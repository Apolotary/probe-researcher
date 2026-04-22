# Imported prototype spec — import_test_sample

Imported from `/Users/apolotary/Documents/Github/probe-researcher/examples/sample_imported_paper.md` via `probe import` on 2026-04-22T06:08:51.639Z. [IMPORTED_DRAFT]

## Research question (imported)

Does the act of writing a prompt for an AI code-review assistant — prior to seeing any AI output — shift a developer's confidence in their review verdict, independently of the AI output itself? [IMPORTED_DRAFT:premise]

## Method (imported verbatim)

### Participants

We will recruit 20 professional software engineers (not students), each with at least 3 years of experience and current active code-review practice. Recruitment through a participant pool at our institution and snowball sampling. [IMPORTED_DRAFT:method]

### Stimuli

Five real pull requests, selected from a public open-source project where the PRs were accepted after nontrivial review discussion. Each PR is 50-200 lines of diff. [IMPORTED_DRAFT:method]

### Procedure

Each participant reviews all five PRs in a within-subjects design. For each PR, we randomly assign one of two conditions: [IMPORTED_DRAFT:method]
- Condition A (prompt-writing): participant writes a short prompt describing what they want the AI to check, then sees a pre-generated standardized AI response. [IMPORTED_DRAFT:method]
- Condition B (output-only): participant is shown the same standardized AI response without writing a prompt first. [IMPORTED_DRAFT:method]

Order is counterbalanced via a Latin square across participants. [IMPORTED_DRAFT:method]

After each PR review, participant records: [IMPORTED_DRAFT:method]
- Verdict (approve / request changes / reject) on a 5-point scale [IMPORTED_DRAFT:method]
- Confidence in verdict on a 7-point scale [IMPORTED_DRAFT:method]
- Free-text reasoning (30 seconds minimum) [IMPORTED_DRAFT:method]

### Analysis

Primary analysis: paired t-test on confidence ratings across conditions. Secondary: thematic analysis of free-text reasoning for differences in attended code aspects. [IMPORTED_DRAFT:method]

## Method summary (classifier-generated)

Participants: 20 professional software engineers with ≥3 years of experience and active code-review practice, recruited via an institutional participant pool and snowball sampling. Stimuli: Five real pull requests (50–200 lines of diff each) drawn from a public open-source project where PRs were accepted after nontrivial review discussion; each PR is paired with a pre-generated standardized AI response. Procedure: Within-subjects design in which each participant reviews all five PRs. Each PR is randomly assigned to one of two conditions — Condition A (prompt-writing): participant writes a short prompt describing what they want the AI to check, then sees the standardized AI response; Condition B (output-only): participant sees the same standardized AI response without writing a prompt first. Order counterbalanced via Latin square. After each PR, participants record: (1) verdict on a 5-point scale, (2) confidence in verdict on a 7-point scale, (3) free-text reasoning (≥30 seconds). Analysis: Primary — paired t-test on confidence ratings across conditions. Secondary — thematic analysis of free-text reasoning for differences in attended code aspects. [AGENT_INFERENCE]

## Human handoff

The researcher should confirm that the classifier's section-to-bucket mapping in `imported_manifest.json` matches their intent before running the audit. [HUMAN_REQUIRED]
