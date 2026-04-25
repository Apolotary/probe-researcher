# Handoff: Probe — research-design CLI + TUI

## Overview

**Probe** is a CLI / agentic research-design pipeline. It walks a user from a vague premise through 7 pipeline stages — `framing → literature → methodology → artifacts → evaluation → report → review` — into a submission-ready research package, with simulated peer review at the end.

Probe ships as **two coordinated surfaces**:

1. **TUI** — the canonical surface, opened by typing `probe` in a terminal. Box-drawing chrome, vim-style keybindings, runs on 80×24 minimum.
2. **GUI** — a richer companion view for the same state (Electron / web dashboard / etc.). Same data model, friendlier affordances.

Both surfaces read and write the same TOML config (`~/.config/probe/probe.toml`) and the same run state. They must agree on every value: an edit in one is visible in the other.

This handoff covers **all five user-facing screens** plus the **shared 7-stage pipeline**, in both surfaces.

---

## About the design files

The files in `references/` are **HTML/React design references** — high-fidelity prototypes that show intended look, copy, color, and behavior. They are **not** production code to copy directly.

Your job is to **recreate these designs in a real codebase** using its established patterns and libraries. If the codebase is empty, pick the framework that best matches Probe's nature:

- For the TUI: Go + [Bubble Tea](https://github.com/charmbracelet/bubbletea) + [Lip Gloss](https://github.com/charmbracelet/lipgloss) is the idiomatic match. Rust + [Ratatui](https://ratatui.rs) is also fine.
- For the GUI: any modern React-based stack (Next.js, Vite + React, Electron renderer) is a clean match for the mocks, which are themselves React.

The mocks are framework-agnostic — they describe layout, copy, colors, and state, not implementation.

## Fidelity

**High-fidelity (hifi).** Final colors, typography, spacing, copy, and interaction states are pinned. Recreate the UI pixel-close in the target codebase using its existing libraries and patterns. Where this handoff specifies a hex value, a font weight, a piece of copy, or an animation duration — use it.

The one exception is iconography: the mocks use Unicode glyphs (●, ○, ▲, ▽, ›, ─, █, ▒, ░) because they have to render in a `<pre>`. In a real GUI you may substitute SVG or icon-font equivalents that match the same visual semantics.

---

## Files in this handoff

| Path | What it is |
|---|---|
| `README.md` | This file. Self-contained spec for an implementer. |
| `SPEC.md` | The original handoff doc — deep dive on the config surface, key resolution, and project-screen mechanics. Read this after the README. |
| `CHANGELOG.md` | Notes on the most recent design pass: panel-shape decisions for the review stage, loading-indicator contract, etc. |
| `references/*.html` | Full HTML design mocks — open these in a browser and click around. **The source of truth.** |
| `references/probe-*.jsx` | The React component code behind the GUI mocks. Use these to read exact colors, layouts, and component compositions. |
| `references/probe-tokens.js` | The shared design-token file (palette, spacing, kbd style, chip style). Lifted directly into a real codebase if useful. |

**Recommended reading order:**

1. Open `references/Probe (TUI).html` in a browser. Use the chip switcher at the top to flip between scenes — this is the canonical visual reference.
2. Open `references/Probe Project.html` for the GUI version of the day-to-day surface.
3. Open this README and `SPEC.md` side-by-side.
4. Skim `references/probe-tokens.js` for exact colors and spacing.

---

## Screens / views

There are five screens. Each has a TUI mock and (for four of them) a GUI mock.

| # | Screen | Command | TUI mock | GUI mock |
|---|---|---|---|---|
| 1 | Startup / launcher | `probe` (no args) | — | `Probe Startup.html` |
| 2 | First-run welcome | `probe --first-run` | `Probe (TUI).html` → *welcome* | `Probe Welcome.html` |
| 3 | New project | `probe new "<premise>"` | `Probe (TUI).html` → *new project* | `Probe New Project.html` |
| 4 | Project (stages + timeline) | `probe open <run-id>` | `Probe (TUI).html` → *project* | `Probe Project.html` |
| 5 | Config | `probe config` | `Probe Config (TUI).html` and *config* scene | `Probe Config.html` |

The deep mechanical detail of each screen lives in `SPEC.md`. The summary below is enough to plan the build.

### 1. Startup screen — `probe`

LazyVim-inspired launcher. Big ASCII Probe logo, version string, three columns:

- **Recent runs** — last 5 projects with last-touched ago.
- **Quick actions** — `[n] new`, `[o] open`, `[c] config`, `[?] help`, `[q] quit`.
- **Tips** — rotating one-liners about Probe's pipeline.

Footer status line shows config path + key-resolution health (`anthropic ✓ env · openai ✗ unset · google ✓ stored`).

### 2. Welcome / first-run

Three vertical steps in a `┌─ … ─┐` frame:

1. **Find a key** — checks `$ANTHROPIC_API_KEY` etc. live; shows ✓ / · per provider; offers paste-once flow.
2. **Try a no-cost replay** — runs a frozen pre-recorded project for 90 seconds against zero credits to demonstrate the pipeline.
3. **Start your own** — drops into `probe new`.

A footer line summarizes connectivity probe results (e.g. `connected · 142 tok ping`).

### 3. New project — `probe new "<premise>"`

The interrogator. Two-pane:

- **Left**: the premise the user typed.
- **Right**: 4 candidate angles streamed in by the interrogator agent. Each angle has a label, a one-line framing, and a tiny rationale. User picks one with `1–4`, types their own with `:edit`, or rerolls with `r`.

Below: a streaming column shows the model's tokens as they arrive, with a `<ModelStatusLine>` (spinner + model name + phase + elapsed). When an angle is chosen, Probe queues the `framing` stage and exits to the project view.

### 4. Project — `probe open <run-id>`

The day-to-day surface. Two tabs (`stages` and `timeline`) over the same run state. Most of the spec lives here. See **§ Pipeline stages** below for the data model and **SPEC.md** for the full pane-by-pane.

### 5. Config — `probe config`

Six sections in a left rail:

- **API keys** (Anthropic / OpenAI / Google · status dot · source · masked preview)
- **Models** (one row per pipeline stage · model dropdown)
- **Budget** (per-run cap · per-month cap · over-budget behavior)
- **Personas** (the 4 simulated reviewer + AC profiles)
- **Output** (default export format, location, anonymization)
- **About** (read-only diagnostics)

`enter` opens an inline editor on the focused row. `:w` saves. `:q` quits. `^r` reloads from disk.

---

## Pipeline stages — shared data model

The stages list is the spine of the project surface. There are **seven** stages, in this order:

| # | id | label | accent (hex) | what it does |
|---|---|---|---|---|
| 01 | `framing` | framing | `#d9a548` (amber) | turns the chosen angle into a pre-registered hypothesis + IRB-readable framing |
| 02 | `literature` | literature | `#7dcfff` (cyan) | runs 3 parallel literature angles; produces an annotated bibliography |
| 03 | `methodology` | methodology | `#a89bd8` (lilac) | proposes a study design; ESM / interview / mixed; pilot reviewer pass |
| 04 | `artifacts` | artifacts | `#7fb069` (moss) | generates the IRB protocol, recruitment email, ESM item list, etc. |
| 05 | `evaluation` | evaluation | `#c8a8e6` (orchid) | simulates a pilot deployment; surfaces frictions before the real one |
| 06 | `report` | report | `#e26e6e` (rose) | drafts the paper from everything above |
| 07 | `review` | review | `#c87838` (orange) | simulates peer review on the report (1AC + 3 reviewers) |

Each stage in run state carries:

```
{
  id, label, glyph, blurb, accent,
  status: 'fresh' | 'stale' | 'running' | 'queued',
  lastRun: '3d ago' | 'never' | …,
  currentRunId, runs: Run[], seed,
}
```

A `Run` is whatever that stage produces: a literature snapshot, a methodology draft, a report, a simulated review panel. Runs are first-class — every stage keeps a small history of past runs the user can flip back to (`d` diff, `a` accept).

### Status colors (used in pips, gantt bars, text)

| status | color (hex) | glyph |
|---|---|---|
| `fresh` | `#7fb069` moss | `●` |
| `stale` | `#d9a548` amber | `●` |
| `running` | `#7dcfff` cyan | `●` (animated) |
| `queued` | `#5c6678` ink3 | `○` |

### Rerun contract (every stage)

Every stage has a "rerun" affordance — same shape across all 7:

- A textarea ("tell the agent what to change"), a per-stage placeholder (e.g. `"e.g. simulate with N=12 instead of 6"`), and a per-stage cost estimate.
- A `<ModelStatusLine>` appears below it while the rerun is in flight (spinner + model + phase + elapsed).
- A `<PhaseDots>` row above it shows sub-progress: `planning › sharpening › drafting › verifying`. Per-stage phase labels are in `probe-project-stages.jsx`.
- After a rerun completes, the new run becomes `currentRunId` but does **not** auto-overwrite — the user must `a` accept it. Until then, the stage shows both the old (current) and new (proposed) run side-by-side with a diff affordance.

### Review stage (stage 07) — special case

Review is a simulated peer-review pass over the report from stage 06. **Read SPEC.md § Review stage for the full data model.** Summary:

- Panel = 1 area chair (`AC`) + 3 reviewers (`R1 R2 R3`). Each reviewer is parameterized by `field` (free text), `affiliation` (`academic` / `industry` / `independent`), and `topic_confidence` (`expert` / `confident` / `tentative` / `outsider`).
- Recommendation scale, 5 buckets: `A` accept · `ARR` accept w/ revisions · `RR` revise & resubmit · `RRX` major revision · `X` reject.
- The AC reads the three reviews and writes a meta-review with `summary`, `proposed`, and `consensus_points[]` (each tagged `all-3` / `2-of-3` / `1-of-3` and prioritized `high` / `medium` / `low`).
- Three actions: `incorporate feedback` (queues a report rerun pre-loaded with consensus issues at priority ≥ medium), `export rebuttal` (Markdown), `dismiss`.
- The review stage is **seeded** — on first project open it shows a fresh prebuilt run, not a `queued` empty state. Other stages are queued on first open.

---

## Interactions & behavior

### Top-level keymap (consistent across all scenes)

| Key | Action |
|---|---|
| `j` / `k` | move down / up in the focused list |
| `enter` | open / activate the focused item |
| `esc` | dismiss modal / clear selection |
| `:` | enter command mode (`:q` quit, `:w` save, `:e <file>`, `:deadline=YYYY-MM-DD`, etc.) |
| `⇧1` / `⇧2` | switch tabs (project screen) |
| `?` | inline help overlay |
| `^c` / `^d` | quit |
| `r` | rerun focused stage |
| `e` | edit prompt for focused stage |
| `v` | view focused stage's artifacts |
| `d` | diff vs previous run |
| `a` | accept proposed run & mark fresh |
| `R` | rerun whole project from focused stage forward |

### Loading indicators

Every model call must show a `<ModelStatusLine>`. The contract:

- Spinner glyph cycles through the 10-frame Braille `⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏` at 80ms per frame. Don't drift this — it's terminal canon (npm `cli-spinners` "dots").
- Format: `<spinner> <model-name> · <phase> · <tokens>tok · <elapsed>`
- Phase labels per stage:
  - framing: `planning › sharpening › drafting › verifying`
  - literature: `planning › searching › ranking › drafting`
  - methodology: `planning › drafting › piloting › verifying`
  - artifacts: `planning › drafting › formatting › verifying`
  - evaluation: `planning › simulating › collating › reporting`
  - report: `planning › drafting › citing › polishing`
  - review: `planning › simulating panel › aggregating › verdict`
- Active phase is brand-amber `#d9a548`; inactive phases are ink3 `#5c6678`. Separator is ` › `.
- Elapsed counter is right-aligned with monospace alignment.

Spinners must appear on:

1. The brainstorm angle generator (new-project screen).
2. The stage rerun dock (replaces the cost estimate while in flight, also on the rerun button itself).
3. All seven stage panes when the user kicks off a rerun.
4. The welcome-screen connectivity probe.

### Animations & transitions

- Spinner: 80ms per frame.
- Reviewer / consensus card expand-collapse: chevron rotates `0deg → 90deg` in 140ms. Body fade-in in 140ms.
- Action tile hover: background fades to accent color in 120ms; text inverts to bg color.
- Tab switch: instant — no transition.
- All easing: default browser easing is fine; no specific cubic-bezier.

### Save semantics (config screen)

- Edits are buffered in memory; the header dirty-dot lights up.
- `:w` writes to TOML atomically (write tmp + rename). Round-trips comments and ordering.
- `^r` discards buffer and reloads — confirms if dirty.
- Env values are shown but **never** overwritten by a stored value: env always wins.

---

## State management

The project run state, persisted to `~/.config/probe/runs/<run-id>/state.json`:

```ts
{
  runId: string,
  premise: string,
  angle: string,                       // chosen framing angle
  deadline: string,                    // ISO date
  budget: { perRun: number, perMonth: number, behavior: 'block' | 'warn' | 'over' },
  stages: {
    [stageId]: {
      status: 'fresh' | 'stale' | 'running' | 'queued',
      lastRun: string,                 // human-readable ('3d ago')
      currentRunId: string | null,
      runs: Run[],                     // shape varies per stage; see references/probe-*.jsx
      seed: Run | null,                // initial seeded run (review only)
    }
  },
  cost: { spent: number, budget: number },
}
```

Per-stage `Run` shapes are documented in the corresponding `references/probe-<stage>.jsx`. The review stage's `Run` shape is documented in detail in `SPEC.md § Review stage` and in `references/probe-review.jsx` (read `seededReview()` for the full structure).

State transitions:

- `queued → running` when user submits a rerun.
- `running → fresh` when the run completes and is accepted (`a`).
- `running → stale` if completion is canceled or fails — the prior run remains current.
- `fresh → stale` automatically when an upstream stage produces a new fresh run (downstream becomes stale; user must rerun).

---

## Design tokens

All exact values live in `references/probe-tokens.js`. Summary:

### Color palette

```
bg        #0e1116    deepest background
bg2       #161a22    panel background
bg3       #1c2129    card background
rule      #262b36    1px borders / dividers
ink       #d8dde7    primary text
ink2      #a8b0bf    secondary text
ink3      #5c6678    tertiary text / labels
ink4      #3a4150    quaternary / disabled
amber     #d9a548    brand accent / active / running
moss      #7fb069    success / fresh
rose      #e26e6e    danger / reject
cyan      #7dcfff    info / running
lilac     #a89bd8    methodology / academic
orchid    #c8a8e6    evaluation
orange    #c87838    review / RRX
```

### Recommendation-bucket colors (review stage)

```
A    #7fb069   moss
ARR  #a8c777   light moss
RR   #d9a548   amber
RRX  #c87838   orange
X    #e26e6e   rose
```

### Typography

- Mock fonts: `ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace` everywhere. The TUI is monospace by design; the GUI mocks lean monospace deliberately.
- Sizes: 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 16, 18, 22 (used contextually). Most body text is 13. Section labels are 11 with `letter-spacing: 0.14em` and uppercase. Reviewer one-liners are 12.5 italic.

### Spacing

- 8px grid throughout. Common values: 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22.
- Card padding: 10px 12px (compact) or 14px 16px (comfortable).
- Section spacing: 22px top margin between sections.

### Borders & radii

- Border: `1px solid #262b36` everywhere. Active / focused: 1px solid the accent.
- Left-border accent: 3px solid the accent color.
- Border-radius: 2 (chips) or 3 (cards / panels). Buttons 2 or 3 to match.
- No shadows in the mocks. Don't add them.

### Shared component styles

`references/probe-tokens.js` exports three shared style objects on `window.__probeKbd`, `window.__probeChip`, `window.__probePalette`. Reuse the shapes in the real codebase.

---

## Assets

No raster images, photos, or logos. Everything is rendered with HTML/CSS, Unicode box-drawing, and Unicode glyphs. The only "branding" is the ASCII Probe logo in the startup screen (see `references/Probe Startup.html`).

If your codebase has a brand system, prefer its components for chrome (window controls, scrollbars) — the mocks use generic versions.

---

## Acceptance checklist

**All surfaces**

- [ ] TUI and GUI read & write the same TOML / run state and produce byte-identical output for the same edits.
- [ ] Env-var precedence is visibly indicated and never silently overridden.
- [ ] All 7 stages render with the exact accent colors above.
- [ ] Status pips use the exact glyphs and colors above.

**Project screen**

- [ ] Stages tab and timeline tab share state — selecting stage 06 in one tab keeps it selected in the other.
- [ ] Rerun dock submits, shows `<ModelStatusLine>`, and on completion presents the new run as proposed (not yet current) until `a` is pressed.
- [ ] Gantt bars recompute backward from the deadline when `:deadline=YYYY-MM-DD` is set.

**Review stage**

- [ ] Renders verdict header + 1AC meta-review + 3 reviewer cards; each reviewer card is independently expandable.
- [ ] Recommendation pills use the five-bucket palette above.
- [ ] Panel-tuning block accepts edits to `field` / `affiliation` / `topic_confidence` per slot; changes apply to the **next** rerun, not the current panel.
- [ ] Seeded review shows on first open (`fresh`, not `queued`).

**Loading indicators**

- [ ] `<ModelStatusLine>` appears on every model-call surface listed under § Loading indicators.
- [ ] Spinner glyph cycle is exactly `⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏` at ~80ms per frame.
- [ ] Phases render in the right order for each stage; active phase is amber.

---

## What to read next

- `SPEC.md` — exhaustive deep dive on the config surface, key resolution, project-screen panes, and review-stage data model.
- `CHANGELOG.md` — context on the most recent design pass (review stage, loading indicators).
- `references/Probe (TUI).html` — open in a browser, flip through scenes with the chip switcher.
- `references/probe-review.jsx` — read `seededReview()` for the canonical review-run shape.
- `references/probe-tokens.js` — exact tokens to lift into the real codebase.
