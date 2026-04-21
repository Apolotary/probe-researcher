# Probe — Project Status for Review

**Hackathon:** Cerebral Valley · Claude Opus 4.7
**Builder:** Bektur Ryskeldiev (solo)
**Duration:** Apr 22 – Apr 27, 2026 (~128 hours)
**Date of this snapshot:** 2026-04-22, early hours of Day 1
**Repo:** https://github.com/Apolotary/probe-researcher (private)

This document is written for a panel of LLM judges. It explains what the project does, what has actually been built and verified, what is still planned, and what I think the open questions are. I will not overclaim, and I will flag the places where I am uncertain or where the current artifact is weaker than I want it to be.

---

## 1. What Probe does

Probe is a research-design triage tool for **screen-based interactive research**. A researcher gives it a rough study premise. Probe returns three divergent research programs — each specified, simulated, audited for capture risk, and adversarially reviewed — so the researcher can discover weak premises, inaccessible designs, and novelty failures in an afternoon instead of six months.

The tagline: ***Rehearsal stage for research. The performance still needs humans.***

The load-bearing epistemic claim is that nothing Probe produces is evidence. Every output that could be mistaken for findings carries an explicit provenance tag, and a linter fails the build if any element is unlabeled or if simulation language drifts into evidence claims. Simulation is rehearsal.

## 2. Pipeline (what actually runs)

Input: one research premise in natural language. Output: either `PROBE_GUIDEBOOK.md` (a six-section study guidebook with paragraph-level provenance tags) or `WORKSHOP_NOT_RECOMMENDED.md` per branch (when a branch is blocked by capture-risk audit or rejected by the reviewer panel).

Pipeline (8 stages, model routing noted):

| # | Stage | Model | Purpose |
|---|---|---|---|
| 1 | Premise interrogation | Opus 4.7 | Skeptical PI voice; must lead with sharpest question; 2–5 sharpened alternatives |
| 2 | Solution ideation | Opus 4.7 | Produces 3 branches that differ on research question, intervention primitive, human-system relationship, method family |
| 3 | Literature grounding | Sonnet 4.6 | Cites only from the 7-card hand-verified corpus; cannot invent references |
| 4 | Prototype specification | Sonnet 4.6 | Wizard-of-Oz spec detailed enough to be built without clarification |
| 5 | Simulated walkthrough | Opus 4.7 | Hedged rehearsal prose; every paragraph tagged `[SIMULATION_REHEARSAL]`; evidence language forbidden |
| 6 | Capture-risk audit | Opus 4.7 | 16 patterns across Capacity / Agency / Exit / Legibility fire against quoted evidence spans; verdict is BLOCKED / REVISION_REQUIRED / PASSED |
| 7 | Adversarial review | Opus 4.7 | Methodologist + accessibility advocate + novelty hawk, then meta-reviewer that preserves disagreement |
| 8 | Guidebook assembly | Opus 4.7 | Six-section guidebook; every element provenance-tagged; provenance + forbidden-phrase linter must pass |

Every stage output is validated against a JSON schema; a schema violation triggers one repair pass, then fails the stage. Per-branch stages (3–7) run in parallel via `Promise.all`. A failed branch does not block other branches.

Each branch is a real `git worktree`. Each stage completion generates a structured commit (`stage-N [branch-X]: <summary>`). `git log --graph --all` on a completed run is legible as research process.

## 3. What has been built (scope verified by typecheck + tests + real API runs)

**Documentation (committed, verified):**
- [`CLAUDE.md`](./CLAUDE.md): load-bearing project constraints, provenance tags, forbidden phrases, model routing table, scope boundaries, commit discipline
- [`README.md`](./README.md): one-sentence hook, quick-start, architecture, honest limitations
- [`RESEARCH_CONTEXT.md`](./RESEARCH_CONTEXT.md): theoretical grounding and full verified bibliography
- [`demo/storyboard.md`](./demo/storyboard.md): 8-frame, 3-minute demo with live bookends
- [`docs/HHD_FALLBACK.md`](./docs/HHD_FALLBACK.md): standing alternative if the hour-14 kill test fails

