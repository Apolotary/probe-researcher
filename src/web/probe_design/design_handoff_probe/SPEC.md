# Probe — surface handoff

You are building **Probe**, a CLI / agentic research-design pipeline that ships two coordinated surfaces:

1. **GUI surface** — polished HTML/web views (used inside an Electron-style companion or browser dashboard).
2. **TUI surface** — in-terminal screens that run directly from the shell with no browser.

Both surfaces share state (config TOML, run state, project state) and must agree on every value. This handoff covers all five screens that have mocks; build the TUI versions to match the visual references and the contracts below.

## Visual references in this project

| Surface | GUI mock (HTML) | TUI mock (HTML rendering of `<pre>` + spans) |
|---|---|---|
| Startup / launcher | `Probe Startup.html` | `Probe (TUI).html` → *startup* scene |
| Welcome / first-run | `Probe Welcome.html` | `Probe (TUI).html` → *welcome* scene |
| New project (premise → brainstorm) | `Probe New Project.html` | `Probe (TUI).html` → *new project* scene |
| Project (stages + timeline) | `Probe Project.html` | `Probe (TUI).html` → *project* scene |
| Config | `Probe Config.html` | `Probe Config (TUI).html` and `Probe (TUI).html` → *config* scene |

Open both `Probe (TUI).html` and the GUI HTML files side by side as you build — they're the source of truth for layout, copy, and color.

## Suggested stack

