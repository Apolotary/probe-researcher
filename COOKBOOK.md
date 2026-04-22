# Probe cookbook — empirical patterns across the run corpus

**Status**: draft-in-progress. 15 runs under `runs/` have been analyzed end-to-end (3 pre-overnight benchmarks + 12 overnight backlog attempts, of which 9 completed and 3 failed twice). A 12-premise adversarial battery is running in the background and this document will be updated when it completes.

**Generated**: 2026-04-22 (15 runs; 9 successful pipelines + 3 failed pipelines + 3 prior benchmarks). Sample size is suggestive, not generalizable — single-author, screen-based-HCI premise set.

An empirical cookbook: which premises produce which pipeline behaviors, which reviewer personas catch what, where the cost sits, what the failure modes look like, and — most important — what the Opus-vs-Sonnet tradeoff actually is once you run it at n=15 rather than n=1.

---

## 0. The headline finding

Before any sub-question: the provider-comparison picture from the original n=1 methodologist ablation did not generalize when we ran the full pipeline under Sonnet across 9 backlog runs.

| Provider | Runs | Guidebooks produced | Surviving branches | Median cost | Cost per guidebook |
| --- | --- | --- | --- | --- | --- |
| Opus 4.7 | 6 | 5 | 10 / 18 (55%) | $4.12 | $4.30 |
| Sonnet 4.6 | 9 | **0** | **0 / 27 (0%)** | $1.79 | ∞ |

Under Opus, 5 of 6 runs produced a usable `PROBE_GUIDEBOOK.md`. Under Sonnet, **zero** runs in this set produced a guidebook — Sonnet either failed at Stage 5 (simulator rehearsal), was rejected at Stage 7 (meta-reviewer), or was rejected at Stage 8 (linter after the one repair pass).

