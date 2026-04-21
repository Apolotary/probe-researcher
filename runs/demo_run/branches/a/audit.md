# Capture-risk audit

**Verdict:** BLOCKED

## Axis scores

| axis | score |
|------|-------|
| capacity | 1 |
| agency | -3 |
| exit | 0 |
| legibility | -3 |

## Findings

### agency.auto_decides_consequential_step (score -1)

> **Evidence (prototype_spec):** A WebSocket-triggered JavaScript snippet adds role='region' and aria-label='Comments section' (or the appropriate section name) to the target container's outermost div in the live DOM without altering visual rendering. NVDA will announce the new landmark on the participant's next D-key landmark navigation press.

The wizard unilaterally modifies the live DOM that the participant is navigating, materially altering the stimulus mid-task without the participant's authorization or knowledge. While this is research-internal rather than externally consequential, it crosses into decision authority over the participant's sensory environment — the participant cannot deliberate over whether the injection happens. This is partially mitigated by the threshold-gating but remains a covert intervention.

### agency.weak_override (score -1)

> **Evidence (simulated_walkthrough):** The overlay intervention (inject_heading_annotation_overlay) causes NVDA to announce text that would not appear on any real website ("[H2]" spoken aloud), which would likely be noticed by any proficient screen-reader user as an artifact rather than accepted as part of the page.

The participant has no described mechanism to refuse or dismiss wizard-triggered overlays or landmark injections during the task. Because the cover story withholds the fact that injections occur, the participant cannot even identify what would need to be overridden. Override in this protocol is effectively impossible without breaking the study frame, making the participant's agency over their own sensory input nominal rather than substantive.

### agency.paternalistic_default (score -1)

> **Evidence (prototype_spec):** If the participant cannot locate the target within 45 seconds, the wizard may activate the 'inject landmark breadcrumb' control to add an ARIA-label to the comments container visible only in the accessibility tree (not visually), which NVDA will then announce on the next D-key landmark press.

The participant population is screen-reader-using blind and low-vision adults — a population historically subject to paternalistic 'help' from sighted researchers. The default behavior at the 45-second threshold is for the wizard to intervene by augmenting the page on the participant's behalf, without participant consent at the point of action. The simulated walkthrough notes the intervention could interrupt an in-progress successful workaround, instantiating exactly the paternalism Kafer critiques. The threshold-gating prevents this from reaching -2, but the default disposition is to intervene rather than wait.

### legibility.no_failure_signal (score -2)

> **Evidence (prototype_spec):** The wizard should detect this when the dashboard shows zero violations for an article but the participant's navigation trace shows repeated backward heading navigations (Shift+H) indicating unexpected heading order, which contradicts the clean audit score. This is the most likely way the audit pipeline produces false-negative structural assessments.

The spec explicitly acknowledges that the axe-core audit pipeline produces false-negative structural assessments (the aria-level mismatch scenario) and that two structurally very different articles can receive identical clean audit scores. The primary instrument on which the AI-vs-human analysis depends fails silently, and the participant — whose navigation is the ground truth — has no channel to flag these failures during the session. The wizard is asked to catch these via judgment, but the analysis_plan treats axe-core counts as a first-class quantitative variable in permutation tests and correlations. A silent failure mode in the central measurement instrument, acknowledged in failure_cases but not resolved, is the canonical fire for this pattern.

### legibility.no_rationale_at_point_of_action (score -1)

> **Evidence (simulated_walkthrough):** The injected landmark breadcrumb, once activated, would likely resolve the blockage within one or two D-key presses as the spec anticipates, but a participant hearing a landmark announce itself where none existed seconds earlier would plausibly remark on the anomaly verbally.

When wizard controls modify the DOM the participant is navigating, the participant receives no rationale at the point where that modification affects their experience. They hear a new landmark announcement or a '[H2]' badge with no explanation, and the cover story actively prevents rationale disclosure until debrief. The participant is making navigation decisions against a surface whose behavior has been silently altered, and rationale after commitment (at debrief, 75+ minutes later) is explicitly what this pattern names as insufficient.

## Patterns not fired

- **capacity.substitutes_for_practice**: The study is an audit of article structure using the participant's own screen-reader navigation skill; the Puppeteer/axe-core pipeline runs only on the wizard dashboard and does not perform navigation on the participant's behalf. The participant exercises their existing NVDA competence throughout, and no wizard control substitutes for the skilled action under study.
- **capacity.no_fade_mechanism**: This is a one-session research protocol, not a longitudinal tool deployment, so the notion of fading assistance over repeated use does not apply. Wizard interventions are explicitly conditional (threshold-gated) rather than always-on, and the participant does not return for subsequent sessions where reliance could accumulate.
- **capacity.creates_dependency_loop**: The observable signals measure structural properties of articles and participant navigation behavior, not frequency of tool invocation as a success metric. The participant is not being trained to invoke a tool repeatedly; they are navigating articles using pre-existing screen-reader skills. No dependency loop is designed into the protocol.
- **capacity.no_rehearsal_space**: The session_structure explicitly includes a warm-up navigation task on a neutral article before stimulus articles are introduced, providing a low-stakes rehearsal phase for the think-aloud protocol and screen-reader calibration. This is a small but explicit scaffold for the participant's practiced engagement with the task format.
- **agency.hides_options_before_review**: The system does not present the participant with ranked recommendations or curated options requiring review. The participant navigates articles using their own chosen strategy; the wizard dashboard is not visible to the participant and does not present options for selection. The decision-making surface is the participant's own screen-reader navigation, not a system-curated option set.
- **exit.data_lock_in**: Session artifacts are stored in open formats (JSONL event logs, axe-core JSON reports, paper questionnaires, OBS video files) on local lab hardware. Participants do not produce artifacts they would need to take with them after the session, as this is an audit study of articles, not a generative tool. Data lock-in is not structurally present.
- **exit.workflow_lock_in**: The intervention is a single 90-minute lab session; it does not restructure the participant's daily news-reading workflow or require other actors in the participant's life to adopt a shared tool. After the session the participant returns to their ordinary NVDA-and-browser workflow with no residual dependencies imposed by the study.
- **exit.competence_decay_on_exit**: The protocol exercises rather than replaces the participant's screen-reader navigation skill, and the session is short enough that no plausible skill degradation occurs. The wizard controls augment page structure on the participant end but do not train the participant out of any capability. Competence-decay concerns apply to longitudinal tool adoption, not to a single audit session.
- **exit.institutional_dependence**: The participant leaves the session with no ongoing dependency on any vendor, platform, or institution introduced by the study. The audit pipeline (Puppeteer, axe-core, Chrome extension, Native Messaging host) runs on lab infrastructure and is not deployed to the participant's own environment. No post-study relationship with an external provider is created.
- **legibility.opaque_ranking**: No step in the task flow presents the participant with a system-generated ranked list of options to choose from. The participant navigates the article's native structure as rendered by NVDA. The dashboard's violation severity color scheme (red/amber/green) is visible only to the wizard, not to the participant, so participant-facing ranking opacity does not arise.
- **legibility.unverifiable_summary**: The system does not produce a summary or synthesis that the participant is expected to act on. The dashboard outputs are audit data consumed by the wizard, not synthesized outputs presented to the participant. The participant works directly with the article source as rendered by NVDA, which is itself the ground truth the study is trying to characterize.
