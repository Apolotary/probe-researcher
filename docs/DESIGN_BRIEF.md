# Probe — design brief

Written for a designer (Claude Design or otherwise) who is about to propose a web UI.

---

## What Probe is, in one breath

Probe takes one sentence of research intent from an HCI researcher ("design a study to evaluate an ARIA-live AI-disclosure banner for BLV screen-reader users") and runs it through an 8-stage pipeline of Claude agents. The output is either a **study guidebook** — a six-section plan the researcher can take into a real user study — or a **WORKSHOP_NOT_RECOMMENDED** report explaining which capture-risks or reviewer objections blocked the design.

The tool's core commitment: **simulation is rehearsal, not evidence.** Every paragraph of every artifact carries a provenance tag (`[SOURCE_CARD]`, `[AGENT_INFERENCE]`, `[SIMULATION_REHEARSAL]`, `[HUMAN_REQUIRED]`, etc.) that a linter enforces at paragraph / bullet / table-row granularity. Nothing the tool produces can pass as user-study findings.

Tagline: *Rehearsal stage for research. The performance still needs humans.*

---

## Who uses it

A single HCI researcher sitting at their laptop. They have a study idea they want to triage *before* they spend six months recruiting, building the prototype, and getting IRB approval on a weak premise. They're skeptical of LLMs and want receipts — the entire interface is built around making the provenance of every claim visible.

Not a product for research teams coordinating. Not a product for naive users. Design for someone who will read the audit findings carefully and push back on what the reviewer agents said.

---

## The 8-stage pipeline

Each stage reads from disk, writes to disk, and hands off via filesystem. Stages 3–7 run three parallel branches via `Promise.all`. The UI's primary job is making this pipeline legible and interruptible.

| # | Stage | Model | Input | Output (artifact path) |
|---|---|---|---|---|
| 1 | **Premise interrogation** | Opus 4.7 | raw premise string | `premise_card.json` — sharpest_question, missing_evidence[], sharpened_options[] |
| 2 | **Solution ideation** | Opus 4.7 | premise_card | 3× `branches/{a,b,c}/branch_card.json` — research_question, intervention_primitive, human_system_relationship, method_family |
| 3 | **Literature grounding** | Sonnet 4.6 | branch_card + 12-card corpus | appends `grounding[]` to `branch_card.json` (source_card_id refs) |
| 4 | **Prototype specification** | Sonnet 4.6 | branch_card | `branches/X/prototype_spec.{json,md}` — Wizard-of-Oz spec: title, summary, wizard_controls[], analysis_plan |
| 5 | **Simulated walkthrough** | Opus 4.7 | prototype_spec | `branches/X/simulated_walkthrough.md` — first-person rehearsal, every paragraph tagged `[SIMULATION_REHEARSAL]` |
| 6 | **Capture-risk audit** | Opus 4.7 | prototype_spec + walkthrough | `branches/X/audit.{json,md}` — 16 patterns across 4 axes (Capacity/Agency/Exit/Legibility), each with pattern_id, axis, score (-2 to +2), evidence_span.quote, rationale. Verdict: BLOCKED / REVISION_REQUIRED / PASSED |
| 7 | **Adversarial review panel** | Opus 4.7 × 4 | all prior artifacts | 3× `reviews/*.json` (methodologist, accessibility advocate, novelty hawk) + `meta_review.json`. Meta verdict: accept_revise / reject / human_judgment_required |
| 8 | **Guidebook assembly** | Opus 4.7 | surviving branch + all prior | `PROBE_GUIDEBOOK.md` — six H2 sections (Premise / Background / Prototype / Study protocol / Failure hypotheses / Risks). Every element carries a provenance tag. |

Per-run wall-clock: ~25–45 min. Per-run cost: $3–6 on Anthropic, $1–2 on Sonnet-only. A blocked branch emits `WORKSHOP_NOT_RECOMMENDED.md` and stops progressing; the pipeline continues with survivors.

---

## What the UI needs to show

Everything is ultimately stored in `runs/<run_id>/`. A run directory looks like:

```
runs/demo_run/
├── premise.md                       ← researcher's input, verbatim
├── premise_card.json                ← Stage 1 output
├── cost.json                        ← accumulating per-call cost log
├── run_summary.json                 ← per-branch status
├── stats.json                       ← probe stats output
├── PROBE_GUIDEBOOK.md               ← Stage 8 output (if any branch survived)
├── PROBE_REPORT_PAGE.html           ← pre-rendered Bloom-style web report
└── branches/{a,b,c}/
    ├── branch_card.json
    ├── prototype_spec.{json,md}
    ├── simulated_walkthrough.md
    ├── audit.{json,md}
    ├── meta_review.json
    ├── reviews/methodologist.json
    ├── reviews/accessibility_advocate.json
    ├── reviews/novelty_hawk.json
    └── WORKSHOP_NOT_RECOMMENDED.md     (if blocked)
```

