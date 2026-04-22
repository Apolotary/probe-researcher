#!/usr/bin/env bash
# Overnight Task 4 runner: 12 backlog premises sequentially.
#
# Behavior:
# - Each premise runs once; on failure retries once; on second failure, logs to
#   ISSUES_OBSERVED.md and moves on.
# - After each run, computes cumulative spend across all backlog_* runs and
#   stops when it crosses the $120 soft-stop threshold.
# - Output per run streams to logs/backlog_<id>.log.
# - Exits cleanly when done; writes a summary line to logs/backlog_summary.txt.

set -uo pipefail

cd "$(dirname "$0")/.."
mkdir -p logs

BUDGET_SOFT_STOP=${BUDGET_SOFT_STOP:-120}
SUMMARY_FILE=logs/backlog_summary.txt
ISSUES_FILE=ISSUES_OBSERVED.md

# Format: run_id \t premise
read -r -d '' PREMISES <<'EOF'
backlog_polymarket_drift	Design a study to understand how semi-automated trading agents should surface execution drift to users monitoring multiple markets simultaneously.
backlog_torso_s4_ios	Design a study to evaluate a mobile recreation of a hardware MPC-style sampler interface, where the constraint is that mobile UX expectations conflict with the hardware's tactile affordances.
backlog_mochi_proactive	Design a study to understand when an AI assistant's proactive reminders feel supportive vs. paternalistic in ADHD-adjacent knowledge worker contexts.
backlog_llm_codereview	Design a study to evaluate whether LLM code review comments change reviewer behavior in cases where the reviewer disagrees with the LLM.
backlog_browser_agents	Design a study to understand how users form trust in browser-use agents when the agent makes consequential web actions on their behalf.
backlog_screenreader_llm	Design a study to evaluate whether LLM-generated image descriptions for screen-reader users improve comprehension of complex data visualizations vs. simpler alt-text.
backlog_claude_artifacts	Design a study to understand how developers reason about AI-generated single-file HTML artifacts vs. multi-file projects when deciding what to trust.
backlog_voice_agents	Design a study to understand failure modes of voice agents in multilingual households when codeswitching occurs mid-utterance.
backlog_live_coding	Design a study to evaluate pair-programming dynamics between a human and an AI coding assistant in live-coding music performance contexts.
backlog_divination_ui	Design a study to understand how users interpret probabilistic/ambiguous outputs in decision-support tools, using divination-app affordances as a test case.
backlog_e2ee_ai	Design a study to understand user mental models of AI features running on end-to-end encrypted messaging platforms.
backlog_rag_attribution	Design a study to evaluate whether inline citation attribution in RAG-based AI answers changes user verification behavior.
EOF

echo "=== Backlog batch started $(date -u +%Y-%m-%dT%H:%M:%SZ) ===" | tee "$SUMMARY_FILE"

TOTAL_SPEND=0

# Helper: compute total spend across ALL runs/ from their cost.json files.
# We check globally so the $150 ceiling covers backlog + adversarial + prior runs.
compute_backlog_spend() {
  python3 - <<'PY'
import json, glob, os
total = 0.0
for p in sorted(glob.glob('runs/*/cost.json')):
    try:
        with open(p) as f:
            d = json.load(f)
        total += d.get('totals', {}).get('usd', 0.0)
    except Exception:
        pass
print(f"{total:.4f}")
PY
}

run_one() {
  local RUN_ID="$1"
  local PREMISE="$2"
  local LOG="logs/backlog_${RUN_ID#backlog_}.log"
  echo "" | tee -a "$SUMMARY_FILE"
  echo "[$(date -u +%H:%M:%SZ)] starting $RUN_ID" | tee -a "$SUMMARY_FILE"
  echo "  premise: $PREMISE" | tee -a "$SUMMARY_FILE"

  # Attempt 1
  if npx probe run --run-id "$RUN_ID" --no-novelty "$PREMISE" >"$LOG" 2>&1; then
    echo "  ✓ ok (attempt 1)" | tee -a "$SUMMARY_FILE"
    return 0
  fi

  # Attempt 2
  echo "  ⟲ retry (attempt 2)" | tee -a "$SUMMARY_FILE"
  # Move the partial run out of the way so retry starts clean
  if [[ -d "runs/$RUN_ID" ]]; then
    mv "runs/$RUN_ID" "runs/${RUN_ID}_failed_attempt1_$(date +%s)"
  fi
  if npx probe run --run-id "$RUN_ID" --no-novelty "$PREMISE" >"$LOG.attempt2" 2>&1; then
    echo "  ✓ ok (attempt 2)" | tee -a "$SUMMARY_FILE"
    return 0
  fi

  echo "  ✗ failed both attempts" | tee -a "$SUMMARY_FILE"
  {
    echo ""
    echo "## $(date -u +%Y-%m-%dT%H:%M:%SZ) — run $RUN_ID failed twice"
    echo "**Source**: scripts/run_backlog.sh (Task 4)"
    echo "**Observation**: Two attempts at \`probe run --run-id $RUN_ID\` failed. Log: \`$LOG\`, \`$LOG.attempt2\`."
    echo "**Why it needs your judgment**: User rule — skip after second failure; do not spend 30+ min debugging."
    echo "**Severity**: medium (reduces Task 4 coverage by one premise)"
  } >> "$ISSUES_FILE"
  return 1
}

COUNT=0
while IFS=$'\t' read -r RUN_ID PREMISE; do
  [[ -z "$RUN_ID" ]] && continue
  COUNT=$((COUNT + 1))

  # Skip if already completed (idempotent restart)
  if [[ -f "runs/$RUN_ID/run_summary.json" && -f "runs/$RUN_ID/cost.json" ]]; then
    echo "" | tee -a "$SUMMARY_FILE"
    echo "[$(date -u +%H:%M:%SZ)] skipping $RUN_ID (already completed)" | tee -a "$SUMMARY_FILE"
    continue
  fi

  # Budget check
  SPEND=$(compute_backlog_spend)
  TOTAL_SPEND="$SPEND"
  echo "  cumulative backlog spend: \$$SPEND (soft-stop at \$$BUDGET_SOFT_STOP)" | tee -a "$SUMMARY_FILE"
  if python3 -c "import sys; sys.exit(0 if float('$SPEND') >= $BUDGET_SOFT_STOP else 1)"; then
    echo "" | tee -a "$SUMMARY_FILE"
    echo "=== BUDGET SOFT STOP reached at \$$SPEND ≥ \$$BUDGET_SOFT_STOP, halting ===" | tee -a "$SUMMARY_FILE"
    {
      echo "# BUDGET_STOP: backlog batch halted early"
      echo ""
      echo "Reached soft-stop at \$$SPEND (threshold \$$BUDGET_SOFT_STOP)."
      echo "$COUNT premises attempted, $(ls -d runs/backlog_*/ 2>/dev/null | wc -l) completed."
      echo "Remaining premises: skipped."
    } > BUDGET_STOP.md
    break
  fi

  run_one "$RUN_ID" "$PREMISE" || true
done <<< "$PREMISES"

echo "" | tee -a "$SUMMARY_FILE"
echo "=== Backlog batch ended $(date -u +%Y-%m-%dT%H:%M:%SZ) ===" | tee -a "$SUMMARY_FILE"
echo "final backlog spend: \$$(compute_backlog_spend)" | tee -a "$SUMMARY_FILE"