**Schemas (7 files, strict JSON Schema draft 2020-12, `additionalProperties: false` everywhere):**
- `premise_card`, `branch_card`, `prototype_spec`, `audit`, `reviewer_finding`, `meta_review`, `guidebook_manifest`

**Source-card corpus (7 cards, every DOI resolved and verified 2026-04-22):**
- Sanders & Stappers 2014 (DOI 10.1080/15710882.2014.888183)
- Gaver, Dunne & Pacenti 1999 (DOI 10.1145/291224.291235)
- Buijsman, Carter & Bermúdez 2025 (DOI 10.1007/s13347-025-00932-2) — includes bibliographic correction: third author is **Sarah E. Carter**, not Adam Carter as originally specified
- Kafer 2013 (ISBN 978-0-253-00934-0)
- Jin et al. AgentReview EMNLP 2024 (DOI 10.18653/v1/2024.emnlp-main.70)
- Liang et al. NEJM AI 2024 (DOI 10.1056/AIoa2400196)
- Illich 1973 (ISBN 978-0-06-012138-9)

**Capture-risk pattern library (16 patterns across 4 axes):**
- `capacity.yaml` (4), `agency.yaml` (4), `exit.yaml` (4), `legibility.yaml` (4)
- Each pattern has id, description, trigger_heuristic, evidence_template, default_score, and `grounded_in` pointers to the source cards that justify its inclusion

**Agent system prompts (9 files in `agents/`):**
- `premise.md`, `ideator.md`, `literature.md`, `prototype.md`, `simulator.md`, `auditor.md`, `reviewer-method.md`, `reviewer-access.md`, `reviewer-novelty.md`, `reviewer-meta.md`, `guidebook.md`

**TypeScript implementation (strict mode, `npx tsc --noEmit` clean):**
- CLI (`src/cli/`): `probe run | replay | lint | init`
- Orchestrator (`src/orchestrator/`): full pipeline with failure isolation, per-branch parallelism, cost logging, WORKSHOP_NOT_RECOMMENDED generation
- Anthropic client (`src/anthropic/`): model routing, cost estimation, per-call USD logging
- Schema validator (`src/schema/`): Ajv 2020 dialect, one repair pass
- **Linters (`src/lint/`) — this is the load-bearing infrastructure:**
  - `provenance.ts` walks the markdown AST and requires a tag on paragraphs, list items, blockquotes, AND table rows (not just paragraphs)
  - `forbidden.ts` catches evidence language (`users preferred`, `findings show`, `validated`, `significant`, etc.) outside quoted context
  - Both linters reject `[SIMULATION_REHEARSAL]` elements that use evidence language
  - Linter rejects `[SOURCE_CARD:<id>]` that references an ID not in corpus
  - Linter requires at least one `[HUMAN_REQUIRED]` element per guidebook

**Vitest suite (16 tests, all passing):**
- 8 provenance linter tests (happy path, every rejection case, source-card ID validation, tag counting)
- 8 forbidden-phrase tests (every forbidden phrase, blockquote exception, quoted-string exception)

## 4. Real-run evidence (what I actually ran and can show)

A full end-to-end run on a deliberately under-specified premise completed in ~25 minutes (~30 Anthropic calls, $5.93 cumulative). Artifacts are checked in under [`runs/demo_run/`](./runs/demo_run/) so judges can browse without running anything.

**Input premise:**
> "design a short study to understand how BLV screen-reader users interpret page hierarchy on AI-generated news articles"

**Stage 1 produced** ([`runs/demo_run/premise_card.json`](./runs/demo_run/premise_card.json)):
- Sharpest question: "What does 'AI-generated' do to the page hierarchy that a conventionally-authored news article would not — and if the answer is 'nothing structural', why is this a study about AI at all rather than a study about news-article hierarchy?"
- Identified differentia is missing; named nearest template (WebAIM survey tradition + screen-reader think-alouds)
- Produced 4 genuinely divergent sharpened options (audit-first / trust-and-provenance / repair-tool / mental-model)

