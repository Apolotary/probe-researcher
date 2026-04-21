# What Probe changed — demo_run

This file is for a non-HCI judge who wants to understand in one page what Probe actually saved the researcher from.

The researcher gave Probe a rough premise in 15 words. Probe spent 25 minutes and $5.93 of API credit. Below is what happened.

## The original premise

> "design a short study to understand how BLV screen-reader users interpret page hierarchy on AI-generated news articles"

BLV = Blind or Low-Vision. Screen-reader users rely on heading structure and ARIA landmarks to navigate a page. The researcher's intuition was that AI-generated news might be doing something structurally different from human-authored news, and that BLV users might notice.

## Before Probe

In the absence of Probe, the researcher's most likely path was:

- **Default method.** A single think-aloud study: recruit 8 BLV participants, give them 3 AI-generated news articles, ask them to navigate, transcribe what they say.
- **Default framing.** Treat "AI-generated" as the independent variable without asking whether it structurally changes the DOM.
- **Default stimulus.** Three real-world articles from different outlets, unmatched on length, topic, and heading depth.
- **Default analysis.** Thematic analysis of think-aloud transcripts, looking for "confusion" and "frustration."
- **Default timeline.** ~3 months from IRB approval to submittable paper.

This is a plausible CHI/ASSETS submission. It is also likely to receive reject-or-revise-major at review. Three of its problems do not show up until reviewers see the write-up — confound bakedin the stimuli, no mechanism connecting "AI-generated" to hierarchy, and no BLV co-design.

## What Probe did

Probe ran the same premise through three divergent research programs simultaneously, each specified as a buildable Wizard-of-Oz protocol, each audited for capture risk, each attacked by three adversarial reviewers.

### The three programs Probe generated

| Branch | Research question | Method family | Outcome |
|---|---|---|---|
| **A** | Do AI-generated articles actually have different hierarchy than human-authored ones in the same outlets? | formative (corpus audit) | **BLOCKED** by capture-risk audit — auto-remediation without human review |
| **B** | When hierarchy is held constant, does disclosing AI authorship via ARIA-live banner shift navigation? | evaluative (controlled trial) | **SURVIVED** — meta-reviewer returned `human_judgment_required` |
| **C** | Can a co-designed in-browser repair overlay reduce BLV navigation breakdowns over repeated sessions? | longitudinal (co-design) | **BLOCKED** by capture-risk audit |

The three branches differ on four independent axes: research question, intervention primitive, human-system relationship, and method family. None of them is a UI variant of the others.

### What Probe killed

**Branch A was blocked** because the capture-risk auditor fired `agency.auto_decides_consequential_step` at -2 with a quoted evidence span from the prototype spec: the automated audit pipeline would flag hierarchy violations and route directly to a remediation queue without a human-review step. The intervention silently becomes a policy: "what we flag, we change." The researcher's default assumption was that automation of hierarchy auditing is straightforwardly good; Probe surfaced that the *decision to remediate* is a consequential human-scale choice being delegated to pattern matching. See [`branches/a/WORKSHOP_NOT_RECOMMENDED.md`](./branches/a/WORKSHOP_NOT_RECOMMENDED.md).

**Branch C was blocked** on similar grounds. A repair overlay co-designed with BLV users sounds participatory, but the overlay *rewrites* markup before the screen reader announces it. The auditor flagged the path where "this participant's personal overlay becomes an institutional default" as an unexamined workflow, and the prototype spec did not specify how the researcher would hand the overlay back to users vs. maintain it as research infrastructure. See [`branches/c/WORKSHOP_NOT_RECOMMENDED.md`](./branches/c/WORKSHOP_NOT_RECOMMENDED.md).

### What Probe changed about the surviving branch

Branch B (the disclosure experiment) survived the audit with `REVISION_REQUIRED`, then went to three adversarial reviewers. Each caught a distinct real weakness:

1. **Methodologist caught an announcement-duration confound.** The prototype spec's AI-disclosure string is 18 words (~6 seconds of speech). The human-framed control string is 5 words (~2 seconds). Every time-bounded behavioral dependent variable in the study would be mechanically contaminated by announcement length rather than disclosure content. The researcher did not notice this. Neither did I when I wrote the spec. See [`branches/b/reviews/methodologist.json`](./branches/b/reviews/methodologist.json).

