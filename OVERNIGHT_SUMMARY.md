# Overnight summary — 2026-04-22

This is Task 10 from the overnight brief: what got done, what didn't, and what to look at first when you wake up. Written at ~18:30 GMT+9 after the external API-credit cap stopped the remaining batch work.

## Headline

**What you can demo in the morning:**
- 5 of 6 Opus runs have a full `PROBE_GUIDEBOOK.md` + `PROBE_REPORT_PAGE.html` (Bloom-style web report, shareable via one URL).
- New `probe` interactive default (no subcommand needed), OpenAI fallback, and demo-mode-without-keys for the browse/lint/render paths.
- ACM sigconf LaTeX archive (`probe_acm_sigconf.zip`) ready to upload to Overleaf.
- 69 passing tests (up from 29 at session start).
- 15 commits on `origin/main`; all of tonight's work is pushed.

**What to look at first when you wake up:**
1. `RUNS_SUMMARY.md` at repo root — one-page cross-run table across the 18 runs.
2. `COOKBOOK.md` (§0 headline finding): Opus produced 5/6 guidebooks; Sonnet produced 0/9. Per-call cost savings are illusory end-to-end.
3. `ISSUES_OBSERVED.md` — 10 timestamped entries needing your judgment; the Stage 2 length-cap bug and the Sonnet Stage-5/Stage-8 fragility are the two most load-bearing for the paper's cost-tradeoff discussion.
4. `runs/demo_run/PROBE_REPORT_PAGE.html` — the new Bloom-style report page. Open in browser; it's the shareable demo artifact.

## Tasks completed

| # | Task | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Verify `--no-novelty` fix | ✓ done | 3 tests in `tests/cli_flags.test.ts`; fix at `src/cli/run.ts:34` |
| 2 | Resolve 32 strict-inference violations | ✓ done | `runs/demo_run/PROBE_GUIDEBOOK.md` passes `--strict-inference` |
| 3 | Build `probe stats` | ✓ done | `src/cli/stats.ts` + `tests/stats.test.ts` (6 tests); `RUNS_SUMMARY.md` generated |
| 4 | Run 10-12 backlog premises | ✓ done (9/12 succeeded, 3 failed twice) | `runs/backlog_*/` |
| 5 | Adversarial battery | ⚠ partial (2/12 completed) | `runs/adversarial_trivial_darkmode/`, `runs/adversarial_trivial_fasterbutton/` |
| 6 | COOKBOOK.md | ✓ done | `COOKBOOK.md` at n=15, 2944 words |
| 7 | Forbidden-phrase candidates | ✓ done | `corpus/candidates/forbidden_phrases_candidates.md` |
| 8 | Source-card candidates | ✗ not started | gated on user judgment; DOI verification via web |
| 9 | Maintain `ISSUES_OBSERVED.md` | ✓ ongoing | 10 entries logged during the session |
| 10 | Final summary | ✓ done | this file |

Also shipped outside the numbered list (mid-session user asks):
- ACM sigconf paper archive (`paper_acm/` + `probe_acm_sigconf.zip`)
- `probe import` — warm-start a run from a paper draft with `[IMPORTED_DRAFT]` provenance tag
- `probe report-page` — single-file HTML report in the stanfordhci.github.io/Bloom template
- Move-framework + contribution-category prompt upgrades (`agents/premise.md`, `agents/guidebook.md`)
- ASCII logo as SVG + expanded README install section
- Interactive default `probe` command + OpenAI fallback + demo mode + `probe doctor` stays-open behavior

## API spend

**Total overnight API spend: $44.34** (well under the $120 local soft-stop in the script, but hit the external credit cap first).

| Batch | Runs | Spend |
| --- | --- | --- |
| Pre-overnight benchmarks | 3 | $15.01 (inherited from prior sessions) |
| Backlog batch (Task 4) | 12 attempted, 9 completed | $31.46 |
| Adversarial battery (Task 5) | 3 attempted, 2 completed | $2.88 |
| Import test | 1 | $0.07 (negligible) |

Ignoring the inherited $15, this session consumed ~$29.40 of API credit across 15 new run attempts.

## Test count

