# Capture-risk audit

**Verdict:** REVISION_REQUIRED

## Axis scores

| axis | score |
|------|-------|
| capacity | -1 |
| agency | -2 |
| exit | -1 |
| legibility | -1 |

## Findings

### capacity.no_fade_mechanism (score -1)

> **Evidence (prototype_spec):** Switches the injection logic from 'every second line break' to 'every line break', so the annotation widget fires on every Enter keypress for the remainder of the session or until the wizard manually deactivates the mode.

The assistance intensity escalates rather than fades; INJECT_DENSITY_INCREASE ramps injection frequency up when engagement is low, and no control describes tapering or participant-initiated reduction. The participant cannot signal 'I have settled into the task, give me fewer' — the only direction of travel is more provocation, not less.

### agency.hides_options_before_review (score -1)

> **Evidence (prototype_spec):** Select which alternative to inject from the pre-prepared candidate bank: choose among (a) a metrically regular completion, (b) a phonetically similar but semantically divergent completion, (c) a semantically congruent but tonally flat completion, or (d) a syntactically incomplete fragment — selecting the category that will be most diagnostic given the line just written.

The wizard draws from a four-category bank but presents the participant with only one alternative at a time. The participant never sees the space of alternatives they are implicitly choosing among; agency is reduced to accept/reject a single opaque proposal. Exposing a small menu of alternatives would change the decision structure materially but is not part of the design.

### agency.weak_override (score -1)

> **Evidence (prototype_spec):** the annotation text field and microphone icon become active and the interface remains locked until the field contains at least 5 words.

Rejecting an alternative is nominally free but operationally costly: the participant must produce a 5-word justification before the interface unlocks, while acceptance is a single click with no annotation burden. The asymmetric friction penalises exercise of the override relative to compliance, making the override ceremonial rather than neutral.

### exit.data_lock_in (score -1)

> **Evidence (prototype_spec):** WoZ drafting interface: a single-page HTML/CSS/JavaScript application with a plain textarea (left 60% of viewport), an annotation panel (right 40%), a status bar, and a websocket connection to the wizard's control panel

The poem drafted during the session lives inside the bespoke WoZ interface and its associated log format. No materials_needed item or wizard_control describes an export path by which the participant leaves with a copy of their own poem in a portable format. The artifact the poet produced is effectively retained by the study apparatus.

### legibility.no_rationale_at_point_of_action (score -1)

> **Evidence (simulated_walkthrough):** Under the task framing, confusion would plausibly concentrate around authorship — specifically, whether the alternative represents a machine suggestion, a human collaborator's suggestion, or something else — and this attribution would in turn shape the rejection reason.

At the moment the participant must accept or reject, no inline surface explains where the alternative came from, why this particular candidate appeared, or on what basis. The walkthrough explicitly identifies this authorship opacity as shaping rejection reasons; a 'why this suggestion' affordance at point of action would materially change the decision and is absent.

## Patterns not fired

- **capacity.substitutes_for_practice**: The intervention does not substitute for the poetic skill itself; the participant writes the poem and the injected alternatives function as provocations that the participant rejects or accepts. The cognitive work of composing and of articulating rejection criteria remains with the participant throughout.
- **capacity.creates_dependency_loop**: This is a single 90-minute session that does not measure tool-invocation growth as a success signal, and the nature of the probe (provocations being rejected) does not create cumulative reliance. There is no mechanism by which repeated use would bind the poet to the tool for future drafting.
- **capacity.no_rehearsal_space**: The session structure includes an explicit low-stakes warm-up phase in which the participant practices the annotation mechanic on a neutral prompt before the core drafting phase begins. This is an adequate rehearsal space for the interaction skill the study requires; the pattern does not fire.
- **agency.auto_decides_consequential_step**: The system does not commit any consequential action on the participant's behalf. Acceptance of an alternative requires an explicit 'Use this' press; rejection requires explicit annotation; nothing is published, submitted, or routed externally without the participant pressing a button themselves. Authority over every line-ending decision remains with the poet.
- **agency.paternalistic_default**: The participant population — practicing poets recruited via MFA programs or poetry societies — is not a historically stigmatized group subject to paternalistic intervention in the sense this pattern names. The design does not default to protective behavior on behalf of a population assumed to need it; the pattern does not apply.
- **exit.workflow_lock_in**: The intervention is a single-session research probe operated by the participant alone. It does not restructure team processes, meeting cadences, or collective workflows; there is nothing for the participant's wider practice to be locked into, since the probe is not adopted as an ongoing tool beyond the session.
- **exit.competence_decay_on_exit**: A 90-minute session is too short to induce meaningful skill decay in a practicing poet's line-ending craft, and the probe does not replace the compositional work. The research question does not concern sustained adoption, so the absence of a longitudinal unaided-performance measure does not constitute a capture risk here.
- **exit.institutional_dependence**: The materials run on a local LAN with no internet access during the session and no cloud service or third-party vendor is implicated. The participant's post-session life is not bound to any institution or platform by having taken part; the pattern does not apply.
- **legibility.opaque_ranking**: The system does not present ranked or filtered lists of options; each injection surfaces a single alternative, not an ordered set. Since there is no list ordering for the participant to misread as meaningful, the specific harm this pattern names does not arise.
- **legibility.no_failure_signal**: The 'correctness' frame does not apply naturally here: injected alternatives are deliberately provocative, not purporting to be right answers. The participant's rejection is itself the signal, and the observer log plus think-aloud capture provide multiple surfaces for detecting inappropriate injections.
- **legibility.unverifiable_summary**: The system does not produce a synthesis, summary, or distillation presented as ground truth. Injected alternatives are single-line poetic candidates, not condensed representations of source material the participant needs to verify. The pattern does not apply to this probe's output type.
