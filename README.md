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

# Run a premise end-to-end
npx probe run "your research premise here"

# Replay the pre-recorded demo run
npx probe replay demo_run

# Lint a guidebook
npx probe lint runs/<run_id>/PROBE_GUIDEBOOK.md
```

A pre-populated `runs/demo_run/` ships with the repo so you can browse a full pipeline without running anything.

## Architecture

```
probe/
├── cli/                 # probe init | run | replay | lint
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

*(populated as runs complete; see [`benchmarks/`](./benchmarks) for premise cards)*

Each benchmark run is scored on:

- Branch divergence (0–4)
- Citation hygiene (pass/fail)
- Prototype specificity (0–3)
- Audit specificity (0–3)
- Reviewer usefulness (0–3)
- Provenance lint (pass/fail)
- Forbidden-phrase lint (pass/fail)

A benchmark passes only if **citation hygiene + provenance lint + forbidden-phrase lint** all pass.

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

## License

Apache 2.0 — see [`LICENSE`](./LICENSE).

## Author

Bektur Ryskeldiev — HCI / accessibility research.