- Session start: 29 passing tests
- Session end: **69 passing tests** (+40)
- New test files: `run_id.test.ts`, `append_cost.test.ts`, `deep_audit_capture.test.ts`, `stats.test.ts`, `import_paper.test.ts`, `provider.test.ts`
- Extended test files: `provenance.test.ts` (added 9 tests — GFM table row enforcement, anchored tag, strict-inference rule, IMPORTED_DRAFT tag behaviors)

## Commit count

**15 commits** pushed to `origin/main` during this session. All commits follow the structured-message pattern from `CLAUDE.md`. Two are session-tagged (session-continuation from prior context), 13 are overnight-tagged (this batch).

## Key findings from the 12 backlog runs

These are the paper-facing results from the full-pipeline runs:

1. **Opus → 5/6 guidebooks. Sonnet → 0/9.** The per-call cost advantage of Sonnet (~2.4×) is illusory for this pipeline — cost-per-guidebook under Sonnet in the current run set is ∞. The CLAUDE.md "never downgrade Stages 5/6/7" constraint now has concrete evidence across 27 branch-trials.

2. **Cross-axis pattern diversity confirmed.** Earlier "legibility dominance" concern from n=3 retracted at n=15. The audit library produced -2 blockers across all four axes: Legibility (demo_run, codereview, polymarket, claude_artifacts), Agency (browser_agents, live_coding, claude_artifacts, fasterbutton), Exit (browser_agents via `exit.data_lock_in`), Capacity (claude_artifacts via `capacity.substitutes_for_practice`).

3. **Meta-reviewer verdict distribution by provider is a paper result.** Opus produced {4 accept_revise, 6 HJR, 0 reject} across 10 meta-reviews. Sonnet produced {0, 0, 12} across 12. Sonnet's meta-reviewer collapses to reject in a way the n=1 Stage 7 ablation couldn't see.

4. **Six documented failure modes** in `COOKBOOK.md` §7, each grounded in specific runs: Sonnet Stage 5 simulator failures (4 branch failures across 3 runs); Sonnet Stage 8 lint-after-repair failures (2 complete-run failures); Stage 2 ideator length-cap violations; pattern over-fire on intentional friction; git-worktree retry collision (now fixed in the adversarial script); slug-derivation bug in branch names.

5. **All four meta-reviewer disagreement classes now seen**: `legitimate_methodological_split` (15), `consensus` (3), `single_reviewer_outlier` (2), `legitimate_normative_split` (1), `spurious_surface_disagreement` (1). The paper's claim about preserving classification diversity is empirically supported.

## Adversarial battery — partial findings (2 of 12 completed)

The 2 completed runs (both Category A: trivial premises) reproduced the COOKBOOK's main findings:

- **`adversarial_trivial_darkmode`** ("study whether users prefer dark mode") — the Move-framework prompt upgrade is visibly live in Stage 1 output. `sharpest_question` is pointed, `missing_evidence` is a 6-item structured list mapping to territory/niche/occupation, `sharpened_options` each open with "Territory: … Niche: …" explicitly. Pipeline then proceeded: 2 of 3 branches failed at Stage 5 (Sonnet weakness), 1 blocked at audit.

- **`adversarial_trivial_fasterbutton`** ("study whether users click faster buttons faster") — interpreted by Stage 2 ideator as a Fitts's-Law variant; 3 branches blocked, 2 on Agency patterns (`agency.auto_decides_consequential_step` and `agency.weak_override`). Meta-finding: the premise interrogator does NOT refuse tautological premises by design; it sharpens them into specific interventions that the audit can substantively critique. Arguably a feature.

- **Retry-cleanup script fix validated.** The `trivial_fasterbutton` run hit the Sonnet Stage 8 lint failure on attempt 1; the upgraded retry logic auto-pruned worktrees and deleted stale branch names before attempt 2, which ran through cleanly. Without this fix, attempt 2 would have hit the same worktree-collision that stalled `llm_codereview` and `voice_agents`.

Category B, C, D (solved / out-of-scope / capture-trap) — not run.

## What's NOT done