The UI is a browser over this directory structure, but with heavy **semantic rendering**:
- Audit findings should not show as raw JSON — they should render as cards with colored severity (red −2, amber −1, neutral 0, green +), the quoted evidence span in italics, the rationale below.
- The guidebook's provenance tags should render as small colored badges next to each paragraph (`[SOURCE_CARD:jakesch_2023]` in navy, `[SIMULATION_REHEARSAL]` in amber, `[AGENT_INFERENCE]` in stone, `[HUMAN_REQUIRED]` in green, etc.).
- The pipeline itself should render as a timeline or DAG — 8 stages across, 3 branches down, color-coded by verdict (survived / blocked / failed).
- Cost and wall-clock should be live during a run, not hidden in a log file.

---

## The three things the UI must enable

This is the product-design shift that motivated the current redesign. Previously Probe ran autonomously: 25 minutes of a loading spinner, then a guidebook appeared. The user asked for something different: **pair-programming with the agents, not delegating to them**.

Three interactive surfaces now exist. The web UI should consolidate them into one interface:

### 1. Watch a pipeline run in real time

- Current stage highlighted, completed stages checkmarked, upcoming dim.
- Per-branch progress during stages 3–7 (which run parallel) — show A, B, C ticking independently, each with their own elapsed time and cost.
- Live running total (budget burn, elapsed wall-clock) in a persistent footer.
- Stage-completion "previews" flow into the main view — the premise card's `sharpest_question`, the three branches' research questions, the fired audit patterns — so the user sees WHAT the agents produced as they produce it, not just "stage 3 complete".

### 2. Pause, read, edit, continue

- After each stage, a checkpoint UI appears: "Stage 4 complete. Continue, edit, skip, or stop?"
- "Edit" opens an inline editor (monaco or codemirror) on the just-produced artifact — the premise card, a branch card, the prototype spec. The researcher can reshape it.
- Save → the next stage reads the edited file.
- "Skip to stage N" lets the researcher jump — useful if they've manually finalized one artifact and want to re-use it without regenerating.
- The current CLI implements this as `probe run --step` with `$EDITOR` spawns. The web UI is a much better home for it.

### 3. Browse + edit historical runs

- A run list (leftmost column or top bar) with run-id, premise preview, cost, verdict summary.
- Click a run → its 8 stages + 3 branches become navigable.
- Per-artifact rendering: JSON as syntax-highlighted tree, markdown with headings and the provenance-tag badges, audit findings as severity cards.
- Edit mode on any artifact → textarea → save back to disk. (No runtime recomputation needed.)

---

## Current brand + aesthetic

We have a visual identity already — new UI should extend it rather than rebuild it. Key references:

