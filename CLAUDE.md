# CLAUDE.md — Probe project constraints

Any agent touching this repo reads this file first. Every constraint below is load-bearing; violating one breaks the project's core claim.

## What Probe is

Probe is a research-design triage tool for **screen-based interactive research**. A researcher enters a rough study premise; Probe turns it into three divergent research programs, runs each through prototype specification, simulated walkthrough, capture-risk audit, and adversarial review, then ships either a provenance-labeled study guidebook or a `WORKSHOP_NOT_RECOMMENDED.md` report.

**Core claim:** Probe does not replace user research. It helps researchers discover weak premises, capture risks, novelty failures, and inaccessible study designs before spending months building the wrong thing.

**Tagline:** *Rehearsal stage for research. The performance still needs humans.*

## Non-negotiable commitments

1. **Simulation is rehearsal, not evidence.** Nothing Probe produces is user data. Every output that could be mistaken for findings carries an explicit provenance tag.
2. **Provenance labels are enforced by a linter, not by convention.** Linter validates paragraphs, bullets, blockquotes, table rows, and list items — not just paragraphs. Provenance cannot leak through formatting.
3. **Scope: screen-based interactive research only.** Web/desktop/mobile UIs, accessibility, AI interaction, dashboards, code tools, creativity support. Not ethnography. Not long-term in-the-wild deployment. Not embodied AR field studies (as distinct from screen-captured interactions).
4. **No hallucinated citations.** Every reference points to a hand-curated source card in `corpus/source_cards/` with a verifiable DOI/URL.
5. **Demo is deterministic replay with live bookends.** Live open and close. Recorded middle. Never risk a live full pipeline on camera.

## Provenance tags (enforced by linter)

Every paragraph, bullet, blockquote, list item, and table row in `PROBE_GUIDEBOOK.md` MUST carry exactly one of:

- `[RESEARCHER_INPUT]` — content the user provided verbatim
- `[SOURCE_CARD:<id>]` — content grounded in a specific source card
- `[SIMULATION_REHEARSAL]` — output of the simulated walkthrough (NOT evidence)
- `[AGENT_INFERENCE]` — reasoning by an agent, not grounded in a source or simulation
- `[HUMAN_REQUIRED]` — explicit handoff point where a human must act
- `[DO_NOT_CLAIM]` — content the guidebook explicitly flags as unclaimable
- `[UNCITED_ADJACENT]` — named outside-corpus literature a reviewer surfaced; the researcher must verify before grounding
- `[TOOL_VERIFIED]` — claim measured by a Managed Agents tool-equipped session (bash, grep, file ops), used only by `probe audit-deep`

The linter fails the build on any missing tag.

## Forbidden language (enforced by `probe lint`)

Probe's own voice MUST NEVER use (outside of quoted context):

- "users preferred" / "users said"
- "participants found" / "participants reported"
- "the study shows" / "findings show"
- "significant" / "significantly"
- "validated" / "validates"
- "proved" / "demonstrated that"
- "evidence suggests" / "data indicates"

Inside `[SIMULATION_REHEARSAL]` paragraphs, required hedging:

- "A user encountering this would likely…"
- "This flow would likely produce friction because…"
- "A reader of this spec might reasonably expect…"

Never quote participant speech that was not actually spoken. Never write `"users said: …"` in a simulated walkthrough.

## Model routing

| Stage | Model | Rationale |
|---|---|---|
| 1 Premise interrogation | `claude-opus-4-7` | Skeptical research judgment |
| 2 Solution ideation | `claude-opus-4-7` | Divergence under four-axis constraints |
| 3 Literature grounding | `claude-sonnet-4-6` | Retrieval over small curated corpus |
| 4 Prototype specification | `claude-sonnet-4-6` | Structured template generation |
| 5 Simulated walkthrough | `claude-opus-4-7` | Vision + epistemic discipline |
| 6 Capture-risk audit | `claude-opus-4-7` | Normative reasoning with evidence spans |
| 7 Adversarial review | `claude-opus-4-7` | Sustained reject-stance under flattery pressure |
| 8 Guidebook assembly | `claude-opus-4-7` | Long-context synthesis with provenance constraints |

If budget tightens, only Stages 2 and 8 may route to Sonnet. Never downgrade Stages 5, 6, 7.

## Architecture commitments

- **Filesystem as state.** No shared conversation context between stages. Every stage reads inputs from files, writes outputs to files.
- **Real git worktrees.** Each branch directory is a real git worktree with its own commit history. `git log --graph --all` must show meaningful research-process history.
- **Structured schemas with repair passes.** Every agent output crossing a stage boundary validates against a JSON schema in `schemas/`. Schema violation triggers a repair pass; second failure fails the stage.
- **No prefilling.** Opus 4.7, Opus 4.6, Sonnet 4.6 do not support response prefilling. Use structured-output instructions in system prompts + schema validation + repair instead.
- **Orchestrator controls shared writes.** Branch agents write only to their branch directory. Only the orchestrator writes `runs/<id>/PROBE_GUIDEBOOK.md` and `runs/<id>/synthesis.md`.

## Commit discipline

Every commit touching a stage output uses this format:

