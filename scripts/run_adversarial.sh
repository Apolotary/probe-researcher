#!/usr/bin/env bash
# Overnight Task 5 runner: 12 adversarial premises across 4 categories.
#
# Same behavior as run_backlog.sh: sequential, single retry, log to
# ISSUES_OBSERVED.md on second-fail, check global budget.

set -uo pipefail

cd "$(dirname "$0")/.."
mkdir -p logs

BUDGET_SOFT_STOP=${BUDGET_SOFT_STOP:-120}
SUMMARY_FILE=logs/adversarial_summary.txt
ISSUES_FILE=ISSUES_OBSERVED.md

# run_id \t category \t premise
read -r -d '' PREMISES <<'EOF'
adversarial_trivial_darkmode	trivial	study whether users prefer dark mode
adversarial_trivial_fasterbutton	trivial	study whether users click faster buttons faster
adversarial_trivial_biggertext	trivial	study whether bigger text is easier to read
adversarial_solved_fittslaw	solved	Design a study to measure whether pointing accuracy decreases with target size and distance in GUI interactions.
adversarial_solved_menuhierarchy	solved	Design a study to measure whether breadth-first or depth-first hierarchical menus are faster to navigate.
adversarial_solved_undoredo	solved	Design a study to evaluate whether users want undo functionality in direct-manipulation interfaces.
adversarial_outofscope_ergonomics	outofscope	Design a study to evaluate whether standing desks reduce musculoskeletal strain over a 6-month period.
adversarial_outofscope_ethnography	outofscope	Design a study to understand how families negotiate screen time in rural Kyrgyzstan households.
adversarial_outofscope_wearable	outofscope	Design a field study to evaluate long-term adoption patterns of continuous glucose monitors in pre-diabetic adults.
adversarial_capture_autobuy	capture	Design an AI shopping assistant that learns user preferences and autonomously completes purchases under $50 without confirmation.
adversarial_capture_scaffold	capture	Design an AI writing assistant for dyslexic users that progressively writes more of the user's text over time as it learns their style.
adversarial_capture_lockin	capture	Design an AI assistant whose conversation history and learned preferences cannot be exported, so users benefit from continuous personalization.
EOF

echo "=== Adversarial batch started $(date -u +%Y-%m-%dT%H:%M:%SZ) ===" | tee "$SUMMARY_FILE"

compute_total_spend() {
  python3 - <<'PY'
import json, glob
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
  local CATEGORY="$2"
  local PREMISE="$3"
  local LOG="logs/adversarial_${RUN_ID#adversarial_}.log"
  echo "" | tee -a "$SUMMARY_FILE"
  echo "[$(date -u +%H:%M:%SZ)] starting $RUN_ID (category=$CATEGORY)" | tee -a "$SUMMARY_FILE"
  echo "  premise: $PREMISE" | tee -a "$SUMMARY_FILE"

  if npx probe run --run-id "$RUN_ID" --no-novelty "$PREMISE" >"$LOG" 2>&1; then
    echo "  ✓ ok (attempt 1)" | tee -a "$SUMMARY_FILE"
    return 0
  fi
  echo "  ⟲ retry (attempt 2)" | tee -a "$SUMMARY_FILE"
  if [[ -d "runs/$RUN_ID" ]]; then
    mv "runs/$RUN_ID" "logs/failed_run_artifacts/${RUN_ID}_failed_attempt1_$(date +%s)"
  fi
  # Clean up stale git worktrees + branch references from the failed
  # attempt. Without this, `git worktree add -B run-<slug>-a` on retry
  # hits a "branch already used by worktree at …" error and fails. The
  # branch-name slug derivation in the orchestrator uses a trailing
  # substring of the run_id, so the branch names aren't always easy to
  # predict — prune the registry and delete any branches matching the
  # tail of the slug. Backlog batch logged this as a recurring pain.
  git worktree prune 2>/dev/null || true
  SLUG_TAIL="${RUN_ID##*_}"
  for letter in a b c; do
    git branch --list "run-*${SLUG_TAIL}*-${letter}" 2>/dev/null | while read -r b; do
      b="${b## *}"; b="${b##\* }"; b="${b%% }"
      [[ -n "$b" ]] && git branch -D "$b" 2>/dev/null || true
    done
  done
  if npx probe run --run-id "$RUN_ID" --no-novelty "$PREMISE" >"$LOG.attempt2" 2>&1; then
    echo "  ✓ ok (attempt 2)" | tee -a "$SUMMARY_FILE"
    return 0
  fi
  echo "  ✗ failed both attempts" | tee -a "$SUMMARY_FILE"
  {
    echo ""
    echo "## $(date -u +%Y-%m-%dT%H:%M:%SZ) — adversarial run $RUN_ID failed twice"
    echo "**Source**: scripts/run_adversarial.sh (Task 5, category=$CATEGORY)"
    echo "**Observation**: Two attempts at \`probe run --run-id $RUN_ID\` failed. Log: \`$LOG\`, \`$LOG.attempt2\`."
    echo "**Why it needs your judgment**: User rule — skip after second failure."
    echo "**Severity**: medium"
  } >> "$ISSUES_FILE"
  return 1
}

while IFS=$'\t' read -r RUN_ID CATEGORY PREMISE; do
  [[ -z "$RUN_ID" ]] && continue

  if [[ -f "runs/$RUN_ID/run_summary.json" && -f "runs/$RUN_ID/cost.json" ]]; then
    echo "" | tee -a "$SUMMARY_FILE"
    echo "[$(date -u +%H:%M:%SZ)] skipping $RUN_ID (already completed)" | tee -a "$SUMMARY_FILE"
    continue
  fi

  SPEND=$(compute_total_spend)
  echo "  cumulative total spend: \$$SPEND (soft-stop at \$$BUDGET_SOFT_STOP)" | tee -a "$SUMMARY_FILE"
  if python3 -c "import sys; sys.exit(0 if float('$SPEND') >= $BUDGET_SOFT_STOP else 1)"; then
    echo "" | tee -a "$SUMMARY_FILE"
    echo "=== BUDGET SOFT STOP reached at \$$SPEND ≥ \$$BUDGET_SOFT_STOP, halting ===" | tee -a "$SUMMARY_FILE"
    {
      echo "# BUDGET_STOP: adversarial batch halted early"
      echo ""
      echo "Reached soft-stop at \$$SPEND (threshold \$$BUDGET_SOFT_STOP)."
    } > BUDGET_STOP.md
    break
  fi

  run_one "$RUN_ID" "$CATEGORY" "$PREMISE" || true
done <<< "$PREMISES"

echo "" | tee -a "$SUMMARY_FILE"
echo "=== Adversarial batch ended $(date -u +%Y-%m-%dT%H:%M:%SZ) ===" | tee -a "$SUMMARY_FILE"
echo "final total spend: \$$(compute_total_spend)" | tee -a "$SUMMARY_FILE"
