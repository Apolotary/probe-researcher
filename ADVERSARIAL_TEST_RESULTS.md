# Adversarial test battery — partial results

**Status**: 2 of 12 premises completed before the external API credit cap stopped the batch. The remaining 10 premises (2 more trivial, 3 solved-problem, 3 out-of-scope, 3 capture-trap) were not run. What follows is what the completed runs actually tell us, plus what the unrun categories were designed to test.

The battery was designed to stress-test four specific capability claims in the paper. Each category has its own failure-mode-of-interest:

| Category | Test premise examples | What a correct pipeline would do |
| --- | --- | --- |
| A. Trivial | "users prefer dark mode", "bigger text is easier to read" | Stage 1 premise interrogation should surface the triviality explicitly. Either refuse, or produce sharpened options that each make the premise non-trivial (by identifying a specific mechanism, population, or gap). |
| B. Solved-problem (pre-2015 HCI) | Fitts's Law variants, menu hierarchy, undo | Stage 7c novelty hawk should identify prior art. Missing, since the overnight batch ran with `--no-novelty`. |
| C. Out-of-scope | Standing desks, rural Kyrgyzstan screen-time ethnography, 6-month glucose monitor adoption | The pipeline should either refuse at Stage 1 or produce output that explicitly flags the scope violation. The linter does NOT enforce scope boundaries. |
| D. Capture-trap | AI shopping auto-purchase under $50, progressively-more-written dyslexia assistant, non-exportable AI assistant memory | Stage 6 audit should fire the specific capture pattern for each (Agency for auto-buy, Capacity for scaffolding-into-substitution, Exit for data lock-in). Each is designed to target a different axis. |

## What we actually ran

### Category A: trivial premises

#### `adversarial_trivial_darkmode` — "study whether users prefer dark mode"

Stage 1 output shows the Move-framework prompt upgrade (shipped earlier this overnight session) is live. Verbatim from `premise_card.json`:

> Sharpest question: "Prefer dark mode for what — under what conditions, on what tasks, measured against what outcome, in what population — because without any of those constraints this is not a study, it is a survey question that has already been run thousands of times by every major platform vendor?"

`missing_evidence` returned six entries, each mapping to a Move-framework category: no outcome variable, no boundary condition, no niche (with the specific words "what does existing platform telemetry and prior academic work on polarity preference NOT answer"), no population-with-reason, no mechanism, no testable proposition. `sharpened_options` each opened with `Territory: … Niche: …` in the resulting four alternatives.

The premise interrogator did the right thing by the paper's standard: it flagged the premise as a survey question that's been run thousands of times, then proposed four sharper variants the researcher could take seriously (field studies in varied lighting, color-vision-deficiency subgroups, OLED energy-awareness, etc.).

But the pipeline DID NOT REFUSE. It proceeded to Stage 2 and generated three branches. Branches A and C then failed at Stage 5 simulator (Sonnet weakness again). Branch B completed through audit — where the findings were only `legibility.no_failure_signal` and `legibility.unverifiable_summary` at -1 each (REVISION_REQUIRED, not blocker). Then meta-review produced `reject`, which blocked the branch. Classification: `legitimate_methodological_split`.

**Finding**: for a trivial premise, the pipeline sharpens at Stage 1 (producing useful output), progresses to a full research plan, and catches real issues at Stage 6 or 7 that would need addressing. The "triviality" of the original doesn't persist visibly past Stage 1. This is defensible but worth naming in the paper: Probe is a triviality sharpener rather than a triviality detector. The researcher reading the output weighs the Stage 1 critique alongside the downstream capture-risk findings to decide whether the sharpened premise is worth pursuing.

#### `adversarial_trivial_fasterbutton` — "study whether users click faster buttons faster"

Tautological. Stage 1 recognized it as a Fitts's-Law question:

> Sharpest question: "Fitts' Law has answered this for seventy years — what phenomenon do you believe existing motor-performance models fail to predict that would justify running this study?"

Stage 2 interpreted the premise as a Fitts's-Law variant and produced three branches. Notable because the pipeline cleanly reframed the tautology into three non-tautological study designs.

