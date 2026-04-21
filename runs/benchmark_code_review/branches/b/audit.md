# Capture-risk audit

**Verdict:** BLOCKED

## Axis scores

| axis | score |
|------|-------|
| capacity | 0 |
| agency | 0 |
| exit | 1 |
| legibility | -3 |

## Findings

### capacity.no_fade_mechanism (score -1)

> **Evidence (prototype_spec):** ADVERSARIAL_CHALLENGE ... Fires when the participant submits an inline comment with a confidence slider rating of 3 or higher (on a 1–5 scale) in the adversarial-challenger condition, or when the participant submits a comment that the wizard judges as overconfident relative to the ground-truth answer key regardless of slider value.

The trigger for challenges is fixed at confidence >= 3 or wizard-judged overconfidence and does not fade as the participant demonstrates improving calibration within the session. There is no mechanism whereby a participant who shows well-calibrated judgment earlier is progressively challenged less, so reliance on the challenger is not tapered toward unaided competence.

### agency.weak_override (score -1)

> **Evidence (prototype_spec):** The 'Approve Hunk' and 'Request Changes' buttons are grayed out and display 'Respond to AI before proceeding' until the participant submits a reply. ... The mandatory response gate reactivates; the participant must submit another reply before proceeding.

The participant cannot bypass or override the challenger's gate without typing a reply (and potentially a second reply if FOLLOW_UP_PROBE fires). There is no 'dismiss challenge' or 'this doesn't apply' affordance visible in the UI. The simulated walkthrough notes participants would plausibly 'read the response gate as paternalistic,' and the only available override is to type filler text, which is an effortful and norm-violating path relative to the one-click accept path available in the suggestion condition.

### legibility.no_failure_signal (score -2)

> **Evidence (prototype_spec):** For off-script hunks (participant comments on a hunk not in the pre-seeded defect set), the wizard skips the ADVERSARIAL_CHALLENGE and instead fires a lightweight clarifying question using a fallback template: 'What assumption about the calling context are you relying on here?' — which is content-neutral and does not reference a specific counterexample.

The spec acknowledges that the wizard may issue challenges for comments where the participant is actually correct, or fall back to content-neutral prompts on off-script hunks, yet nothing in the participant-facing interface signals when the AI is operating in fallback mode or is pressing on a correct judgment. The simulated walkthrough reinforces this: 'A participant whose original comment was correct and whose confidence was appropriately high would likely experience the challenger as unhelpfully contrarian.' Combined with the explicit design choice that 'No ground-truth feedback is given during the session,' the participant has no in-flow way to detect when the AI's challenge is wrong or hollow, and may revise correct confidence downward — a direct erosion of legibility in a calibration study where the dependent variable is precisely whether participants correctly distinguish good from bad AI pushback.

### legibility.no_rationale_at_point_of_action (score -1)

> **Evidence (prototype_spec):** The message contains: (1) a code snippet drawn from the pre-prepared counterexample library for this PR, displayed in a syntax-highlighted code block labeled with the source filename and line numbers, and (2) a mandatory follow-up question formatted as bold text, either 'What would have to be true in [filename] for this change to be safe?' or 'Name the invariant you are relying on here.'

At the point of action — when the participant must type a mandatory reply and then decide whether to revise confidence — the AI provides a snippet and a question but no rationale for why this particular counterexample was selected or why it is relevant to the specific comment. The participant cannot inspect 'why is the AI challenging me on this?' before committing to a reply. While the snippet itself is concrete, the selection logic (wizard judgment against a ground-truth key) is entirely opaque to the participant at the decision moment, which matters especially when fallback templates fire.

## Patterns not fired

- **capacity.substitutes_for_practice**: The adversarial challenger does not perform code review on the participant's behalf; it poses counterexamples and questions that require the participant to do the reasoning. The participant still produces comments, judgments, and typed justifications themselves, so the substantive skill (identifying defects, articulating invariants) is exercised rather than substituted.
- **capacity.creates_dependency_loop**: Success signals in the observable_signals are calibration improvement (Brier scores, confidence-accuracy correlation) and substantive engagement with challenges, not frequency of tool invocation. The study is a one-shot 90-minute session, so there is no longitudinal usage growth being optimized, and nothing in the analysis plan rewards increased reliance on the tool.
- **capacity.no_rehearsal_space**: The session includes an explicit low-stakes warm-up PR in no-tool mode before the counterbalanced conditions begin. While the simulated walkthrough rightly flags that this warm-up does not rehearse the gated adversarial experience specifically, a rehearsal phase for the core review-and-comment skill is present and deliberately staged, which scaffolds participant competence on the underlying task.
- **agency.auto_decides_consequential_step**: The consequential decisions — approving a hunk, requesting changes, submitting the review, setting confidence — are all performed by the participant. The challenger agent never commits a review decision on the participant's behalf; it only asks questions. Decision authority sits unambiguously with the human reviewer.
- **agency.hides_options_before_review**: The system does not present a ranked recommendation or a completed artifact for the participant to approve; it presents a counterexample and a question. The participant generates their own judgment rather than choosing among system-surfaced options, so the pattern about hiding alternatives behind a single recommendation does not apply to this interaction structure.
- **agency.paternalistic_default**: Mid-level software engineers are not a population historically subject to the kind of paternalism Kafer and the pattern target (disabled users, elderly users, children, mental health contexts). While the gate is paternalistic in a general design sense, this pattern's specific trigger around stigmatized populations does not fit the participant population here.
- **exit.data_lock_in**: The session produces research data (logs, transcripts, questionnaires) held by the research team, not artifacts the participant would take with them into ongoing work. Because this is a one-shot study rather than a deployed tool, the question of participant artifact portability does not apply in the sense the pattern targets.
- **exit.workflow_lock_in**: The study takes place in an isolated usability lab on a mock interface with no integration into the participant's team workflow, repository, or code review tooling. Participants return to their normal review process unchanged after 90 minutes, and no collective or institutional re-engineering is implicated by participation.
- **exit.competence_decay_on_exit**: The design explicitly includes a no-tool condition within each participant's session, giving a measurement of unaided performance alongside the assisted conditions. This is precisely the 'without tool' condition whose absence the pattern flags. The 90-minute duration also forecloses long-run decay, and the inclusion of a no-tool comparison actively scaffolds the exit dimension for the research question.
- **exit.institutional_dependence**: The mock review interface runs on a local Node or Python server with no external dependency, the WoZ control panel is a localhost web app, and no cloud vendor or institutional platform is required for participation or for any post-study use. Participants do not develop any dependence on a vendor whose terms they cannot control.
- **legibility.opaque_ranking**: The challenger does not present ranked lists or filtered sets of options to the participant; it presents a single counterexample snippet paired with a question. There is no ordering or selection surface being exposed to the user in a way that would require ranking rationale, so this pattern does not apply to the interaction structure.
- **legibility.unverifiable_summary**: The challenger does not produce summaries, syntheses, or distillations of source material. It surfaces a specific code snippet with filename and line numbers, which is itself the source rather than a summary of it. The participant can inspect the snippet directly, so the pattern about trust-me synthesized output with no inspection path does not fit this interaction.
