# Probe — changes since last handoff

This file is a delta on top of `Handoff.md`. Hand the whole project to your coding agent and have it apply these in order. Nothing here invalidates the existing spec — the contracts in `Handoff.md` still hold; this just adds new screens/states and patches a few values.

---

## 1. New stage: **review** (stage 06)

The pipeline now has a sixth stage between `report` and "done": **review**, which simulates the OpenReview / ARR experience — one **area chair** (meta-reviewer) and three **reviewers**, each producing a structured review with strengths, weaknesses, comments to the authors, comments to the chairs, scores, and a recommendation.

The full mock lives in `probe-review.jsx` and is wired into `Probe Project.html`. Open the project, click **06 review** in the left rail.

### 1.1 Pipeline order (updated)

The five-stage pipeline in the original handoff (`framing → literature → methodology → artifacts → evaluation → report`) is now **six** stages:

```
01 framing
02 literature
03 methodology
04 artifacts        ← was numbered "03" in the old handoff; now "04"
05 evaluation
06 report
07 review           ← NEW
```

Wait — let me restate cleanly. The canonical pipeline order is now:

| # | id | label | notes |
|---|---|---|---|
| 01 | `framing` | framing | unchanged |
| 02 | `literature` | literature | unchanged |
| 03 | `methodology` | methodology | unchanged |
| 04 | `artifacts` | artifacts | unchanged (was previously also labelled "03" — fix that) |
| 05 | `evaluation` | evaluation | unchanged |
| 06 | `report` | report | unchanged |
| 07 | `review` | review | **NEW** |

The stage numbering in the rail (`01 …` `07 …`) should match this. The TUI's left rail and the GUI's `<StageRail>` in `probe-project-stages.jsx` already render this list in order — confirm against `Probe Project.html`.

### 1.2 Review stage data model

Add a `review` block to the run state. Each run has **one** review session containing **one area chair** + **three reviewers**.

```toml
# inside a run's state file
[review]
venue          = "ARR · cycle 14"        # display only
deadline       = "2026-05-30"
verdict        = "major-revisions"        # accept | minor-revisions | major-revisions | reject

[review.ac]
id             = "1AC"
recommendation = "major-revisions"
confidence     = 4                         # 1–5
summary        = "<one-paragraph meta-review>"
agreement      = "partial"                 # full | partial | split
notes_to_chairs = "<text>"

[[review.reviewers]]
id             = "R1"
recommendation = "RR"                      # one of A | ARR | RR | RRX | X
confidence     = 3
expertise      = 4                         # 1–5
soundness      = 3                         # 1–5
excitement     = 3                         # 1–5
reproducibility = 4                        # 1–5
strengths      = "<text>"
weaknesses     = "<text>"
to_authors     = "<text>"
to_chairs      = "<text>"
ethics_flagged = false

# … two more reviewer entries (R2, R3)
```

### 1.3 Recommendation buckets

Five buckets, modelled on the **ACL Rolling Review** taxonomy:

| code | label | color token |
|---|---|---|
| `A` | accept | moss `#7fb069` |
| `ARR` | accept w/ revisions | moss-dim |
| `RR` | revise & resubmit | amber `#d9a548` |
| `RRX` | reject (major issues) | rose-dim |
| `X` | reject | rose `#e26e6e` |

The **verdict** at the top of the review pane aggregates these — show the AC's recommendation as the headline verdict; reviewer recommendations sit below.

### 1.4 GUI layout (`probe-review.jsx`)

The pane has four regions, top to bottom:

1. **Verdict header** — large, brand-amber if revisions, rose if reject, moss if accept. Includes venue + deadline + AC agreement chip (`agrees with majority` / `splits with R2`).
2. **Meta-review (1AC)** — collapsible card, expanded by default. Shows AC summary + recommendation + confidence + notes-to-chairs.
3. **Reviewer cards** — three side-by-side (or stacked below 1100px). Each card is collapsible; collapsed shows recommendation pill + confidence + 1-line tldr; expanded shows the full structured review (strengths, weaknesses, to-authors, to-chairs, scores grid).
4. **What now** — action row: `[draft response]`, `[diff vs previous review]`, `[export PDF for ARR portal]`, `[mark as accepted]`.

