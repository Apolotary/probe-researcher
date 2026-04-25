# Probe Code Review Report

Date: 2026-04-22 JST

Scope: local repository review only. I inspected the TypeScript orchestration, CLI surfaces, linters, schemas, source-card corpus handling, managed-agent integration, and shipped run artifacts. I did not edit source code.

## Executive Judgment

Probe is not in worse shape than the project description says, but several claims are currently stronger than the implementation. The highest-risk issues are not TypeScript correctness; typecheck and tests pass. The risks are demo-facing contract mismatches: default fresh runs likely fail schema validation, the provenance linter overclaims table-row and end-tag coverage, source-card validation checks IDs but not claim fidelity, `probe runs` misreports the flagship demo run, and `audit-deep` writes an unlinted conversation summary rather than a full local deep-audit artifact.

If judges only watch a curated video, the project will read as coherent. If they run the README commands, the rough edges are visible.

## Findings

### High: default `probe run` generates schema-invalid run IDs

`src/cli/run.ts:80-87` builds run IDs from `new Date().toISOString()` and preserves the uppercase `T`. The stage schemas require lowercase IDs with `^[a-z0-9_-]{3,64}$`, for example `schemas/premise_card.schema.json:24`, `schemas/branch_card.schema.json:28`, `schemas/prototype_spec.schema.json:26`, `schemas/audit.schema.json:22`, and `schemas/meta_review.schema.json:23`.

Impact: the README quick start uses `npx probe run "your research premise here"` without `--run-id`. A normal fresh run can hand Stage 1 a run ID that the model is instructed to echo, then fail schema validation for a self-inflicted ID format issue. Fix by lowercasing/sanitizing the timestamp, for example replacing `T` with `_`, or by relaxing the schema consistently. The better fix is to keep schema lowercase and make the generator conform.

### High: cost logging is race-prone under branch parallelism

`src/orchestrator/per_branch.ts:90-100` and `src/orchestrator/per_branch.ts:144-169` run per-branch stages in `Promise.all`. Every Anthropic call then writes to shared `runs/<id>/cost.json` through `appendCost` in `src/orchestrator/run_dir.ts:28-39`, which reads, mutates, and rewrites the whole file with no lock.

Impact: two branch calls finishing near each other can lose cost entries or totals. That undermines `probe gantt`, `probe runs`, total spend claims, and repair-pass counts. Use append-only JSONL plus derived totals, or serialize writes with a per-run mutex and recompute totals from entries.

### High: the provenance linter does not enforce the stated table-row or end-tag contract

`src/lint/provenance.ts:15-17` uses `remark-parse` without a GFM table plugin, but the visitor expects `tableRow` nodes at `src/lint/provenance.ts:144-150`. Standard pipe tables are parsed as paragraph text, so row-level enforcement is not happening. Separately, `TAG_RE` at `src/lint/provenance.ts:47` is not anchored, and `checkNode` accepts any tag anywhere in a node at `src/lint/provenance.ts:86-95`, even though prompts and docs say each element must end with a tag.

I confirmed this with a local smoke test: a markdown table with only one tagged cell and an entirely untagged second row passed `checkProvenance`; a paragraph beginning with `[AGENT_INFERENCE]` and continuing with untagged prose also passed. Add `remark-gfm`, add failing tests for untagged table rows, and require the last non-whitespace token of each checked element to be a valid provenance tag.

### High: source-card validation checks citation IDs, not claim fidelity

Stage 3 loads full source cards and prompts the model to use `allowed_claims`, but post-validation only checks that each `source_card` ID exists (`src/orchestrator/stages/stage3_literature.ts:48-61`). The guidebook linter similarly validates `[SOURCE_CARD:<id>]` against known IDs only (`src/lint/provenance.ts:97-102`; `src/orchestrator/stages/stage8_guidebook.ts:47-76`).

Impact: a model can attach a valid source-card ID to a claim that is not in that card's `allowed_claims`. In the demo branch card, `runs/demo_run/branches/b/branch_card.json:24-27` uses `liang_nejm_ai_2024` to support a broader "source identity shapes credibility judgments" inference, while the card's allowed claim at `corpus/source_cards/liang_nejm_ai_2024.yaml:35` only says 57.4% of researchers rated GPT-4 feedback helpful or very helpful. The hallucination test proves no fake source ID was minted; it does not prove source-card claim fidelity. A robust fix is to require `allowed_claim_id` or exact allowed-claim selection, then let prose paraphrase elsewhere under `[AGENT_INFERENCE]`.

### Medium: run status semantics are inconsistent and misreport the flagship run

`BranchState.status` only permits `in_progress | completed | blocked | failed` (`src/orchestrator/per_branch.ts:23-29`), and `writeRunSummary` persists states as-is (`src/orchestrator/pipeline.ts:268-273`). Current code never marks surviving branches completed before writing the summary. The shipped summaries are inconsistent: `runs/benchmark_creativity_support/run_summary.json:4-15` leaves all three branches `in_progress`, while `runs/demo_run/run_summary.json:11-16` uses `surviving`, which is not in the TypeScript status union.

Impact: `src/cli/runs.ts:190` counts only `completed` and `in_progress` as surviving. Running `node dist/cli/index.js runs` showed `demo_run` as "all 2 blocked" even though branch B has a guidebook and manifest. This is demo-visible and conflicts with `DEMO_WALKTHROUGH.md:22-28`. Define one terminal survivor state, update the type, pipeline summary, renderer, and shipped artifacts together.

