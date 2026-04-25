# Probe — CLI reference for the web UI designer

Companion to `DESIGN_BRIEF.md`. That file describes what Probe is and what the web UI should feel like. **This file describes exactly what the CLI does today, what a realistic researcher session looks like, and which interaction points the CLI cannot support.** Design reads this, then proposes a browser-native replacement.

Nothing in here is aspirational — every command, every file path, every example artifact below is from the shipped repo.

---

## How to read this document

1. **§1 The product loop** — what a researcher actually wants to do with Probe, in plain English, independent of any interface.
2. **§2 Every CLI command** — 20 commands, grouped by phase, each with purpose, inputs, outputs, and a realistic invocation.
3. **§3 A realistic session** — one researcher, one premise, start to finish. Where the CLI lets them pair-program with the agents, and where it doesn't.
4. **§4 Seven interaction gaps** — the specific places the CLI stops letting the researcher interact and build. These are the web UI's job.
5. **§5 Artifact shapes** — the JSON and markdown formats the UI must render. Sample snippets included.

---

## §1 The product loop

A researcher opens Probe with a premise — one sentence of study intent. They want a partner that does four things:

1. **Interrogate** the premise. Name what's missing, name the nearest templates, propose sharper variants.
2. **Diverge** into 2–3 research programs that differ non-trivially (not variations of the same study).
3. **Rehearse** each program — simulate a participant session, audit for ethical/methodological capture, run an adversarial reviewer panel.
4. **Assemble** a study guidebook for any program that survives, with every claim tagged by source.

The researcher's posture is **skeptical collaborator, not delegator**. They want to see what the agent produced at every stage, edit it in flight, kill a branch that's going nowhere, feed a revision back in. If the interface hides the stages behind a progress bar, they won't trust the output. Probe's current CLI almost gets this right — the three interactive surfaces (`probe run --step`, `probe web`, `probe explore2`) exist because the first attempt was "autonomous run, 25 minutes, then a report appears" and the researcher pushed back.

The web UI's job: make that collaborator posture feel native in a browser.

---

## §2 Every CLI command

Typed `probe --help`, enumerated below. Grouped by phase of use.

### Phase A — Running a pipeline

#### `probe` (no arguments)

Launches an interactive Ink menu. Current options:
- New premise (opens a text input, then calls `probe run`)
- Import existing paper draft (opens file picker, calls `probe import`)
- Open a run (calls `probe explore2 <id>`)
- Doctor (runs the verification sweep)
- Quit

**Why the UI cares**: this is today's "landing" surface. In the browser it should be a proper home screen with a big text input for a new premise, a list of recent runs, a healthcheck indicator.

#### `probe run <premise> [--step] [--skip 1,2,3] [--no-novelty] [--run-id <id>]`

Runs the full 8-stage pipeline. Default is fire-and-forget (~25 minutes, ~$5 in API credit). `--step` pauses after each stage; at the pause the researcher can type `c` to continue, `[1-9]` to open an artifact in `$EDITOR`, `s 4` to skip to stage 4, or `q` to quit the run mid-flight. `--skip 1,2,3` lets the researcher start from an already-prepared artifact on disk.

**Realistic invocation**:
```
probe run "evaluate an ARIA-live AI-disclosure banner for BLV screen-reader users" --step
```

**Outputs**: everything under `runs/<run_id>/`. See §5.

**Why the UI cares**: the checkpoint UX (pause, read, edit, resume) is the single most-requested interaction. The CLI does it by spawning `vi`. The browser should do it inline with a proper editor.

#### `probe replay <run_id>`

Re-runs a completed pipeline deterministically, replaying cached LLM responses from `runs/<id>/replay_cache/`. Zero API cost. Used for the live demo so a 25-minute live run can't fail on stage.

**Why the UI cares**: "demo mode" is a real button. A user looking at Probe for the first time should be able to replay the canonical `demo_run` and see the pipeline animate without burning tokens.

#### `probe import <file> [--run-id <id>]`