The rerun dock (model-call surface) at the bottom matches the other stages: text prompt, cost estimate, `[enter] queue rerun`, model status line on rerun.

### 1.5 TUI layout

Add a **review** scene to `Probe (TUI).html` and the standalone TUI binary. Same 4-region structure, rendered as box-drawing:

```
┌─ PROBE › <run-name> › review ─ ARR · cycle 14 · due may 30 ─┐
│                                                              │
│  VERDICT  ▸ major revisions      ac agrees with majority     │
│           confidence 4 / 5                                   │
│                                                              │
│  ─── meta-review · 1AC ──────────────────────────────────    │
│   <AC summary, wrapped>                                      │
│   ▸ recommendation: major revisions                          │
│   ▸ notes to chairs: <text>                                  │
│                                                              │
│  ─── reviewers ──────────────────────────────────────────    │
│   R1  RR  conf 3   "<one-line tldr>"                         │
│   R2  RR  conf 4   "<one-line tldr>"                         │
│   R3  ARR conf 3   "<one-line tldr>"                         │
│                                                              │
│   [enter] expand focused reviewer                            │
│   [d] diff vs previous review · [r] rerun · [e] edit prompt  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

`j/k` moves between AC, R1, R2, R3 cards. `enter` toggles expand. `tab` jumps from cards to action row.

### 1.6 Initial state on first open

Unlike the other stages, **review opens pre-loaded with a seeded run** (`r1 · 3d ago · simulated · 1AC + 3 reviewers`) so the user immediately sees a worked example. Other stages start at `queued` with a "ready to simulate" prompt; review starts at `fresh`. Document this difference in your state machine.

### 1.7 Status mapping

In the pipeline rail, review uses the same status colors as every other stage (`fresh / stale / running / queued`). It is `fresh` on first open per §1.6. After a rerun completes, it goes back to `fresh` with an updated `lastRun`.

---

## 2. Loading indicators on all model-call surfaces

Every place we simulate a `claude.complete` style call now renders a consistent **TUI-style loading line**. This is the contract the real implementation must honor.

### 2.1 Shared module: `probe-spinner.jsx`

Exposes:

| export | signature | use |
|---|---|---|
| `Spinner` | `<Spinner />` | inline 10-frame Braille spinner |
| `ModelStatusLine` | `<ModelStatusLine model="claude-sonnet-4-5" elapsedMs={…} />` | full status line with model name + spinner + elapsed counter |
| `PhaseDots` | `<PhaseDots phases={[…]} active={2} />` | sub-progress: `planning › sharpening › drafting › verifying`, with the current phase highlighted |
| `useBraille()` | hook returning current frame | `⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏` cycled at 80ms |
| `useElapsed(running)` | hook returning ms since `running` flipped to true | for the elapsed counter |

The Braille set is the canonical 10-frame terminal spinner — same one most CLIs use. Don't drift it.

### 2.2 Surfaces where the indicator must appear

Every surface that triggers a model call must render `<ModelStatusLine>` somewhere visible while the call is in flight:

1. **Brainstorm angle generator** (`Probe New Project.html`) — above the streaming branch column while the interrogator produces angles.
2. **Stage rerun dock** (`probe-project-stages.jsx`) — below the rerun prompt, replacing the cost estimate while the rerun is in flight. Spinner also appears on the rerun button itself.
3. **All six stage panes** (`probe-literature.jsx`, `probe-methodology.jsx`, `probe-artifacts.jsx`, `probe-evaluation.jsx`, `probe-report.jsx`, `probe-review.jsx`) — when the user clicks rerun and the dock kicks off, the pane shows a thinking row at the top of the streamed-content column until first content arrives.
4. **Welcome screen connectivity probe** (`Probe Welcome.html`) — already had a `checking…` state; align its spinner to use `<Spinner />` for consistency.

### 2.3 Phase labels

The four phases shown in `<PhaseDots>` are:

```
planning › sharpening › drafting › verifying
```

These are abstract — they map to whatever internal stages your model client wants — but they must show up in this order and the active one must be brand-amber while the others are dim ink3. Bumped the simulated thinking duration from 700ms → 1400ms so users actually see the state change.

### 2.4 TUI equivalent

In the TUI, the status line is rendered as plain text:

```
 ⠹ claude-sonnet-4-5  ·  planning › sharpening › drafting › verifying        2.4s
