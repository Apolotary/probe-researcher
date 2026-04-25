# Probe Fix Handoff For Coding Agent

This file is a fix-oriented follow-up to the repository review. It is written for a coding agent that will make source changes. The priority is to repair behavioral gaps that passed the current test suite but can break the CLI, provenance guarantees, or imported-run workflow.

Do not treat this as a rewrite request. Keep changes narrow, add focused tests, and avoid changing generated benchmark artifacts unless a test fixture needs them.

## Current Verification Baseline

These commands passed before this handoff was written:

```bash
npm run typecheck
npm test
npm run lint
npm run build
node dist/cli/index.js doctor --once
```

`doctor --once` reported one warning for the dirty working tree. That warning is expected in the current workspace.

## Fix 1: Make `probe import` Emit Schema-Compatible Artifacts

Priority: High

Problem:

`probe import` says it emits stage-compatible artifacts, and the CLI tells users to run:

```bash
probe run --run-id <id> --skip 1,2,3,4,5 "<premise>"
```

But the synthetic JSON files written by `src/cli/import_paper.ts` do not conform to the canonical schemas:

- `runs/<id>/premise_card.json` does not match `schemas/premise_card.schema.json`.
- `runs/<id>/branches/a/branch_card.json` does not match `schemas/branch_card.schema.json`.
- `runs/<id>/branches/a/prototype_spec.json` does not match `schemas/prototype_spec.schema.json`.

Relevant code:

- `src/cli/import_paper.ts`, especially `writeSyntheticStageArtifacts`
- `schemas/premise_card.schema.json`
- `schemas/branch_card.schema.json`
- `schemas/prototype_spec.schema.json`
- `src/schema/validate.ts`

Recommended fix:

Update `writeSyntheticStageArtifacts` so every synthetic artifact validates against the same schema as the real pipeline output.

For `premise_card.json`, use the required fields:

- `stage: "1_premise"`
- `schema_version: "1.0.0"`
- `run_id`
- `raw_premise`
- `sharpest_question`
- `claim`
- `differentia`
- `nearest_template`
- `missing_evidence`
- `sharpened_options`
- `provenance: { raw_premise: "RESEARCHER_INPUT", analysis: "AGENT_INFERENCE" }`

For `branch_card.json`, use the required fields:

- `stage: "2_ideator"` or `"3_literature"` if you decide imported grounding is already populated
- `schema_version: "1.0.0"`
- `run_id`
- `branch_id: "a"`
- `research_question`
- `intervention_primitive`
- `human_system_relationship` using one of the schema enums
- `method_family` using one of the schema enums
- `one_sentence_claim`
- `why_divergent`
- `grounding: []`
- `provenance: { ideation: "AGENT_INFERENCE", grounding: "SOURCE_CARD" }`

For `prototype_spec.json`, either synthesize a minimal valid Wizard-of-Oz spec or introduce a separate explicit imported-draft schema and update all downstream consumers to understand it. The lower-risk path is to synthesize a conservative valid `prototype_spec`:

- `actors`: include at least participant and facilitator or observer.
- `context`: use inferred method text, conservative device/setting defaults, and a defensible duration.
- `task_flow`: at least three steps derived from imported method/prototype sections.
- `wizard_controls`: at least one imported/manual control.
- `observable_signals`: at least two signals, using enum values from the schema.
- `failure_cases`: at least two cases, pulling from limitations when available.
- `materials_needed`: at least one item.
- `provenance: { specification: "AGENT_INFERENCE" }`

After writing each artifact, call `validateAgainst` in `import_paper.ts` before the command reports success. If any synthetic artifact fails validation, fail the import with a clear message naming the artifact and schema errors.

Tests to add:

- A unit test that builds a small imported manifest and asserts the generated `premise_card.json`, `branch_card.json`, and `prototype_spec.json` pass `validateAgainst`.
- If the helper is currently private, extract the artifact-building logic into testable pure functions or export a narrow internal helper.
- A regression test that `probe import` no longer emits free-text enum values for `human_system_relationship` and `method_family`.

Acceptance criteria:

```bash
npm test
npm run typecheck
```

Also verify manually or via test:

```bash
node --input-type=module -e "import { validateAgainst } from './dist/schema/validate.js'; /* validate representative imported artifacts */"
```

## Fix 2: Make CLI Provenance Lint Validate Real Source Card IDs

Priority: High

Problem:

`checkProvenance` can validate `[SOURCE_CARD:id]` only when `knownSourceCards` is passed. The CLI path does not pass it:

- `src/cli/lint.ts`

As a result, this currently passes:

```markdown
Bad citation. [SOURCE_CARD:not_real]

Handoff. [HUMAN_REQUIRED]
```

