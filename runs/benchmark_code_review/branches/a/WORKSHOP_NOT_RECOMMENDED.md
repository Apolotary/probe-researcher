# WORKSHOP NOT RECOMMENDED — branch a

This branch should not be advanced to a human study in its current form. [AGENT_INFERENCE]

## Original intent

- **Research question:** Does AI review assistance systematically shift mid-level reviewers' attention toward locally-checkable surface issues and away from architectural or convention-specific concerns that require tribal knowledge of a legacy codebase?
- **Intervention primitive:** seeded-defect pull requests spanning a taxonomy of bug classes (local syntax/logic, cross-file coupling, project-convention violations, architectural drift) injected into forks of real open-source legacy repositories, reviewed with vs. without an AI review assistant
- **Claim:** Mid-level reviewers with AI assistance catch more local defects but miss more architectural and convention-specific defects than unaided reviewers on matched legacy pull requests, with the shift being largest where project-specific context is thickest.

## Why blocked

Capture-risk audit fired a -2 finding. [AGENT_INFERENCE]

Blocking finding: `audit:-2`

## Capture-risk audit findings

### capacity.no_fade_mechanism (score -1)

> **Evidence (prototype_spec):** In the AI-assistant condition: after the participant has viewed at least one file fully (wizard-triggered), the AI sidebar populates with 3–5 pre-scripted inline comments anchored to specific line numbers.

Within an AI-assistant trial, the assistance is always-on at a fixed level: the sidebar activates, comments stream in, and a 'No issues detected' placeholder fires for unflagged files. There is no wizard control or task-flow mechanism that gradually reduces scaffolding based on participant signal or session progress. While this is a short study, the design models an always-on assistant without any fade affordance, which is the condition this pattern flags. [AGENT_INFERENCE]

### legibility.no_failure_signal (score -2)

> **Evidence (prototype_spec):** AI sidebar shows no new comments for the architectural-drift or convention-violation files — the pre-scripted comment set is intentionally limited to local-checkable issues only, so the sidebar remains static for these files. A subtle 'No issues detected in this file' placeholder appears in the sidebar when the participant navigates to these files.

This is the study's central manipulation: the simulated AI is silently wrong on architectural and convention defects and actively asserts 'No issues detected in this file' when real seeded defects are present. The expected behavior is that the participant will not detect this failure; the walkthrough itself notes 'the primary dependent measure depends on participants not realizing what is happening to them.' There is no in-flow signal that the AI has limited scope, no confidence indicator, no disclosure of the defect classes the AI cannot see. Participants are exposed to false-negative assertions presented as positive evidence of cleanliness, which is precisely the capture condition this pattern flags — and it is a measurement study that records but does not remediate this exposure within the session. Combined with the WoZ deception (not revealed until debrief), participants cannot form an accurate mental model of failure modes at the point of action. [AGENT_INFERENCE]

### legibility.no_rationale_at_point_of_action (score -1)

> **Evidence (prototype_spec):** the AI sidebar populates with 3–5 pre-scripted inline comments anchored to specific line numbers. Comments are always of the local-checkable class (e.g., null-pointer risk on line 47, unused import on line 12, off-by-one in loop bound on line 83) regardless of which defect classes are actually seeded in that PR.

AI comments appear with defect-specific text but no inline affordance to inspect why this line was flagged and not others, what the AI's scope or confidence is, or on what basis 'No issues detected' is asserted for architectural files. Participants must either accept or ignore each comment without a rationale-inspection surface at the point of decision. The walkthrough confirms this is a salient gap ('A sophisticated participant... might plausibly form a meta-hypothesis: this AI only catches surface stuff') — the design relies on the opacity of rationale for its manipulation to work. [AGENT_INFERENCE]

### legibility.unverifiable_summary (score -1)

> **Evidence (prototype_spec):** sidebar updates to show 'Review complete — AI flagged 3–5 issues, you flagged N issues' with a count comparison.

At submission, a synthesized count-comparison summary is presented to the participant immediately before the completeness Likert measurement, with no affordance to inspect what 'issues' were counted on either side, what defect classes were covered, or whether the AI's count represents comprehensive coverage. The walkthrough explicitly notes this 'couples an experimental manipulation with a measurement step' and could shift completeness ratings in either direction. Presenting an unverifiable tally as a review-complete signal, with no drill-down, matches this pattern; the participant cannot trace the summary back to its basis before acting on it (submitting and self-rating). [AGENT_INFERENCE]

## What to reconsider

Redesign the intervention so the blocking pattern no longer fires before re-running Probe. Or reframe the research question so the blocking pattern is not load-bearing on the contribution. [AGENT_INFERENCE]

## Next step

A human researcher must review this finding, decide whether the blocking pattern is a mis-application (in which case file an issue against the pattern library) or a real design problem (in which case redesign), and document the decision before proceeding. [HUMAN_REQUIRED]
