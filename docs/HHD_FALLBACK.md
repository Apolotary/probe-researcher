# HHD fallback plan

If Probe's kill test (Day 1, hour 14) fails, pivot to HHD — Hallucinated Hierarchy Detector — immediately. Do not push through. HHD is the standing alternative with a 4-day build budget.

## Triggers for pivot

Pivot when any of the following are true at hour 14:

1. Three branches cannot be made to genuinely differ on the four divergence axes after two hours of ideator prompt tuning.
2. Literature agent hallucinates references (citations do not resolve to source cards in `corpus/source_cards/`).
3. Prototype spec is consistently too vague for a different researcher to build without clarification.
4. None of the three branches surface an approach or failure mode that a domain expert would not have thought of unprompted.

## What HHD is

A focused accessibility tool that analyzes web pages for mismatches between visual DOM hierarchy and screen-reader-perceived structure. Based on the ASSETS 2025 HTML restructuring work.

**Input:** URL or HTML file.

**Output:** a report identifying specific points in the page where sighted users perceive structure the screen reader cannot reach (or vice versa), with evidence spans, fix proposals, and optionally a patched HTML file.

## Architecture (4-day budget)

- **Day 2 (24h):** DOM extraction with headless Chrome, axe-core integration, screen-reader accessibility-tree extraction, basic Opus 4.7 analysis of the rendered page + tree
- **Day 3 (24h):** hierarchy comparison logic, evidence-span generation, fix proposal prompts
- **Day 4 (24h):** report generation, demo polish, one benchmark case (prior ASSETS 2025 target)
- **Day 5 (24h):** video recording, writeup, submission

## Demo structure (3 min)

- **0:00 – 0:20** Pain point: screen-reader users encountering pages that look structured but traverse as unstructured soup
- **0:20 – 1:00** Paste URL of a real e-commerce / news / AI-interface page. Tool extracts DOM + screen-reader tree side-by-side
- **1:00 – 1:45** Opus 4.7 identifies specific hallucinated-hierarchy patterns with visual highlights on the page
- **1:45 – 2:30** Fix generation — patched HTML with corrections, before/after screen-reader traversal
- **2:30 – 3:00** Closing: "This is what's wrong with AI-generated web pages at scale. HHD catches it before shipping."

## Why HHD, not something else

- Built-in narrative (ASSETS 2025 ethos, accessibility identity)
- Uses Opus 4.7 for vision + structural reasoning in one pass (same capability bet)
- Reproducible demo on real pages judges can verify
- Ships reliably in 4 days from pivot decision
- Narrower identity play than Probe, but the problem is unambiguous

## What carries over from Probe if we pivot

- Opus 4.7 client, cost logging, schema validation, provenance linter ideas
- Any source cards that reference accessibility or disability studies
- The commit discipline and worktree infrastructure (adapted for HHD's simpler structure)
- `CLAUDE.md`'s voice and constraint framing — reused with HHD-specific updates

## What does not carry over

- Multi-branch orchestration (HHD is single-pipeline)
- Capture-risk pattern library (not applicable to accessibility scan)
- Adversarial reviewer personas (no design proposal to review)
- Guidebook assembly (HHD output is a report, not a study protocol)

## Pivot execution checklist

- [ ] Tag current branch `probe-killed-<timestamp>` and push
- [ ] Create `hhd/` branch or new repo
- [ ] Update `CLAUDE.md` with HHD constraints
- [ ] Update `README.md` to describe HHD
- [ ] Schedule HHD Day 2 work starting from hour 18 (after 4h break)
