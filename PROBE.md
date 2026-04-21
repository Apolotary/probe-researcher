# PROBE.md — orchestration contract

Single-file specification of Probe's runtime behavior. Inspired by Karpathy's `autoresearch/program.md` and Feynman's `AGENTS.md`: one markdown file that tells a future developer (or LLM) everything they need to know about how the pipeline actually executes.

If the code disagrees with this file, update this file OR update the code — do not leave them out of sync.

## Commands

| Command | What it does |
|---|---|
| `probe run <premise>` | full 8-stage pipeline, $5-10 per run |
| `probe replay <run_id>` | deterministic replay of a recorded run, no Anthropic calls |
| `probe lint <file>` | provenance + forbidden-phrase linting on a markdown file |
| `probe init <run_id>` | scaffold an empty run directory |
| `probe explore <run_id>` | Ink-based 3-pane worktree-style UI for a completed run |
| `probe audit-deep <run_id> <branch>` | Managed Agents deep audit with bash/grep/file tools, ~$1 |
| `probe interview <run_id>` | Managed Agents simulated participant for interview rehearsal |
| `probe symposium <run_id>...` | convener report across N completed runs |
| `probe runs` | list view of every run in `runs/` with status, cost, duration, verdict |
| `probe gantt <run_id>` | per-run horizontal Gantt of stage × branch durations |
| `probe render <run_id>` | single-file PDF/HTML/markdown report bundling guidebook + reviews + audit + cost log |
| `probe build-paper` | build `paper/probe.{html,pdf}` via pandoc + wkhtmltopdf |

## Pipeline shape

```
  premise string
  ─────┬─────
       ▼
  [1 premise interrogation]  Opus 4.7  ── writes premise_card.json
       │
       ▼
  [2 solution ideation]       Opus 4.7  ── writes 3 branch_card.json + 3 git worktrees
       │
       ├─── branch a ──┐
       ├─── branch b ──┼── parallel via Promise.all, failure-isolated
       └─── branch c ──┘
              │
              ▼
         [3 literature]       Sonnet 4.6  ── grounding[] in branch_card.json
              │
              ▼
         [4 prototype]        Sonnet 4.6  ── prototype_spec.{json,md}
              │
              ▼
         [5 simulator]        Opus 4.7    ── simulated_walkthrough.md (every para [SIMULATION_REHEARSAL])
              │
              ▼
         [6 audit]            Opus 4.7    ── audit.json, verdict ∈ {PASSED, REVISION_REQUIRED, BLOCKED}
              │              ── BLOCKED → WORKSHOP_NOT_RECOMMENDED.md, branch stops here
              ▼
         [7a methodologist]   Opus 4.7
         [7b accessibility]   Opus 4.7    ── reviews/*.json
         [7c novelty]         Opus 4.7
         [7d meta]            Opus 4.7    ── meta_review.json, verdict ∈ {accept_revise, reject, human_judgment_required}
              │              ── reject → WORKSHOP_NOT_RECOMMENDED.md, branch stops here
              ▼
  [8 guidebook assembly]      Opus 4.7  ── PROBE_GUIDEBOOK.md (surviving branch only)
              │
              ▼
  final: lint PROBE_GUIDEBOOK.md; must pass provenance + forbidden-phrase linters
```

## File layout per run

```
runs/<run_id>/
├── premise.md                        researcher's raw input
├── premise_card.json                 Stage 1 output
├── cost.json                         cumulative per-call token + $ log
├── run_summary.json                  per-branch final status
├── PROBE_GUIDEBOOK.md                Stage 8 output (final artifact for surviving branch)
├── guidebook_manifest.json           machine-readable sidecar
├── DECISION_DIFF.md                  judge-facing "what Probe changed" (optional)
├── git_graph.txt                     snapshot of `git log --graph --all` for replay
├── managed_agents/
│   └── deep_audit_<branch>.json      session metadata if audit-deep was run
└── branches/
    ├── a/
    │   ├── branch_card.json          Stage 2 + 3 output
    │   ├── prototype_spec.{json,md}  Stage 4 output
    │   ├── simulated_walkthrough.md  Stage 5 output
    │   ├── audit.{json,md}           Stage 6 output
    │   ├── reviews/
    │   │   ├── methodologist.json    Stage 7a
    │   │   ├── accessibility.json    Stage 7b
    │   │   └── novelty.json          Stage 7c (optional)
    │   ├── meta_review.json          Stage 7d
    │   ├── deep_audit.md             audit-deep output (optional)
    │   └── WORKSHOP_NOT_RECOMMENDED.md   emitted iff branch was blocked
    ├── b/ ... (same structure)
    └── c/ ... (same structure)
```

## Per-stage contract

