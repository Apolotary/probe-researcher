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

## 2026-04-22 15:37 GMT+9 — Stage 8 guidebook-lint failures (voice_agents, e2ee_ai)

**Source**: `runs/backlog_voice_agents/` + `runs/backlog_e2ee_ai/`; logs in each
**Observation**: Two of 10 Sonnet runs failed at Stage 8 the same way: pipeline reached Stage 8 successfully, the assembler produced a guidebook that failed the provenance + forbidden-phrase linter, the one repair pass did not fix it, the pipeline threw. Both attempt 1s had green status through Stage 7 (all branches reviewed, meta-review produced a verdict).

Under Sonnet, this is now a **20% Stage-8 failure rate** (2 out of 10 runs that reached Stage 8). Under Opus, across the three shipped runs, we had 0 Stage-8 failures. This is the second named Sonnet-weakness axis after Stage 5 simulator failures (4 branch-level failures across 3 Sonnet runs).

Both retry attempts hit the git-worktree-collision scripting issue — the retry does not `git branch -D run-<slug>-{a,b,c}` before re-attempting, so the stale worktree registration blocks the new worktree creation. Both batches of stale branches (`run-voice_agents-{a,b,c}`, `run-klog_e2ee_ai-{a,b,c}`) cleaned up post-hoc. Note that the slug generator produces `klog_e2ee_ai` from `backlog_e2ee_ai` — the first three characters of the run-id get eaten somewhere in the name derivation. That's a separate bug worth logging and fixing when the retry path is revisited.

**Why it needs your judgment**: The paper's cost-tradeoff story needs to be honest about BOTH Sonnet weaknesses: Stage 5 simulator (rehearsal quality) and Stage 8 assembly (linter-discipline). Combined, ~2 of 10 Sonnet runs fail to produce a guidebook. Opus costs ~2× as much but produces a guidebook from every comparable run. The straight budget comparison ($3 vs $6 per run) underweights the assembly-failure cost, because a failed run spends most of its budget anyway — the agent runs through 7 of 8 stages before the lint rejection.

Fix recommendations:
- Sonnet's voice-discipline prompt in `agents/guidebook.md` could be tightened with concrete before/after examples of forbidden vs acceptable phrasing. This would not address all cases but should help.
- The retry path in `scripts/run_backlog.sh` should run `git worktree remove --force` + `git branch -D` before re-attempting. 5 lines of bash.
- Paper evaluation section should add a one-paragraph "Sonnet weaknesses" summary alongside the "Sonnet strengths" note from the Stage 7 ablation.
**Severity**: medium (affects the paper's claim about routing)

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

**Source**: `runs/backlog_browser_agents/` (first Sonnet-only run), updated through 15:58 GMT+9
**Observation (initial)**: Stage 5 (simulated walkthrough) required a repair pass on ALL THREE branches of the first Sonnet run, and branch A failed outright after repair. This is new behavior — across the three Opus runs, Stage 5 repair passes were rare (median 0 per run, max 1). The ablation study had only tested Sonnet at Stage 7 (methodologist reviewer); this is the first evidence that Sonnet is substantively weaker at Stage 5. The CLAUDE.md constraint "Never downgrade Stages 5, 6, 7" now has concrete evidence behind it.

**UPDATE 15:58 GMT+9**: after three more Sonnet runs the Stage-5 failure rate is now concrete. Across 6 Sonnet backlog runs completed so far:

| Run | Stage 5 failures | Outcome |
| --- | --- | --- |
| backlog_llm_codereview | n/a — failed at Stage 2 | both attempts failed |
| backlog_browser_agents | 1 (branch A) + 3 repair passes | 2 blocked |
| backlog_screenreader_llm | 0 | (not yet analyzed) |
| backlog_claude_artifacts | 0 | 3 blocked |
| backlog_voice_agents | 0 (failed at Stage 8 lint instead) | both attempts failed |
| backlog_live_coding | 1 (branch C) | 2 blocked |
| backlog_divination_ui | **2 (branches A + B)** | 1 blocked, 2 failed |

Total: **4 Stage-5 failures across 6 Sonnet runs**, versus **0 Stage-5 failures across 3 Opus runs** in the shipped corpus. This is no longer a single-trial observation; Stage 5 is materially less reliable under Sonnet, and in the `divination_ui` run the failure rate reached 2-of-3 branches on a single run, which is likely the floor for pipeline usefulness (with only one surviving branch reaching Stage 6, the divergent-branch comparison Probe is built around collapses).

Budget win is real: ~$2-3 per Sonnet run vs ~$5-6 per Opus run. Quality loss on Stage 5 is also real: ~1 Stage 5 branch fails per 1.5 runs under Sonnet.

**Why it needs your judgment**: The paper's cost-tradeoff section currently reads "Sonnet is substantively capable on the methodologist stage" (from the n=1 Stage 7 ablation). The new evidence is the opposite shape on Stage 5 — Sonnet is substantively LESS capable. Neither claim generalizes beyond the stage it was tested on; the paper should distinguish. Concrete suggestion: add a Stage 5 ablation line to the evaluation — on one saved branch card that succeeded under Opus, re-run Stage 5 under Sonnet and report what breaks.
**Severity**: medium (affects budget/quality tradeoff story; CLAUDE.md constraint is now load-bearing rather than hypothetical)

## 2026-04-22 17:04 GMT+9 — adversarial run 1: Move framework is live in the premise interrogator

**Source**: `runs/adversarial_trivial_darkmode/premise_card.json`
**Observation**: First adversarial battery run just completed. The premise was the literal sentence "study whether users prefer dark mode" — Category A (should-die-at-Stage-1). Stage 1 did NOT refuse (Probe's design is that Stage 1 sharpens rather than rejects), but the output shows the Move-framework prompt upgrade shipped earlier tonight is alive and doing work:

- `sharpest_question`: "Prefer dark mode for what — under what conditions, on what tasks, measured against what outcome, in what population — because without any of those constraints this is not a study, it is a survey question that has already been run thousands of times by every major platform vendor?"
- `missing_evidence`: 6-item structured list explicitly flagging "No niche", "No mechanism", "No testable proposition", "No population with a reason to be studied". These align 1:1 with the Move framework's three moves (territory / niche / occupation).
- `sharpened_options`: each begins "Territory: … Niche: … [option]" — the three-move template is visibly shaping every option.

The premise interrogator was already good. The Move framework didn't replace it; it gave the agent a structured checklist that shows up in the outputs as specifically-named deficiencies.

The downstream stages proceeded (Sonnet weakness again: 2 of 3 branches failed at Stage 5 simulator, 1 blocked at audit). Expected.

**Why it needs your judgment**: None — positive. Flagged because it's the first empirical evidence the Move-framework prompt edit is working as intended.
**Severity**: low (positive)

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

## 2026-04-22T07:24:53Z — run backlog_e2ee_ai failed twice
**Source**: scripts/run_backlog.sh (Task 4)
**Observation**: Two attempts at `probe run --run-id backlog_e2ee_ai` failed. Log: `logs/backlog_e2ee_ai.log`, `logs/backlog_e2ee_ai.log.attempt2`.
**Why it needs your judgment**: User rule — skip after second failure; do not spend 30+ min debugging.
**Severity**: medium (reduces Task 4 coverage by one premise)
