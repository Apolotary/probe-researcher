# Cerebral Valley submission — Probe

## 150-word writeup

Probe uses Claude **Opus 4.7** as a research-design triage engine. A researcher enters one sentence about a study they want to run; Probe returns three divergent research programs in parallel git worktrees, each specified, adversarially reviewed, and audited against a 16-pattern library for AI-capture risks grounded in Illich and Buijsman-Carter-Bermúdez's autonomy-by-design work. A markdown-AST linter rejects any paragraph that lacks a provenance tag or uses evidence language in simulated-rehearsal contexts; a Managed Agents extension lets a reviewer agent run bash and grep to measure claims the single-prompt audit could only approximate. On the demo run, Opus 4.7's adversarial methodologist caught an announcement-duration confound that the authors had missed. A planted fake citation did not produce a fabricated `[SOURCE_CARD]` tag. Probe sits between a rough premise and the six months of wrong-direction research a researcher is about to build — rehearsal stage, never performance.

---

*Word count: 158 words (target 100-200).*

## Tagline

*Rehearsal stage for research. The performance still needs humans.*

## Links

- Repository: https://github.com/Apolotary/probe-researcher
- Paper: [`paper/probe.pdf`](./paper/probe.pdf) (17 pages)
- Demo walkthrough: [`DEMO_WALKTHROUGH.md`](./DEMO_WALKTHROUGH.md)
- Demo video: (to be uploaded)

## Prize categories targeted

Ranked by fit:

1. **Most Creative Opus 4.7 Exploration** — the adversarial-reviewer panel with preserved disagreement is a specific bet on Opus 4.7's sustained role-separation under flattery pressure. The ablation against Sonnet 4.6 is shipped in the repo and honestly tempers the capability claim; the paper says so.
2. **Best use of Managed Agents** — `probe audit-deep` spawns a Managed Agent with the full `agent_toolset_20260401` (bash, file ops, web, grep) inside a managed cloud container. On the demo, the agent ran 21 tool calls to measure the announcement-duration delta between the study's AI and human stimulus strings at 3.67 seconds, a figure the shallow audit could only approximate.
3. **Keep Thinking special prize** — the project's load-bearing commitment is structural enforcement of the rehearsal-vs-evidence distinction via a provenance linter at paragraph / bullet / blockquote / table-row granularity. That infrastructure is small, legible, and runs as a test gate.

## Built during the hackathon

- All pipeline code (~3,500 lines TypeScript, strict mode)
- 9 agent system prompts
- 12 verified source cards with resolved DOIs
- 16 capture-risk patterns across 4 axes
- 49 tests (provenance linter with anchored tags and GFM table enforcement, forbidden-phrase linter, CLI flag parsing, cost-log race under `Promise.all`, run-id schema, deep-audit capture extractor, opt-in strict-inference rule for `[AGENT_INFERENCE]`)
- Markdown-AST provenance linter + forbidden-phrase linter
- 3 benchmark runs on different research domains (accessibility, code review, creativity support)
- Opus 4.7 vs. Sonnet 4.6 ablation on the methodologist reviewer
- Hallucination test with planted fake citation (PASSED)
- Managed Agents deep-audit integration (21 tool-call demo session)
- 17-page arXiv paper with 33 verified citations and two figures (pipeline DAG + concrete capture-risk audit finding)

## Declared pre-existing

- Domain expertise in HCI research and accessibility (ASSETS 2025 HTML-restructuring work)
- Theoretical grounding (Sanders-Stappers probes framework, Buijsman-Carter-Bermúdez autonomy-by-design, Illich's conviviality, Kafer's crip theory)
- The general problem area of research-design triage

All repository code and all source cards were produced inside the window. The commit history begins on 2026-04-22 at 01:00 JST.
