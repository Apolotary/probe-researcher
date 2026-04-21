# WORKSHOP NOT RECOMMENDED — branch a

This branch should not be advanced to a human study in its current form. [AGENT_INFERENCE]

## Original intent

- **Research question:** Do AI-generated news articles published by outlets using LLM pipelines exhibit systematically different heading depth, landmark structure, and ARIA correctness than human-authored articles from the same outlets, and on which dimensions is divergence large enough to affect screen-reader navigation?
- **Intervention primitive:** automated corpus audit pipeline that parses article DOMs and scores hierarchy artifacts against ARIA conformance plus screen-reader-relevant structural metrics
- **Claim:** AI-generated news articles from LLM-using outlets diverge from human-authored articles at the same outlets on measurable hierarchy dimensions, and only a subset of those dimensions actually degrade screen-reader navigation.

## Why blocked

Capture-risk audit fired a -2 finding. [AGENT_INFERENCE]

Blocking finding: `audit:-2`

## Capture-risk audit findings

### agency.auto_decides_consequential_step (score -1)

> **Evidence (prototype_spec):** A WebSocket-triggered JavaScript snippet adds role='region' and aria-label='Comments section' (or the appropriate section name) to the target container's outermost div in the live DOM without altering visual rendering. NVDA will announce the new landmark on the participant's next D-key landmark navigation press.

The wizard unilaterally modifies the live DOM that the participant is navigating, materially altering the stimulus mid-task without the participant's authorization or knowledge. While this is research-internal rather than externally consequential, it crosses into decision authority over the participant's sensory environment — the participant cannot deliberate over whether the injection happens. This is partially mitigated by the threshold-gating but remains a covert intervention. [AGENT_INFERENCE]

### agency.weak_override (score -1)

> **Evidence (simulated_walkthrough):** The overlay intervention (inject_heading_annotation_overlay) causes NVDA to announce text that would not appear on any real website ("[H2]" spoken aloud), which would likely be noticed by any proficient screen-reader user as an artifact rather than accepted as part of the page.

The participant has no described mechanism to refuse or dismiss wizard-triggered overlays or landmark injections during the task. Because the cover story withholds the fact that injections occur, the participant cannot even identify what would need to be overridden. Override in this protocol is effectively impossible without breaking the study frame, making the participant's agency over their own sensory input nominal rather than substantive. [AGENT_INFERENCE]

### agency.paternalistic_default (score -1)

> **Evidence (prototype_spec):** If the participant cannot locate the target within 45 seconds, the wizard may activate the 'inject landmark breadcrumb' control to add an ARIA-label to the comments container visible only in the accessibility tree (not visually), which NVDA will then announce on the next D-key landmark press.

The participant population is screen-reader-using blind and low-vision adults — a population historically subject to paternalistic 'help' from sighted researchers. The default behavior at the 45-second threshold is for the wizard to intervene by augmenting the page on the participant's behalf, without participant consent at the point of action. The simulated walkthrough notes the intervention could interrupt an in-progress successful workaround, instantiating exactly the paternalism Kafer critiques. The threshold-gating prevents this from reaching -2, but the default disposition is to intervene rather than wait. [AGENT_INFERENCE]

### legibility.no_failure_signal (score -2)

> **Evidence (prototype_spec):** The wizard should detect this when the dashboard shows zero violations for an article but the participant's navigation trace shows repeated backward heading navigations (Shift+H) indicating unexpected heading order, which contradicts the clean audit score. This is the most likely way the audit pipeline produces false-negative structural assessments.

The spec explicitly acknowledges that the axe-core audit pipeline produces false-negative structural assessments (the aria-level mismatch scenario) and that two structurally very different articles can receive identical clean audit scores. The primary instrument on which the AI-vs-human analysis depends fails silently, and the participant — whose navigation is the ground truth — has no channel to flag these failures during the session. The wizard is asked to catch these via judgment, but the analysis_plan treats axe-core counts as a first-class quantitative variable in permutation tests and correlations. A silent failure mode in the central measurement instrument, acknowledged in failure_cases but not resolved, is the canonical fire for this pattern. [AGENT_INFERENCE]

### legibility.no_rationale_at_point_of_action (score -1)

> **Evidence (simulated_walkthrough):** The injected landmark breadcrumb, once activated, would likely resolve the blockage within one or two D-key presses as the spec anticipates, but a participant hearing a landmark announce itself where none existed seconds earlier would plausibly remark on the anomaly verbally.

When wizard controls modify the DOM the participant is navigating, the participant receives no rationale at the point where that modification affects their experience. They hear a new landmark announcement or a '[H2]' badge with no explanation, and the cover story actively prevents rationale disclosure until debrief. The participant is making navigation decisions against a surface whose behavior has been silently altered, and rationale after commitment (at debrief, 75+ minutes later) is explicitly what this pattern names as insufficient. [AGENT_INFERENCE]

## What to reconsider

Redesign the intervention so the blocking pattern no longer fires before re-running Probe. Or reframe the research question so the blocking pattern is not load-bearing on the contribution. [AGENT_INFERENCE]

## Next step

A human researcher must review this finding, decide whether the blocking pattern is a mis-application (in which case file an issue against the pattern library) or a real design problem (in which case redesign), and document the decision before proceeding. [HUMAN_REQUIRED]