Warm-starts a run from an existing paper draft (markdown or LaTeX-as-text). Classifies sections into Probe's schema (premise / prototype / method / rehearsal / findings), emits stage-compatible artifacts tagged `[IMPORTED_DRAFT]`, and makes the draft auditable. After import, `probe audit-deep` and `probe run --skip 1,2,3,4,5` can run the adversarial reviewers against the draft rather than a generated design.

**Why the UI cares**: "upload my paper, critique it" is a distinct entry point. Drag-and-drop a PDF or .tex file, pick which branch it goes into, kick off adversarial review.

### Phase B — Watching and navigating

#### `probe runs`

Prints a Linear-style table of every run under `runs/`: run_id, premise preview, wall-clock duration, total cost, surviving branch count, verdict per branch.

Example output:
```
RUN                                    STATUS      COST     DURATION  VERDICT
demo_run                               complete    $5.93    25m 12s   1 surviving
backlog_torso_s4_ios                   complete    $4.12    21m 04s   2 surviving
adversarial_trivial_darkmode           complete    $3.28    18m 30s   all blocked
```

#### `probe stats [run_id] [--all] [--json]`

Per-run or cross-run triage summary. Branch verdicts, axis-level pattern-fire counts, reviewer disagreement class, anomalies (repair passes, missing artifacts). Writes `stats.json` into the run dir. `--all` produces `RUNS_SUMMARY.md` at repo root.

#### `probe gantt <run_id>`

Terminal Gantt chart showing per-stage durations and costs, grouped by branch. Shows model routing (Opus vs Sonnet), repair-pass counts, where time and dollars went.

#### `probe explore <run_id>`

Older 3-pane Ink TUI — branch picker on left, artifact tree middle, content right. Locks/unlocks branches, toggles artifact views. The UI the researcher found clunky.

#### `probe explore2 <run_id>`

Newer 2-pane Ink TUI. Sidebar lists stages + branches as a flat tree; main area renders the selected artifact. Arrow keys navigate, `Tab` switches focus, `e` spawns `$EDITOR` on the current artifact, `q` quits. This is the SSH-friendly equivalent of `probe web` — built for when a browser isn't available.

#### `probe web [--port 4470] [--host 127.0.0.1]`

**This is what the designer is replacing.** Starts an Express server serving a single-page HTML app. Sidebar with runs, main area with artifact rendering and inline editor. Current endpoints (all working):

| Method | Path | Returns |
|---|---|---|
| GET | `/api/runs` | list of runs with premise + stats |
| GET | `/api/runs/:id` | full run metadata + per-branch artifacts |
| GET | `/api/runs/:id/file?p=<relpath>` | raw artifact content |
| PATCH | `/api/runs/:id/file?p=<relpath>` | overwrite an artifact |
| GET | `/api/health` | liveness |

Data flow is correct. Visual rendering is minimal (raw `<pre>` blocks). Pipeline-DAG, stage progress timeline, audit-card rendering, guidebook provenance badges — all missing. **The web UI redesign should keep the API and rewrite the frontend.**

### Phase C — Deep critique

#### `probe audit-deep <run_id> <branch_id> [--dry-run]`

Spawns a Claude Managed Agent (Opus 4.7 + `agent_toolset_20260401`) with bash, grep, file ops, web search against the branch artifacts. The agent measures claims the shallow Stage 6 audit could only reason about. On the demo run: 21 tool calls, measured a 3.67-second announcement-duration confound, 9 new findings. Output: `runs/<id>/managed_agents/deep_audit_<branch>.md` with a full conversation trace.

Cost: ~$1.20 per invocation.

**Why the UI cares**: this is a "run on demand, expensive, rare" operation. A browser button with a confirm dialog and a live tail of the agent's tool-call stream would be dramatic.

#### `probe interview <run_id> [--persona <desc>] [--persona-file <path>] [--single-turn]`

Rehearses the guidebook's interview protocol against a simulated participant (Managed Agent session). Every participant response is tagged `[SIMULATION_REHEARSAL]` — not evidence, practice. Useful when the researcher wants to dry-run the protocol before running it on real BLV users.