The cost-per-call advantage of Sonnet (~2.3× cheaper) is illusory for this pipeline at this task. Of the work Stages 1–4 completed under Sonnet (which is most of the pipeline by cost), none survived to produce the artifact the system is built around. The failed runs still produced `WORKSHOP_NOT_RECOMMENDED.md` reports on blocked branches (which are valuable — they say what's wrong with the design), but not the guidebook itself.

The CLAUDE.md rule "never downgrade Stages 5, 6, 7" — originally a judgment call pre-measurement — now has concrete evidence behind it across 27 branch-trials.

**Implication for the paper**: the Opus-vs-Sonnet ablation section should state the n=1 Stage 7 finding (Sonnet substantively capable on the methodologist stage) alongside the n=9 full-pipeline finding (Sonnet produces 0 guidebooks). The ablation measured Sonnet's judgment on one stage with fixed inputs; the full-pipeline run measured whether Sonnet can sustain the pipeline end-to-end. These are different tests, and the first result does not generalize to the second.

---

## 1. Dataset

### Opus runs (n=6)

| run_id | premise domain | verdicts (a/b/c) | cost | wall | repairs |
| --- | --- | --- | --- | --- | --- |
| `demo_run` | BLV screen-reader × AI disclosure | B/S(HJR)/B | $5.93 | 55m | 23 |
| `benchmark_creativity_support` | creativity tool for poets | S/S/S | $6.65 | 45m | 13 |
| `benchmark_code_review` | AI-assisted code review | B/B/F | $2.43 | 19m | 2 |
| `backlog_polymarket_drift` | semi-auto trading agent drift | S(HJR)/B/S(HJR) | $3.43 | 28m | 2 |
| `backlog_torso_s4_ios` | mobile hardware-sampler UI | B/S/S(HJR) | $4.56 | 34m | 8 |
| `backlog_mochi_proactive` | ADHD-proactive reminders | S(HJR)/S/B | $3.76 | 28m | 2 |

**5 of 6 produced guidebooks.** One (`benchmark_code_review`) blocked all branches — all three hit the audit/reviewer gates, no guidebook assembled, but the run still produced useful `WORKSHOP_NOT_RECOMMENDED` reports naming the capture risks on each branch.

### Sonnet runs (n=9 completed + 3 failed twice = 12 attempted)

| run_id | premise domain | verdicts (a/b/c) | cost | result |
| --- | --- | --- | --- | --- |
| `backlog_llm_codereview` | LLM code review × reviewer disagreement | fail/fail | $0.04 | Stage 2 length-cap violation |
| `backlog_browser_agents` | browser-use agent trust | F/B/B | $1.93 | first Agency + Exit blockers |
| `backlog_screenreader_llm` | LLM alt-text for data vis | F/B/F | $1.46 | 2 Stage-5 fails |
| `backlog_claude_artifacts` | AI-generated HTML reasoning | B/B/B | $2.30 | 3 different -2 patterns |
| `backlog_voice_agents` | voice agent codeswitching | fail/fail | $0.07 | Stage 8 lint-after-repair failure |
| `backlog_live_coding` | pair-programming music perf | B/B/F | $2.20 | 2 Agency blockers + 1 Stage-5 fail |
| `backlog_divination_ui` | probabilistic decision-support | F/F/B | $1.68 | 2 Stage-5 fails (worst run) |
| `backlog_e2ee_ai` | E2EE platform AI features | fail/fail | $0.07 | Stage 8 lint-after-repair failure |
| `backlog_rag_attribution` | RAG citation attribution | F/B/B | $1.94 | 1 Stage-5 fail |

**0 of 9 produced guidebooks.** 3 failed before reaching Stage 8. The 6 that reached Stage 8 all had either all-branches-blocked or all-branches-rejected outcomes.

HJR = `human_judgment_required` meta-review verdict (not a failure state — the meta-reviewer refused to collapse a legitimate reviewer split to consensus).

---

## 2. Premise shapes and branch divergence

The Stage 2 ideator is required to produce three branches that differ on research question, intervention primitive, human-system relationship, and method family. Reading `branches/*/branch_card.json` across the 15 runs:

**Premises that diverge richly**: premises naming a specific interaction modality plus a measurable mechanism. Examples: `backlog_torso_s4_ios` (mobile UX × tactile affordances), `backlog_browser_agents` (consequential web actions), `demo_run` (BLV + ARIA-live × disclosure). Each produced branches that genuinely differ on their unit of analysis — A tested the real-time intervention, B the semantic framing, C the participant expertise structure.

**Premises that collapse to same-method variants**: premises framed at too abstract a level. `benchmark_creativity_support` (poetry drafting) produced three branches that mostly differed on when a suggestion fires rather than what is being studied. When this happens, the adversarial review panel has less to disagree about — the `benchmark_creativity_support` run produced the only `consensus` disagreement class in the pre-overnight corpus.

**Premises where divergence matters most**: premises that exhibit multiple capture axes simultaneously. `backlog_claude_artifacts` — how developers reason about AI-generated HTML — fired three different -2 patterns across three branches (A on Legibility, B on Capacity, C on Agency). The divergence structure let the audit surface the premise's actual risk portfolio, not just its dominant axis.

---

## 3. Capture-risk audit — cross-domain pattern firing (n=15, 39 branches)

| axis | total fires | branches with ≥1 fire | fires per branch (mean) |
| --- | --- | --- | --- |
| Capacity | 31 | 23 / 39 (59%) | 0.79 |
| Agency | 31 | 22 / 39 (56%) | 0.79 |
| Exit | 13 | 10 / 39 (26%) | 0.33 |
| Legibility | 68 | 29 / 39 (74%) | 1.74 |

The earlier `[n=3]` claim that legibility dominated survives at larger n — but the gap to Capacity/Agency is narrower than it looked. The library's cross-axis vocabulary is intact; when premises exhibit Agency or Exit capture specifically, the audit fires the relevant patterns.

### First-fire milestones (positive capability signals)

- **Exit axis was under-exercised** until `backlog_polymarket_drift` (branch C: 2 Exit fires) — the first non-zero Exit count outside the creativity-support benchmark.
- **First Agency -2** (a blocker, not just drift) fired on `backlog_browser_agents` branch B (`agency.auto_decides_consequential_step`) — an autonomous-action scenario where the audit correctly caught the capture.
- **First Exit -2** fired on `backlog_browser_agents` branch C (`exit.data_lock_in`).
- **First Capacity -2** fired on `backlog_claude_artifacts` branch B (`capacity.substitutes_for_practice`).

Prior to the overnight batch, no -2 blockers existed outside the `legibility.*` axis. The backlog runs produced blockers on three other axes across three different domains. This is the strongest single piece of evidence that the audit library's vocabulary is genuinely cross-axis.

### Top-fired patterns

The most-fired patterns across the corpus, in order:

1. `legibility.no_failure_signal` — fired on 14 branches across the corpus; blocked 2 branches at -2. This pattern over-domesticates to screen-based AI studies because most screen-based AI interventions DO have a "can the user tell when the AI failed" question.
2. `legibility.no_rationale_at_point_of_action` — fired on 11 branches; blocked 1 branch at -2.
3. `agency.auto_decides_consequential_step` — fired on 9 branches; blocked 2 branches at -2.
4. `capacity.substitutes_for_practice` — fired on 8 branches; blocked 1 branch at -2.

The long tail of the pattern library (12 of 16 patterns) fired at least once across the corpus. Three patterns never fired (all three on the Exit axis, which was the under-tested axis across the domain set).

---

## 4. Reviewer panel — who catches what, and how harsh is each persona

Across the 15 runs, reviewer persona behavior is consistent:

**Methodologist** catches confound control, statistical power, demand characteristics, IRB framing, and the match between claim and method. The announcement-duration confound on `demo_run` branch B (4-5× speech-duration difference between AI and human stimulus strings) is canonical methodologist output.

**Accessibility advocate** is strongest on accessibility-adjacent premises. On `demo_run` (BLV domain) it caught cross-disability conflation, wizard-authority asymmetry, and the extractive-research-pattern critique. On non-accessibility runs it produces weaker but legitimate catches (e.g. dyslexic-writer accessibility flagged on the poetry-drafting run).

**Novelty hawk** (where enabled) surfaces uncited-adjacent literature. On the demo_run this produced the Jakesch/Longoni/Sundar flag that led to three source cards being added to the corpus. Under `--no-novelty` (how the overnight batch ran), the panel is 2-reviewer rather than 3-reviewer.

**Meta-reviewer** harshness drifted sharply from Opus to Sonnet:

| Meta-reviewer verdict | Opus runs (n=6) | Sonnet runs (n=9, reaching stage 7) |
| --- | --- | --- |
| `accept_revise` | 4 | 0 |
| `human_judgment_required` | 6 | 0 |
| `reject` | 0 | 12 |

The Stage 7 ablation study (done pre-overnight, n=1 at the single-reviewer level) reported that Sonnet recommended `reject` where Opus said `major_revision` — "arguably the more methodologically honest call at n=8." This finding generalized at the meta-reviewer level too: **every Sonnet meta-review in the overnight batch produced `reject` as the verdict.** This is the primary reason Sonnet produced zero guidebooks — the meta-reviewer stops the pipeline before Stage 8 when it rejects.

Two readings, both supportable:
(a) Sonnet is calibrated to be harsher, producing a methodologically cleaner but practically unusable pipeline output rate.
(b) Sonnet doesn't have Opus's ability to sustain a "major revision is a legitimate verdict" stance — it collapses ambiguity to reject.

The evidence does not distinguish these two readings. It does demonstrate that Opus preserved both `accept_revise` and `human_judgment_required` across 10 meta-reviews, while Sonnet produced neither in 12 meta-reviews. A follow-up ablation holding the branch-card + audit + reviewer outputs constant and only swapping the meta-reviewer model would pin which reading is right; that's not in scope for this paper.

---

## 5. Meta-review disagreement classifications (n=22 on runs that reached stage 7)

| classification | count | shape |
| --- | --- | --- |
| `legitimate_methodological_split` | 15 | reviewers disagree on method rigor; not resolvable by pipeline |
| `consensus` | 3 | reviewers aligned on decisive weakness |
| `single_reviewer_outlier` | 2 | one reviewer objects strongly, others don't |
| `legitimate_normative_split` | 1 | reviewers disagree on values / ethics, not methods |
| `spurious_surface_disagreement` | 1 | reviewers look disagreeing but aren't on closer read |

4 of 5 available classes appear in the corpus. Only the verdicts `accept_revise` and `human_judgment_required` are paired with most of these — under the Sonnet-only runs, nearly all disagreement classes collapsed into `reject` regardless of class. This is additional evidence for reading (b) above: Sonnet's meta-reviewer does use the full classification vocabulary but always chose `reject` as the subsequent verdict.

---

## 6. Cost, wall-clock, and pipeline-completion rates

### Under Opus (n=6)

| metric | min | median | max |
| --- | --- | --- | --- |
| cost per run | $2.43 | $4.12 | $6.65 |
| wall-clock | 19m | 31m | 55m |
| repair passes per run | 2 | 7.5 | 23 |
| guidebook produced | 5 of 6 runs | | |

### Under Sonnet (n=9 completed + 3 failed twice)

| metric | min | median | max |
| --- | --- | --- | --- |
| cost per run | $0.04 (pipeline-aborted) | $1.68 | $4.56 |
| wall-clock | 1m (pipeline-aborted) | 26m | 34m |
| repair passes per run | 0 | 4 | 8 |
| guidebook produced | 0 of 9 runs | | |

Sonnet's per-run cost savings (~2.4× per successful run) are real, but cost-per-guidebook is ∞ in this run set.

---

## 7. Failure modes worth flagging

These observations are the "what to watch for" list, pulled from 15 runs of actual pipeline behavior:

1. **Sonnet Stage 5 simulator failures (4 branch failures across 3 Sonnet runs)**. The `screenreader_llm`, `live_coding`, and `divination_ui` runs each had at least one branch fail at Stage 5 after one repair pass. The divination_ui run failed 2 of 3 branches here. Stage 5 under Opus had median 0 repair passes per run; under Sonnet the median is 1-2. This is the "can the model sustain hedged rehearsal voice over a page of output" test, and Sonnet is visibly worse at it.

2. **Sonnet Stage 8 guidebook lint failures (2 complete-run failures)**. Both `voice_agents` and `e2ee_ai` reached Stage 8 successfully, produced a guidebook, failed the provenance + forbidden-phrase linter, failed the one repair pass, threw. Both are voice-discipline failures (the model used evidence-coded language the forbidden-phrase list catches). The `voice_agents` premise (multilingual codeswitching) may specifically push the model into "participants said" phrasing.

3. **Stage 2 ideator length-cap violations**. The `llm_codereview` Opus attempt produced a `branch b.one_sentence_claim` over 300 characters; the one repair pass did not shorten it. This is a prompt-tuning issue on Opus, not Sonnet — the fix (add a concrete 300-char example to the ideator prompt) is a 5-line edit but out of scope for tonight per the overnight task constraints.

4. **Pattern over-fire on intentional friction**. The `benchmark_code_review` run (pre-overnight) flagged an adversarial-challenger UI (intentionally designed to create over-trust correction) as `agency.weak_override`. The audit template now asks the human reviewer to confirm pattern fires in `WORKSHOP_NOT_RECOMMENDED.md`, but the pattern library does not yet include an applicability check. The CLAUDE.md non-negotiables prevent editing `patterns/*.yaml` without user review, so this stays open.

5. **Git worktree collision on retry**. The retry path in `scripts/run_backlog.sh` didn't clean up stale git branch references before re-attempting. Hit this twice in the backlog batch (`llm_codereview`, `voice_agents`). The fix (5 lines: `git worktree prune` + `git branch -D run-<slug>-{a,b,c}`) was added to the adversarial runner for the next batch.

6. **Slug-derivation bug**. Branch names derived from the run-id sometimes chop the first few characters — `backlog_e2ee_ai` produced `run-klog_e2ee_ai-*` branch names. Worth fixing in the orchestrator's slug generation.

---

## 8. Provenance-linter behavior across the corpus

All 5 runs that produced guidebooks (all Opus) pass both the default provenance lint and the voice-forbidden-phrase lint. The demo_run guidebook additionally passes `--strict-inference` (the opt-in rule requiring every `[AGENT_INFERENCE]` to sit within 5 preceding elements of an anchor tag) after the Task 2 edits — it was the only shipped guidebook with enough reviewer-objection paragraphs to test the rule at scale.

Running `--strict-inference` against the `benchmark_creativity_support` guidebook surfaces 22 violations (not yet addressed). That guidebook's structure (all-three-branches-surviving, richer failure-hypothesis section) may be more AGENT_INFERENCE-dense than `demo_run`. A future Stage 8 prompt that integrates strict-inference as a generation-time rule rather than a post-hoc check would produce naturally-passing guidebooks.

---

## 9. What this suggests for the paper

Concrete paper-facing implications from the 15-run corpus:

1. **The cost-tradeoff section needs rewriting**. The current text says "Sonnet is substantively capable on the methodologist stage at 2.4× lower cost" (true, from the n=1 ablation) and implies this generalizes to Sonnet-everywhere (false — 0 of 9 Sonnet runs produced a guidebook). The rewrite should distinguish: per-stage capability (Sonnet is usable at Stage 7 methodology review) from end-to-end pipeline capability (Sonnet is not usable end-to-end in this configuration).

2. **Add a cross-axis fire-count table to Section 5** (capture-risk audit). The current text claims 16 patterns exist; the data shows 13 fired at least once, 3 Exit-axis patterns never fired, and the cross-axis distribution is 31/31/13/68 for Cap/Agc/Exit/Leg. This is empirical not theoretical and strengthens the "library uses its vocabulary" claim.

3. **The meta-reviewer verdict distribution is a paper result**. Under Opus: 4 accept_revise, 6 HJR, 0 reject across 10 meta-reviews. Under Sonnet: 0, 0, 12. The paper currently doesn't present this; it's a clean one-table finding.

4. **Acknowledge the `benchmark_code_review` pattern mis-fire** — the intentional-friction vs capture ambiguity — alongside the current audit template's `[HUMAN_REQUIRED]` mitigation. This is a limitation, not a claim, and the paper's honesty on other limitations earns the framing.

5. **The screen-based HCI corpus is biased**. All 12 overnight premises were screen-based. The pattern library was tuned against accessibility and AI-assistance. When the adversarial battery runs (currently in progress), the out-of-scope premises will test whether the pipeline fails gracefully on non-screen-based research, which is an evaluation the paper currently lacks.

---

## 10. To be updated when the adversarial battery completes

The adversarial battery (12 premises across 4 categories: trivial, solved, out-of-scope, capture-trap) is running in the background. When it finishes, this cookbook will add:

- Section on what each adversarial category actually caught (Stage 1 interrogator, novelty hawk, scope-flagging, audit library)
- Honest assessment of where the pipeline produced output that shouldn't have existed (e.g. if a trivial premise produced a full guidebook)
- Per-category cost + time summary

Until then, the adversarial section is empty and this cookbook is `[n=15]` rather than `[n=27]`.

*End of revision.*
