# Probe cookbook — empirical patterns across run set

**Status**: draft-in-progress. As of this writing, 3 runs under `runs/` have completed end-to-end: `demo_run`, `benchmark_code_review`, `benchmark_creativity_support`. A backlog batch (Task 4, 10-12 premises) and an adversarial battery (Task 5, 12 premises) are running sequentially in the background; this document is updated as those complete.

**Generated**: 2026-04-22 by overnight Task 6, starting pass. Observations are tagged `[n=3]` where only three runs contribute. Claims labelled `[n≥5]` or higher will appear as more runs land.

This is not a user manual. It's an empirical cookbook: what kinds of premises yield what kinds of pipeline behaviors, which reviewers catch what, where the cost sits, and where the failure modes live.

---

## 1. Dataset so far

| run_id | premise shape | verdicts (a / b / c) | cost | wall | repairs |
| --- | --- | --- | --- | --- | --- |
| `demo_run` | BLV screen-reader accessibility × AI disclosure | BLOCKED / SURVIVED (HJR) / BLOCKED | $5.93 | 54m | 23 |
| `benchmark_creativity_support` | Creativity-support tool for poetry drafting | SURVIVED / SURVIVED / SURVIVED (HJR) | $6.65 | 44m | 13 |
| `benchmark_code_review` | AI-assisted code review for legacy engineers | BLOCKED / BLOCKED / FAILED | $2.43 | 19m | 2 |

HJR = `human_judgment_required` meta-review verdict.

### Blocking patterns so far `[n=3]`

Every BLOCKED branch across all three runs was blocked by the same pattern: `legibility.no_failure_signal` (-2). This is suggestive but not generalizable — the patterns were tuned against accessibility-ish premises, so over-firing on accessibility and code-review runs is expected. The creativity-support run did not fire any -2 at all.

| run | branches BLOCKED | blocking pattern |
| --- | --- | --- |
| demo_run | a, c | legibility.no_failure_signal |
| benchmark_code_review | a, b | legibility.no_failure_signal |
| benchmark_creativity_support | — | (none blocked) |

---

## 2. Premise shapes that produce divergence `[n=3]`

Stage 2 (solution ideation) is required to produce three branches that differ on **research question**, **intervention primitive**, **human-system relationship**, and **method family**. Reading the three runs' `branches/*/branch_card.json`:

- **demo_run** produced a rich divergence: branch A used live-DOM ARIA injection (high-fidelity intervention), branch B used in-band provenance-banner comparison (semantic intervention), branch C used a passive heading-scan + debrief (observational method). Three genuinely different research questions; three different human-system relationships. The branches diverged well.

- **benchmark_creativity_support** produced divergence that was tighter: all three branches centered on divergence-from-habit, and differed mainly on timing of suggestion (in-line vs. post-hoc vs. on-demand). This is a domain artifact: for creativity tools, the plausible intervention space is narrower than for accessibility.

- **benchmark_code_review** produced divergence but all three still landed on legibility issues (disclosure-of-AI-reasoning), which is why two of three blocked on the same pattern. The divergence was real but the pipeline noticed the structural failure in each.

**Early observation**: premises that name a specific interaction modality (BLV + ARIA-live, poetry drafting + line suggestions, code review + reviewer feedback) diverge usefully. Premises that are fully abstract ("study AI trust") are less likely to produce distinct interventions. This will be testable across the backlog.

---

## 3. Audit pattern firing counts per axis `[n=3]`

Across 9 branches (3 runs × 3 branches), summing fired patterns by axis:

| axis | total fires | branches with ≥1 fire | average per branch |
| --- | --- | --- | --- |
| Capacity | 9 | 8 | 1.0 |
| Agency | 10 | 6 | 1.1 |
| Exit | 3 | 3 | 0.33 |
| Legibility | 21 | 9 | 2.3 |

**Observation**: legibility patterns fire most frequently across domains and branches. This is consistent with the axis being the one that directly checks "can the participant tell what's happening to them" — which is load-bearing in any AI-involved study.

Exit fires least. This is probably an artifact of the premise set: none of the three runs proposed an ongoing tool-adoption arc where exit friction matters. The backlog batch includes a premise about browser-use agents and one about AI assistants with non-exportable history; those should produce Exit fires if the pattern library works.

### Pattern-by-pattern hotspots

In the 3-run set, the single most-fired pattern was `legibility.no_failure_signal` (fired on 6 of 9 branches). The second most-fired was `legibility.no_rationale_at_point_of_action` (3 of 9). These two are the canonical "silent failure" and "opaque decision" patterns; their dominance is consistent with the audit library's intent.

The user should check whether `legibility.no_failure_signal` is over-firing — a false-positive hotspot can look like a dominance pattern.

---

## 4. Reviewer-catch patterns per persona

Reading `branches/*/reviews/*.json` across the 3 runs, what each persona reliably catches:

### Methodologist

Caught in every run where it ran. Specific weaknesses:
- `demo_run`: announcement-duration confound (~4-5× difference in spoken length of stimulus strings) — the catch that the `probe audit-deep` managed agent later quantified at 3.67 seconds.
- `benchmark_creativity_support`: absence of a length-matched control condition; demand characteristics from within-subject design.
- `benchmark_code_review`: underpowered n and missing confound control on developer experience level.

**Pattern**: the methodologist consistently catches confound control and statistical power. It is the most reliable reviewer at finding fatal-to-claims issues.

### Accessibility advocate

