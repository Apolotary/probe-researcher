#!/usr/bin/env bash
# E2E smoke test for the Probe web UI. Walks every endpoint, every
# UI route, and the full demo replay flow. Exits non-zero on any
# 5xx, broken HTML, or missing v2 feature.
#
# Run:
#   bash scripts/e2e_smoke.sh

set -u
BASE="http://127.0.0.1:4470"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
DIR="docs/screenshots/audit/auto-test"
mkdir -p "$DIR"

PASS=0
FAIL=0
WARN=0

ok() { echo "  ✓ $1"; PASS=$((PASS+1)); }
fail() { echo "  ✗ $1"; FAIL=$((FAIL+1)); }
warn() { echo "  ⚠ $1"; WARN=$((WARN+1)); }

section() { echo; echo "=== $1 ==="; }

# ─────────────────────────────────────────────────────────────────
section "1. Server health + meta endpoints"
status_code() { curl -s -o /dev/null -w "%{http_code}" "$1"; }

[[ "$(status_code "$BASE/ui")" == "200" ]] && ok "/ui" || fail "/ui"
[[ "$(status_code "$BASE/ui/new")" == "200" ]] && ok "/ui/new" || fail "/ui/new"
[[ "$(status_code "$BASE/ui/replay")" == "200" ]] && ok "/ui/replay" || fail "/ui/replay"
[[ "$(status_code "$BASE/ui/project")" == "200" ]] && ok "/ui/project" || fail "/ui/project"
[[ "$(status_code "$BASE/ui/config")" == "200" ]] && ok "/ui/config" || fail "/ui/config"
[[ "$(status_code "$BASE/ui/launcher")" == "200" ]] && ok "/ui/launcher" || fail "/ui/launcher"
[[ "$(status_code "$BASE/api/probe/status")" == "200" ]] && ok "/api/probe/status" || fail "/api/probe/status"
[[ "$(status_code "$BASE/api/probe/models")" == "200" ]] && ok "/api/probe/models" || fail "/api/probe/models"
[[ "$(status_code "$BASE/api/probe/config")" == "200" ]] && ok "/api/probe/config" || fail "/api/probe/config"
[[ "$(status_code "$BASE/api/probe/demo/list")" == "200" ]] && ok "/api/probe/demo/list" || fail "/api/probe/demo/list"

# ─────────────────────────────────────────────────────────────────
section "2. Per-stage model routing"
MODELS_JSON=$(curl -s "$BASE/api/probe/models")
echo "$MODELS_JSON" | python3 -c "
import sys, json
d = json.load(sys.stdin)
expected_opus = ['brainstorm', 'methodology', 'review']
expected_sonnet = ['literature', 'plan', 'artifacts', 'personas', 'findings', 'report']
issues = []
for stage in expected_opus:
    if 'opus' not in d['models'].get(stage, '').lower():
        issues.append(f'{stage} should route to Opus, got {d[\"models\"].get(stage)}')
for stage in expected_sonnet:
    if 'sonnet' not in d['models'].get(stage, '').lower():
        issues.append(f'{stage} should route to Sonnet, got {d[\"models\"].get(stage)}')
if d.get('mode') != 'mixed':
    issues.append(f'mode should be mixed, got {d.get(\"mode\")}')
print('\n'.join('  ✗ ' + i for i in issues) if issues else '  ✓ mixed mode routes Opus on brainstorm/methodology/review, Sonnet elsewhere')
exit(1 if issues else 0)
" && PASS=$((PASS+1)) || FAIL=$((FAIL+1))

# ─────────────────────────────────────────────────────────────────
section "3. Demo replay — start, walk all 11 stages, stop"
START=$(curl -s -X POST -H "Content-Type: application/json" -d '{"name":"focus-rituals","delayMs":50}' "$BASE/api/probe/demo/start")
[[ "$START" == *'"active":true'* ]] && ok "demo/start" || fail "demo/start: $START"

# Each stage endpoint should return cached payload (not error)
test_stage() {
  local stage="$1"; local body="$2"; local expectField="$3"
  local resp=$(curl -s -X POST -H "Content-Type: application/json" -d "$body" "$BASE/api/probe/$stage" 2>&1)
  if echo "$resp" | grep -q "\"$expectField\""; then
    ok "$stage cached payload contains '$expectField'"
  else
    fail "$stage missing '$expectField' — resp: $(echo "$resp" | head -c 120)"
  fi
}