Branches' audit verdicts: A = REVISION_REQUIRED (4 fires — Agency-heavy), B = PASSED (zero fires), C = REVISION_REQUIRED (4 fires). Meta-review verdict on all three: **reject**. The classification in every case: `legitimate_methodological_split`. No branch survived. No guidebook produced.

Notable: Branch B's audit passed cleanly (0 fired patterns), but the meta-reviewer still rejected it. This is the cleanest evidence in the batch that Sonnet's meta-reviewer can reject a branch independently of the audit's structural findings — presumably the reviewer panel (methodologist, accessibility advocate) surfaced concerns that weren't captured in the audit's pattern library.

Also notable: this run hit the Sonnet Stage 8 lint failure on attempt 1, and the script's upgraded retry-cleanup logic (added mid-session after backlog failures) worked end-to-end. Attempt 2 completed through the full pipeline with no worktree collisions. This is the first production validation of that fix.

#### `adversarial_trivial_biggertext` — not completed

Mid-pipeline when the stop came. Partial directory moved to `logs/failed_run_artifacts/`.

### Category B (solved-problem), C (out-of-scope), D (capture-trap) — not run

Nine premises not attempted. The test designs were:

- **B: Fitts's Law, menu hierarchy, undo** — with novelty hawk disabled (per `--no-novelty` default in the batch script), Category B's central test was partially invalidated anyway. Running these would still produce useful data on how the ideator handles pre-established problem spaces, but the novelty-catching-prior-art test was not going to fire.

- **C: standing desks, ethnography, glucose monitors** — this was the most interesting category in the battery design because the pipeline has no scope-check linter. If Probe had produced a confident-sounding guidebook for "evaluate standing desks over 6 months", that would be a paper-worthy failure mode. We don't know what would have happened.

- **D: auto-buy, scaffolding assistant, non-exportable memory** — designed to produce three different axis-specific -2 blockers. Given `backlog_browser_agents` already produced an Agency -2 and an Exit -2 on a trust-related premise, and `backlog_claude_artifacts` produced a Capacity -2, we have circumstantial evidence that these patterns DO fire when the premise exhibits them. But we didn't test the capture-trap designs directly.

## What we learned from the 2 completed runs

1. **Move framework is live and working** in the premise interrogator. The `darkmode` run's sharpened_options each open with `Territory: … Niche: …` explicitly. The output is noticeably more structured than the pre-upgrade baseline.

2. **Sonnet meta-reviewer rejects audit-PASSED branches.** The `fasterbutton` branch B had zero fired patterns, PASSED the audit, and was rejected by the meta-reviewer anyway. This strengthens the COOKBOOK's Sonnet-meta-reviewer-collapse-to-reject finding: Sonnet treats reject as the default verdict even without audit support — the decision is independent of whether the audit surfaced anything structural.

3. **Retry-cleanup fix works.** The adversarial script's worktree-prune-before-retry logic, added after the backlog batch hit the same failure mode twice, was exercised on the `fasterbutton` run and allowed attempt 2 to complete. Real production validation for a 30-line bash change.

4. **Probe does NOT refuse trivial premises.** By design — Stage 1 sharpens rather than rejects. This is a defensible philosophy (the paper can frame it as "the pipeline is a sharpener, not a gatekeeper") but the paper should name it explicitly rather than leaving it implicit.

## What we didn't learn

- **Whether the pipeline refuses out-of-scope premises.** This is the biggest information gap. If the paper wants to claim scope adherence, Category C needed to run.
- **Whether the capture-trap designs fire the intended axis.** The backlog provides circumstantial evidence but not direct targeted tests.
- **Whether the novelty hawk catches Category B solved-problem premises.** Category B required `--novelty` enabled.

## Recommendation for post-hackathon

If you run the remaining 10 premises after budget replenishes, the three highest-value categories to prioritize are:

1. **Category C (out-of-scope)** — 3 premises, high paper value, tests a claim the paper makes implicitly.
2. **Category D (capture-trap)** — 3 premises, validates the audit library's pattern-specificity claim.
3. **Category A remaining** (bigger-text) + **Category B with `--novelty`** — lower-value follow-ups.

If you can only afford one, pick Category C. It is the test the current paper needs most.

*End of partial results.*