- **Go** + [Bubble Tea](https://github.com/charmbracelet/bubbletea) + [Lip Gloss](https://github.com/charmbracelet/lipgloss) — idiomatic match for the look
- **Rust** + [Ratatui](https://github.com/ratatui-org/ratatui) is fine
- **Python** + [Textual](https://github.com/Textualize/textual) is fine but heavier

Pick whichever matches the rest of Probe's codebase. The mocks are framework-agnostic.

## Shared visual contract (applies to every scene)

- **Outer frame**: `┌─ PROBE · <scene title> ─ … ─┐` header, vertical `│` rules, bottom row is a full-width status line.
- **Status line**: inverse-video amber pill on the left for mode (`NORMAL` / `INSERT` / `COMMAND`), then dim contextual text, then keymap or counters on the right.
- **Selected row**: inverse video on the brand amber (`#d9a548` bg, dark fg). Soft-selected = 14% amber wash.
- **Status colors** (do not drift):
  - `#7fb069` moss — fresh / ok
  - `#d9a548` amber — stale / warning / brand
  - `#7dcfff` cyan — running / streaming
  - `#5c6678` ink3 — queued / unset
  - `#e26e6e` rose — critical / deadline / error
- **Box-drawing**: U+2500 series throughout. Section glyphs (⧬ ◆ ⏵ etc.) require a Nerd Font or recent emoji-aware terminal. Provide ASCII fallbacks behind a flag.
- **Respect `NO_COLOR`** — fall back to monochrome.
- **Min terminal**: 80×24. Below 100 cols, collapse the sidebar to a top tab strip.

## Top-level keymap (consistent across scenes)

| Key | Action |
|---|---|
| `j` / `↓` | move down |
| `k` / `↑` | move up |
| `tab` / `shift-tab` | next/prev field |
| `enter` | confirm focused / open detail |
| `esc` | leave insert → leave modal → back |
| `:e` | open underlying file in `$EDITOR` |
| `:q` | quit current screen |
| `^c` | hard quit |

Scene-specific keys are listed under each section below.

---

## Files in this project

- `Probe Startup.html` — GUI mock of the launcher
- `Probe Welcome.html` — GUI mock of first-run + key check
- `Probe New Project.html` — GUI mock of the premise → brainstorm flow
- `Probe Project.html` — GUI mock of the main project view (stages + timeline tabs)
- `Probe Config.html` — GUI mock of the config screen
- `Probe (TUI).html` — single-file TUI mock with all five scenes (chip switcher at the top)
- `Probe Config (TUI).html` — standalone TUI mock for config (same content as the *config* scene above)
- This file — the spec

Open all of them before reading on.

---

## Information model (config surface)

A single TOML config, persisted to `~/.config/probe/probe.toml` with `0600` perms. Sections map 1:1 to the six panes in both surfaces.

```toml
# probe.toml — managed by `probe config`. Hand-edit at your own risk.

[keys]
# Each provider entry is optional. If absent, Probe falls through to the env var.
# Env always wins — never overwrite an env value with a stored one.
anthropic = "sk-ant-..."   # optional; env: ANTHROPIC_API_KEY
openai    = "sk-..."       # optional; env: OPENAI_API_KEY
google    = ""             # optional; env: GOOGLE_API_KEY

[models]
literature   = "claude-sonnet-4-5"
methodology  = "claude-sonnet-4-5"
artifacts    = "claude-sonnet-4-5"
evaluation   = "claude-haiku-4-5"
report       = "claude-sonnet-4-5"

[budget]
max_per_run   = 25.0     # hard ceiling — abort run if exceeded
warn_at       = 15.0     # show banner once a run crosses this
confirm_over  = 5.0      # prompt before kicking off any run estimated above this
monthly_cap   = 200.0    # across all runs; reset on the 1st

[appearance]
font_family = "JetBrains Mono"  # GUI only; TUI inherits terminal font
font_size   = 14                # GUI only
theme       = "amber-dark"      # amber-dark | mono-dark | green-crt | paper
density     = "comfy"           # compact | comfy | spacious
cursor      = "block"           # block | bar | underline (TUI cursor shape)

[behavior]
editor          = "$EDITOR"     # $EDITOR | vim | nvim | code | cursor | zed
workdir         = "~/probe"     # where new runs are written
auto_replay     = false         # re-open last run on launch
confirm_spend   = true          # ask before any run projected over $5
stream_logs     = true          # show live token stream during a run
send_telemetry  = false         # anonymous run counts only
```

### Resolution order

1. Process env var (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_API_KEY`)
2. Stored value from `[keys]` table
3. Empty → key is "missing"

Whichever wins, surface the **source** in the UI (`env · $ANTHROPIC_API_KEY` vs. `stored in config` vs. `unset`). Do not silently fall through.

---

## Config surface — TUI build

Suggested stack:

- **Go** + [Bubble Tea](https://github.com/charmbracelet/bubbletea) + [Lip Gloss](https://github.com/charmbracelet/lipgloss) — most idiomatic match for the look in `Probe Config (TUI).html`
- **Rust** + [Ratatui](https://github.com/ratatui-org/ratatui) is also fine
- **Python** + [Textual](https://github.com/Textualize/textual) is fine but heavier

Pick whichever matches the rest of Probe's codebase. The mock is framework-agnostic.

### Layout (match `Probe Config (TUI).html`)

```
┌─ PROBE · config ───────────────────────────  ~/.config/probe/probe.toml ● unsaved ─┐
│                                                                                    │
│  SECTIONS                  │  § <pane title>                                       │
│  > [k] API keys           │  <pane subtitle>                                      │
│    [m] Models              │                                                       │
│    [b] Budget              │  <fields…>                                            │
│    [a] Appearance          │                                                       │
│    [h] Behavior            │                                                       │
│    [i] About               │                                                       │
│                            │                                                       │
│  NAVIGATE                  │                                                       │
│   j/k · move section       │                                                       │
│   tab · next field         │                                                       │
│   enter · edit field       │                                                       │
│   :e · open raw toml       │                                                       │
│   ^s · save & apply        │                                                       │
│   esc · back               │                                                       │
│                            │                                                       │
└────────────────────────────┴───────────────────────────────────────────────────────┘
 NORMAL  API keys              JetBrains Mono · 14px         [+]  2/3 keys ok    1:1
```

- Outer rounded box; inner vertical rule between left rail and main pane.
- Selected sidebar row = **inverse video on amber** (`#d9a548` background, dark fg).
- Header right side: `~/.config/probe/probe.toml` path · `●` amber dot if dirty · `unsaved` text.
- Status line (bottom row, full width): inverse amber block on the left for mode (`NORMAL` / `INSERT`), then dim section name, then file/font info, then `[+]` if dirty, key health, position. Match the HTML version exactly.
- All box-drawing: U+2500 series.

### Keymap (match the GUI's hotkeys + add vim conventions)

| Key | Action |
|---|---|
| `j` / `↓` | next section |
| `k` / `↑` | prev section |
| `k`, `m`, `b`, `a`, `h`, `i` | jump to section by hotkey (when not in insert mode) |
| `tab` / `shift-tab` | next/prev field within a pane |
| `enter` | edit focused field (opens modal for keys, opens picker for selects, enters insert mode for text) |
| `space` | toggle focused boolean |
| `esc` | leave insert mode → normal mode → back out of modal → quit screen |
| `^s` | save & apply |
| `^r` | reload from disk (revert unsaved) |
| `:e` | open raw `probe.toml` in `$EDITOR` |
| `:q` | quit |

### Per-pane specifics

**API keys.** Three rows (Anthropic, OpenAI, Google). For each row show: status dot, source label, masked preview (`sk-ant-…7Q4f`), last-tested time. Pressing `enter` on a key opens a centered modal with a single text input — see the modal in the mock. Inside the modal: `enter` saves, `^t` runs a test request and shows ✓ / ✗ inline, `esc` cancels.

**Models.** Five rows, one per pipeline stage. `enter` opens a list picker (overlay) of the available models; `j/k` to move, `enter` to choose.

**Budget.** Four numeric inputs. Show a usage bar like the HTML version (`$used` / `$cap`, color-coded green/amber/rose at 50%/80%).

**Appearance.** Font family/size are GUI-only; in the TUI **show them but mark them disabled** (dim, with a `(GUI only)` suffix) — they still write to TOML so the GUI honors them. Theme is a swatch grid in the GUI, in the TUI it's a list. Density and cursor apply to both surfaces.

**Behavior.** Mostly toggles + two text fields. Toggles render as `[x]` / `[ ]` checkboxes; `space` flips them.

**About.** Read-only key/value table. Buttons at the bottom (`open log`, `copy diagnostics`, `edit toml in $EDITOR`, `factory reset`). In the TUI these are a bottom row of inline `[ … ]` pills navigated with `tab`.

### Save semantics

- Edits are buffered in memory; the header dirty dot lights up.
- `^s` writes the full TOML atomically (write to `probe.toml.tmp`, `fsync`, rename) and re-reads to confirm.
- On save, briefly flash `✓ saved to disk` in the header where `● unsaved` was — exactly like the HTML version.
- `^r` discards the buffer and reloads — confirm if dirty.

### Things the TUI should additionally do that the GUI doesn't

- Honor `$EDITOR` for `:e` — drop into the user's editor on the actual file, then re-parse on return.
- Detect when the file is edited externally while open and offer to reload.
- Respect `NO_COLOR` env var (fall back to monochrome).

---

## Config surface — GUI

`Probe Config.html` is a finished React mock of the GUI version. If you're building the GUI for real (e.g. an Electron companion or a hosted dashboard), use that file as the visual spec. Same six sections, same field semantics, same save model. The two surfaces should agree on every value.

---

## Startup screen — `probe`

The launcher. Runs when the user types `probe` with no arguments.

**Layout (TUI ref: *startup* scene).** Big centered ASCII logo (block-style, double-stroke), version & tagline below, then a hotkey menu, then a short "recent" list. No left rail — it's intentionally minimal.

**Menu items.**

| Hotkey | Label | Behavior |
|---|---|---|
| `n` | New project | jump to *new project* screen |
| `o` | Open project | open the local-runs picker |
| `r` | Recent | show recent runs list |
| `d` | Replay demo_run | replay the canned demo (cached, $0) |
| `c` | Config | open *config* screen |
| `h` | Help & docs | `man probe` / `:help` |
| `q` | Quit | exit |

**Behavior.**

- Pressing the hotkey or `j/k` + `enter` selects an item.
- The recent list shows up to 3 entries: `id · premise · age · cost`. Use the same status-color dots (fresh/stale/queued).
- Status line right-side: monthly cost-so-far / cap (read from `[budget].monthly_cap`).

---

## Welcome screen — `probe --first-run`

Shown the first time Probe is launched, or any time `~/.config/probe/probe.toml` is absent. Walks the user through three steps: find a key, try a no-cost replay, start their own run.

**Layout (TUI ref: *welcome* scene).** Single full-width pane, no sidebar. Three numbered steps stacked vertically, each headed by a brand-amber `step N ─ <label>`.

**Step 1 — find an API key.** Loops the three providers and shows for each:

- ✓ if a key was found, dim `·` if not.
- Source: `env · $ANTHROPIC_API_KEY` (env wins) or `stored in config` or `unset`.
- Masked preview if found, plus a small connectivity probe result (`connected · 142 tok ping` on success).
- Below the list, the precedence sentence: `env → ~/.config/probe/probe.toml → paste-once. First match wins.`

**Step 2 — replay.** Suggest `probe replay demo_run`. No-cost, ~30s.

**Step 3 — start.** Suggest `probe new "<premise>"`. Show an example.

**Footer prompt.** A small `› probe █` prompt with a blinking caret hints they can type a command right there.

**Status line.** Right side shows key-check result (`✓ key`, `✗ no key`, `! 401`, etc.).

**Key states to handle visually** (these are tweakable in the GUI version, the TUI must render all of them):

- `valid` — moss ✓, "connected · NN tok ping"
- `missing` — ink3 ·, "unset · falls through"
- `unauthorized` — rose ✗, "401 unauthorized — rotate or paste a new one"
- `rate-limited` — amber !, "429 rate-limited — last seen <time>"
- `checking` — cyan ~, "checking… spinning"

---

## New-project screen — `probe new "<premise>"`

The interrogator stage: take a premise, propose 4 angles, let the user pick one (or write their own) before kicking off the literature stage.

**Layout (TUI ref: *new project* scene).** Single full-width pane.

1. **Premise box** at the top — read-only display of the premise, with `[i] edit premise` hint.
2. **Interrogator pane** — heading + subheading, then a numbered list of 4 angles. Each angle: title in `ink`, two-line dim subtitle (description + suggested methods).
3. **Custom angle** — line 5 is `+ write your own angle` with a blinking caret to indicate it's editable.
4. **Cost estimate** at the bottom: per-angle estimate, full-pipeline estimate, monthly budget remaining.

**Behavior.**

- `j/k` moves the highlight between angles 1–5.
- `enter` on 1–4 confirms the angle and transitions to the literature stage.
- `enter` (or `a`) on row 5 enters insert mode for the custom angle.
- `R` re-brainstorms (calls the interrogator again with the same premise).
- `esc` returns to the premise editor; from the premise editor, `esc` again quits to the launcher.

**Selected row** uses the soft-amber wash (`selSoft`) plus a leading `▸` so it reads even without color.

---

## Project screen — `probe open <run-id>`

The day-to-day surface. Two tabs (`stages` and `timeline`) over the same data; left rail of pipeline stages; main pane shows the focused stage's detail.

**Layout (TUI ref: *project* scene).** The mock shows both tabs stacked so you can see the relationship — in the actual TUI they're alternates of the main pane, switched with `⇧1` / `⇧2`.

**Header.** `┌─ PROBE › <run-name> ─ <tabs> ─ deadline <date> · NNd left ─┐`. Active tab uses inverse-video amber pill; inactive is dim.

**Left rail (stages).**

```
STAGES
 ● 01 framing      4d ago
 ● 02 literature   3d ago
 ● 03 methodology  2d ago
 ● 04 artifacts    2d ago
 ● 05 evaluation   1d ago
 ● 06 report       3d ago     ← currently focused
 ○ 07 review       queued
```

Seven canonical stages, in this order: `framing`, `literature`, `methodology`, `artifacts`, `evaluation`, `report`, `review`. Each row carries a status pip + label + last-run age. Selected stage uses inverse-video amber.

Below the rail: a `LEGEND` block (status-color key), an `ACTIONS` block (per-focused-stage hotkeys), and a `NAVIGATE` block (global hotkeys).

**Stages tab — main pane.** Shows the focused stage's detail:

- Section header `§ <stage label>` with stage subtitle/status.
- `runs ─` list — most recent first, current run marked `▸ … · current`.
- For evaluation: a `findings ─` list of pilot frictions, each with severity pip (`▲ critical` rose, `▲ medium` amber, `▽ low` dim), a one-line rationale, and a `› fix:` recommendation tagged `[recommended]` in moss.
- For review (stage 07): see *Review stage* below.
- A `rerun` modal at the bottom: text input + cost estimate + `[enter] queue rerun` / `[esc] cancel`.

**Timeline tab — main pane.** Deadline-anchored Gantt:

- X-axis: weekly date labels (`apr 14 · apr 21 …`), tick marks `│` between them.
- Y-axis: one row per stage, in pipeline order.
- Bars use these glyphs:
  - `█` solid — fresh / completed
  - `▒` dashed — pending / queued rerun (shows alongside the solid)
  - `░` light — queued / not-started
- Two vertical guides:
  - `today` — brand amber, with label
  - `deadline` — rose, with label
- Footer: slack-to-deadline summary (`slack to deadline ─ ~12 days after planned report finish · healthy if you start report by may 22`).

**Behavior.**

- `j/k` move stages in the rail. `enter` opens the stage detail (already shown in main pane).
- `r` queue rerun (opens the rerun modal). `e` edit prompt. `v` view artifacts. `d` diff vs previous. `a` accept & mark fresh.
- `R` (capital) reruns the whole project from the focused stage forward.
- `⇧1` / `⇧2` switch tabs.
- On the timeline tab: `:deadline=YYYY-MM-DD` updates the deadline; bars recompute backward from it.
- Status line: focused stage status, then aggregate counts (`7 stages · 5 fresh · 1 stale · 1 queued`), then run cost vs budget.

### Review stage (stage 07)

Review is a **simulated peer-review pass** over the report from stage 06. The point is to surface the kinds of objections a real panel would raise, before submission.

**Panel shape.** 1 area chair (`AC`) + 3 reviewers (`R1 R2 R3`). Each reviewer is parameterized by:

- `field` — free-text research area (e.g. `attention & cognitive ergonomics`).
- `affiliation` — one of `academic` · `industry` · `independent`.
- `topic_confidence` — one of `expert` · `confident` · `tentative` · `outsider`.

The AC reads the three reviews and writes a **meta-review** that proposes a verdict.

**Recommendation scale.** Five buckets, in order of strength:

| short | label | meaning |
|---|---|---|
| `A` | accept | ready as-is — rare |
| `ARR` | accept w/ revisions | 1AC verifies fixes |
| `RR` | revise & resubmit | next cycle |
| `RRX` | major revision | rethink core argument |
| `X` | reject | venue mismatch or fatal flaw |

Verdict colors are bucketed by direction: `A`/`ARR` → moss; `RR` → amber; `RRX` → orange; `X` → rose.

**Per-reviewer fields** (Probe stores these structurally; the GUI/TUI render them):

- `id` (R1/R2/R3), `field`, `affiliation`, `topic_confidence`
- `rec` — one of the five buckets
- `one_line` — single-sentence summary used in the collapsed card
- `strengths` (string[]), `weaknesses` (string[])
- `to_authors` — paragraph; the public review body
- `to_chairs` — confidential note shown in italics, dashed border

**Meta-review (AC) fields:**

- `summary` — what the panel collectively saw
- `proposed` — the AC's proposed verdict, in prose
- `consensus_points[]` — each one tagged `all-3` / `2-of-3` / `1-of-3` and prioritized `high` / `medium` / `low`

**TUI layout (match `Probe (TUI).html` → *review* scene, stage 06 in the mock pre-rename, now stage 07).** Top: simulated panel summary line + recommendation distribution mini-chart. Below: collapsible per-reviewer cards keyed by `R1`/`R2`/`R3`/`AC`. Bottom: a `PANEL TUNING` block letting the user tweak `field` / `affiliation` / `topic_confidence` for the next rerun, and a checks block (anonymization, format, length, etc.).

**Actions on review:**

- `incorporate feedback` — queues a report rerun pre-loaded with the consensus issues at priority ≥ medium.
- `export rebuttal` — emits a Markdown rebuttal letter responding point-by-point.
- `dismiss` — archives the review run, leaves the report frozen.

**Rerun shape.** A review rerun re-simulates the panel — uses cached lit/method/artifacts/eval. Estimated cost ~$3.40 for AC + 3 reviewers.

**Status-line copy when focused:** `06 review-prep · running · 4 personas    panel mean predicted: RR (above threshold)    cost · $22.10 / $50 budget`.

**Stage status colors** (used in pips, gantt bars, text):

| status | color | glyph |
|---|---|---|
| `fresh` | moss `#7fb069` | `●` |
| `stale` | amber `#d9a548` | `●` |
| `running` | cyan `#7dcfff` | `●` (animated) |
| `queued` | ink3 `#5c6678` | `○` |

---

## Acceptance

**All surfaces**
- Both surfaces (GUI + TUI) read & write the same TOML / run state and produce byte-identical output for the same edits.
- Env-var precedence is visibly indicated and never silently overridden.
- TUI runs in an 80×24 terminal at minimum (degrade gracefully — collapse the sidebar to a top tab strip below 100 cols).
- `NO_COLOR` falls back to monochrome on every screen.
- Status colors and box-drawing match the visual mocks within reason — don't drift the moss/amber/cyan/rose tokens.

**Config**
- Saved `probe.toml` is `0600`. No key material in logs or diagnostics.
- All five key states (valid / missing / unauthorized / rate-limited / checking) render in the welcome screen.

**Startup / welcome**
- Pressing each menu hotkey from the launcher routes to the right screen.
- First-run welcome appears iff `~/.config/probe/probe.toml` does not exist.

**New project**
- The 4 angles are returned by the interrogator; the TUI must render them with the same description + methods structure shown in the mock.
- Cost estimates use the same `$X.XX – $Y.YY` ranged format and read budget remaining from `[budget].monthly_cap` minus this-month usage.

**Project**
- Stage-status pips and Gantt bar colors match the mock's color tokens exactly.
- Timeline recomputes backward from the deadline when it changes; today's vertical guide stays anchored to real now.
- Rerun modal accepts free-text, shows a cost estimate, and produces a draft run that can be diffed against the current run before accepting.
