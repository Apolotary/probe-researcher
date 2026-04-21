# Capture-risk audit

**Verdict:** REVISION_REQUIRED

## Axis scores

| axis | score |
|------|-------|
| capacity | -2 |
| agency | -1 |
| exit | 0 |
| legibility | -2 |

## Findings

### capacity.substitutes_for_practice (score -1)

> **Evidence (prototype_spec):** Participant types the first 3–5 words of line 1 into the drafting interface, stopping before the line is complete, then presses Tab to signal they are ready for suggestions... presents three numbered candidate line endings in a panel to the right of the draft area. Each candidate is displayed in a fixed-width font with stress marks pre-annotated

The wizard performs the skilled metrical and rhyming work — constructing scansion-compliant line endings with pre-annotated stress marks — at precisely the step where that prosodic reasoning is the creative act of formalist poetry. The participant types a stem and receives completed, metrically annotated candidates. However, the within-subjects design explicitly includes solo and rhyming-dictionary conditions in which participants must perform the skill unaided, which partially mitigates substitution by making unaided competence a measured comparison rather than a bypassed step.

### capacity.no_fade_mechanism (score -1)

> **Evidence (prototype_spec):** This accept/edit/override cycle repeats for all 14 lines.

Within the co-writer condition, assistance is provided at a constant level across all 14 lines, with no mechanism for the participant to reduce suggestion intensity, turn off specific registers, or move to a 'training wheels off' mode as the poem progresses. The wizard_controls describe always-available injection on every Tab press without conditional gating on participant confidence, skill demonstration, or elapsed time. For a 120-minute session this is a minor drift rather than deep capture, but the uniform assistance level misses the opportunity to study graduated reliance.

### agency.weak_override (score -1)

> **Evidence (simulated_walkthrough):** When a participant overrides, the panel stays visible for five seconds with grayed-out candidates before collapsing. A participant might reasonably experience this as mild judgmental presence — the rejected candidates lingering in peripheral vision while they type their own ending — and this lingering could plausibly suppress override behavior

The override path is nominally available (free-text box always visible) but the five-second lingering grayed-out panel after override introduces asymmetric friction compared to the one-click 'Use this' accept path. The walkthrough identifies this as a design choice that could suppress override behavior through mild social-presence pressure, and since override rate is a primary observable signal, this weak-override asymmetry directly confounds interpretation of participant agency. The effect is drift rather than capture because the override remains functionally possible and is a tracked signal.

### legibility.opaque_ranking (score -1)

> **Evidence (simulated_walkthrough):** the interface does not label the registers to the participant — the register tags live only in the wizard's dispatch payload. A participant who happens to perceive and articulate the register dimension would be doing so via their own aesthetic sensibility, while a participant who does not perceive it would be treating the three candidates as an unstructured menu.

The three candidates are ordered/structured along a deliberate plain/elevated/unexpected register dimension that carries the study's theoretical weight, but this basis of selection is invisible to the participant at the point of choice. Numbered positions 1-2-3 without register labels present the candidates as an unstructured menu rather than as principled alternatives, which both confounds the study's own construct (unexpected candidate selection) and denies participants the rationale they need to choose among options understanding what they are choosing between.

### legibility.no_rationale_at_point_of_action (score -1)

> **Evidence (prototype_spec):** Each candidate is displayed in a fixed-width font with stress marks pre-annotated (e.g., 'u / u / u / u / u /') beneath the text to make metrical compliance visible. A 'Use this' button appears beside each candidate

Stress annotations provide partial rationale for metrical compliance — a genuine scaffold for the prosodic dimension of each choice. However, at the point where the participant clicks 'Use this,' no inline mechanism surfaces why each candidate was offered, what semantic or imagistic consideration justified it relative to the developing poem, or what register each represents. The register labels exist in the wizard payload but are not displayed. The rationale is partial: metrical compliance is visible, but diction and semantic reasoning are opaque until commitment.

## Patterns not fired