Strongest on `demo_run` (its home domain): caught cross-disability conflation (Braille-display users as edge case), wizard-authority asymmetry, and the extractive-research-pattern critique. On the non-accessibility runs the reviewer was less specific — on `benchmark_creativity_support` it flagged dyslexic-writer accessibility as an uninvestigated subpopulation, which is a legitimate but weaker catch.

**Pattern**: produces strongest findings when the premise directly concerns disabled users. Still produces findings elsewhere but they're thinner.

### Novelty hawk (where it ran)

Disabled via `--no-novelty` in most overnight runs. On the demo run where it was enabled, it flagged uncited-adjacent literature (Jakesch, Longoni, Sundar) — three of which were added to the corpus in response. The pattern: novelty hawk acts as a corpus-gap detector, which is useful but blurs the boundary between literature review and reviewer output.

---

## 5. Meta-review verdict distribution `[n=3]`

Across 3 meta-reviews on surviving branches:

| verdict | count | which |
| --- | --- | --- |
| `accept_revise` | 2 | creativity_support/a, creativity_support/b |
| `human_judgment_required` | 2 | demo_run/b, creativity_support/c |

Disagreement classifications:
- `consensus`: 1 (creativity_support/b)
- `spurious_surface_disagreement`: 1 (creativity_support/a)
- `legitimate_methodological_split`: 2 (demo_run/b, creativity_support/c)

**Observation**: `human_judgment_required` is not a failure state. It appears when reviewers' decisive weaknesses are non-reducible (different objects of concern: a methodological fix doesn't address a novelty gap, and vice versa). Both HJR cases here involved a genuine three-way tension that the meta-reviewer correctly refused to collapse.

---

## 6. Cost, wall-clock, and lint pass rates `[n=3]`

| metric | min | median | max |
| --- | --- | --- | --- |
| cost (USD) | 2.43 | 5.93 | 6.65 |
| wall-clock (min) | 19 | 44 | 54 |
| repair passes (absolute) | 2 | 13 | 23 |

**Observation**: cost varies 2.7× across the three runs, and repair passes vary 11×. The outlier is `benchmark_code_review`, which was cheaper and faster because it ended early — branch C failed at stage 7 (reviewer) and the pipeline didn't spend on stage 8 guidebook assembly (no surviving branch). The repair-pass rate correlates roughly with how much Stage 4 (prototype specification) struggled with the schema enums for that premise's branches.

Both shipped guidebooks (`demo_run`, `benchmark_creativity_support`) pass both default linters. `demo_run` additionally passes `--strict-inference` after the Task 2 edits.

---

## 7. Interesting failure modes

The three runs together surface four failure modes worth flagging:

1. **Pattern over-fire on intentional friction** (observed on `benchmark_code_review`): the adversarial-challenger UI designed for over-trust correction got scored as `agency.weak_override` because the pattern heuristic doesn't distinguish intentional friction-for-reflection from friction-as-capture. The audit now asks humans to confirm pattern fires in `WORKSHOP_NOT_RECOMMENDED.md`, but the pattern library itself does not yet include an applicability check. This is documented in the paper's Limitations section.

2. **Stage 4 schema-repair churn** (observed on all 3 runs): the prototype specification stage repairs against schema enums multiple times in the first few trials. Median 4 repair passes per (stage, branch) pair. The repair prompt is fine but the schema is strict. The observed cost: ~$0.10 per repaired pair.

3. **Stage 7 early-exit failure** (observed on `benchmark_code_review` branch C): one branch failed at stage 7 with "reviewer reached reject verdict without reading the full reviewer panel" — a meta-reviewer bug in its own rehearsal. This happened in one trial; it should be watched for in the backlog batch.

4. **Cross-domain legibility dominance**: as noted in section 3, `legibility.no_failure_signal` accounts for every BLOCKED verdict. If this pattern fires on 10+ runs in the backlog batch with varying relevance, it will need re-calibration. The alternative hypothesis — that every AI-involved screen-based study genuinely has a silent-failure problem — is also plausible.

---

## 8. Premise-to-branch-count observations `[n=3]`

All three runs produced three branches. None of the current premises triggered a Stage 1 refusal or a Stage 2 collapse-to-two. The pipeline's invariant (three branches or pipeline-failure) has not yet been stressed. The adversarial Category A (trivial premises) is designed to test this: premises like "study whether users prefer dark mode" should arguably fail at Stage 1 if the premise-interrogation agent is doing its job.

---

## 9. Open questions for the user (flag for morning review)

- Is `legibility.no_failure_signal` over-firing on accessibility-adjacent premises, or is its dominance an accurate reflection of the design space? A re-calibration run with one premise pre-fixed against this pattern would test it.
- The repair-pass rate on Stage 4 is notable (median 4 per pair). Is the enum strictness worth the repair cost, or should Stage 4 tolerate broader schema shapes?
- The `human_judgment_required` verdict appears on 2 of 3 surviving branches. Is this the expected rate (meta-reviewer doing its job), or are reviewers over-producing non-reducible objections?

---

## 10. To be updated

Sections to extend once the backlog and adversarial batches complete:
- Section 1 (dataset): add rows
- Section 3 (axis fire counts): refresh with expanded n
- Section 4 (reviewer patterns): extend with cross-domain examples
- Section 5 (meta-review distribution): will be more informative at n≥10
- Section 9 (open questions): update with anything the new runs surface

*End of draft.* Expect a larger revision after the overnight batches complete.