#### `probe symposium <run_id_1> <run_id_2> ...`

Convenes N completed runs on adjacent premises as a simulated workshop. Produces a disagreement-preserving "convener report" that maps where position papers agree, disagree, and share blind spots. Explicitly not a synthesis — a workshop-planning artifact.

#### `probe panel <run_id> <branch_id>`

Renders a standalone HTML reviewer-disagreement panel for a branch. 3-column layout: methodologist / accessibility / novelty findings side-by-side, meta-reviewer verdict as a banner. Self-contained HTML, no external CSS/JS.

### Phase D — Shipping artifacts

#### `probe render <run_id> [-f pdf|html|md|auto] [-o <path>]`

Bundles guidebook + reviewer panel + audit findings + blocked branches + lint status + cost log into a single-file report. Auto-detects backend (pandoc+wkhtmltopdf preferred).

#### `probe report-page <run_id> [-o <path>]`

Renders a single-file HTML report in the `stanfordhci.github.io/Bloom` long-scroll template — top-nav anchors, title block, teaser pipeline figure, text/figure rhythm, Safety section, reviewer summary, BibTeX footer. Zero API cost. This is Probe's polished shareable artifact. See `runs/demo_run/PROBE_REPORT_PAGE.html` (61 KB) for the reference.

#### `probe build-paper`

Builds `paper/probe.tex` + `references.bib` to PDF via pandoc + wkhtmltopdf. No LaTeX engine required. Outputs `paper/probe.{html,pdf}`.

### Phase E — Hygiene and maintenance

#### `probe lint <file> [--voice-only] [--provenance-only] [--strict-inference]`

Runs the markdown-AST linter against a file (typically `PROBE_GUIDEBOOK.md`). Checks: every content-bearing element carries a provenance tag; no `[SIMULATION_REHEARSAL]` element uses evidence language; every `[SOURCE_CARD:id]` resolves to a real YAML card; no headings name findings. `--strict-inference` adds the rule that every `[AGENT_INFERENCE]` element must sit within 5 preceding elements of an anchor tag.

This is the load-bearing constraint in the system. The linter has 21 tests in `tests/provenance.test.ts`.

#### `probe doctor [--once] [--watch [N]]`

Verification sweep: typecheck, test suite, lint every shipped guidebook, check PDF backend availability, git cleanliness, corpus/patterns/benchmark inventory. Without flags: stays open and re-runs every 30s until Ctrl+C. `--once` for CI. `--watch 60` to change the refresh cadence.

#### `probe init <run_id>`

Scaffolds an empty run directory. Used for manual seeding; not called in normal flow.

---

## §3 A realistic session

This is the session the UI should make effortless. The researcher's name is Priya. She's preparing a CHI submission.

**0:00** — Priya opens her laptop. She has one sentence: *"evaluate an ARIA-live AI-disclosure banner for BLV screen-reader users."* She types:
```
probe run "evaluate an ARIA-live AI-disclosure banner for BLV screen-reader users" --step
```

**0:02** — Stage 1 completes. The premise card's `sharpest_question` appears in the terminal: *"What specifically does disclosing AI authorship via ARIA-live add to a BLV user's navigation or credibility judgment that a static byline wouldn't?"*

Priya reads the four `sharpened_options`. One reframes the study as comparing AI-disclosed-early vs. AI-disclosed-late vs. human-framed as a phrasing-only within-subjects design. She likes this version.

The CLI pauses with `continue / edit / skip / quit?`. She types `1` to open the premise_card.json in `vi`. She tweaks the `claim` field to reflect the disclosure-phrasing framing. Saves. The CLI unblocks and continues to Stage 2.

**0:05** — Stage 2 generates three branches. Branch A is a corpus audit, B is a Wizard-of-Oz disclosure study, C is a longitudinal co-design. Priya reads the three branch_card.json files. Branch C doesn't fit the hackathon timeline. She can't currently kill C — the CLI doesn't expose "delete branch." She continues, knowing C will consume tokens for nothing.

