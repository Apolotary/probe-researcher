# WORKSHOP NOT RECOMMENDED — branch c

This branch should not be advanced to a human study in its current form. [AGENT_INFERENCE]

## Original intent

- **Research question:** What failure patterns emerge when BLV screen-reader users navigate AI-generated articles over repeated sessions, and can a co-designed in-browser repair layer that rewrites hierarchy on the fly reduce those failures across successive encounters?
- **Intervention primitive:** in-browser accessibility-repair overlay co-designed with BLV participants that detects hallucinated headings and inconsistent landmark nesting in AI-generated articles and rewrites them before screen-reader announcement
- **Claim:** A co-designed repair overlay refined across multiple sessions with BLV screen-reader users reduces hierarchy-related navigation breakdowns on AI-generated news articles, and the specific breakdowns that resist repair reveal limits of post-hoc structural correction.

## Why blocked

Capture-risk audit fired a -2 finding. [AGENT_INFERENCE]

Blocking finding: `audit:-2`

## Capture-risk audit findings

### agency.auto_decides_consequential_step (score -1)

> **Evidence (prototype_spec):** Decide whether landmark nesting anomalies (e.g., a <nav> inside an <article> with no label) should be repaired silently or replaced with an ARIA label announcement — the default is silent repair unless the participant's Session 1 co-design notes indicated they want audible confirmation of repairs.

The wizard silently alters the document the participant is reasoning about, by default without announcement. While the participant is not making external commitments, the structural terrain of the participant's sensemaking task is being modified on their behalf without in-the-moment authorization. The co-design process partially mitigates this after Session 1, but the default-silent posture still places a consequential interpretive decision outside the participant's authority at point of action. [AGENT_INFERENCE]

### agency.hides_options_before_review (score -1)

> **Evidence (prototype_spec):** Executes a pre-scripted DOM rewrite that promotes or demotes the affected heading tags to reflect the implied hierarchy, based on the rule set co-designed with the participant. The rewrite is applied to all affected headings simultaneously (batch, not one at a time) so the outline is consistent before the participant navigates through the section.

At the moment of navigation the participant receives only the repaired structure, with no surfaced alternatives — the original hierarchy and the space of plausible repairs are not announced alongside. Review occurs retrospectively in the debrief via a DOM diff, but by then commitment has already been made. This is a drift rather than capture because the co-design loop does eventually expose the repair space, just not before action. [AGENT_INFERENCE]

### legibility.no_failure_signal (score -2)

> **Evidence (simulated_walkthrough):** The 'apparent resolution rate' metric (proportion of repairs followed within 10 seconds by a CONFIRM code or absence of DISCONFIRM) treats the absence of disconfirmation as evidence of resolution. Rehearsing this, one would note that silence after a repair could also mean the participant did not hear the repair (the NVDA verbosity case), did not connect the repair to their task, or was still processing.

The failure_cases section describes scenarios where the overlay fires repairs the participant never hears (suppressed landmark announcements), repairs misaligned with semantic confabulations, and late repairs producing double-announcements. In the silent-injection case the expected_behavior is that the wizard may interpret absence of disorientation as successful repair, with no in-flow signal to the participant that something was injected. The participant has no reliable way to detect when the system has acted incorrectly on their document, and the quantitative scheme itself conflates silence with success. This is an active capture of the participant's ability to form accurate beliefs about what the tool did. [AGENT_INFERENCE]

### legibility.no_rationale_at_point_of_action (score -1)

> **Evidence (prototype_spec):** Decide whether to show the participant a visual diff of the original vs. repaired DOM (rendered as an indented plain-text tree read aloud by the screen reader) during the post-article debrief, or to describe changes verbally via the facilitator — the default is verbal description unless the participant requested DOM-tree review in a prior session.

Rationale for each specific repair is available only post-hoc in the debrief, and even there the default is a verbal summary rather than a structural diff. At the point of action — when the participant is navigating and encountering the repaired structure — there is no inline mechanism to ask 'what was changed here and why.' The co-design loop eventually surfaces rationale at the ruleset level, but not per-action, which is what this pattern targets. [AGENT_INFERENCE]

### legibility.unverifiable_summary (score -1)

> **Evidence (simulated_walkthrough):** In the debrief, a participant is asked to reconstruct 'what did you hear, what did you expect to hear' from a timestamped excerpt the observer has selected. Rehearsing this, one would reasonably expect the selection itself to shape the co-design output: excerpts chosen by the observer are the moments the observer noticed, which skews toward breakdowns that were audible or verbalised and away from silent breakdowns

The co-design debrief hands the participant a curated selection of speech excerpts drawn from the session log, and the participant reasons about repair rules from that summary without an affordance to surface the full session record for comparison. The selection is an observer-generated synthesis presented as the evidentiary base for rule-making, with no described mechanism for the participant to inspect unselected moments before committing to rule changes. [AGENT_INFERENCE]

## What to reconsider

Redesign the intervention so the blocking pattern no longer fires before re-running Probe. Or reframe the research question so the blocking pattern is not load-bearing on the contribution. [AGENT_INFERENCE]

## Next step

A human researcher must review this finding, decide whether the blocking pattern is a mis-application (in which case file an issue against the pattern library) or a real design problem (in which case redesign), and document the decision before proceeding. [HUMAN_REQUIRED]