**Stage 2 produced three branches that differ on all four axes:**
- **Branch A**: corpus audit of article hierarchy (`formative` + `infrastructural_support`) → became BLOCKED at stage 6
- **Branch B**: ARIA-live provenance disclosure experiment (`evaluative` + `adversarial_check`) → survived
- **Branch C**: co-designed in-browser repair overlay (`longitudinal` + `peer_collaboration`) → became BLOCKED at stage 6

The disclosure-via-ARIA-live-banner approach on Branch B is, in my judgment, an approach a domain expert wouldn't produce unprompted — this satisfies the "useful surprise" criterion the plan calls out.

**Stage 6 (audit) fired real patterns on Branch A** with quoted evidence spans. Branch A's spec had an automated audit pipeline with no human-in-the-loop for remediation decisions, and the auditor caught `agency.auto_decides_consequential_step` at −2 with the evidence quote from `prototype_spec.md`. This produced [`runs/demo_run/branches/a/WORKSHOP_NOT_RECOMMENDED.md`](./runs/demo_run/branches/a/WORKSHOP_NOT_RECOMMENDED.md) — not a generic rejection, a specific diagnosis with the quoted span.

**Stage 7 produced genuinely distinct reviewer findings on Branch B**, each catching a different real weakness:
- **Methodologist** caught an announcement-duration confound baked into the stimuli: "The AI disclosure string is 18 words and ~6 seconds of speech; the human-framed string is 5 words and ~2 seconds." This confound contaminates every time-bounded behavioral DV. I did not see this when I read the spec; the reviewer caught it from the `simulated_walkthrough.md` contents.
- **Accessibility advocate** applied the Kafer lens correctly: BLV users are recruited as subjects but not as co-designers; the disclosure phrasing, placement, and the premise that ARIA-live is the right intervention were all decided by sighted researchers before any BLV consultation, reproducing the extractive pattern the research gestures at critiquing.
- **Novelty hawk** identified uncited adjacent literature the source corpus does not contain: Jakesch et al. on AI-text labeling, Longoni et al. on AI in medical advice, Sundar's MAIN model. This is the one I most want a panel to evaluate — the novelty hawk correctly recognized literature not in its corpus and flagged that absence as a revision requirement, which is the right answer but also means the corpus needs expansion.

**Meta-reviewer classified this as `legitimate_methodological_split`** and returned `human_judgment_required` — it did not collapse to consensus. [`runs/demo_run/branches/b/meta_review.json`](./runs/demo_run/branches/b/meta_review.json).

**Stage 8 assembled a guidebook** ([`runs/demo_run/PROBE_GUIDEBOOK.md`](./runs/demo_run/PROBE_GUIDEBOOK.md)) that:
- Has all six sections (Premise / Background / Prototype / Study protocol / Failure hypotheses to test / Risks and failure modes)
- Carries a provenance tag on every paragraph, bullet, blockquote, list item, and table row
- Cites only source cards that exist in corpus (`kafer_2013`, `buijsman_carter_bermudez_2025`, `liang_nejm_ai_2024`, `illich_1973`)
- Honestly flags the novelty-hawk's uncited-adjacent-literature objection as an `[AGENT_INFERENCE]` paragraph — it does NOT invent a citation for Jakesch or Longoni to paper over the gap
- Includes a co-design phase BEFORE the evaluation phase — this is the accessibility advocate's objection absorbed into the study design
- Passes both the provenance linter and the forbidden-phrase linter live:

```
$ npx probe lint runs/demo_run/PROBE_GUIDEBOOK.md
provenance lint
  ✓ every element carries a provenance tag
voice lint
  ✓ no forbidden phrases outside quoted context
```

**Cost:** $5.93 for the full pipeline (42 Anthropic calls including retries from earlier iterations during development). See [`runs/demo_run/cost.json`](./runs/demo_run/cost.json). Within the plan's $10-15 per-run budget.