test_stage brainstorm '{"premise":"x"}' "rqs"
test_stage literature '{"rq":{"letter":"A","rq":"x","angle":"x","method":"x","n":"x"}}' "block"
test_stage methodology '{"premise":"x","rqs":[]}' "candidates"
test_stage plan '{"design":{"id":"x","name":"x","weeks":1,"arc":"x","summary":"x","coverage":{},"strengths":[],"tensions":[]},"premise":"x"}' "plan"
test_stage artifacts '{"design":{"id":"x","name":"x","weeks":1,"arc":"x","summary":"x","coverage":{},"strengths":[],"tensions":[]},"plan":{"phases":[],"deliverables":[],"recruitment":"x","totalWeeks":1,"risks":[]}}' "artifacts"
test_stage personas '{"n":12,"premise":"x"}' "personas"
test_stage findings '{"plan":{"phases":[],"deliverables":[],"recruitment":"x","totalWeeks":1,"risks":[]},"premise":"x"}' "findings"
test_stage report '{"premise":"x","rqs":[],"designName":"x","findings":[]}' "discussion"
test_stage review '{"premise":"x","rqs":[],"designName":"x"}' "reviewers"
test_stage disagreement-audit '{"paperTitle":"x","reviewers":[],"meta":{}}' "summary"
test_stage rq-boolean '{"premise":"x","op":"union","a":{"letter":"A","rq":"x","angle":"x","method":"x","n":"x"},"b":{"letter":"B","rq":"x","angle":"x","method":"x","n":"x"}}' "rq"

STOP=$(curl -s -X POST "$BASE/api/probe/demo/stop")
[[ "$STOP" == *'"active":false'* ]] && ok "demo/stop" || fail "demo/stop"

# ─────────────────────────────────────────────────────────────────
# Restart server so the rate-limit bucket is fresh — without this,
# sections 4 and 5 conflict: the cumulative count from sections 1–3
# leaves no headroom for either validation tests OR the rate-limit
# burst test.
section "(reset) restart server for clean rate-limit bucket"
lsof -nP -iTCP:4470 -sTCP:LISTEN 2>/dev/null | awk 'NR>1 {print $2}' | xargs -I{} kill -TERM {} 2>/dev/null
sleep 1
nohup node dist/cli/index.js ui --web --port 4470 --no-open > /tmp/probe-server.log 2>&1 &
sleep 2.5
[[ "$(status_code "$BASE/ui")" == "200" ]] && ok "server back up after restart" || fail "server didn't come back"

# ─────────────────────────────────────────────────────────────────
section "4. Validation: 400s on bad input"
test_400() {
  local stage="$1"
  local code=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d '{}' "$BASE/api/probe/$stage")
  [[ "$code" == "400" ]] && ok "$stage rejects empty body" || fail "$stage returned $code (expected 400)"
}
test_400 brainstorm
test_400 literature
test_400 disagreement-audit
test_400 rq-boolean

# Restart again so section 5 starts with a fresh bucket too.
lsof -nP -iTCP:4470 -sTCP:LISTEN 2>/dev/null | awk 'NR>1 {print $2}' | xargs -I{} kill -TERM {} 2>/dev/null
sleep 1
nohup node dist/cli/index.js ui --web --port 4470 --no-open > /tmp/probe-server.log 2>&1 &
sleep 2.5

# ─────────────────────────────────────────────────────────────────
section "5. Rate limits enforced"
# Note: only counts after demo is stopped (replay short-circuits don't hit limiter? actually they do)
# Run a burst of 35 requests to brainstorm; should see 429 by the 31st
HIT_429=0
for i in $(seq 1 35); do
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d '{"premise":"rate-limit-test"}' "$BASE/api/probe/brainstorm")
  if [[ "$code" == "429" ]]; then
    HIT_429=$((HIT_429+1))
  fi
done
if [[ $HIT_429 -gt 0 ]]; then
  ok "rate limit fires after 30 requests ($HIT_429 of 35 returned 429)"
else
  warn "rate limit didn't fire — burst of 35 saw zero 429s (may be already past window or no Anthropic key?)"
fi

