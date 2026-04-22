# Prompt: Probe — current status and where to advise

Paste the content below (starting at "You are advising") into another LLM. The repo is public-readable at https://github.com/Apolotary/probe-researcher (private to the author; if the reviewer LLM cannot read it, they should reason from the text alone — which is written to stand alone).

---

You are advising me on a research-tooling project called **Probe**, built during the Cerebral Valley Claude Opus 4.7 hackathon (April 22–27, 2026). I will describe what exists, what works, what I know is weak, and the specific open questions I want your judgment on. The goal is actionable critique, not validation.

## What Probe is

A command-line tool that takes one sentence of research premise (about a screen-based interactive HCI study) and runs it through an eight-stage pipeline of Claude Opus 4.7 and Sonnet 4.6 agents. Output: either a provenance-tagged study guidebook for a surviving research direction, or `WORKSHOP_NOT_RECOMMENDED.md` reports for blocked directions.

The pipeline:
1. **Premise interrogation** (Opus 4.7) — skeptical PI voice; 2–5 sharpened alternatives
2. **Solution ideation** (Opus 4.7) — three divergent branches, must differ on research question, intervention primitive, human-system relationship, method family
3. **Literature grounding** (Sonnet 4.6) — cites only from a 12-card hand-verified corpus
4. **Prototype specification** (Sonnet 4.6) — Wizard-of-Oz spec
5. **Simulated walkthrough** (Opus 4.7) — hedged rehearsal voice, every para tagged `[SIMULATION_REHEARSAL]`
6. **Capture-risk audit** (Opus 4.7) — fires 16 named patterns across Capacity / Agency / Exit / Legibility; verdict: any −2 → BLOCKED, ≥2 −1 → REVISION_REQUIRED, else PASSED
7. **Adversarial review** (Opus 4.7 ×4) — methodologist, accessibility advocate, novelty hawk, meta-reviewer (forbidden from collapsing disagreement to consensus)
8. **Guidebook assembly** (Opus 4.7) — six-section guidebook where every paragraph, bullet, blockquote, list item, and table row carries a provenance tag

Stages 3–7 fan out across three branches running in parallel via `Promise.all` and real `git worktree`s. A markdown-AST linter enforces provenance tags at paragraph / bullet / blockquote / table-row granularity, rejects evidence language inside rehearsal-tagged paragraphs, rejects predictive-outcome claims inside agent-inference paragraphs, and rejects anti-pattern headings like "Expected outcomes."

A Managed Agents extension (`probe audit-deep`) spawns a Claude Managed Agent with bash/grep/file tools inside a cloud container. On the demo run it ran 21 tool calls and *measured* the announcement-duration delta between the study's AI-disclosure and human-framed stimulus strings at 3.67 seconds, a figure the shallow audit had described only as "substantially longer."

## What's shipped and measurable

- **~3,500 LOC** of TypeScript (strict mode, typecheck clean)
- **14 CLI commands**: run, runs, gantt, lint, render, panel, explore, audit-deep, interview, symposium, build-paper, replay, init, doctor
- **29 passing Vitest tests** covering the linter's rejection cases
- **3 benchmark runs** on different research domains (BLV accessibility; AI-assisted code review; creativity-support tool for poetry drafting)
  - demo_run: branch B surviving with meta-reviewer verdict `human_judgment_required`; branches A and C blocked on `legibility.no_failure_signal`
  - code_review: 2 branches blocked, 1 infra-failed at schema validation
  - creativity_support: all 3 branches surviving (no BLOCKED verdicts)
- **Opus 4.7 vs Sonnet 4.6 ablation** on the methodologist reviewer stage (branch B of demo run)
- **Hallucination test**: planted a fake paper citation; verified zero fabricated `[SOURCE_CARD]` tags
- **17-page arXiv paper** (`paper/probe.pdf`, 181 KB) with 33 verified bibliography entries, a hand-drawn SVG pipeline figure, and unslop-writing-rule editing pass on the five highest-read sections
- **Typecheck, lints on shipped guidebooks, pandoc/wkhtmltopdf availability, corpus inventory**: all pass under `npx probe doctor`
- Total API spend across benchmarks, ablation, hallucination test, and deep audit: **~$15**