Every stage runner in `src/orchestrator/stages/stageN_*.ts` MUST:

1. Accept a typed args object; never read globals.
2. Read inputs via `src/util/paths.ts` helpers (`runDir`, `branchDir`, `agentPromptPath`, `schemaPath`).
3. Call Claude via `src/anthropic/client.ts` — this routes by model choice and logs cost.
4. Validate the parsed output against the matching schema in `schemas/`.
5. Run a single repair pass on first failure. On second failure, throw.
6. Write the validated output to the canonical path with a populated `provenance` field.
7. Never write outside `runs/<run_id>/` or `runs/<run_id>/branches/<id>/`.
8. For per-branch stages: structured commit to the branch's worktree with message `stage-N [branch-X]: <summary>`.

Stages that produce a string verdict (6 and 7d) cause the branch to be marked BLOCKED when the verdict is in the declared blocking-verdicts list; the orchestrator then emits `WORKSHOP_NOT_RECOMMENDED.md` and the branch stops progressing.

## Provenance discipline

Every paragraph, bullet, blockquote, list item, and table row in a generated guidebook MUST end with exactly one of:

| Tag | Meaning |
|---|---|
| `[RESEARCHER_INPUT]` | content from the researcher's original premise, verbatim or lightly restated |
| `[SOURCE_CARD:<id>]` | grounded in a specific source card. `<id>` must exist in `corpus/source_cards/` |
| `[SIMULATION_REHEARSAL]` | drawn from the simulated walkthrough. NOT evidence. |
| `[AGENT_INFERENCE]` | reasoning by an agent, not grounded in source or simulation |
| `[HUMAN_REQUIRED]` | explicit handoff. Document must have ≥1. |
| `[DO_NOT_CLAIM]` | content the guidebook explicitly marks as unclaimable |
| `[UNCITED_ADJACENT]` | reviewer-named outside-corpus literature the researcher must verify |
| `[TOOL_VERIFIED]` | measured by a Managed Agent via bash/grep/file tools (used only by audit-deep output) |

`src/lint/provenance.ts` enforces this. It also checks headings for evidence language — a heading like "Expected outcomes" or "Results" or "Findings" is rejected even if every paragraph below is correctly tagged.

## Forbidden phrases (voice discipline)

Probe's own voice (not inside `>` blockquotes or `"..."` quoted regions) must never use:

`users preferred`, `users said`, `participants found`, `participants reported`, `the study shows`, `findings show`, `significant(ly)`, `validated(s)`, `proved`, `demonstrated that`, `evidence suggests`, `data indicates`

The linter rejects any match in `probe lint <file>` voice mode.

## Cost model

As observed on the demo_run (2026-04-22):

| Per-stage | Model | Avg input | Avg output | Avg USD | Avg latency |
|---|---|---|---|---|---|
| 1 premise | Opus 4.7 | 1.3K | 1.2K | $0.04 | ~24s |
| 2 ideator | Opus 4.7 | 2.9K × 2 | 1.6K × 2 | $0.11 | ~25s |
| 3 literature × 3 | Sonnet 4.6 | ~6K | ~1K | $0.025 | ~14s |
| 4 prototype × 3 | Sonnet 4.6 | ~15K | ~3K | $0.10 | ~100s |
| 5 simulator × 3 | Opus 4.7 | ~15K | ~2K | $0.23 | ~85s |
| 6 audit × 3 | Opus 4.7 | ~30K | ~4K | $0.21 | ~65s |
| 7a/b/c × ~3 | Opus 4.7 | ~25K | ~3K | $0.18 | ~55s |
| 7d meta | Opus 4.7 | ~10K | ~1K | $0.08 | ~20s |
| 8 guidebook | Opus 4.7 | ~50K | ~6K | $0.35 | ~130s |
| **Total per run** | — | ~500K | ~170K | **$6** | ~25 min |

Opus 4.7 pricing: $5/MTok input, $25/MTok output.
Sonnet 4.6 pricing: $3/MTok input, $15/MTok output.
Temperature parameter is omitted on all calls (deprecated on Opus 4.7).

## Linter and test invariants

- `npx tsc --noEmit` must pass clean.
- `npx vitest run` must pass with ≥29 tests.
- `npx probe lint runs/demo_run/PROBE_GUIDEBOOK.md` must exit 0 (both provenance and voice pass).

If any invariant fails, DO NOT ship. The demo depends on these.

## Kill switch

The hour-14-of-Day-1 kill test (see `CLAUDE.md` § "Kill test"): if stages 1-4 on a known-cold premise fail any of the four criteria (branch divergence, citation hygiene, prototype specificity, useful surprise), pivot to HHD per `docs/HHD_FALLBACK.md`. Not optional.
