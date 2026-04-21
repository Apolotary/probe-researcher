# Stage runners

Each stage is a standalone module. Inputs come from files on disk, outputs go
to files on disk. No shared conversation state.

| Stage | Status | File |
|-------|--------|------|
| 1 premise | implemented | `stage1_premise.ts` |
| 2 ideator | implemented | `stage2_ideator.ts` |
| 3 literature | stub (Day 1 hour 9-13) | — |
| 4 prototype | stub (Day 1 hour 9-13) | — |
| 5 simulator | stub (Day 2 hour 24-32) | — |
| 6 audit | stub (Day 2 hour 24-32) | — |
| 7a methodologist | stub (Day 3 hour 48-56) | — |
| 7b accessibility | stub (Day 3 hour 48-56) | — |
| 7c novelty (stretch) | stub | — |
| 7d meta | stub (Day 3 hour 48-56) | — |
| 8 guidebook | stub (Day 4 hour 72-80) | — |

## Contract each runner honors

1. Accept a structured args object; never read from globals
2. Read all inputs via the paths helpers in `src/util/paths.ts`
3. Call Anthropic via `src/anthropic/client.ts` — this logs cost and routes model
4. Validate output against the matching schema in `schemas/`
5. Run a repair pass on first failure; throw on second failure
6. Write output to the canonical path with the `provenance` field populated
7. Never write outside `runs/<run_id>/` or `runs/<run_id>/branches/<id>/`

## Parallelism

Stages 3–7 run per-branch and SHOULD run in parallel via `Promise.all`. Stages
1, 2, 8 are single-branch or orchestrator-level and run serially. Each per-
branch stage writes `DONE.marker` on success and `FAILED.marker` on failure so
a parallel wait loop can report status.
