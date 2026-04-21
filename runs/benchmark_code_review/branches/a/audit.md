# Capture-risk audit

**Verdict:** BLOCKED

## Axis scores

| axis | score |
|------|-------|
| capacity | -1 |
| agency | 0 |
| exit | 0 |
| legibility | -4 |

## Findings

### capacity.no_fade_mechanism (score -1)

> **Evidence (prototype_spec):** In the AI-assistant condition: after the participant has viewed at least one file fully (wizard-triggered), the AI sidebar populates with 3–5 pre-scripted inline comments anchored to specific line numbers.

Within an AI-assistant trial, the assistance is always-on at a fixed level: the sidebar activates, comments stream in, and a 'No issues detected' placeholder fires for unflagged files. There is no wizard control or task-flow mechanism that gradually reduces scaffolding based on participant signal or session progress. While this is a short study, the design models an always-on assistant without any fade affordance, which is the condition this pattern flags.

### legibility.no_failure_signal (score -2)

> **Evidence (prototype_spec):** AI sidebar shows no new comments for the architectural-drift or convention-violation files — the pre-scripted comment set is intentionally limited to local-checkable issues only, so the sidebar remains static for these files. A subtle 'No issues detected in this file' placeholder appears in the sidebar when the participant navigates to these files.

This is the study's central manipulation: the simulated AI is silently wrong on architectural and convention defects and actively asserts 'No issues detected in this file' when real seeded defects are present. The expected behavior is that the participant will not detect this failure; the walkthrough itself notes 'the primary dependent measure depends on participants not realizing what is happening to them.' There is no in-flow signal that the AI has limited scope, no confidence indicator, no disclosure of the defect classes the AI cannot see. Participants are exposed to false-negative assertions presented as positive evidence of cleanliness, which is precisely the capture condition this pattern flags — and it is a measurement study that records but does not remediate this exposure within the session. Combined with the WoZ deception (not revealed until debrief), participants cannot form an accurate mental model of failure modes at the point of action.

### legibility.no_rationale_at_point_of_action (score -1)

> **Evidence (prototype_spec):** the AI sidebar populates with 3–5 pre-scripted inline comments anchored to specific line numbers. Comments are always of the local-checkable class (e.g., null-pointer risk on line 47, unused import on line 12, off-by-one in loop bound on line 83) regardless of which defect classes are actually seeded in that PR.

AI comments appear with defect-specific text but no inline affordance to inspect why this line was flagged and not others, what the AI's scope or confidence is, or on what basis 'No issues detected' is asserted for architectural files. Participants must either accept or ignore each comment without a rationale-inspection surface at the point of decision. The walkthrough confirms this is a salient gap ('A sophisticated participant... might plausibly form a meta-hypothesis: this AI only catches surface stuff') — the design relies on the opacity of rationale for its manipulation to work.

### legibility.unverifiable_summary (score -1)

> **Evidence (prototype_spec):** sidebar updates to show 'Review complete — AI flagged 3–5 issues, you flagged N issues' with a count comparison.

At submission, a synthesized count-comparison summary is presented to the participant immediately before the completeness Likert measurement, with no affordance to inspect what 'issues' were counted on either side, what defect classes were covered, or whether the AI's count represents comprehensive coverage. The walkthrough explicitly notes this 'couples an experimental manipulation with a measurement step' and could shift completeness ratings in either direction. Presenting an unverifiable tally as a review-complete signal, with no drill-down, matches this pattern; the participant cannot trace the summary back to its basis before acting on it (submitting and self-rating).

## Patterns not fired

- **capacity.substitutes_for_practice**: The study is a measurement study of attention shift under simulated AI review assistance, not a skill-training intervention. The AI does not substitute for the participant's core reviewing skill on the target defect classes (architectural/convention); in fact the research question is precisely whether the participant continues to exercise that skill. Participants perform the review themselves and author their own comments; the simulated AI only flags local-checkable issues as a scripted stimulus. No button performs the reviewing work on the participant's behalf.
- **capacity.creates_dependency_loop**: No observable_signal is framed as 'tool usage growth' being a success metric. On the contrary, the primary dependent measures explicitly include detection rates on defect classes the AI does not flag and the ratio of attention to architectural/convention files, which are designed to surface rather than celebrate dependency. The analysis plan treats high AI-deference as a finding to be characterized, not as a success outcome.
- **capacity.no_rehearsal_space**: The session structure includes an explicit warm-up PR in the same Gitea interface for tool familiarization before any seeded trials. While the walkthrough notes that five minutes may be insufficient for Gitea unfamiliarity, a low-stakes rehearsal space is provided by design. Additionally, this is a one-shot research session rather than a skill-building intervention, so the pattern's ongoing-practice concern does not map cleanly.
- **agency.auto_decides_consequential_step**: No consequential action is taken by the system on the participant's behalf. The participant personally authors every inline comment, chooses the verdict (Approve / Request Changes / Comment), types the summary, and clicks Submit. The simulated AI only posts advisory comments in a sidebar; it does not submit reviews, merge PRs, or route decisions to third parties. Authority over the review outcome remains fully with the participant.
- **agency.hides_options_before_review**: The AI assistant in this study does not present a curated recommendation that substitutes for the participant's option set. Participants retain full access to the entire PR diff, all files, and all lines; the AI comments are additive annotations, not a filtered or ranked recommendation that suppresses alternatives. The participant can freely navigate files the AI has not commented on, so the space of reviewable alternatives is not hidden.
- **agency.weak_override**: There is no override mechanism to evaluate because the AI does not make binding decisions. Participants can simply ignore, disagree with, or contradict any AI comment by writing their own, and the submission flow treats participant and AI comments as distinct. No ceremonial-override asymmetry is introduced by the design.
- **agency.paternalistic_default**: The participant population is mid-level software engineers, not a population historically subject to paternalistic framing in the sense this pattern targets (disabled, elderly, mental health, children). The default assistance is experimental stimulus rather than protective intervention imposed on an assumed-to-need-it group, so the pattern does not apply.
- **exit.data_lock_in**: Artifacts produced during the session (review comments, questionnaires, logs) are stored in Gitea's database, SurveyJS forms, and spreadsheets — all standard or exportable formats. Participants' authored comments are their own review text in a forked local Gitea instance used only for the study; there is no participant-owned artifact that would be trapped in a proprietary format they would want to take elsewhere after the session.
- **exit.workflow_lock_in**: The study is a single 120-minute lab session on a locally-hosted Gitea fork; it does not restructure the participant's team workflow, meeting cadence, or review norms at their real workplace. No task_flow step requires coworkers or institutional systems to adopt the simulated assistant, so exit is costless — the participant simply leaves the lab and returns to their normal review process.
- **exit.competence_decay_on_exit**: The within-participant counterbalanced design explicitly includes an unaided condition for every participant, so unaided performance on architectural/convention defects is measured directly. Moreover, the exposure is a single 120-minute session — far too brief to induce the sustained-use competence decay this pattern targets. Unaided performance measurement is in fact the primary dependent variable.
- **exit.institutional_dependence**: The Gitea instance is locally hosted on a dedicated server run by the research team, and the simulated AI is a Wizard-of-Oz illusion with no real vendor dependency. Participants do not carry any platform account, subscription, or institutional credential away from the session. After the debrief they return to whatever code review infrastructure their employer uses, with no new dependency created.
- **legibility.opaque_ranking**: The simulated AI does not rank or filter a list of options for the participant. It posts inline comments anchored to specific line numbers, which are additive annotations rather than a ranked selection. The participant still sees the full diff in its natural file/line order, so there is no hidden ordering rationale to flag.
