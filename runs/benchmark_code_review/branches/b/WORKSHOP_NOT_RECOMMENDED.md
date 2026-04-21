# WORKSHOP NOT RECOMMENDED — branch b

This branch should not be advanced to a human study in its current form. [AGENT_INFERENCE]

## Original intent

- **Research question:** Can an adversarial AI 'devil's advocate' that interrogates the reviewer's justifications improve mid-level reviewers' calibration — the match between their confidence in a review decision and its actual correctness — on legacy code where automation bias is the dominant failure mode?
- **Intervention primitive:** a challenger agent that, after a reviewer writes a comment or approves a hunk, surfaces counterexamples, asks 'what would have to be true elsewhere in the repo for this to be safe?', and forces the reviewer to respond before submission; compared against a standard suggestion-style AI reviewer and against no tool
- **Claim:** Reviewers paired with an adversarial challenger show tighter confidence-accuracy calibration on legacy PRs than those using a suggestion-style AI, even when raw defect-catch rates are similar.

## Why blocked

Capture-risk audit fired a -2 finding. [AGENT_INFERENCE]

Blocking finding: `audit:-2`

## Capture-risk audit findings

### capacity.no_fade_mechanism (score -1)

> **Evidence (prototype_spec):** ADVERSARIAL_CHALLENGE ... Fires when the participant submits an inline comment with a confidence slider rating of 3 or higher (on a 1–5 scale) in the adversarial-challenger condition, or when the participant submits a comment that the wizard judges as overconfident relative to the ground-truth answer key regardless of slider value.

The trigger for challenges is fixed at confidence >= 3 or wizard-judged overconfidence and does not fade as the participant demonstrates improving calibration within the session. There is no mechanism whereby a participant who shows well-calibrated judgment earlier is progressively challenged less, so reliance on the challenger is not tapered toward unaided competence. [AGENT_INFERENCE]

### agency.weak_override (score -1)

> **Evidence (prototype_spec):** The 'Approve Hunk' and 'Request Changes' buttons are grayed out and display 'Respond to AI before proceeding' until the participant submits a reply. ... The mandatory response gate reactivates; the participant must submit another reply before proceeding.

The participant cannot bypass or override the challenger's gate without typing a reply (and potentially a second reply if FOLLOW_UP_PROBE fires). There is no 'dismiss challenge' or 'this doesn't apply' affordance visible in the UI. The simulated walkthrough notes participants would plausibly 'read the response gate as paternalistic,' and the only available override is to type filler text, which is an effortful and norm-violating path relative to the one-click accept path available in the suggestion condition. [AGENT_INFERENCE]

### legibility.no_failure_signal (score -2)

> **Evidence (prototype_spec):** For off-script hunks (participant comments on a hunk not in the pre-seeded defect set), the wizard skips the ADVERSARIAL_CHALLENGE and instead fires a lightweight clarifying question using a fallback template: 'What assumption about the calling context are you relying on here?' — which is content-neutral and does not reference a specific counterexample.

The spec acknowledges that the wizard may issue challenges for comments where the participant is actually correct, or fall back to content-neutral prompts on off-script hunks, yet nothing in the participant-facing interface signals when the AI is operating in fallback mode or is pressing on a correct judgment. The simulated walkthrough reinforces this: 'A participant whose original comment was correct and whose confidence was appropriately high would likely experience the challenger as unhelpfully contrarian.' Combined with the explicit design choice that 'No ground-truth feedback is given during the session,' the participant has no in-flow way to detect when the AI's challenge is wrong or hollow, and may revise correct confidence downward — a direct erosion of legibility in a calibration study where the dependent variable is precisely whether participants correctly distinguish good from bad AI pushback. [AGENT_INFERENCE]

### legibility.no_rationale_at_point_of_action (score -1)

> **Evidence (prototype_spec):** The message contains: (1) a code snippet drawn from the pre-prepared counterexample library for this PR, displayed in a syntax-highlighted code block labeled with the source filename and line numbers, and (2) a mandatory follow-up question formatted as bold text, either 'What would have to be true in [filename] for this change to be safe?' or 'Name the invariant you are relying on here.'

At the point of action — when the participant must type a mandatory reply and then decide whether to revise confidence — the AI provides a snippet and a question but no rationale for why this particular counterexample was selected or why it is relevant to the specific comment. The participant cannot inspect 'why is the AI challenging me on this?' before committing to a reply. While the snippet itself is concrete, the selection logic (wizard judgment against a ground-truth key) is entirely opaque to the participant at the decision moment, which matters especially when fallback templates fire. [AGENT_INFERENCE]

## What to reconsider

Redesign the intervention so the blocking pattern no longer fires before re-running Probe. Or reframe the research question so the blocking pattern is not load-bearing on the contribution. [AGENT_INFERENCE]

## Next step

A human researcher must review this finding, decide whether the blocking pattern is a mis-application (in which case file an issue against the pattern library) or a real design problem (in which case redesign), and document the decision before proceeding. [HUMAN_REQUIRED]