**0:14** — Stages 3–5 complete across all three branches in parallel. The per-branch progress log shows A, B, C ticking independently. The simulated walkthrough for branch B surfaces two findings: fast H-key navigators would traverse all three H2s in under 4 seconds (late-banner condition hard to fire); AI string is ~6 seconds of speech, human string is ~2 seconds (duration confound).

**0:17** — Stage 6 audit. Branch B fires four Legibility patterns, no −2, verdict `REVISION_REQUIRED`. Branches A and C both fire `legibility.no_failure_signal` at −2 and get `BLOCKED`. Their `WORKSHOP_NOT_RECOMMENDED.md` files emit. Priya reads A's; the blocking reason is plausible. She accepts C wasn't going anywhere anyway.

**0:22** — Stage 7 reviewer panel on branch B. Methodologist's first line is the announcement-duration confound. Accessibility advocate flags that BLV users are recruited as subjects, not co-designers; required major revision with a co-design phase. Novelty hawk names Jakesch 2023, Longoni 2019, Sundar 2008 as uncited adjacent literature. Meta-reviewer classifies as `legitimate_methodological_split`, verdict `human_judgment_required`.

**0:25** — Stage 8 assembles the guidebook. The `Next steps` section is a `[HUMAN_REQUIRED]` block listing six items. The lint passes. The run completes.

**0:26** — Priya runs `probe audit-deep demo_run b` to get measured versions of the qualitative findings. $1.20, 21 tool calls, 6 minutes. The agent grepped the prototype spec and produced a quantified 3.67-second confound with exact character and word counts. She reads the deep-audit transcript.

**0:33** — She runs `probe render demo_run -f pdf`. Gets a 105 KB PDF. Runs `probe report-page demo_run`. Gets a shareable HTML. Drops the URL in a Slack channel for her advisor.

### What went well

- The `--step` pauses let her steer the run in real time.
- The stage previews gave her signal about *what* was being produced, not just that it was progressing.
- The audit's evidence spans were quoted from the prototype spec; she could verify without re-reading.

### What went badly

- She couldn't kill branch C. It cost tokens.
- Editing the premise_card.json meant remembering `$EDITOR`, using `vi` bindings, and re-saving. The CLI doesn't validate the JSON before the next stage reads it.
- During the 12 minutes of parallel stages, she had no live view of what the agents were actually writing — just three spinners. She went and made coffee. She'd have preferred to read the simulated walkthroughs as they streamed.
- The deep audit transcript is a markdown conversation log. She wanted to click a tool-call and see its output as a card, not scroll.
- The guidebook has 77 tagged elements. She wants to read them with the tags as colored badges, not inline brackets.
- She wanted to compare branch B to an analogous run from last month. `probe symposium` takes run_ids and produces a report; there's no interactive compare.

All of those are web-UI territory.

---

## §4 Seven interaction gaps

The specific places the CLI stops supporting the researcher. Each is a feature for the web UI.

### Gap 1 — Start a run from the interface

The CLI's `probe run <premise>` requires a shell. The browser should have a single textarea + "Run" button on the landing page. Bonus: a "run in step mode" toggle and a "use replay cache" toggle.

### Gap 2 — Live streaming of stage content

Today the researcher sees "stage 3 in progress…" for minutes. The content the agent is producing is in memory until the stage completes and writes to disk. Either:
- **Server-Sent Events** endpoint that emits stage-level events + per-stage content chunks.
- Or a polling pattern where the UI re-fetches the artifact directory every few seconds and renders anything new.

The designer should assume SSE is available (the server is Express and can add it trivially).

### Gap 3 — Per-branch kill / resume

Currently every run produces exactly 3 branches. If the researcher wants to abandon one before it burns tokens through stages 3–7, they can't. The UI needs a per-branch state machine and a "stop this branch" affordance. API: `POST /api/runs/:id/branches/:branch/stop`.