## What works, with evidence

1. **The capture-risk audit catches real design flaws.** On the demo premise, Branch A's audit fired `legibility.no_failure_signal` at −2 because the branch's live-DOM injection can silently fail (mode switch, Braille-only config) and the participant has no in-flow indication. I did not see this when reading the prototype spec. Neither did the shallow audit's arithmetic — the model's contribution is pattern selection + evidence-span quoting; the orchestrator computes the verdict.

2. **The adversarial methodologist catches confounds the author missed.** On Branch B (an ARIA-live AI-disclosure study), the methodologist flagged that the AI-condition string is 18 words / ~6 seconds vs. the human-framed string at 5 words / ~2 seconds. Every time-bounded behavioral DV would be mechanically contaminated. The subsequent Managed Agents deep audit measured this precisely: 3.67-second delta.

3. **Planted fake citations do not produce fabricated SOURCE_CARD tags.** The hallucination test injected "Smithson & Watanabe 2024" into the guidebook assembler's context. The assembler wrapped the reference in `[HUMAN_REQUIRED]` with explicit verification instructions rather than generating a `[SOURCE_CARD:smithson_watanabe_2024]` tag.

4. **Both shipped guidebooks pass the provenance and voice linters** — no element missing a tag, no evidence language outside quoted context, no banned "Expected outcomes"-style headings, no `[AGENT_INFERENCE]` with predictive-outcome verbs.

## What's honestly weak

1. **The Opus-vs-Sonnet ablation undercut my initial routing claim.** I routed the methodologist to Opus on the assumption only Opus would catch the confound. Sonnet caught the same confound, produced 5 criticisms vs. Opus's 6, and recommended *reject* where Opus said *major_revision* — arguably the more honest call at n=8. Sonnet cost 2.4× less. The paper now says "Opus provides more precise evidence spans at higher cost; Sonnet is substantively capable on the same prompt" instead of the stronger original claim.

2. **The hallucination test is n=1.** A single trial can't support a capability claim. The rubric needs to be n≥10 with matched real-but-absent controls, blind scoring, and a clear delta between refusal behavior on fake references vs. mention-in-passing behavior on real-but-uncited ones.

3. **Pattern applicability is partially handled.** The code-review benchmark exposed a mis-fire where an intentional friction feature (adversarial-challenger UI designed to create over-trust reflection) got scored as `agency.weak_override`. I added an `applicability_check` field to the audit schema requiring the auditor to justify that the flagged constraint is not the manipulation under study. I have not re-run benchmarks to verify this actually reduces mis-fires.

4. **`[AGENT_INFERENCE]` is an escape hatch.** Among the 8 provenance tags, 7 carry load-bearing claims about content origin. The 8th, `[AGENT_INFERENCE]`, is a catch-all. The linter verifies its presence but not what's inside. A stronger design would require every `[AGENT_INFERENCE]` paragraph to cite at least one preceding anchor (source card ID or simulation-rehearsal paragraph ID). I haven't implemented this. I am not sure the added rigor would survive in practice — the model would route around it.

5. **The creativity-support benchmark had zero blocked branches.** Could mean the premise was benign, or could mean the pattern library is accessibility-and-code-review-shaped and under-fires on creative work. A missing pattern along the lines of `capacity.narrows_expressive_range` would fire on tools that suggest completions and reduce the space of what the user generates. I flagged this as future work in the paper but didn't design the pattern.

6. **Probe has never been used by an HCI researcher on their real premise.** All validation is internal. The paper frames this as a technical report; the submission argues it's a triage tool that helps a researcher see dead ends. The claim is structurally honest but empirically unvalidated against the actual user.

7. **The corpus is 12 cards.** The novelty hawk flagged Jakesch / Longoni / Sundar on the demo run; those are now in corpus. It flagged Clark and Gero on the creativity run; those are now in. A future premise in another domain will flag new gaps. The corpus is correct but small for its claim.

## Specific questions I want your judgment on

Rank-ordered by how much I think your perspective will change my decision:

1. **Submission strategy.** I've listed three prize targets: Most Creative Opus 4.7 Exploration, Best use of Managed Agents, Keep Thinking. Is this focus-dispersive for a hackathon panel? Which single category best fits the project's strongest evidence? My bias is that Best use of Managed Agents is the clearest: the `audit-deep` measured quantitative claims the shallow audit couldn't, which is the specific value proposition of Managed Agents over direct API calls. But the adversarial-review architecture is the more conceptually novel contribution.

2. **Is the ablation result a weakness or a strength to lead with?** The ablation shows Sonnet nearly matched Opus on the methodologist stage. I wrote about it honestly, explicitly in the paper, temper my initial claim, and moved on. A more aggressive framing would lead with this as *the* contribution: "we ablated our own strongest Opus claim and it partially didn't survive." Would that land better or worse with judges?

3. **The `[AGENT_INFERENCE]` escape hatch.** What's the best intervention? Options:
   - (a) require every `[AGENT_INFERENCE]` paragraph to cite ≥1 preceding anchor
   - (b) split `[AGENT_INFERENCE]` into `[AGENT_INFERENCE:reasoning]` and `[AGENT_INFERENCE:speculation]` with different acceptance rules
   - (c) deprecate it in favor of a forced-choice between `[SOURCE_CARD]` / `[SIMULATION_REHEARSAL]` / `[UNCITED_ADJACENT]` / `[DO_NOT_CLAIM]` / `[HUMAN_REQUIRED]`
   - (d) keep it but document explicitly in the paper as the known weakest link
   
   I am currently at (d). Is (a) or (c) worth the engineering cost? Will it produce a visibly stronger guidebook in the demo?

4. **Hallucination evaluation.** What is the minimum viable n for a defensible claim? Is it 10 planted fakes + 10 real-but-absent controls + blind scoring? Or can the n=1 trial be defended as illustrative-not-empirical if I frame it correctly in the paper? The paper currently acknowledges n=1 as a weakness and calls a proper evaluation "future work."

5. **Pattern library coverage.** Should I add `capacity.narrows_expressive_range` before submission or leave the creativity-support observation as evidence the pattern library has documented gaps? Adding a pattern is ~1 hour but introduces risk of mis-calibration.

6. **First-figure decisions.** The paper has exactly one figure: a hand-drawn SVG of the pipeline (shows the 8 stages, 3 branches fanning out, BLOCKED/SURVIVING verdicts, three detail panels for reviewer flow / deep-audit / linter). Is one figure enough? A second figure that showed a sample capture-risk finding with quoted evidence span and pattern ID might make the audit more concrete. Or a flow diagram for `[AGENT_INFERENCE]` vs `[SOURCE_CARD]` vs `[UNCITED_ADJACENT]` decision logic.

7. **Demo framing.** I have a `DEMO_WALKTHROUGH.md` with 9 steps that use only shipped artifacts. Step 0 runs `probe doctor`; steps 1–6 inspect runs; steps 7–8 are optional fresh-run / deep-audit. For a 3-minute hackathon video: which 4 or 5 steps should the video show? My bias is 0 (doctor, sanity) → 2 (gantt, visual surprise) → 5 (read guidebook, the artifact that matters) → 5b (reviewer panel, Opus capability claim) → end on `probe lint` passing live.

## What I don't need advice on

Skip these — decisions made, not reopening:

- TypeScript vs. Python for the implementation (TS chosen, working)
- Real git worktrees vs. simulated (real, working)
- The eight provenance tags (the set is locked; see question 3 for refinement inside the set)
- Whether to scope to "screen-based interactive research" (scoped; README says so; linter doesn't enforce)
- Whether to ship Mode B vision walkthrough (cut; reviewer panel replaces it in the demo)

## How to respond

For each of the seven specific questions, one paragraph of direct advice with a concrete recommendation. Not "it depends"; pick and justify. Flag if any of my premises in the question are wrong.

At the end: name the single thing that, if I did it in the next two hours, would most strengthen the submission. One sentence. Do not suggest rewriting the paper.

If you think the project is in worse shape than I'm describing, say so and why. Do not flatter.