### Medium: `audit-deep` stores a conversation summary, not the managed-agent file artifact

The deep-audit prompt tells the managed agent to write `/workspace/branch/deep_audit.md` (`src/managed_agents/deep_audit.ts:60-70`, `src/managed_agents/deep_audit.ts:113-120`), but the local command writes `drain.text` to `runs/<id>/branches/<branch>/deep_audit.md` (`src/managed_agents/deep_audit.ts:161-162`). The shipped `runs/demo_run/branches/b/deep_audit.md:1-12` is a short untagged summary, not the four-section tagged artifact requested in the system prompt.

Impact: this weakens the "Managed Agents produced a report" claim. The tool-call measurement itself is still valuable, but the local artifact does not satisfy the same provenance standard as the guidebook. Either retrieve the actual generated file from the managed environment, or require the agent to emit the full markdown as final text, then lint it for `[TOOL_VERIFIED]`, `[AGENT_INFERENCE]`, `[HUMAN_REQUIRED]`, and `[DO_NOT_CLAIM]`.

### Medium: `npm run lint` is broken

`package.json:25` advertises `eslint . --ext .ts`, and `package.json:57` installs ESLint 9. There is no `eslint.config.*` or `.eslintrc*` file. `npm run lint` fails immediately with ESLint's missing-config error. `probe doctor` passes because it does not run this script.

Impact: a reviewer running standard Node project checks will see a failed lint. Add an ESLint 9 flat config, pin ESLint 8, or remove/rename the script if the only intended lint is the custom provenance/voice linter.

### Low: `probe replay` is still a stub for most artifacts

`src/cli/replay.ts:29-42` lists globbed artifacts but prints "replay glob expansion pending" instead of expanding and replaying them. README quick start presents `npx probe replay <run_id>` as deterministic artifact replay (`README.md:49-53`).

Impact: not a core correctness bug, but it reads unfinished if a judge tries it. Either implement glob expansion or remove it from the primary quick start.

## Verification

- `npm run typecheck`: passed.
- `npm test`: passed, 29 tests across 3 files.
- `node dist/cli/index.js doctor`: passed all 11 checks.
- `node dist/cli/index.js lint runs/demo_run/PROBE_GUIDEBOOK.md`: passed.
- `node dist/cli/index.js lint runs/benchmark_creativity_support/PROBE_GUIDEBOOK.md`: passed.
- `npm run lint`: failed because ESLint 9 has no config file.
- `node dist/cli/index.js runs`: ran, but misreported `demo_run` as all blocked.
- Local linter smoke tests confirmed table-row and end-tag gaps described above.

## Advice on the Seven Open Questions

1. **Submission strategy:** target **Best use of Managed Agents**, but only after tightening the local `audit-deep` artifact. The 21-tool-call session and 3.67-second measured timing delta are the cleanest category-specific evidence because they show something a direct Messages API call could not do: inspect files and compute a quantity. The premise to fix is that the shipped local `deep_audit.md` is currently just a short untagged summary; make that artifact strong enough to open on camera.

2. **Ablation framing:** treat the Opus-vs-Sonnet ablation as a strength, but do not make it the main contribution. The right line is: "We ablated our own routing assumption; Sonnet caught the same confound, while Opus gave more precise evidence spans at higher cost." That makes the project more credible without turning the demo into a model-comparison paper.

3. **`[AGENT_INFERENCE]` escape hatch:** implement option **(a)** eventually: require every `[AGENT_INFERENCE]` element to name at least one preceding anchor. Do not do option (c) before submission; it is too disruptive. Option (d) is honest but leaves the main epistemic weakness untouched. The visible demo improvement would be modest unless the guidebook shows anchors inline, so this is second priority behind the linter and `audit-deep` artifact gaps.

4. **Hallucination evaluation:** keep the n=1 trial as illustrative only. The minimum defensible empirical claim is 10 planted fake references plus 10 real-but-absent controls, with blind scoring and predeclared pass/fail categories. With n=1, say "smoke test" or "illustrative check," not "evaluation demonstrates."

5. **Pattern library coverage:** do not add `capacity.narrows_expressive_range` before submission unless you also rerun the creativity benchmark. A new uncalibrated pattern could create a false-positive story right before judging. Leave the creativity-support observation as documented coverage evidence and frame it as a scoped limitation.

6. **First-figure decisions:** add a second figure if you can do it cheaply: a single capture-risk finding card with pattern ID, evidence quote, score, and orchestrator-computed verdict. That will make the audit concrete faster than another pipeline diagram or a provenance decision flow. One figure is acceptable, but two figures would help judges understand the strongest mechanism.

7. **Demo framing:** for a 3-minute video, show `doctor`, `gantt demo_run`, the reviewer panel for branch B, the managed-agent timing delta, and `probe lint` passing. Skip `probe runs` until the status bug is fixed, because it currently misreports `demo_run`. The story should be: health check, parallel pipeline shape, adversarial reviewer catches a confound, managed agent measures it, linter enforces the epistemic contract.

## Single Highest-Leverage Two-Hour Task

Fix the provenance linter to use GFM table parsing and enforce end-of-element tags, add the regression tests, and rerun `doctor`; that protects the project's most load-bearing claim.
