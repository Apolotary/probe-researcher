# Rehearsal and Reflection: Does Pre-Writing an AI Prompt Shift Developer Code-Review Attitudes?

## Abstract

We investigate whether the act of writing a prompt for an AI code-review assistant, before seeing its output, shifts a developer's attitude toward the eventual review. We propose a within-subjects pre/post study with 20 developers reviewing five real pull requests, each under two conditions: writing a prompt first, or receiving a pre-written prompt's output directly. The primary outcome is the difference in self-reported confidence in the review verdict.

## 1. Introduction

AI-assisted code review is now common practice in engineering teams, but the mechanism of effect is poorly understood. Does the AI change the reviewer's decision, or does the act of preparing to query the AI change the reviewer's attitude before any output arrives? This project asks the second question.

We hypothesize that prompt-writing is itself a rehearsal step that shifts which aspects of the code the reviewer attends to. If true, the same AI output would produce different downstream decisions depending on whether the reviewer wrote the prompt themselves or received someone else's.

## 2. Related work

Jakesch et al. (2023) showed that co-writing with opinionated language models shifts users' attitudes even when users are unaware of the model's bias. Longoni et al. (2019) documented consumer resistance to AI decision-makers in medical contexts. Neither of these studied the prompt-writing step specifically.

Work by Chen and colleagues on prompt engineering has focused on output quality, not on the prompt-writer's attitudinal shifts.

## 3. Method

### Participants

We will recruit 20 professional software engineers (not students), each with at least 3 years of experience and current active code-review practice. Recruitment through a participant pool at our institution and snowball sampling.

### Stimuli

Five real pull requests, selected from a public open-source project where the PRs were accepted after nontrivial review discussion. Each PR is 50-200 lines of diff.

### Procedure

Each participant reviews all five PRs in a within-subjects design. For each PR, we randomly assign one of two conditions:
- Condition A (prompt-writing): participant writes a short prompt describing what they want the AI to check, then sees a pre-generated standardized AI response.
- Condition B (output-only): participant is shown the same standardized AI response without writing a prompt first.

Order is counterbalanced via a Latin square across participants.

After each PR review, participant records:
- Verdict (approve / request changes / reject) on a 5-point scale
- Confidence in verdict on a 7-point scale
- Free-text reasoning (30 seconds minimum)

### Analysis

Primary analysis: paired t-test on confidence ratings across conditions. Secondary: thematic analysis of free-text reasoning for differences in attended code aspects.

## 4. Anticipated behavior

We anticipate that in Condition A (prompt-writing), participants will report higher confidence regardless of AI output content, because the prompt-writing step creates a sense of agency over the review process.

We expect free-text reasoning in Condition A to reference specific code aspects the participant asked the AI about, even when the AI response did not address those aspects.

## 5. Limitations

Within-subjects design risks demand characteristics — by trial 3, participants may notice the two-condition structure and adjust behavior. Recruiting 20 professional engineers is resource-intensive; findings won't generalize to junior developers or students. Confidence ratings are self-reported and may reflect social-desirability bias rather than true epistemic state.

## 6. Expected contribution

This study will contribute a clean isolation of the prompt-writing step from the AI-output step, which the existing literature conflates. If our hypothesis is supported, it suggests code-review tool design should treat the input box as a behavioral intervention rather than a neutral query channel.