- **capacity.creates_dependency_loop**: The study is a single-session within-subjects evaluation, not a longitudinal adoption study, so there is no mechanism by which successive uses could build reliance over time. Observable signals do not measure tool-invocation growth as a success metric; they measure accept/edit/override rates and compare conditions. The design does not create a feedback loop where each use increases reliance on subsequent uses within or across sessions.
- **capacity.no_rehearsal_space**: The session_structure does include an explicit low-stakes warm-up phase with a neutral prompt and a practice round of suggestions before the measured drafting begins. The rehearsal is brief and only covers the first condition per the counterbalanced order (which the walkthrough flags as asymmetric), but a rehearsal space is present in the design rather than absent, so the pattern's fire condition — absence of any low-stakes practice — is not met.
- **agency.auto_decides_consequential_step**: No step in the task flow commits to an external or consequential action without participant authorization. The system presents candidates; the participant explicitly clicks 'Use this', edits, or overrides. Submission is participant-triggered via 'Submit Draft'. No publication, routing to third parties, or consequential automated commitment occurs — the wizard's outputs are advisory and the participant retains execution authority at every commitment point.
- **agency.hides_options_before_review**: The interface always presents three alternatives spanning a deliberately designed register spread (plain/elevated/unexpected) plus a visible free-text override box, so the space of alternatives is exposed rather than collapsed to a single recommendation. The pattern does not fire. The walkthrough notes register labels are not visible to participants, which is a legibility concern rather than an option-hiding concern since the alternatives themselves are fully shown.
- **agency.paternalistic_default**: The participant population is working poets with MFA training and demonstrated formalist competence, screened via a prosody quiz. This is not a population historically subject to paternalistic design, and the intervention does not impose protective or assistive defaults framed around a stigmatized identity. The opt-in structure (voluntary Tab press to invoke suggestions) is the opposite of paternalistic auto-assistance.
- **exit.data_lock_in**: Artifacts are stored as local JSON files on lab hardware in an open, documented format that preserves the full poem text and structured log events. JSON is a portable, non-proprietary format, and the naming convention is transparent. Participants' poems are trivially extractable as plain text from these files. No vendor-proprietary schema or service binding is described.
- **exit.workflow_lock_in**: The study is a single 120-minute lab session with individual participants; there is no team, editorial workflow, or institutional process being restructured. Poets compose privately at a desk. No task_flow step creates dependencies on other actors adopting the same tool for the participant to continue working, and the intervention does not propagate into the participant's home writing practice during the study itself.
- **exit.competence_decay_on_exit**: The within-subjects design explicitly includes a solo drafting condition where each participant composes an unaided sonnet, which directly measures unaided performance as part of the primary comparison. Additionally, the study is a single session with no longitudinal adoption, so sustained-use competence decay is not at issue. The risk the pattern names — no measurement of unaided skill — is actively addressed by the solo condition.
- **exit.institutional_dependence**: The infrastructure is explicitly designed to avoid external vendor dependency: a local WebSocket server on a lab router, locally running CMU Pronouncing Dictionary API, open-source Python libraries. The only external dependency is the RhymeZone iframe in the control condition, which is a comparison baseline rather than a core adoption path. Participants are not being onboarded to a vendor platform whose terms could change on them.
- **legibility.no_failure_signal**: The design explicitly surfaces metrical failures via the flag_meter_break control, which visibly annotates lines that fail to scan and thereby provides an in-flow signal when something has gone wrong prosodically. Additionally, stress annotations under each candidate make compliance inspectable at the point of decision. The log_wizard_error control and prosody audit flag further capture system errors. This constitutes scaffold, not capture — but the asymmetry that wizard-caused errors are flagged to PI while participant-override scansion errors are deliberately not flagged to the participant is noted in task_flow step 2 as a study-design choice, not a failure silence, so the pattern does not fire overall.
- **legibility.unverifiable_summary**: The system does not produce summaries, syntheses, or extractive outputs claiming to represent underlying sources. It produces generative candidate line endings, which are creative proposals rather than distillations of a source corpus the participant would need to verify against. The 'trust me summary' failure mode this pattern targets — e.g., a generated abstract of a clinical record — is not present in a creative writing suggestion interface.
