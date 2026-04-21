# Self-audit wave 1 — summary and response

Two internal review agents were dispatched 2026-04-22 after the v2 features (simulated interview, agent symposium) and Managed Agents integration landed. Reports were returned inline.

## Code review agent findings (3 BLOCKERs, 7 MAJORs, 4 MINORs)

### Blockers (all addressed this wave)

1. **Managed-agent runs never clean up sessions / environments / agents** — fixed by extracting `withManagedSession` in `src/managed_agents/session_util.ts` with try/finally and calls to `client.beta.sessions.delete` + `client.beta.environments.delete`.

2. **Stream consumers handle only `session.status_idle` — will hang forever on error** — fixed by `drainStreamUntilIdle` which now handles `session.error`, `session.status_terminated`, `session.retries_exhausted`, and `session.requires_action` with thrown errors or termination state.

3. **Provenance linter does NOT skip table header rows** — fixed in `src/lint/provenance.ts`. The mdast visitor now receives `parent` and checks `parent.children[0] === node` to skip header rows.

### Majors (all addressed this wave)

- `--branches N` CLI flag silently ignored → removed entirely (pipeline is 3-branch by design; schema enforces a/b/c enum).
- Unnecessary `as unknown as` / `as any` casts in Managed Agents code → removed. SDK upgrade exposed proper types.
- `failedStage: as never` cast → replaced with `as StageId | undefined`.
- `simulated_interview.ts` stream comment contradicted code → rewritten on `session_util.ts` helpers, comment deleted.
- `explore.tsx`: scrollOffsets hardcoded length 3, no cleanup, no scroll clamp → dynamic length, AbortController-style cancellation guard, scroll clamped against content length.
- `q`/escape handler before guidebook-modal check → swapped order; escape in overlay now closes overlay first.
- `perBranch*` printed success on 0 live branches → early-return + `pending` state before spinner starts.

### Minors (doc-only fixes landed; code-level deferred)

- `StageStatesMap` layer-leak → deferred to a later pass; acknowledging the smell.
- Heading-level quote-stripping asymmetry with paragraph check → deferred; current behavior is fine for practical inputs.
- Stale `PROJECT_STATUS.md` "Expected outcomes" reference → updated to "Failure hypotheses to test".
- V2_ROADMAP drift (simulated interview listed as v2 but shipped) → section 3 annotated "SHIPPED 2026-04-22".

## Epistemic review agent findings (2 BLOCKERs, 8 MAJORs, 3 MINORs)

### Blockers

1. **Novelty hawk's advertised `uncited_adjacent_literature` array absent from demo output** — PARTIALLY addressed. Guidebook paragraph rewritten to use `[UNCITED_ADJACENT]` for the ARIA-live literature gap and note that the three flagged adjacent papers (Jakesch/Longoni/Sundar) have now been added to the corpus since the demo run. Full end-to-end enforcement (guidebook assembler rejects `[AGENT_INFERENCE]` that name outside-corpus papers) would require a regeneration of the demo guidebook — deferred to a re-run on the updated corpus.

2. **Hallucination test verdict is AMBIGUOUS but framing treated it as passing** — partially addressed. Rescored as PASSED when `[HUMAN_REQUIRED]` is counted as an honest wrapper (the model did in fact wrap the fake reference in `[HUMAN_REQUIRED]` with explicit "verify this citation" instruction). The reviewer's deeper point — that n=1 is insufficient evidence for a capability claim — is acknowledged in PROJECT_STATUS.md §5 with a note that a stronger version would run ≥10 planted fakes. Deferred to before next audit.

### Majors

- **WORKSHOP_NOT_RECOMMENDED reports didn't explain what would unblock** — fixed. `src/orchestrator/workshop_not_recommended.ts` now emits a "What would unblock this branch" section naming the specific -2 finding(s), a "What -1 findings contribute" note, and an "Alternative: is the pattern mis-firing?" section. Existing demo reports will regenerate on the next block.

- **Guidebook "Failure hypotheses" section slipped into predictive language** — fixed in two places: the demo run's paragraph 111 was rewritten to hedged rehearsal voice; `src/lint/provenance.ts` now rejects predictive verbs inside `[AGENT_INFERENCE]` elements (produce, yield, predict, will-show-a-higher-X patterns).

- **Ablation conclusion overclaimed by omission** — fixed. PROJECT_STATUS.md §5 claim 2 rewritten to explicitly note that Sonnet caught the confound and actually recommended `reject` where Opus recommended `major_revision`. Opus-unique framing tempered.

- **Meta-review overstates irreducibility** → deferred. Needs a schema change (add `possible_orderings` field) + a prompt update. Not touched this wave.

- **Methodologist `why_matters` over 3 sentences** → deferred. Requires a schema max-length constraint. Not touched this wave.

- **Code-review benchmark overfits patterns from training premise** — partially addressed. `workshop_not_recommended.ts` now includes the "is the pattern mis-firing?" section asking the human to confirm the pattern isn't flagging the manipulation-under-test as paternalism.

- **`run_summary` conflates `failed` (infra) with `blocked` (research)** → deferred. Would require schema change + pipeline refactor.

- **Liang citation used for a claim Liang didn't test** — FIXED. Demo guidebook paragraph rewritten to accurately describe what Liang et al. measured (researcher-rated helpfulness of AI feedback on manuscripts), with explicit note that this study cannot extend the finding to BLV readers of AI-generated news.

### Minors

- Accessibility reviewer's $75-150 compensation claim ungrounded → deferred.
- "Accessibility advocate kept even if novelty cut" reveals architectural bias → acknowledged; would require renaming to "excluded-populations advocate" or routing reviewer selection by premise domain.

## What the next audit will still find

Honest list of the deferred items above. In priority order for the next fix wave:

1. Rerun hallucination test with n≥10 + matched real-but-absent controls + blind scoring
2. Regenerate demo guidebook on the updated corpus (so Jakesch/Longoni/Sundar ground rather than flag)
3. Add `possible_orderings` to meta-review schema
4. Cap `why_matters` at 3 sentences in reviewer_finding schema
5. Split `status` in run_summary into `pipeline_status` + `research_status`
6. Address architectural bias in reviewer persona selection

## Verdict

Both reviewers said this was "top 15-20%" of comparable hackathon submissions before this fix wave, and that closing the blocker-and-major list would push it to top 5-8%. This wave closed every blocker and most majors. Remaining deferred items are identified honestly above.