- **Palette**: warm off-white background (`#f7f5ef`), card surfaces (`#ffffff`), sidebar (`#ede9dc`), navy accent (`#1B365D`), content colors for severity: red-brick (`#9e2e22`) for blocker, amber (`#b47b2a`) for drift, green (`#1f6b1e`) for pass, plum (`#7a2d5a`) for novelty/uncited_adjacent, code bg (`#1a1d2c`).
- **Typography**: body in [Newsreader](https://fonts.google.com/specimen/Newsreader) serif, headings in Inter, code in JetBrains Mono. Newsreader is the house voice — the tool reads like a research artifact, not a dashboard.
- **Pipeline DAG reference**: see `paper/figures/pipeline.svg` — hand-drawn SVG of the 8-stage flow with branch fanout, designed to render at 760×340.
- **Audit-finding card reference**: see `paper/figures/audit_finding.svg` — a single fired pattern rendered with pattern_id, axis, score, quoted evidence, rationale, and verdict.
- **Existing report-page reference**: any `runs/<id>/PROBE_REPORT_PAGE.html` — single-column long-scroll report in the `stanfordhci.github.io/Bloom` template shape. The new interactive UI should feel like this page's sibling (same palette, same typography) but with left-sidebar navigation and edit affordances.

Provenance-tag color map (from the current report-page CSS):
- `[RESEARCHER_INPUT]` → green on light green
- `[SOURCE_CARD:id]` → navy on light blue
- `[SIMULATION_REHEARSAL]` → amber on cream
- `[AGENT_INFERENCE]` → stone on cream
- `[HUMAN_REQUIRED]` → green on mint
- `[DO_NOT_CLAIM]` → red on light red
- `[UNCITED_ADJACENT]` → plum on light plum
- `[TOOL_VERIFIED]` → green on light green
- `[IMPORTED_DRAFT]` → slate-blue on light blue

These render as small monospace badges at the end of each paragraph (not inline in the prose).

---

## What exists as of now (web UI v0)

`probe web` starts an Express server at `127.0.0.1:4470` serving a single-page HTML app. Current behavior:

- Sidebar with run list, stage navigator, branch navigator.
- Main area renders the selected artifact (raw `<pre>` for now, no syntax highlighting beyond that).
- Edit button → textarea → Save → PATCH back to disk.
- Click a branch → overview with audit findings rendered as severity cards (closest to the target design).

It works end-to-end but looks utilitarian. A designer coming in should:
1. Treat the current sidebar / main-area / toolbar structure as a starting scaffold — the data flow and API surface are right.
2. Replace the `<pre>` artifact viewer with proper rendered views per artifact type.
3. Add the pipeline-DAG hero view as the first thing a user sees when they land on a run.
4. Add the live-run view (streaming stage completion events — SSE endpoint needs to be added, currently stubbed).

The server exposes these endpoints, already working:

| Method | Path | Returns |
|---|---|---|
| GET | `/api/runs` | list of runs with premise + stats |
| GET | `/api/runs/:id` | full run metadata + per-branch artifacts |
| GET | `/api/runs/:id/file?p=<relpath>` | raw artifact content (text) |
| PATCH | `/api/runs/:id/file?p=<relpath>` | overwrite an artifact |
| GET | `/api/health` | liveness |

What's not yet implemented (good candidates for the web UI to drive):
- POST to start a new run from a premise (currently the user runs `probe run "..."` in their shell)
- SSE / WebSocket for live pipeline-event streaming
- Checkpoint-between-stages UX (the `--step` flow, but in the browser)
- A run-comparison view (Probe now has 18+ completed runs worth browsing across)

---

## Three design directions worth considering

Questions the designer should resolve, not decide for them:

**A. Pipeline-DAG as landing, or run-list as landing?** The current web UI defaults to run-list. But a fresh visit could also open on a big pipeline DAG showing Probe's method at a glance, with "run a new premise" as the primary CTA. Research designers are usually one-shot visitors — landing on the method is more onboarding-friendly.

**B. How much of the guidebook to render vs link to the PDF/HTML report?** The shipped PDF reports are excellent. The web UI could either fully render the guidebook inline (with live editing of each tagged paragraph) or treat the PDF as the definitive artifact and offer only section-level edits in the sidebar. The answer depends on whether the user is expected to edit the guidebook (yes → inline render) or just read it (no → link to report).

**C. Checkpoint mode: modal, or always-on?** When `--step` is active, the pipeline pauses after each stage. Two UX patterns:
- *Modal*: a pause banner takes over the screen with "Stage 4 complete · [continue] [edit] [skip] [stop]".
- *Always-on*: the run can be paused at any moment by hitting a space bar or clicking "pause"; every artifact has an always-visible edit button.

The second scales better if the user wants to pair-program continuously. The first is less invasive for users who just want to watch.

---

## Hard constraints the design must respect

- **Provenance tags are load-bearing.** They are not decoration. Every paragraph in any edit surface must keep its tag, and the linter rejects saves that strip tags or use evidence language in rehearsal paragraphs. The UI should surface this affordance (maybe: highlight the tag, don't let users accidentally delete it).
- **No hallucinated citations.** Any `[SOURCE_CARD:id]` reference must resolve to a YAML file in `corpus/source_cards/`. The UI should validate inline when the user edits.
- **"Simulation is rehearsal, not evidence."** The walkthrough view should visually differ from an audit-finding or a guidebook section so the user never confuses one for the other. Light amber left-border for rehearsal, firm red-brick for blocker, etc.
- **Scope is screen-based interactive research.** Ethnography / long-term deployment / embodied AR are out of scope. The UI doesn't need to enforce this (the linter doesn't either), but the onboarding copy should name the scope.

---

## Reference artifacts in the repo

For the designer to poke at:

- `paper/probe.pdf` — the 17-page paper documenting Probe's method. Section 5 (System description) has the diagrams.
- `paper/figures/pipeline.svg` and `paper/figures/audit_finding.svg` — SVG figures in the existing brand.
- `runs/demo_run/PROBE_REPORT_PAGE.html` — a rendered report page in the Bloom template; the closest thing to a "what the web UI could look like at a polished run-detail page".
- `runs/demo_run/PROBE_GUIDEBOOK.md` — the shipped guidebook content with every paragraph tagged. Good source of realistic text to render.
- `runs/demo_run/branches/a/audit.json` — a real audit JSON with fired patterns, evidence spans, rationale. Good source of realistic content for the audit-card view.
- `src/ui/theme.ts` — the palette definitions in code form.
- `src/web/index_html.ts` — the current web UI's HTML + CSS + JS. Shows the data flow the designer doesn't have to redesign.

---

## One-paragraph pitch for the designer

Probe is a tool that turns a sentence of research intent into a defensible study plan in thirty minutes. It does this through an 8-stage pipeline of Claude agents that interrogate the premise, generate divergent study designs, ground them in hand-curated literature, simulate the participant experience, audit for capture-risk using a named pattern library, and adversarially review for methodological and ethical issues. The current UI makes this feel like a black-box autonomous process. The researcher wants it to feel like pair-programming — see what the agents produced at each stage, edit it, push back, continue. Design an interface that rewards this closeness. Treat the provenance-tag system as a feature, not a constraint; it's the thing that makes Probe's output usable instead of vibes.