2. **Accessibility advocate applied the Kafer political/relational lens.** BLV users were recruited as *subjects* of the study but not as *co-designers* of the intervention. The disclosure phrasing, placement, and the premise that an ARIA-live banner is the right intervention at all were decided by sighted researchers before any BLV consultation. This reproduces the extractive pattern the research gestures at critiquing. Required revision: add a paid co-design phase before any evaluation trials run. See [`branches/b/reviews/accessibility.json`](./branches/b/reviews/accessibility.json).

3. **Novelty hawk identified uncited adjacent literature.** The AI-disclosure-effects literature is substantial (Jakesch et al. 2023 on co-writing, Longoni et al. 2019 on medical AI resistance, Sundar's MAIN model). None of it was in the source corpus at the time of this run. The novelty hawk correctly named the gap rather than fabricating citations. See [`branches/b/reviews/novelty.json`](./branches/b/reviews/novelty.json). *(Note: the three papers it flagged have since been added to the corpus — verified 2026-04-22. A re-run would ground against them rather than flag them.)*

**The surviving guidebook absorbs all three objections:**
- The co-design phase is a required block before the evaluation phase — directly from the accessibility advocate.
- The duration-confound is named explicitly as a `[DO_NOT_CLAIM]` constraint on what the study can support — directly from the methodologist.
- The uncited-literature gap is flagged as `[AGENT_INFERENCE]` with explicit note that verification is needed — directly from the novelty hawk.

See [`PROBE_GUIDEBOOK.md`](./PROBE_GUIDEBOOK.md) — every paragraph, bullet, table row, and blockquote is provenance-tagged, and the guidebook passes both the provenance linter and the forbidden-phrase linter.

## Decision the researcher now faces

Probe does not decide. The meta-reviewer's verdict on Branch B is `human_judgment_required` with classification `legitimate_methodological_split`. Three reviewers disagree on what the most-load-bearing revision is, and the researcher must decide which revision to prioritize before proceeding.

The human's decision is structured, not open-ended:

1. **Accept the co-design requirement** (accessibility advocate's position) → the evaluation phase is gated on 2–3 paid co-design sessions with BLV contributors. Adds 3–4 weeks and ~$1k–$2k to the timeline.
2. **Accept the duration-confound fix** (methodologist's position) → length-matched stimulus strings rewritten, or a within-condition length-control condition added. Adds a week and may require abandoning some intended DVs.
3. **Accept the novelty-gap fix** (novelty hawk's position) → read and cite Jakesch/Longoni/Sundar (and possibly more) and update the study's predictions accordingly. Reshapes the hypotheses the study tests.

In practice the researcher likely does all three. The useful thing Probe provided is that all three objections are named, quoted, and evidence-backed *before* recruitment, IRB, or pilot work. The default path would have discovered these at reviewer round 1 of submission.

## What this saved

The realistic before/after:

| Discovery | Without Probe | With Probe |
|---|---|---|
| Announcement-duration confound | reviewer round 1 of CHI submission | stage 7a of Probe run, minute 14 |
| Extractive recruitment framing | after the study runs | stage 7b of Probe run, minute 15 |
| Adjacent-literature gap | after submission | stage 7c of Probe run, minute 15 |
| That Branch A's automation is a decision not a tool | never, or post-deployment | stage 6 of Probe run, minute 11 |
| That Branch C's overlay creates workflow lock-in | after deployment | stage 6 of Probe run, minute 12 |

Approximate time savings: ~3–6 months of wrong-direction work.
Approximate dollar cost: $5.93 of Anthropic API credit.
Approximate human effort: 15 words of input premise.

## A note on the three things this run did NOT do

1. **Probe did not run a real study.** Every "rehearsal" paragraph carries a `[SIMULATION_REHEARSAL]` tag and the linter rejects evidence language inside them.
2. **Probe did not recruit participants.** The accessibility advocate's co-design requirement is a `[HUMAN_REQUIRED]` step.
3. **Probe did not decide which revision to prioritize.** The meta-reviewer's `human_judgment_required` verdict is the honest output.

Probe triages. Humans still do the research.
