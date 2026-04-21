# Capture-risk audit

**Verdict:** REVISION_REQUIRED

## Axis scores

| axis | score |
|------|-------|
| capacity | -1 |
| agency | -1 |
| exit | 1 |
| legibility | -1 |

## Findings

### capacity.no_fade_mechanism (score -1)

> **Evidence (prototype_spec):** For treatment participants: within 90 seconds of PR submission, the wizard injects a structured annotation block into the PR comment thread via the wizard control panel.

Across the 8–12 week longitudinal arc, the annotation scaffold fires at every Step 2 PR submission at a fixed level and format. There is no conditional gating (e.g., withholding annotations in later weeks, reducing their scope as participant confidence grows, or letting participants opt out of sections they've internalized). The assistance does not taper, which is a notable omission given the study's explicit interest in longitudinal mental-model formation.

### agency.hides_options_before_review (score -1)

> **Evidence (prototype_spec):** Select which pre-authored annotation set from the annotation library matches this week's focus area and the specific diff in the patch — the library contains 12 sets, one per anticipated focus area; choose the closest match even if not exact.

The participant sees a single annotation block (one of 12 pre-authored sets, in one of two variants) with no visibility into the space of alternatives the wizard selected from. The annotation's 'Related historical commits' and 'Related modules' sections each present 2–3 items as if definitive; the participant cannot see what other commits or modules were considered and rejected, nor the basis for inclusion. The walkthrough notes this framing functions as 'implicit authority' without option-space exposure.

### exit.competence_decay_on_exit (score 1)

> **Evidence (prototype_spec):** During Part 2, treatment participants may open PRs on the fixture GitHub interface and receive wizard annotations; control participants may use only the pinned Rails documentation PDF and VS Code's global search.

The protocol actively instruments unaided competence at every session: Step 1 navigation, Step 3 sketching, and Step 4 predictive debugging all occur without the annotation firing. The analysis plan compares treatment-vs-control trajectories specifically to detect whether 'navigation paths become more direct... or broader over time,' which is precisely the competence-decay signal this pattern warns about. This is a scaffold-positive design choice that surfaces rather than obscures the exit risk.

### legibility.opaque_ranking (score -1)

> **Evidence (prototype_spec):** (A) 'Related historical commits' listing 2–3 commit SHAs with one-sentence summaries drawn from the wizard's pre-prepared annotation library for this week's focus area; (B) 'Related modules' naming 2–3 files in the codebase with a one-sentence rationale for the connection

The annotation presents 2–3 commits and 2–3 modules as a filtered selection from the much larger codebase without explaining the selection basis. The participant sees the shortlist but not the criteria — whether these are the most frequently touched, most recently modified, most pedagogically instructive, or simply what the wizard pre-authored. The walkthrough explicitly flags that participants may read this framing as 'implicit authority' without a visible ranking rationale at the point of decision.

### legibility.no_failure_signal (score -1)

> **Evidence (prototype_spec):** choose the closest match even if not exact

The wizard is instructed to select a 'closest match' annotation set even when no set cleanly fits the participant's specific diff, and the annotation is presented to the participant without any mismatch indicator. The walkthrough highlights this explicitly: 'Sessions in which the annotation matched poorly would plausibly produce different participant behaviors than sessions with tight matches, and the analysis plan does not currently treat annotation-fit quality as a moderator variable.' Participants have no in-flow signal when the scaffold is giving them suboptimally-matched content.

### legibility.unverifiable_summary (score 1)

> **Evidence (prototype_spec):** (A) 'Related historical commits' listing 2–3 commit SHAs with one-sentence summaries

The annotation names specific commit SHAs and specific file paths within the local Rails clone, which means the participant has a direct inspection path: they can navigate to the commit in git history or open the named file in VS Code to verify the annotation's claims against source. While one-sentence summaries are themselves distillations, the provision of sha and file_path identifiers gives participants a concrete affordance to verify against ground truth, making this a scaffold-positive design rather than a 'trust me' summary.

## Patterns not fired

- **capacity.substitutes_for_practice**: The annotation scaffold does not perform the core skilled actions on the participant's behalf. Navigation (Step 1), architectural sketching (Step 3), and predictive debugging (Step 4) all require the participant to perform the substantive cognitive work unaided; the annotation in Step 2 provides supplementary references (historical commits, related modules, convention rationale) rather than completing the task. The study design preserves rehearsal space for the target skills.
- **capacity.creates_dependency_loop**: The protocol explicitly measures unaided performance through the Step 1 navigation task, Step 3 sketching, and Step 4 predictive debugging, none of which involve the scaffold firing during the task itself. Observable signals track navigation directness, sketch accuracy, and prediction accuracy as capacity indicators rather than treating annotation invocation frequency as a success metric. The design is structured to detect rather than induce dependency.
- **capacity.no_rehearsal_space**: The session structure itself functions as repeated low-stakes rehearsal: Steps 1, 3, and 4 are explicitly unaided skill-practice windows in which the annotation does not fire, and the weekly cadence provides sustained rehearsal across 8–12 sessions. The architectural sketching and predictive debugging tasks are framed as reasoning probes rather than performance evaluations, giving participants a bounded space to practice unaided architectural reasoning.
- **agency.auto_decides_consequential_step**: The annotation is explicitly labeled 'AI Learning Scaffold (for your reference — not a blocking review)' and does not commit to any external action. Participants make all consequential choices (which files to open, which arrows to draw, what fault location to predict, what to write in reflections). The wizard's variant selection affects annotation content but not any outcome binding on the participant or a third party.
- **agency.weak_override**: Override is not a relevant construct here because the annotation is advisory rather than a decision the participant must dismiss. The preface 'for your reference — not a blocking review' explicitly frames the annotation as non-binding, and participants can ignore it with zero friction by simply not acting on its content. There is no auto-decision flow requiring an override path.
- **agency.paternalistic_default**: Participants are mid-level software engineers with 2–6 years of professional experience, not a population historically subject to paternalistic assistive design (disabled users, elderly users, mental health contexts, children). The 'onboarding to an unfamiliar codebase' framing positions participants as competent professionals learning a specific system rather than as a stigmatized group requiring protective defaults.
- **exit.data_lock_in**: Session artifacts are stored in accessible, portable formats: CSV logs, Google Forms exports, PNG exports of Miro boards, and Zoom recordings. The Rails codebase used is open-source and cloned locally. There are no proprietary schemas or platform bindings that would prevent participants from taking their own produced content (reflections, learning) away from the study context.
- **exit.workflow_lock_in**: The study is structured as individual research sessions rather than team workflow integration. The fixture PR interface is a self-contained localhost:4000 simulation that does not alter the participant's actual work processes, team communication norms, or code review practices outside the study. Exit from the study does not require any collective switch-back by other actors or systems.
- **exit.institutional_dependence**: The study uses open-source materials (Rails codebase), a self-hosted fixture (localhost:4000), and commodity tools (VS Code, Chrome, Zoom, Google Forms). Participants do not become dependent on any single vendor or institution for the skills or knowledge they develop during the study; the 'AI scaffold' itself is a wizard-of-oz simulation with no persistent service to depend on after the study ends.
- **legibility.no_rationale_at_point_of_action**: The annotation block explicitly contains a 'Convention rationale' section and one-sentence rationales per commit and per related module, providing inline explanation at the point the participant reads the annotation and decides whether to act on it. The rationale is co-presented with the content rather than deferred to documentation or post-hoc explanation, which is the specific remedy this pattern calls for.