That weakens the central provenance claim.

Related paths:

- `src/cli/lint.ts`
- `src/cli/doctor.ts`
- `src/cli/stats.ts`
- `src/orchestrator/stages/stage8_guidebook.ts`
- `src/lint/provenance.ts`
- `src/util/paths.ts`

Recommended fix:

Create a small shared helper for loading known source card IDs, for example:

```ts
// src/lint/source_cards.ts
export async function loadKnownSourceCardIds(): Promise<string[]> {
  const entries = await fs.readdir(sourceCardDir());
  return entries.filter((e) => e.endsWith('.yaml')).map((e) => e.replace(/\.yaml$/, ''));
}
```

Use that helper in:

- `lintCommand`
- `doctor` guidebook checks
- `stats` guidebook checks
- `stage8_guidebook` instead of its local `loadKnownCardIds`

Make `probe lint` validate corpus IDs by default. If there is a use case for linting external markdown without the repo corpus, add an explicit opt-out like `--no-source-card-check`; do not silently skip validation.

Tests to add:

- CLI-level or function-level test showing `[SOURCE_CARD:not_real]` fails under `lintCommand`.
- Test showing `[UNCITED_ADJACENT]`, `[IMPORTED_DRAFT:method]`, and other non-source tags do not require corpus IDs.
- Test that `doctor` or the lower-level guidebook checker fails a guidebook with an unknown source card. If exposing `checkGuidebooks` is too invasive, cover this through the shared linter helper and one CLI test.

Acceptance criteria:

```bash
npm test
npm run typecheck
node dist/cli/index.js lint runs/demo_run/PROBE_GUIDEBOOK.md
```

The following should fail after the fix:

```bash
tmp="$(mktemp)"
printf 'Bad citation. [SOURCE_CARD:not_real]\n\nHandoff. [HUMAN_REQUIRED]\n' > "$tmp"
node dist/cli/index.js lint "$tmp"
```

## Fix 3: Correct Provenance Suffix Parsing And Strict-Inference Inline IDs

Priority: Medium

Problem A:

`src/lint/provenance.ts` treats every final `:id` suffix as a source-card ID:

```ts
const idMatch = mEnd[0].match(/:([a-z0-9_-]+)\]/);
if (idMatch?.[1]) {
  sourceCardsReferenced.push(idMatch[1]);
  if (opts.knownSourceCards && !opts.knownSourceCards.includes(idMatch[1])) {
    violations.push(`SOURCE_CARD references unknown id: "${idMatch[1]}"`);
  }
}
```

That is wrong for tags like:

- `[IMPORTED_DRAFT:method]`
- `[UNCITED_ADJACENT:jakesch]` if ever used
- any future non-source typed tag

Problem B:

Strict inference accepts any inline `[SOURCE_CARD:id]` inside an `[AGENT_INFERENCE]` paragraph, but does not validate that inline ID against `knownSourceCards`.

Recommended fix:

Update the tag regex to capture both the tag and suffix separately. Only validate and record source-card references when the tag is `SOURCE_CARD`.

For strict inference:

- Find inline `[SOURCE_CARD:id]` references before the final provenance tag.
- Validate each inline ID against `knownSourceCards` when provided.
- Add inline IDs to `sourceCardsReferenced`.
- Let an inline source card satisfy strict inference only if it is syntactically present and, when a known list is supplied, known.

Suggested shape:

```ts
const FINAL_TAG_RE = new RegExp(`\\[(${VALID_TAGS.join('|')})(?::([a-z0-9_-]+))?\\]\\s*$`);
```

Then:

```ts
const tag = mEnd[1] as ProvenanceTag;
const suffix = mEnd[2];

if (tag === 'SOURCE_CARD') {
  if (!suffix) violations.push('SOURCE_CARD tag missing id');
  else validateSourceCardId(suffix);
}
```

Consider enforcing `SOURCE_CARD` must have an ID. Currently `[SOURCE_CARD]` is syntactically accepted. If existing shipped guidebooks rely on bare `[SOURCE_CARD]`, either repair them or keep bare tags as a warning-level issue only. The stronger design is to require IDs.

Tests to add:

- `[IMPORTED_DRAFT:method]` passes when `knownSourceCards` is supplied.
- `[IMPORTED_DRAFT:method]` increments `IMPORTED_DRAFT` but does not appear in `sourceCardsReferenced`.
- Final `[SOURCE_CARD:not_real]` fails with known cards.
- Inline `[SOURCE_CARD:not_real] ... [AGENT_INFERENCE]` fails under `strictInference` with known cards.
- Inline `[SOURCE_CARD:real_card] ... [AGENT_INFERENCE]` passes and records `real_card`.

Acceptance criteria:

```bash
npm test
npm run typecheck
```

