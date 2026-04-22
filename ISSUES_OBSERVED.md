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

## 2026-04-22 15:37 GMT+9 — voice_agents Stage 8 guidebook-lint failure

**Source**: `runs/backlog_voice_agents/`, `logs/backlog_voice_agents.log` + `.attempt2`
**Observation**: Run 8 of 12 failed twice. Attempt 1 reached Stage 8 successfully (all prior stages green: premise → ideation → literature → prototype → simulator → audit → 2 branches reviewed) but the Stage 8 assembler produced a guidebook that failed the provenance + forbidden-phrase linter AFTER the one repair pass, so the pipeline threw. Attempt 2 hit the known git-worktree-collision (same as llm_codereview, same root cause: the retry doesn't run `git branch -D run-<slug>-{a,b,c}` before re-attempting).

The attempt-1 failure is the substantive one. Stage 8 repairing-into-linter-rejection twice is rare — in the Opus runs we had 0 documented cases; under Sonnet this is the second voice-agents-class failure (Sonnet also required 3 Stage 5 repairs on browser_agents). This is consistent with the earlier finding that Sonnet is substantively weaker on the judgment-heavy stages. The voice-agents premise (multilingual-household codeswitching) may have pushed Sonnet past the linter's tolerance for voice discipline.

Post-hoc cleanup performed: `git branch -D run-voice_agents-{a,b,c}` so future re-attempts of this specific run_id work cleanly.

**Why it needs your judgment**: This is the second concrete data point that Sonnet's weakness on judgment stages costs pipeline completions, not just Stage 5 quality. If the Sonnet-for-remaining-batch experiment continues to hit rate ~1 Stage-8 failure per 4 runs, the cost/quality math tips back toward Opus. Worth a sentence in the paper's cost-tradeoff discussion.
**Severity**: medium (capacity to complete the pipeline under Sonnet is visibly lower)

## 2026-04-22 15:16 GMT+9 — three-different-patterns-block-three-branches

**Source**: `runs/backlog_claude_artifacts/`
**Observation**: All three branches blocked, each on a DIFFERENT -2 pattern: A on `legibility.no_rationale_at_point_of_action`, B on `capacity.substitutes_for_practice` (first-ever -2 on Capacity axis), C on `agency.hides_options_before_review`. This is the strongest single-run evidence so far that the capture-risk library has substantive pattern diversity. The claude-artifacts premise — how developers reason about AI-generated HTML artifacts — is genuinely a triple-threat across Capacity (AI substitutes developer practice), Agency (artifacts are pre-decided before developer review), and Legibility (no inline "why" affordance). The audit library caught all three separately on three different branches, each with a legitimate evidence span. No guidebook was assembled (all-branches-blocked); the run ends with 3 WORKSHOP_NOT_RECOMMENDED reports, which is also a valid pipeline outcome.

This strongly tempers the earlier "legibility dominance" concern: when the premise genuinely exhibits each capture axis, the audit uses them. The prior dominance really was a domain artifact of the first three premises.

**Why it needs your judgment**: The COOKBOOK section 3 (axis fire counts) needs rewriting at batch end; the current n=3 numbers understated Capacity and Agency.
**Severity**: low (positive — this is the behavior we want)

## 2026-04-22 14:50 GMT+9 — first non-legibility blocking patterns (Agency + Exit)

**Source**: `runs/backlog_browser_agents/`
**Observation**: Branch B blocked on `agency.auto_decides_consequential_step` (-2) and Branch C blocked on `exit.data_lock_in` (-2). These are the first -2 verdicts from patterns outside the `legibility.*` axis across the entire run set. The browser-agents premise — users forming trust in agents that take consequential web actions on their behalf — is a textbook Agency-capture scenario, and the premise's framing of persistent agent state (trust built over time) is a textbook Exit-capture scenario. The audit fired the right pattern for each.

This is strong evidence against the earlier hypothesis that `legibility.no_failure_signal` was the only pattern being used. The library's cross-axis vocabulary is intact; the prior dominance was a domain artifact.

**Why it needs your judgment**: None — positive capability demonstration. Consider whether the COOKBOOK section on axis dominance should be rewritten now or after more data.
**Severity**: low (positive observation, strengthens paper's claim about audit coverage)

## 2026-04-22 14:50 GMT+9 — first `legitimate_normative_split` disagreement class

**Source**: `runs/backlog_browser_agents/branches/b/meta_review.json`
**Observation**: Meta-reviewer classified branch B's disagreement as `legitimate_normative_split` — the 4th of 5 possible classes to appear in the shipped corpus (prior: `consensus`, `spurious_surface_disagreement`, `legitimate_methodological_split`, `single_reviewer_outlier`). Only `human_judgment_required` as a standalone verdict remains untested, but HJR has appeared as a verdict attached to splits. The normative-split fired when the accessibility advocate and the methodologist disagreed on whether auto-action constraints were paternalistic or a required safety scaffold. That is the exact disagreement this class is designed to preserve.
**Why it needs your judgment**: None — positive observation.
**Severity**: low

## 2026-04-22 14:50 GMT+9 — Sonnet weaker than Opus at Stage 5 simulator

**Source**: `runs/backlog_browser_agents/` (first Sonnet-only run)
**Observation**: Stage 5 (simulated walkthrough) required a repair pass on ALL THREE branches, and branch A failed outright after repair. This is new behavior — across the three Opus runs, Stage 5 repair passes were rare (median 0 per run, max 1). The ablation study had only tested Sonnet at Stage 7 (methodologist reviewer); this is the first evidence that Sonnet is substantively weaker at Stage 5. The CLAUDE.md constraint "Never downgrade Stages 5, 6, 7" now has concrete evidence behind it.

User override is still in effect by your explicit request for the test batch. The weaker Stage 5 output may affect the subsequent audit / review stages (worse rehearsal → thinner evidence spans for the auditor to anchor on). Watching whether the Sonnet runs produce fewer -2 verdicts than Opus would have on comparable premises.

**Why it needs your judgment**: After this batch, a lightweight Stage-5-only ablation on one saved branch card would pin the cost/quality tradeoff precisely for Stage 5. That's a paper-strengthening data point.
**Severity**: medium (affects the budget-vs-quality tradeoff story; also a potential paper addition)

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

## 2026-04-22T05:37:44Z — run backlog_llm_codereview failed twice
**Source**: scripts/run_backlog.sh (Task 4)
**Observation**: Two attempts at `probe run --run-id backlog_llm_codereview` failed. Log: `logs/backlog_llm_codereview.log`, `logs/backlog_llm_codereview.log.attempt2`.
**Why it needs your judgment**: User rule — skip after second failure; do not spend 30+ min debugging.
**Severity**: medium (reduces Task 4 coverage by one premise)

**Root cause (post-hoc analysis by me)**: The two failures had different root causes.

1. **Opus attempt 1 (pre-Sonnet switch)**: Stage 2 ideator produced `branch b.one_sentence_claim > 300 chars`; repair pass didn't shorten it. This is the real pipeline issue originally noted above at 14:12 — prompt or schema-repair instructions don't adequately enforce the 300-char cap.

2. **Sonnet attempt 2 (after batch restart with PROBE_FORCE_SONNET=1)**: Git worktree collision, not a pipeline/model issue. When I killed the Opus batch I did `mv runs/backlog_llm_codereview runs/backlog_llm_codereview_killed_opus_$(date +%s)` which left the branch names `run-m_codereview-{a,b,c}` registered in git as "prunable" worktrees. `git worktree prune` cleaned the registrations but the branch names remained allocated. Stage 2 of the Sonnet retry tried to `git worktree add -B run-m_codereview-a …` and got `'run-m_codereview-a' is already used by worktree`. I've now cleaned up with `git branch -D run-m_codereview-{a,b,c}`; a future re-attempt of this specific run_id would work.

**Fix recommendations**:
- For the original prompt/schema issue: tighten the Stage 2 ideator agent prompt (add a concrete 300-char enforcement example) and/or the schema-repair user message (quote the over-long string verbatim so the model can see what to shorten). This is a prompt change, not a code change.
- For the worktree collision: the batch script's "move aside on retry" logic is a code smell. A cleaner pattern is to `git worktree remove --force runs/$run_id/branches/{a,b,c}` and `git branch -D run-$slug-{a,b,c}` before the retry. I'm noting this but not implementing it right now — it's adjacent to `src/orchestrator/` territory and the workaround (branch deletion after the fact) is sufficient for the remaining batch.

## 2026-04-22T06:37:04Z — run backlog_voice_agents failed twice
**Source**: scripts/run_backlog.sh (Task 4)
**Observation**: Two attempts at `probe run --run-id backlog_voice_agents` failed. Log: `logs/backlog_voice_agents.log`, `logs/backlog_voice_agents.log.attempt2`.
**Why it needs your judgment**: User rule — skip after second failure; do not spend 30+ min debugging.
**Severity**: medium (reduces Task 4 coverage by one premise)