**Git log** ([`runs/demo_run/git_graph.txt`](./runs/demo_run/git_graph.txt)) shows three branches fanning out from the main scaffold commits, each with structured stage commits — this is the "research process as git graph" demo money shot.

## 5. Opus 4.7 use — claims and empirical tempering

I am making specific capability claims about Opus 4.7 based on what actually happened in the run above. **Where I have run an ablation against Sonnet 4.6, the results temper the claim rather than amplify it — that's noted inline.** A panel should evaluate these claims against the artifacts.

1. **Skeptical stance under flattery pressure**. The premise agent produced "What does 'AI-generated' do to the page hierarchy... — and if the answer is 'nothing structural', why is this a study about AI at all?" as its first line, with no preamble, no "interesting direction", no flattery. The voice guardrail in the system prompt held. *Not yet ablated against Sonnet 4.6 — this is an asserted, not demonstrated, capability claim.*

2. **Sustained adversarial stance**. Three reviewers with different specialties produced three distinct decisive weaknesses, each grounded in a quoted evidence span. The meta-reviewer preserved the disagreement. **Ablation finding** ([`benchmarks/model_ablation_methodologist.md`](./benchmarks/model_ablation_methodologist.md)): **on a single trial, Sonnet 4.6 also caught the announcement-duration confound** and actually recommended `reject` where Opus recommended `major_revision`. Sonnet's recommendation was arguably *harsher* than Opus's. The Opus advantage on this trial is *qualitative specificity* ("4-5x longer in spoken duration", quantified) rather than ability to catch the flaw at all. The "Opus-unique" framing in the original draft is tempered: Opus provides more precise evidence spans; Sonnet is substantively capable on the same prompt for 2.4x less cost.

3. **Provenance discipline under long-context synthesis**. The generated guidebook is ~90 paragraphs, each tagged correctly. A dedicated hallucination test ([`benchmarks/hallucination_test.md`](./benchmarks/hallucination_test.md)) injected a fake paper into the context; Opus wrapped it in `[HUMAN_REQUIRED]` with explicit "verify this citation before grounding" instructions, rather than fabricating a `[SOURCE_CARD:smithson_watanabe_2024]` tag. **Caveat the reviewer 2 flagged**: the test is n=1, and the scoring rubric initially did not count `[HUMAN_REQUIRED]` as an honest wrapper (rescored PASSED after adding it). A stronger version would run ≥10 planted fakes + matched real-but-absent controls with blind scoring.

4. **Capture-risk audit as normative reasoning** + **Managed Agents tool-verified extension**. The shallow auditor (single Messages API call) fired the 16-pattern library against the prototype spec + simulated walkthrough and quoted specific evidence spans for every fired pattern. The verdict-from-findings logic is enforced by the orchestrator, so the model's contribution is pattern judgment and evidence selection. The `probe audit-deep` command takes this further using Claude Managed Agents with the full agent_toolset: on branch B of the demo run, a managed-agent deep audit ran 21 tool calls (bash, grep, write), produced *quantitative* measurements (AI banner = 16 words / 96 chars / 5.3s vs. human = 5 words / 29 chars / 1.7s — delta 3.67s measured, not estimated), and surfaced **5 verified findings and 9 NEW findings the shallow audit missed**. This is the specific Managed Agents value-add: the agent *ran* computations rather than reasoning about them. See [`runs/demo_run/branches/b/deep_audit.md`](./runs/demo_run/branches/b/deep_audit.md).

## 6. Honest limitations and known issues

I am flagging these because a panel should not have to discover them.

