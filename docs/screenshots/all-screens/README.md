# Probe web app — all screens (1440×900 @ 2x)

Captured `2026-04-26` against the bundled `focus-rituals` demo via headless Chrome (`walk-all.mjs` in repo root). Each PNG is a single state of the new-project workflow plus the supporting routes.

## Index

| # | File | Stage | Notes |
|---|------|-------|-------|
| 01 | `01-home.png` | Home / launcher | sidebar + 3-column suggestion grid |
| 02 | `02-replay-picker.png` | `/ui/replay` | demo recordings picker, speed selector |
| 03 | `03-new-project-premise.png` | `/ui/new` | premise screen (empty), 3-column suggestions |
| 04 | `04-new-project-filled.png` | `/ui/new` | premise textarea filled |
| 05 | `05-brainstorm.png` | Stage 1 — Brainstorm | three sub-RQs revealed (replay) |
| 06 | `06-literature.png` | Stage 2 — Literature | per-RQ SOA + your-notes |
| 07 | `07-methodology.png` | Stage 3 — Methodology | three integrated designs |
| 08 | `08-methodology-design-picked.png` | Stage 3 — Methodology | one design expanded + plan drafted |
| 09 | `09-artifacts-list.png` | Stage 4 — Artifacts | five collapsed artifact cards |
| 10 | `10-artifacts-open.png` | Stage 4 — Artifacts | impl-plan card expanded with markdown body |
| 11 | `11-evaluation-config.png` | Stage 5 — Pre-mortem | N-slider + cost estimate (config phase) |
| 12 | `12-evaluation-done.png` | Stage 5 — Pre-mortem | simulated personas + risks (done phase) |
| 13 | `13-report.png` | Stage 6 — Report | title + discussion-shaped + conclusion-shaped + exports |
| 14 | `14-review.png` | Stage 7 — Review | 1AC meta-review + disagreement audit |
| 15 | `15-config.png` | `/ui/config` | API keys / models / budget / appearance |
| 16 | `16-project-page.png` | `/ui/project` | project dashboard — stages tab |
| 17 | `17-project-timeline.png` | `/ui/project` | project dashboard — gantt timeline |

## Notes for an analysis agent

- **Provenance taxonomy.** Stages 5–6 surface per-paragraph provenance tags (`[SIMULATION_REHEARSAL]`, `[RESEARCHER_INPUT]`, etc.) via colored gutter strips. The "live · model output" / "placeholder · waiting for model" pill marks whether each section's text is real model output or stock placeholder.
- **Replay vs live.** Screens 5–14 were captured during a deterministic demo replay (cached payloads served from `assets/demos/focus-rituals.json`). The `replay · focus-rituals` chip in the top-right marks every stage.
- **iframe boundary.** `/ui` is the shell; `/ui/new`, `/ui/replay`, `/ui/config`, `/ui/project` are direct iframe-target pages. The shell embeds them via `<iframe>` — when running standalone (no shell), they render as the top-level page.
- **Visual consistency goal.** The home page (01) and the iframe new-project premise screen (03) intentionally share the same 3-column suggestion grid; this consistency was a recent fix.