## Fix 4: Make The Interactive Menu Dispatch Reliably

Priority: Medium

Problem:

The no-argument interactive menu shells out to `probe` by name:

- `src/cli/interactive.tsx`

This is brittle when running from source with:

```bash
npm run probe
node dist/cli/index.js
tsx src/cli/index.ts
```

If `probe` is not globally linked or installed on `PATH`, subcommands fail. Current catch blocks suppress most failures, so the menu can appear to do nothing.

There is also a smaller issue: the menu dispatches doctor as `['doctor']`, but doctor now blocks by default until Ctrl+C. That prevents returning naturally to the menu.

Recommended fix:

Avoid shelling out to `probe` by name. Prefer one of these options:

1. Dispatch the current executable and current entrypoint:

```ts
execFileSync(process.execPath, [process.argv[1], ...args], { stdio: 'inherit' });
```

2. Or call command functions directly from the menu for simple commands. This avoids process spawning but may require more cleanup around command state.

Use option 1 unless there is a clear reason not to.

Also change the doctor menu entry to:

```ts
dispatch: { kind: 'subcommand', argv: ['doctor', '--once'] }
```

Do not swallow subcommand errors completely. At minimum, print the command and exit status/message before returning to the menu.

Tests to add:

- Unit test `buildMenu` or a small exported helper to assert doctor dispatch includes `--once`.
- Unit test for a helper that builds the child process command, confirming it uses `process.execPath` and `process.argv[1]` rather than literal `probe`.

Acceptance criteria:

Run from source:

```bash
npm run probe
```

Choose an offline command such as runs/stats/doctor. It should execute and return to the menu without requiring a global `probe` binary.

## Fix 5: Preserve Branch State When Quitting `run --step` After Stage 2

Priority: Low

Problem:

In `src/orchestrator/pipeline.ts`, branch IDs are known after Stage 2, but `states` is populated after the Stage 2 step pause. If the user chooses quit at that pause, `userQuit` receives an empty state map and writes an incomplete `run_summary.json`.

Relevant lines:

- `branchIdsForPause = branchIds`
- `if (!(await step('2_ideator'))) return userQuit(runId, states, stageStates);`
- `states = new Map(...)`

Recommended fix:

Populate `states` immediately after Stage 2 succeeds and before the step pause:

```ts
branchIdsForPause = branchIds;
states = makeInitialBranchStates(branchIds);
if (!(await step('2_ideator'))) return userQuit(runId, states, stageStates);
```

Then skip reinitializing `states` later if it is already populated. A small helper makes this less error-prone:

```ts
function initialBranchStates(branchIds: string[]): Map<string, BranchState> {
  return new Map(branchIds.map((id) => [id, { branchId: id, status: 'in_progress' }]));
}
```

Tests to add:

- If `pauseBetweenStages` is mockable, test `runPipeline({ stepMode: true })` with a quit response after Stage 2 and assert `run_summary.json` includes branches `a`, `b`, and `c` as `in_progress`.
- If not easily mockable, extract the initialization logic and cover it with a focused unit test, then add a TODO for integration coverage.

Acceptance criteria:

```bash
npm test
npm run typecheck
```

Manual behavior: quitting after Stage 2 in `--step` mode should leave a summary that reflects the generated branches.

## Suggested Implementation Order

1. Fix provenance source-card validation (`Fix 2` and `Fix 3`) first. These are small, central, and easy to test.
2. Fix `probe import` artifact schemas next. This is the largest behavioral gap and should not be mixed with linter changes.
3. Fix interactive menu dispatch.
4. Fix `run --step` quit state.

## Final Verification Before Handing Back

Run:

```bash
npm run typecheck
npm test
npm run lint
npm run build
node dist/cli/index.js doctor --once
```

Then run these targeted smoke checks:

```bash
# Unknown source cards should fail.
tmp="$(mktemp)"
printf 'Bad citation. [SOURCE_CARD:not_real]\n\nHandoff. [HUMAN_REQUIRED]\n' > "$tmp"
! node dist/cli/index.js lint "$tmp"

# Imported draft subtypes should not be treated as source-card IDs.
tmp="$(mktemp)"
printf 'Imported method text. [IMPORTED_DRAFT:method]\n\nHandoff. [HUMAN_REQUIRED]\n' > "$tmp"
node dist/cli/index.js lint "$tmp"

# Existing shipped guidebook should still pass.
node dist/cli/index.js lint runs/demo_run/PROBE_GUIDEBOOK.md
```

If any shipped guidebook now fails because it uses bare `[SOURCE_CARD]` or a bad card ID, fix the artifact or decide explicitly whether bare `SOURCE_CARD` remains allowed. Do not silently weaken the linter.