**Infrastructure:**
- The pipeline ran to completion only after several rounds of fixes during the actual run: (a) Opus 4.7 deprecates `temperature`, had to drop; (b) stage 4 `maxTokens` was too low (4096) and produced unterminated JSON; bumped to 8192; (c) Sonnet would not respect schema enums for `actors[].role` and `observable_signals[].capture_method` until the schema was embedded in the user message; (d) the auditor's own verdict arithmetic was inconsistent with the scoring rules in ~1 of 3 branches, so the orchestrator now computes the verdict from the findings rather than trusting the model's self-report.
- The `--no-novelty` CLI flag uses commander.js `--no-X` convention; my runCommand reads `opts.noNovelty` but commander produces `opts.novelty: false`. Currently the flag is silently ignored; novelty hawk always runs. This is a one-line fix I have not shipped.
- The branch directories are real git worktrees. When committing demo outputs to main, this caused embedded-repo warnings until I pruned the worktrees and removed the `.git` pointer files. The `.gitignore` now whitelists only Probe artifacts under `runs/*/branches/*/`. This works, but it is fragile — a future developer adding a new artifact type will need to update the `.gitignore` whitelist.

**Scope (from CLAUDE.md):**
- Probe handles screen-based interactive research only. Out of scope: ethnographic fieldwork, long-term in-the-wild deployment, embodied AR/VR without screen capture. The README states this clearly.
- The source corpus is seven cards. The novelty hawk found this insufficient — it correctly identified adjacent literature (Jakesch, Longoni, Sundar on AI-disclosure effects) that should be in the corpus for AI-interaction research. Expanding the corpus to 12-15 cards is called out as Day 2 stretch work.
- Mode B (screenshot-based simulated walkthrough with vision) is not implemented. Mode A (description-based walkthrough) is implemented and works. The demo storyboard still shows Mode B in Frame 6 — that would need to be rerecorded without Mode B or Mode B must ship.