### Gap 4 — Inline editing of artifacts with validation

`probe web` has a textarea-based editor. That's the bare minimum. The designer should propose:
- Syntax-highlighted JSON editor for `.json` artifacts, with live schema validation against the file under `schemas/`.
- Markdown editor for `.md` with live preview and provenance-tag autocomplete.
- A "save and re-run from here" button that calls `probe run --skip <everything before this stage>`.

### Gap 5 — Semantic rendering of audit findings

An audit JSON has `findings[]`, each with `pattern_id`, `axis`, `score` (-2..+2), `evidence_span.quote`, `rationale`. Today the UI shows a JSON blob. The designer should specify:
- A card per finding with severity color (red −2, amber −1, neutral 0, green +1/+2).
- Pattern_id in monospace, axis as a label chip, score as a number badge.
- Evidence quote in italics with a small "open in source file" link.
- Rationale in body text.
- Group by axis or by severity; toggle.

Realistic source JSON is in `runs/demo_run/branches/a/audit.json`; its markdown render is `audit.md` in the same directory.

### Gap 6 — Provenance badges on guidebook prose

A guidebook paragraph currently reads:
> Kafer develops a political/relational model of disability that situates access needs within social and structural arrangements rather than locating the deficit solely in the individual user, which frames how this study treats BLV participants as expert users of their own tooling rather than as subjects of a corrective intervention. [SOURCE_CARD:kafer_2013]

The bracket notation is load-bearing but ugly. Target render: paragraph in Newsreader serif, then a small monospace pill reading `SOURCE_CARD:kafer_2013` in navy on light-blue at the trailing end (or margin). Click the pill → opens the source card YAML in a side-panel. Same treatment for all 9 tag types (see DESIGN_BRIEF.md §"Current brand + aesthetic" for the palette).

### Gap 7 — Run comparison and diff

The researcher often wants to ask: "this run and the previous run on a related premise — where did they diverge?" `probe symposium` does this as a markdown report. The UI could do it better:
- Two-column diff of guidebooks, aligned by section.
- Pattern-fire heatmap: which capture-risk patterns fired where.
- Cost / duration / verdict comparison.

API: `GET /api/runs/:id/compare?with=<other_id>`.

---

## §5 Artifact shapes the UI must render

Five shapes cover everything. Sample files linked for the designer to poke at.

### 5.1 Premise card (JSON)

Path: `runs/<id>/premise_card.json`. Example: `runs/demo_run/premise_card.json`.

Fields:
- `raw_premise` — the researcher's input, verbatim.
- `sharpest_question` — one sentence, the hook.
- `claim` — the researcher's implicit claim, made explicit.
- `differentia` — what makes this study different from the nearest template; nullable.
- `nearest_template` — the prior-art template the agent recognized.
- `missing_evidence` — array of strings, things the premise hasn't specified.
- `sharpened_options` — array of 3–4 rewrites of the premise along different axes.
- `provenance` — map from field name to tag name.

UI treatment: hero display. Sharpest question in serif H2. Sharpened options as stacked cards, each clickable ("use this").

### 5.2 Branch card (JSON)

Path: `runs/<id>/branches/<a|b|c>/branch_card.json`.

Fields:
- `research_question` — one sentence.
- `intervention_primitive` — what the study introduces.
- `human_system_relationship` — substitutive / infrastructural / scaffolding / co-design.
- `method_family` — formative / evaluative / longitudinal / corpus-audit / co-design.
- `analysis_plan` — short paragraph.
- `grounding` — array of source_card IDs.

UI treatment: three side-by-side panels, color-coded. The four axes become labeled chips so the branches' divergence is visually obvious.

### 5.3 Prototype spec (JSON + markdown)

Paths: `prototype_spec.json` for structure, `prototype_spec.md` for narrative. The JSON has `wizard_controls[]`, `task_flow[]`, `observable_signals[]`, `analysis_plan`, `failure_cases[]`.

UI treatment: tabbed view. Overview (summary + task_flow). Wizard controls table. Observable signals list. Failure cases as red-bordered cards.