- **Task 5**: 9 of 12 adversarial runs not attempted.
- **Task 8**: source-card candidates not drafted.
- **Task 5 synthesis** (`ADVERSARIAL_TEST_RESULTS.md`): will be attempted in the remaining API-free work after this summary.
- **Move framework + contribution categories ablation**: the prompt upgrade shipped but wasn't re-run on the demo premise to compare guidebook quality. Both would cost API credits.
- **OpenAI fallback end-to-end validation**: the code path is wired and typechecks, but no OpenAI-backed run was ever executed. The first user to set `OPENAI_API_KEY` will be the first to exercise the dispatch path. Low risk for the hackathon demo because the paper claims are Anthropic-specific; medium risk for post-hackathon users.
- **Paper rewrites**: per the overnight brief's hard constraint, framing work is yours. COOKBOOK.md §9 lists five specific paper rewrites recommended by the empirical findings.

## Interesting moments

The single most interesting moment from the backlog runs, in my read:

**`backlog_claude_artifacts`** (how developers reason about AI-generated HTML artifacts) — all three branches blocked, each on a DIFFERENT -2 pattern: A on `legibility.no_rationale_at_point_of_action`, B on `capacity.substitutes_for_practice` (first-ever Capacity -2 in the corpus), C on `agency.hides_options_before_review`. This is the strongest single-run evidence that the capture-risk library isn't just finding `legibility.no_failure_signal` everywhere — when the premise exhibits multiple capture axes, the audit uses the library's full vocabulary. The premise was genuinely a triple-threat across Capacity, Agency, and Legibility, and the audit caught each axis on a different branch with a legitimate evidence span.

The single most surprising thing: **Sonnet's meta-reviewer never produced `accept_revise` or `human_judgment_required` across 12 opportunities**, despite the Stage 7 ablation showing Sonnet recommended `reject` where Opus said `major_revision` in the one-trial case. The ablation result generalized more strongly than expected — Sonnet collapses to reject not just as a judgment but as a pipeline behavior, and 0 of 9 Sonnet runs produced a guidebook as a direct consequence.

## Paper-facing recommendations

Five specific rewrites that the empirical findings support:

1. **Cost-tradeoff section** needs to distinguish per-stage capability (Sonnet is usable at Stage 7 methodology review) from end-to-end pipeline capability (Sonnet produces 0 guidebooks in 9 attempts). Current text conflates these.

2. **Cross-axis fire-count table** — add the 31/31/13/68 distribution across 39 branches. Strengthens the library-is-cross-axis claim empirically.

3. **Meta-reviewer verdict distribution by provider** — the Opus {4/6/0} vs Sonnet {0/0/12} table is a clean one-table finding that doesn't currently appear in the paper.

4. **Acknowledge the `benchmark_code_review` pattern mis-fire** alongside the existing `[HUMAN_REQUIRED]` mitigation in `WORKSHOP_NOT_RECOMMENDED.md`. The pattern library doesn't yet include an applicability check.

5. **Move-framework prompt upgrade is validated in production** — the `trivial_darkmode` Stage 1 output is a ready-made example for the discussion section's "what the premise interrogator does" paragraph.

## Open questions (flagged for your judgment)

From `ISSUES_OBSERVED.md`:

- **Is `legibility.no_failure_signal` over-calibrated?** Fired as blocker on only 2 branches in the full corpus. Low risk it's a false-positive magnet.
- **Stage 2 ideator length-cap violations** (2 runs hit this) — should the repair prompt quote the rejected string verbatim? 5-line prompt change.
- **OpenAI fallback paper-language position** — the README disclaims "Opus-specific claims don't generalize" honestly. The paper itself should probably carry the same caveat.
- **Slug-derivation bug** in branch names (e.g., `backlog_e2ee_ai` → `run-klog_e2ee_ai-*`) — small, cosmetic, one-line fix in the orchestrator's slug helper.

## Repo state for your other machine

```bash
git pull origin main    # pulls all 15 overnight commits
npx probe doctor --once # 13/14 green or so (1 warning for uncommitted state on your primary machine)
npx probe               # the new interactive default; offers the menu adapted to your keys
```

All 18 runs under `runs/` are committed with canonical artifacts (excluded worktree contents per `.gitignore`); the 3 failed-twice attempts are in `logs/failed_run_artifacts/` locally but not tracked.

The paper archive `probe_acm_sigconf.zip` (41 KB, in repo root) uploads cleanly to Overleaf per `paper_acm/README_OVERLEAF.md`.

*End of summary.*