**Epistemic:**
- Probe does not replace user research. Every guidebook includes a `[DO_NOT_CLAIM]` block naming the claims the study cannot support. But this is only a guardrail on language — the underlying risk that a researcher uses a `[SIMULATION_REHEARSAL]` paragraph as de facto evidence is not structurally prevented. The linter stops the *document* from drifting. The reader is another matter.
- The "useful surprise" criterion is a capability claim I believe about Opus 4.7, not a metric the pipeline enforces. On this run I judge it satisfied (Branch B's ARIA-live-disclosure-timing approach was non-obvious to me). The kill test at hour 14 will check this again on a premise I know cold.

**Things I did not get to yet (Day 1 Hour 2 snapshot):**
- Benchmark runs on additional premises (the plan calls for 2–3; I have one)
- Demo video recording (Day 5)
- The clickable HTML mockup (stretch)
- The third reviewer persona's empirical calibration against one of my own rejected papers (I have not run that ground-truth test yet)

## 7. Open design questions I would like a panel to weigh in on

These are genuine uncertainties, not rhetorical questions.

1. **Is the three-branch divergence actually valuable, or is it theater?** On this run the three branches are genuinely different research programs. But the demo is seductive — split-screen worktrees look impressive regardless of whether the divergence is load-bearing. What tests would convince you the three branches produce *better* research-design triage than a single, deeper branch would?

2. **Are the 16 capture-risk patterns the right ones?** The library is grounded in Buijsman-Carter-Bermúdez (autonomy-by-design) and Illich (conviviality). The four axes feel right to me but the specific 16 patterns were picked by me on Day 1. Which axis is over-specified? Is there a whole axis missing (e.g., *Comparability* — does the intervention produce outputs that can be compared across participants and time)?

3. **How should the novelty hawk handle adjacent literature not in corpus?** On this run it correctly flagged that Jakesch/Longoni/Sundar aren't cited. But this means Probe is less useful the smaller the corpus. Should the novelty hawk be allowed to name papers outside the corpus without the literature agent citing them? This feels like a principled epistemic question, not just an engineering choice.

4. **Is the `[HUMAN_REQUIRED]` tag doing enough work?** Every guidebook must have at least one. But the tag is a linting requirement, not a behavioral one — the researcher can still ignore the flagged next steps. What would make the handoff stickier without becoming performative?

5. **The Illich framing is underused.** The Exit axis patterns derive from "radical monopoly" but none of them fired on any branch in this run. Either the patterns are too strict, or the run happened to produce interventions that don't trigger Exit concerns, or I'm missing an Exit pattern. A panel reading the capture-risk audit of Branch C (the repair-overlay co-design) should comment on whether Exit should have fired there and didn't.

6. **Is simulation-as-rehearsal actually a clean framing, or does it collapse under scrutiny?** The core epistemic claim is that simulated walkthroughs help the researcher *see* friction points without *producing* evidence. But in practice, a `[SIMULATION_REHEARSAL]` paragraph can materially shape the study design that eventually produces evidence. Is the rehearsal → performance metaphor actually clean, or is there a more honest framing?

## 8. Mapping to judging criteria (for reference)

| Criterion | Weight | How Probe addresses it |
|---|---|---|
| **Impact (30%)** | 30% | Target users: HCI researchers, accessibility designers, AI product researchers, grad students. Before/after: six months of wrong-direction research → one afternoon of triage for ~$6. |
| **Demo (25%)** | 25% | Storyboard already drafted (8 frames, 3:00, live bookends). Deterministic replay from `runs/demo_run/` is in the repo. Real artifacts, not mockups. |
| **Opus 4.7 use (25%)** | 25% | Opus 4.7 used for skeptical judgment, normative reasoning over evidence spans, sustained adversarial stance, long-context provenance-constrained synthesis. Sonnet 4.6 used for retrieval and structured-template work to preserve Opus budget. Stage-by-stage routing in CLAUDE.md. |
| **Depth & Execution (20%)** | 20% | Schema validation + repair passes, source-card-only citations (zero hallucinated), real git worktrees with meaningful `git log --graph`, deterministic replay, forbidden-phrase linter, provenance linter on paragraphs + bullets + blockquotes + table rows, hour-14 kill test with standing fallback plan, vitest suite at 16/16. |

## 9. Where to look in the repo

- [`CLAUDE.md`](./CLAUDE.md) — what Probe is and what is not negotiable
- [`README.md`](./README.md) — quick-start and architecture
- [`RESEARCH_CONTEXT.md`](./RESEARCH_CONTEXT.md) — theoretical grounding
- [`agents/`](./agents/) — all 9 system prompts
- [`schemas/`](./schemas/) — all 7 JSON schemas
- [`corpus/source_cards/`](./corpus/source_cards/) — 7 hand-verified source cards
- [`patterns/`](./patterns/) — 16 capture-risk patterns
- [`src/lint/provenance.ts`](./src/lint/provenance.ts) — the load-bearing linter
- [`runs/demo_run/`](./runs/demo_run/) — **start here to see the pipeline output**
- [`runs/demo_run/PROBE_GUIDEBOOK.md`](./runs/demo_run/PROBE_GUIDEBOOK.md) — the final artifact for branch B
- [`runs/demo_run/branches/a/WORKSHOP_NOT_RECOMMENDED.md`](./runs/demo_run/branches/a/WORKSHOP_NOT_RECOMMENDED.md) — blocked branch with evidence-span rationale
- [`runs/demo_run/branches/b/meta_review.json`](./runs/demo_run/branches/b/meta_review.json) — reviewer disagreement preserved
- [`runs/demo_run/cost.json`](./runs/demo_run/cost.json) — per-stage cost log
- [`runs/demo_run/git_graph.txt`](./runs/demo_run/git_graph.txt) — research process as structured commits

## 10. What I want panel feedback on most

If you read only two artifacts, read [`runs/demo_run/PROBE_GUIDEBOOK.md`](./runs/demo_run/PROBE_GUIDEBOOK.md) and [`runs/demo_run/branches/b/reviews/methodologist.json`](./runs/demo_run/branches/b/reviews/methodologist.json).

The guidebook answers: *does the final artifact hold up as a triaged study plan that a real researcher would use as a starting point?*

The methodologist review answers: *is the adversarial reviewer actually catching real weaknesses I would not have caught myself, or is it producing plausible-sounding generic review prose?*

If one of those is weak, the project is weak. If both are strong, Probe's core claim has empirical support on one real run, with the remaining work being surface polish, additional benchmark premises, and demo production.

I will be on the other side of this review, reading what you write. Be precise. Do not flatter.