```
stage-N [branch-X]: <one-line summary>
```

Examples:

```
stage-2 [branch-a]: ideator produced divergent research question
stage-6 [branch-b]: auditor fired agency.hides_options_before_review
stage-7 [branch-c]: methodologist blocked on IRB-inadequate consent flow
```

This makes `git log --graph --all` legible as research process, not file churn.

## Kill test (hour 14 of Day 1)

Run stages 1–4 on one known-cold premise. Pass criteria (ALL four):

1. Three branches differ on research question, intervention primitive, human-system relationship, method family
2. Every citation ID resolves to a `corpus/source_cards/<id>.yaml` file (zero hallucinated references)
3. Prototype spec is specific enough that a different researcher could build the WoZ without clarification
4. At least one branch surfaces an approach or failure mode the user hadn't already considered

Fail → pivot to HHD fallback (see `docs/HHD_FALLBACK.md` when written). Do not push through.

## Scope boundaries

**In scope:** web/desktop/mobile software interfaces, screen-reader and accessibility research, AI assistant/chat/coding interfaces, dashboards, creativity support tools, anything capturable as screenshots or screen-recorded video.

**Out of scope:** ethnographic fieldwork, long-term in-the-wild deployment, embodied AR/VR without screen capture, any research without a capturable digital artifact.

README must state these bounds explicitly.

## What is NOT up for negotiation

- Provenance linter ships and validates bullets, table rows, blockquotes — not just paragraphs
- Kill test runs at hour 14 of Day 1
- Forbidden-phrase guardrail is enforced
- Citations resolve to source cards — no hallucinated papers, ever
- Accessibility advocate reviewer persona is kept even if novelty hawk is cut
- Demo has live bookends
- `WORKSHOP_NOT_RECOMMENDED.md` emits on blocked branches

Everything else is engineering judgment in the moment.

## Extending Probe

New stages, patterns, source cards:

- Source cards: add YAML file in `corpus/source_cards/<id>.yaml`, fill all fields, verify DOI resolves before committing.
- Capture-risk patterns: add to `patterns/<axis>.yaml` with id, name, description, trigger_heuristic, evidence_template, default_score.
- Agent prompts: one file per agent in `agents/<stage>.md`. System prompt first, then output schema reference, then voice guardrails, then examples.

## `probe ui` — interactive workflow (separate from `probe run`)

`probe ui` is a complementary surface added to the project (commit `3698c0c`). It does **not** replace `probe run` and does **not** produce shipped guidebooks under `runs/`. It's a tutorial-style walkthrough designed in Claude Design that lets a researcher rehearse the 7-stage pipeline interactively before committing to a real run.

Architecture:

- `src/cli/ui_app.tsx` — top-level Ink router, scene state.
- `src/cli/ui_state.ts` — workflow state (premise, RQs, plan, artifacts, findings, review session) carried between scenes. Has both canned `make*` and live `live*` content generators; the live ones call `src/llm/probe_calls.ts`.
- `src/cli/ui_scenes/` — one .tsx per scene (startup / welcome / premise / brainstorm / literature / methodology / artifacts / evaluation / report / review / done / project / config). Each scene reads `state` and calls `setState` from props.
- `src/llm/probe_calls.ts` — pure async functions that hit the Anthropic SDK directly. No `runId`, no `cost.json` append (different posture from `src/anthropic/client.ts`, which is for the production pipeline).
- `src/web/probe_design/` — design files (HTML + JSX) shipped verbatim from Claude Design's handoff bundle. Each stage's component fetches `/api/probe/<stage>` for live content and falls back to its stock data on error.
- `src/web/probe_api.ts` — express endpoints that wrap `probe_calls.ts` for the web frontend.
- `src/config/probe_toml.ts` — read/write `~/.config/probe/probe.toml` (atomic, 0600 perms). Both surfaces share this file.

Pipeline order (fixed, do NOT renumber): `framing → literature → methodology → artifacts → evaluation → report → review`. The review stage simulates a peer-review panel: 1 AC + 3 reviewers, each with `field` / `affiliation` (academic | industry | independent) / `topicConfidence` (expert | confident | tentative | outsider). Recommendation buckets: `A | ARR | RR | RRX | X`. Verdicts: `accept | minor | major | reject`.

Output artifacts from `probe ui` are NOT shipped guidebooks. They are exports the user can save (markdown / latex / pdf / project page) and explicitly carry `[SIMULATION_REHEARSAL]` provenance tags. The same hard rule applies: nothing produced here is evidence.

When extending `probe ui`:

- New stage → new file under `src/cli/ui_scenes/`, register in `ui_app.tsx` SceneId + route, add `live*` generator in `ui_state.ts` and `probe_calls.ts`, mount endpoint in `probe_api.ts`, copy/link the design file under `src/web/probe_design/`.
- Per-stage accent colors and phase labels for `<ModelStatusLine>` are documented in `src/web/probe_design/design_handoff_probe/README.md` § Loading indicators.
- Don't drift the status colors (moss / amber / cyan / rose / ink3) between TUI and web — both surfaces import from `src/ui/probe_tokens.ts`.

Never add a forbidden-phrase exception. Never add a provenance tag that isn't enforced by the linter.
