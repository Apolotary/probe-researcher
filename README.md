# Probe

**Probe is a research-design triage tool for screen-based interactive research.** Give it a rough study premise; it returns three divergent research programs — each specified, simulated, audited for capture risk, and adversarially reviewed — so you can discover weak premises in an afternoon instead of six months.

> *Rehearsal stage for research. The performance still needs humans.*

Built for the [Cerebral Valley Claude Opus 4.7 hackathon](https://cerebralvalley.ai/), April 22–27 2026.

---

## What it does

You type:

```bash
probe run "design a screen-reader-aware checkout flow for BLV users"
```

Probe spawns three git worktrees — three divergent research programs — and runs each through an 8-stage pipeline:

1. **Premise interrogation** — a senior-PI voice pushes back on the premise
2. **Solution ideation** — three branches that differ on research question, intervention primitive, human-system relationship, and method family
3. **Literature grounding** — constrained to a hand-curated corpus (no hallucinated citations)
4. **Prototype specification** — a Wizard-of-Oz spec another researcher could build from
5. **Simulated walkthrough** — a structured rehearsal, tagged `[SIMULATION_REHEARSAL]` (not evidence)
6. **Capture-risk audit** — 16 named patterns across Capacity / Agency / Exit / Legibility, firing against quoted evidence spans
7. **Adversarial review** — methodologist, accessibility advocate, (optionally) novelty hawk, and meta-reviewer
8. **Guidebook assembly** — a six-section study guidebook where every paragraph, bullet, and table row carries a provenance tag

Surviving branches produce `PROBE_GUIDEBOOK.md`. Blocked branches produce `WORKSHOP_NOT_RECOMMENDED.md`.

A provenance linter fails the build if any element is unlabeled or if a `[SIMULATION_REHEARSAL]` element uses evidence language.

## Quick start

Requires Node 20+ and `git` on PATH. Uses the Anthropic API — set `ANTHROPIC_API_KEY`.

```bash
git clone https://github.com/Apolotary/probe-researcher.git
cd probe-researcher
npm install
npm run build

export ANTHROPIC_API_KEY="sk-ant-..."

# Run a premise end-to-end (~25 min, ~$6 API credit)
npx probe run "your research premise here"

# Inspect and diagnose
npx probe runs                          # Linear-style list of all runs
npx probe gantt <run_id>                # per-run stage × branch timeline
npx probe lint runs/<run_id>/PROBE_GUIDEBOOK.md
npx probe replay <run_id>               # deterministic artifact replay (no API calls)

# Render a report or paper
npx probe render <run_id>               # PDF/HTML/markdown bundle of the run
npx probe panel <run_id> <branch>       # reviewer-disagreement HTML panel
npx probe build-paper                   # build paper/probe.{html,pdf}

# Explore and extend (Managed Agents features)
npx probe explore <run_id>              # Ink 3-pane worktree-style UI
npx probe audit-deep <run_id> <branch>  # tool-equipped deep audit (bash/grep/file)
npx probe interview <run_id>            # simulated participant interview
npx probe symposium <run_id>...         # N-run convener report
```

A pre-populated `runs/demo_run/` ships with the repo so you can browse a full pipeline without running anything. See [`DEMO_WALKTHROUGH.md`](./DEMO_WALKTHROUGH.md) for a 10-minute tour that uses only shipped artifacts.

## Architecture

```
probe/
├── cli/                 # probe run | runs | gantt | render | lint | audit-deep | interview | symposium | explore
├── agents/              # system prompts, one per stage
├── corpus/source_cards/ # hand-curated literature, verifiable DOIs only
├── patterns/            # 16 capture-risk patterns (4 axes × 4 each)
├── schemas/             # JSON schemas for every stage boundary
├── src/                 # orchestrator, linters, anthropic client
├── benchmarks/          # premise cards for evaluation harness
├── runs/demo_run/       # pre-populated deterministic run
└── demo/                # storyboard, script, recorded run
```

Each branch runs in a real `git worktree` — `git log --graph --all` on a completed run shows the research process as structured commits.

## Model routing

Probe uses Claude **Opus 4.7** for stages that need skeptical judgment, vision, sustained adversarial stance, or long-context synthesis with provenance constraints. Non-critical stages (literature grounding, prototype templating) route to **Sonnet 4.6** to preserve budget. See [`CLAUDE.md`](./CLAUDE.md) for the full routing table.

## Benchmarks

Three benchmark runs ship with the repo, each on a different research domain. `npx probe runs` lists them:

| Run | Domain | Verdict |
|---|---|---|
| `demo_run` | BLV screen-reader + AI-generated news | 1 surviving (branch B), 2 blocked |
| `benchmark_code_review` | AI-assisted code review for engineers | 0 surviving, 2 blocked, 1 infra-failed |
| `benchmark_creativity_support` | creativity-support tool for poets | 1 surviving (branch A), 0 blocked |

The three domains expose different parts of the pattern library. The code-review domain fires `legibility.no_failure_signal` and `legibility.opaque_ranking` heavily; the accessibility domain fires agency and legibility patterns; the creativity-support domain fires almost no capture-risk patterns at all (a useful signal that the pattern library may need a `capacity.narrows_expressive_range` pattern for creative tools — see [`docs/V2_ROADMAP.md`](./docs/V2_ROADMAP.md)).

Each run has a `PROBE_REPORT.pdf` produced by `probe render` that bundles the guidebook, reviewer panel, audit findings, and lint status for offline review. The `benchmarks/` directory has the Opus-vs-Sonnet ablation on the methodologist reviewer (`model_ablation_methodologist.md`) and the hallucination test with a planted fake citation (`hallucination_test.md`).

A benchmark passes only if **citation hygiene + provenance lint + forbidden-phrase lint** all pass. All three shipped runs pass these checks on their surviving branches.

## Limitations

**Probe does not replace real user research.** It triages design directions before participants are ever recruited.

- **Simulation is rehearsal, not evidence.** The walkthroughs are structured guesses about what a user *might* encounter. They are explicitly tagged `[SIMULATION_REHEARSAL]` and the linter fails the build if they use evidence language.
- **Scope: screen-capturable digital interactions.** Out of scope: ethnographic fieldwork, long-term in-the-wild deployment, embodied AR/VR without screen capture, any research without a capturable digital artifact.
- **Vision quality depends on Opus 4.7.** Mode B screenshot walkthrough inherits the model's limitations in interpreting dense UI state.
- **Nothing here is findings.** If a human-facing artifact ever says `users preferred` or `findings show`, the linter failed and the build is broken.

## Research context

See [`RESEARCH_CONTEXT.md`](./RESEARCH_CONTEXT.md) for the theoretical grounding (Sanders & Stappers probes framework, Buijsman et al. autonomy-by-design, Illich's conviviality, Kafer's political/relational model of disability) and full bibliography with verified DOIs.

## Extending

See [`CLAUDE.md`](./CLAUDE.md) for:
- Commit discipline (`stage-N [branch-X]: <summary>`)
- How to add source cards, capture-risk patterns, agent prompts
- The non-negotiable commitments

## Citing this work

If you use Probe in research, teaching, derivative software, or a paper, **please cite it**. This is the one thing the author asks in exchange for open-sourcing the code.

The preferred citation is the arXiv paper that documents the system in depth:

```bibtex
@article{ryskeldiev2026probe,
  title   = {Probe: Rehearsal-Stage Triage for Screen-Based Interactive Research},
  author  = {Ryskeldiev, Bektur},
  year    = {2026},
  journal = {arXiv preprint},
  note    = {Built at the Cerebral Valley Claude Opus 4.7 hackathon}
}
```

A machine-readable citation is available in [`CITATION.cff`](./CITATION.cff) — GitHub will render a "Cite this repository" button from it automatically.

If you modify Probe and ship a derivative, the Apache 2.0 license already requires you to (1) include the [`LICENSE`](./LICENSE) file, (2) preserve the [`NOTICE`](./NOTICE) file and its contents in any derivative works, and (3) state prominent changes. See the [Apache 2.0 attribution terms](https://www.apache.org/licenses/LICENSE-2.0#redistribution). The CITATION.cff file makes the additional expectation explicit: if you publish or demo the derivative, cite the paper.

## License

Apache 2.0 — see [`LICENSE`](./LICENSE) and [`NOTICE`](./NOTICE). Attribution is required under the license terms; see the [Citing this work](#citing-this-work) section above for the preferred citation.

## Author

Bektur Ryskeldiev — HCI / accessibility research.