```

- Spinner glyph cycles at 80ms.
- Phases are separated by ` › ` — active phase is amber, inactive is ink3.
- Elapsed counter is right-aligned with `tabular-nums`-equivalent monospace alignment.
- When the call completes, the whole line is replaced by `✓ done · 4.7s · $0.12` in moss.

---

## 3. Misc patches

### 3.1 Seeded run timestamps

The seeded `r1` runs across all stages (literature, methodology, artifacts, evaluation, report, review) now read **`3d ago`** instead of `just now`. This makes the "last run" display more believable on first open and matches the deadline math in the timeline tab.

### 3.2 Rerun cost format

Cost estimates in the rerun dock are now ranged (`$0.42 – $0.68`) rather than a single number, matching the format already documented for the new-project cost estimate. Apply this to all stages.

### 3.3 Stage rail glyph

Confirm that the rail uses `●` for `fresh / stale / running` and `○` for `queued` — the running state animates (pulse, 1.2s loop). The original handoff mentioned this; just calling it out as a checked invariant.

### 3.4 Naming: review vs reviewer

The stage is **review** (singular). The three R1/R2/R3 entities are **reviewers**. The single 1AC is the **area chair** or **meta-reviewer** (use either, but be consistent within a screen). The verdict belongs to the **review session**, not to any individual reviewer.

### 3.5 New-project pipeline preview

The new-project / brainstorm screen (`Probe New Project.html`) now shows a **pipeline preview row** above the action bar once at least one RQ is selected. It reads:

```
FULL PIPELINE · PER RQ    framing › literature › methodology › artifacts › evaluation › report › review    est $2.40 – $3.85 · ~18m wall
```

- The arrow chain matches the canonical 7-stage order; `review` is rendered in brand-amber to highlight that it's part of every run.
- Per-RQ cost multiplies linearly with the number of selected RQs; wall-clock too.
- The status line at the bottom of the brainstorm screen now reads `stage 1 of 7 · interrogator` (was `1 of 8`).
- Done pane status reads `7 stages complete` (was `5 stages complete`).

Apply the same correction in the TUI mock — `Probe (TUI).html` was patched: `spans 7 stages`, `full pipeline (7 stages): $11 – $19`, `7 stages · 5 fresh · 1 stale · 1 queued`.

---

## 4. Files touched / added

New:
- `probe-review.jsx` — review stage component
- `probe-spinner.jsx` — shared spinner / phase-dots / hooks

Modified:
- `Probe Project.html` — wires review into the stage rail + main pane
- `Probe New Project.html` — brainstorm thinking row uses `<ModelStatusLine>`
- `probe-project-stages.jsx` — adds review to `STAGES`, rerun dock uses `<ModelStatusLine>` + `<PhaseDots>`
- `probe-project-gantt.jsx` — adds review row to the timeline (rightmost stage)
- `Probe (TUI).html` — adds review scene; brainstorm spinner aligned

Unchanged (still authoritative):
- `Handoff.md` — read first, then this file
- `Probe Config.html` / `Probe Config (TUI).html` — config surface untouched
- `Probe Startup.html` / `Probe Welcome.html` — launcher + first-run untouched

---

## 5. Acceptance additions

On top of the original handoff's acceptance criteria:

- **Pipeline rail** shows seven stages in the canonical order; review is rightmost; numbering is `01`–`07`.
- **Review pane** renders verdict + 1AC + 3 reviewer cards; each reviewer card is independently expandable; recommendation pills use the five-bucket palette in §1.3.
- **Loading indicator** appears on every model-call surface listed in §2.2 — both GUI and TUI. No surface kicks off a call without showing one.
- **Spinner glyph cycle** matches `⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏` at ~80ms per frame.
- **Phases** render in the order `planning › sharpening › drafting › verifying`; the active phase is brand-amber.
- **Seeded review on first open** — the review stage is `fresh`, not `queued`, with one prebuilt run visible. Document the difference from the other stages.
