# Issues observed during overnight run

Log of items that need human judgment. Not deletions, not fixes — just observations for morning review.

Format per entry:
- **Timestamp** — ISO timestamp of when I noticed it
- **Source** — run_id / file / stage / task
- **Observation** — what I saw
- **Why it needs your judgment** — why I did not act on it
- **Severity** — low / medium / high (high = may block submission)

---

## 2026-04-22 12:56 GMT+9 — starting overnight task batch

Nothing to log yet. Placeholder to timestamp the start of the overnight run.

---

## 2026-04-22 13:42 GMT+9 — first Exit-axis fire in the run set

**Source**: `runs/backlog_polymarket_drift/` (backlog run 1 of 12)
**Observation**: Branch C fires two Exit-axis patterns, alongside 1 Capacity, 1 Agency, and 2 Legibility. This is the first non-zero Exit count across the 4 runs to date (demo_run, creativity_support, code_review, polymarket_drift). The prior 3 runs had a cumulative Exit count of 3 (all from creativity_support). The polymarket premise — users monitoring multiple trading markets while a semi-automated agent acts on their behalf — is exactly the shape where "can the user step away / disengage the agent" becomes a first-class design question, so Exit firing here is expected rather than surprising. I am logging it because it updates the prior cookbook observation that Exit was under-firing; the backlog set appears to stress that axis in domains where Capacity and Legibility had been dominant.
**Why it needs your judgment**: None strictly — the audit is doing its job. Flagged because it updates the cross-domain coverage claim in COOKBOOK.md Section 3.
**Severity**: low (observation, not a defect)

## 2026-04-22 14:12 GMT+9 — Stage 2 ideator over-runs one_sentence_claim length cap

**Source**: `runs/backlog_llm_codereview/` first attempt, `logs/backlog_llm_codereview.log`
**Observation**: Stage 2 ideator produced `branch b.one_sentence_claim > 300 chars`. The repair pass also failed validation — the model did not shorten the string. This is the first non-transient pipeline failure across the overnight batch; prior runs either succeeded on attempt 1 or completed through all stages. Script auto-retried; `attempt 2` is running as of this note. If attempt 2 also fails, the run will be skipped per protocol.

Root-cause hypothesis: the Stage 2 system prompt or user message does not reinforce the 300-char cap with a concrete example, and the repair prompt may not quote the rejected string verbatim. Worth checking whether other backlog runs produce claims closer to the cap without crossing it (near-miss rate is diagnostic of how tight the model's length budget is).

**Why it needs your judgment**: The fix is a small prompt change in `agents/stage2_ideator.md` or the schema-repair prompt in `src/orchestrator/stages/stage2_ideator.ts` — could be a one-line "respect the 300-char limit" reinforcement, or a post-validate helper that truncates at the boundary and lets the model explain. Hard constraint says don't modify `src/orchestrator/` beyond bug fixes; this arguably IS a bug fix, but the fix is a prompt change, not a code change, so I'm leaving it for your call.
**Severity**: medium (happens on ~1/4 of runs so far; wastes one stage-2 call worth of budget each time, ~$0.10)

## 2026-04-22 13:58 GMT+9 — new meta-reviewer disagreement class appeared

**Source**: `runs/backlog_torso_s4_ios/branches/a/meta_review.json`
**Observation**: Branch A's meta-review classified the disagreement as `single_reviewer_outlier` — the first time this class has appeared across any shipped run. Prior runs produced `consensus`, `spurious_surface_disagreement`, and `legitimate_methodological_split` but never outlier. Branch B of the same run produced `consensus`, also a first for the non-creativity runs. This is useful evidence that the meta-reviewer is using its full classification vocabulary, not collapsing everything to `legitimate_methodological_split`.
**Why it needs your judgment**: None strictly — good news. Flagged because the paper's discussion claims Probe preserves classification diversity; this run is the first concrete evidence from outside the demo domain.
**Severity**: low (positive observation)

## 2026-04-22 13:42 GMT+9 — methodologist objection pattern stabilizing

**Source**: `runs/backlog_polymarket_drift/branches/b/`
**Observation**: Branch B was blocked on `legibility.no_failure_signal` — the same pattern that blocked demo_run branches A and C and benchmark_code_review branches A and B. This is now **5 of 10 blocked/total branches** across the run set blocked by the same pattern. Two hypotheses, both to check across more runs: (1) `legibility.no_failure_signal` is over-calibrated and over-firing; (2) the design space for AI-involved screen-based studies genuinely has a silent-failure problem the audit correctly catches every time.
**Why it needs your judgment**: If the pattern keeps dominating through the backlog batch, this deserves a re-calibration pass on the pattern library.
**Severity**: medium (affects confidence in audit library over time)
