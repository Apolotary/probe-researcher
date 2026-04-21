# Demo walkthrough — for the morning test run

A 10-minute tour of what Probe actually does. Each step is a real command against a real artifact already in the repo. No API calls required unless you want to run a fresh pipeline at the end.

## Prerequisites

```bash
cd /Users/apolotary/Documents/Github/probe-researcher
npm install  # if you haven't already
npm run build
export ANTHROPIC_API_KEY="sk-ant-..."  # only needed for step 7 (optional)
```

## Step 1 — See what's in flight (15 seconds)

```bash
npx probe runs
```

Expected: a Linear-style list view with three runs (`demo_run`, `benchmark_code_review`, `benchmark_creativity_support`) showing status, cost, duration, and premise. Sanity-check: all three have artifacts; two have surviving branches.

## Step 2 — Per-run Gantt (30 seconds)

```bash
npx probe gantt demo_run
```

Expected: horizontal bars, one per (stage × branch) pair, color-coded by model (cyan Opus / magenta Sonnet). ↺N badges show repair passes. The stage-4 prototype bar is conspicuously long — that's Sonnet retrying against schema enums during early development; the fact that it's visible is the point of the view.

## Step 3 — Lint the flagship guidebook (15 seconds)

```bash
npx probe lint runs/demo_run/PROBE_GUIDEBOOK.md
```

Expected:
```
provenance lint
  ✓ every element carries a provenance tag
voice lint
  ✓ no forbidden phrases outside quoted context
```

This is the load-bearing piece. It walks the markdown AST and requires a tag on every paragraph, list item, blockquote, and table row. Try intentionally breaking it — edit the guidebook, delete one tag, re-run the lint. It should fail on the specific line.

## Step 4 — See a blocked branch (1 minute of reading)

```bash
cat runs/demo_run/branches/a/WORKSHOP_NOT_RECOMMENDED.md
```

Branch A of the demo run got blocked. The report names `legibility.no_failure_signal` at -2 with the quoted evidence span from the prototype spec. Toward the end, a "What would unblock this branch" section names specifically which findings would need to be removed or re-scored. The closing `[HUMAN_REQUIRED]` block asks the researcher to confirm the pattern fired correctly before redesigning.

## Step 5 — Read the surviving guidebook (3-5 minutes)

Open the PDF report in your viewer of choice:

```bash
open runs/demo_run/PROBE_REPORT.pdf   # macOS
# or xdg-open on Linux
```

The report bundles the guidebook, reviewer panel, audit findings, blocked-branch reports, lint status, cost log, and the managed-agent deep audit into one file. Newsreader serif body, Inter headings, warm off-white background. 14 pages.

If you want to see the raw guidebook:

```bash
bat runs/demo_run/PROBE_GUIDEBOOK.md  # or `less`
```

Look for the three reviewer findings pulled into the Risks section — they ARE the guidebook's risk register, not commentary attached to it.

## Step 6 — See the Opus-vs-Sonnet ablation (2 minutes)

```bash
open benchmarks/model_ablation_methodologist.md
# or
bat benchmarks/model_ablation_methodologist.md
```

Skim the "Decisive weakness" section. Both models caught the announcement-duration confound. Sonnet was harsher (reject), Opus was more precise (quantified the 4-5× duration diff). This is the result that *tempered* the paper's original Opus-unique claim — honest finding against our own hypothesis.

## Step 7 — Optional: run the full pipeline on a new premise ($5-10, ~25 min)

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
npx probe run "your rough research premise here" --no-novelty
```

Watch the per-stage spinner, the colored branch glyphs, and the pipeline banner lighting up. When done, render the report:

```bash
npx probe render <run_id>
```

## Step 8 — Optional: the Managed Agents deep audit (~$1, ~3 min)

```bash
npx probe audit-deep demo_run b
```

Spawns a Claude Managed Agent with bash/grep/file tools inside a managed cloud container. Watch the tool-call feed: it writes the branch artifacts to `/workspace/branch/`, then greps and measures — e.g., the literal character and word counts of the AI vs human stimulus strings, the Friedman-test minimum detectable effect size at n=8. Produces `deep_audit.md` alongside the shallow audit.

## Step 9 — The paper

```bash
open paper/probe.pdf
```

15-page arXiv paper. Section structure: abstract, introduction, related work (four clusters), system description, demo case study, evaluation (ablation + hallucination test + second-domain benchmark + deep audit), discussion, limitations, conclusion. 27 verified bibliography entries.

If the PDF is stale, rebuild:

```bash
npx probe build-paper
```

## What the demo is trying to prove

Three specific claims a skeptical reader should be able to verify in this walk-through:

1. **The linter is real infrastructure, not a marketing phrase.** Steps 3 and (try to break it) 3b. If you remove a tag, the lint fails on that exact line.

2. **The capture-risk audit fires on evidence, not vibes.** Step 4. Every blocking finding in `WORKSHOP_NOT_RECOMMENDED.md` has a quoted evidence span from the prototype spec.

3. **Probe's self-reporting on capability claims is corrigible.** Step 6. The ablation found Sonnet substantively capable where the project's initial plan routed only Opus; the paper was rewritten to say so, and the commit history shows the correction.

## If something doesn't work

- `probe runs` shows "no runs": you're in the wrong directory. `cd /Users/apolotary/Documents/Github/probe-researcher`.
- `probe lint` can't find the file: check `runs/demo_run/PROBE_GUIDEBOOK.md` exists. If not, re-check-out the git state — it's committed.
- `probe render` produces only `.md` (no PDF): pandoc or wkhtmltopdf is not on PATH. `brew install pandoc wkhtmltopdf` on macOS.
- `probe run` hits an Anthropic error: check `ANTHROPIC_API_KEY` is set and valid.

## Timing budget

If you have 10 minutes: steps 1–6.
If you have 20 minutes: add step 7 (fresh run) or step 8 (deep audit).
If you have 45 minutes: read the paper (step 9) alongside the demo.