### 5.4 Audit (JSON + markdown)

Path: `branches/<b>/audit.json`. Rendered markdown in `audit.md`.

Fields:
- `verdict` — `BLOCKED` / `REVISION_REQUIRED` / `PASSED`.
- `axis_scores` — map.
- `findings[]` — each with `pattern_id`, `axis`, `score`, `fired` (bool), `evidence_span.quote`, `rationale`, `suggested_revision`.
- `patterns_not_fired[]` — same shape, with `fired=false` and a "why not" rationale.

UI treatment: this is the single most important view. See Gap 5 above. The blocking-finding red card should be impossible to miss.

### 5.5 Guidebook (markdown)

Path: `runs/<id>/PROBE_GUIDEBOOK.md`.

Six H2 sections: Premise, Background, Prototype, Study protocol, Failure hypotheses to test, Risks and failure modes.

Every content-bearing element ends with exactly one of 9 provenance tags: `[RESEARCHER_INPUT]`, `[SOURCE_CARD:<id>]`, `[SIMULATION_REHEARSAL]`, `[AGENT_INFERENCE]`, `[UNCITED_ADJACENT]`, `[HUMAN_REQUIRED]`, `[DO_NOT_CLAIM]`, `[TOOL_VERIFIED]`, `[IMPORTED_DRAFT]`.

UI treatment: see Gap 6. Tags render as trailing monospace pills, color-coded per the palette in `src/ui/theme.ts`. Click a `[SOURCE_CARD:id]` pill to open the card's YAML in a side-panel. Inline-editing must preserve the tag — the linter rejects saves that strip it.

---

## §6 Runtime behavior the UI must match

- **Local-first.** The server binds 127.0.0.1 by default. Nothing goes to a cloud backend. Edits write directly to disk. This is a constraint the designer should treat as permanent; Probe is a tool a researcher runs on their own machine.
- **Read-only by default, opt-in edit.** The researcher should not be able to accidentally corrupt a run. Edit mode requires an explicit toggle.
- **Lint on save.** Every PATCH to an artifact runs the provenance linter and rejects if the save introduces violations. The UI should surface the rejection inline ("this paragraph lost its tag on line 14") rather than as a modal.
- **No destructive deletes.** A researcher can "archive" a run but can't delete it from the UI. `rm -rf runs/<id>` is a shell operation.

---

## §7 What the designer should not propose

- **Cloud sync.** Not happening. The tool runs locally.
- **Multi-user collaboration.** Not the target user. One researcher, one laptop.
- **Training-data collection.** The runs directory stays on the researcher's machine.
- **An agent chat interface.** The pipeline is the interface. A freeform chatbot undermines the stage-structured commitment.
- **Animated loading illustrations.** The CLI leans on quiet, legible status lines; the web UI should too.
- **Heroes that imply findings.** "Discover what users want" headers are banned by the project's forbidden-phrase rule. Probe is rehearsal, not evidence, and the copy must not blur that.

---

## §8 One-paragraph pitch for the designer

Probe is a 20-command CLI that runs a research-design pipeline across 8 Claude-agent stages and emits provenance-tagged guidebooks. Its current browser surface (`probe web`) has the right data model but a utilitarian frontend — raw text boxes where semantic renderings belong. The researcher's session is a sequence of interrogation → divergence → rehearsal → assembly, with the option to pause at every stage, edit any artifact, kill branches, and reflow. The CLI supports most of this with `$EDITOR` spawns; the web UI should make the same interactions feel native — syntax-highlighted JSON editing with schema validation, audit findings as severity cards with quoted evidence, guidebook prose with provenance tags as colored badges, a live stage timeline that shows what the agents produced as they produced it. Everything the UI needs is already written to disk under `runs/<id>/` in predictable paths. The four-digit JSON schemas are in `schemas/`. The palette and typography are in `src/ui/theme.ts`. The API is stable at `127.0.0.1:4470`. Design the frontend; the data and the commands are done.