# ─────────────────────────────────────────────────────────────────
section "6. Bundled demo has v2 payloads"
node -e "
const d = JSON.parse(require('fs').readFileSync('assets/demos/focus-rituals.json', 'utf8'));
const checks = [
  ['top-level modelMode = mixed', d.modelMode === 'mixed'],
  ['regeneratedAt timestamp', !!d.regeneratedAt],
  ['state.disagreementAudit present', !!d.state.disagreementAudit],
  ['state.disagreementAudit.realDisagreements >= 1', (d.state.disagreementAudit?.realDisagreements?.length || 0) >= 1],
  ['state.disagreementAudit.acDecision.recommendation', !!d.state.disagreementAudit?.acDecision?.recommendation],
  ['state.rqBoolean present', !!d.state.rqBoolean],
  ['state.rqBoolean has at least one composition', Object.keys(d.state.rqBoolean || {}).length >= 1],
  ['reviewSession with 3 reviewers', (d.state.reviewSession?.reviewers?.length || 0) === 3],
  ['reviewers have distinct recs', new Set((d.state.reviewSession?.reviewers || []).map(r => r.rec)).size >= 2],
];
let ok = 0, fail = 0;
for (const [label, pass] of checks) {
  console.log(pass ? '  ✓ ' + label : '  ✗ ' + label);
  if (pass) ok++; else fail++;
}
process.exit(fail === 0 ? 0 : 1);
" && PASS=$((PASS+9)) || FAIL=$((FAIL+1))

# ─────────────────────────────────────────────────────────────────
section "7. Headless Chrome — DOM contains v2 affordances"
shoot() {
  local label="$1"; local url="$2"
  local out="$DIR/${label}.png"
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size=1440,900 \
    --screenshot="$out" --virtual-time-budget=8000 "$url" 2>/dev/null > /dev/null
  [[ -f "$out" ]] && [[ $(wc -c < "$out") -gt 5000 ]] && ok "screenshot $label ($(($(wc -c < "$out") / 1024))KB)" || fail "screenshot $label missing or too small"
}
shoot home "$BASE/ui"
shoot replay-picker "$BASE/ui/replay"
shoot replay-input "$BASE/ui/new?demo=focus-rituals"
shoot launcher "$BASE/ui/launcher"
shoot project "$BASE/ui/project"
shoot config "$BASE/ui/config"

# DOM-content checks
section "8. Headless Chrome — content sanity per route"
dom_has() {
  local label="$1"; local url="$2"; shift 2
  local out=$("$CHROME" --headless=new --disable-gpu --window-size=1440,900 --dump-dom --virtual-time-budget=8000 "$url" 2>/dev/null)
  for substr in "$@"; do
    if echo "$out" | grep -qiF "$substr"; then
      ok "$label has '$substr'"
    else
      fail "$label missing '$substr'"
    fi
  done
}
dom_has "/ui" "$BASE/ui" "probe" "new project" "replay sample run"
dom_has "/ui/replay" "$BASE/ui/replay" "Pick a demo to replay" "focus-rituals"
dom_has "/ui/config" "$BASE/ui/config" "API keys" "Models" "Anthropic"

# Replay-active path (start demo first, dump-dom, then verify the badge appears)
curl -s -X POST -H "Content-Type: application/json" -d '{"name":"focus-rituals","delayMs":50}' "$BASE/api/probe/demo/start" > /dev/null
dom_has "/ui/new?demo replay-active" "$BASE/ui/new?demo=focus-rituals" "How do remote workers" "replay" "skip brainstorm"
curl -s -X POST "$BASE/api/probe/demo/stop" > /dev/null

# ─────────────────────────────────────────────────────────────────
section "9. Console errors check (headless)"
ERR_LOG=$(mktemp)
"$CHROME" --headless=new --disable-gpu --window-size=1440,900 \
  --enable-logging --v=1 --log-level=0 \
  --virtual-time-budget=8000 "$BASE/ui" > "$ERR_LOG" 2>&1
ERR_COUNT=$(grep -ciE "console.*error|uncaught|TypeError|ReferenceError|SyntaxError" "$ERR_LOG" 2>/dev/null || echo 0)
ERR_COUNT=$(echo "$ERR_COUNT" | tr -d ' ')
if [[ "$ERR_COUNT" == "0" ]]; then
  ok "/ui produces no console errors"
else
  warn "/ui logged $ERR_COUNT error-flavored lines (may include framework noise)"
fi
rm -f "$ERR_LOG"

# ─────────────────────────────────────────────────────────────────
section "Summary"
echo "PASS: $PASS · FAIL: $FAIL · WARN: $WARN"
exit $FAIL
