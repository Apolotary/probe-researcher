# Capture-risk audit

**Verdict:** REVISION_REQUIRED

## Axis scores

| axis | score |
|------|-------|
| capacity | -1 |
| agency | 0 |
| exit | 2 |
| legibility | -2 |

## Findings

### capacity.no_fade_mechanism (score -1)

> **Evidence (prototype_spec):** No suggestions appear until the participant explicitly requests them.

Although the participant must initiate each suggestion request (so assistance is request-gated rather than always-on), there is no mechanism that graduates, reduces, or withdraws assistance as the session progresses. The wizard delivers the same 5-chip panel on every request across both poems. This is a weak rather than strong fire: the user controls frequency, but the system itself offers no scaffolded fade or training-wheels-off flow, which would matter more if the tool were studied beyond a single session.

### legibility.opaque_ranking (score -1)

> **Evidence (prototype_spec):** Each chip shows only the candidate word or short phrase (2–4 words maximum), with no score, rank, or provenance label visible to the participant.

The interface explicitly presents 5 candidates with no score, rank, or provenance label. The participant cannot tell why these five were selected, whether they are ordered by divergence, synonymy, or arbitrary bank position, or what pool they were drawn from. This is deliberate for the WoZ illusion, but it nevertheless means the participant operates without a legible basis for the selection at the point of decision. The walkthrough flags this directly as collapsing dense tacit reasoning into a click that the event stream cannot decode.

### legibility.no_rationale_at_point_of_action (score -1)

> **Evidence (simulated_walkthrough):** With no score, rank, or provenance shown, the chips carry only their text, which means the participant's decision leans heavily on aesthetic reaction within a few seconds.

At the point of action — choosing among the 5 chips — the participant has no inline affordance to inspect why a candidate was suggested, what it was divergent from, or what criterion selected it. No 'why this suggestion?' surface is described in the interface. The walkthrough explicitly names this as creating pressure toward fast aesthetic reaction rather than reflective judgment. While this opacity is partly required by the WoZ design, it is still a legibility cost the participant bears at every decision.

## Patterns not fired

- **capacity.substitutes_for_practice**: The skilled action under study is poem drafting, and the participant performs that action throughout — typing lines, deciding whether to accept or reject candidates, and continuing to draft. The tool supplies line-ending candidates but does not perform the act of composition. The participant retains authorship of structure, meaning, and most lexical choices, so the intervention augments rather than substitutes for the core skilled practice.
- **capacity.creates_dependency_loop**: The study is a single 90-minute session with two drafting tasks; there is no longitudinal arc across which dependency could form. Observable signals measure divergence of accepted candidates, not usage growth as a success metric. The analysis plan treats acceptance rate as a descriptive engagement measure rather than an outcome to maximize, so the design does not encode a reinforcing dependency loop.
- **capacity.no_rehearsal_space**: The session_structure explicitly includes a 5-minute warm-up poem task that is not used in analysis, which functions as a low-stakes rehearsal phase for the interface. This is a narrow rehearsal (interface familiarization, not skill-building), but it meets the pattern's trigger condition for a practice environment, so the pattern does not fire. The skilled action itself — poetry drafting — is one the participants already possess, so a rehearsal space for the underlying skill is not the research question.
- **agency.auto_decides_consequential_step**: Every consequential step — requesting suggestions, choosing among them, inserting text, finishing the poem — requires an explicit deliberate participant click. The system never commits text to the draft without the participant selecting a specific chip. The wizard's behind-the-scenes candidate selection is upstream of the participant's decision and does not auto-commit any output. No external-facing consequential action is taken on the participant's behalf.
- **agency.hides_options_before_review**: The interface presents five alternatives simultaneously rather than a single recommendation, and the participant chooses among visible options or rejects all. This is explicitly a multi-option surface, which is the inverse of the pattern's trigger. The participant sees the choice space before committing. The five options are of course a curated subset of the wizard's bank, but at the point of user decision, alternatives are visible alongside each other.
- **agency.weak_override**: Rejecting the suggestion panel is a single click on a visible 'X' button — symmetric in effort to accepting, and the default drafting mode assumes the participant writes their own endings unless they explicitly request suggestions. Override is not hidden, effortful, or framed as deviant; in fact the baseline interaction assumes unaided drafting and suggestions are opt-in per line.
- **agency.paternalistic_default**: Practicing poets with traceable publication records are not a stigmatized or historically paternalized population in the sense the pattern targets (disabled users, elderly users, mental health contexts, children). The intervention does not default to protective or assistive behavior on assumed-need grounds; suggestions are user-requested and opt-in per line. The consent process also explicitly surfaces the corpus-rights question rather than assuming consent.
- **exit.data_lock_in**: The session explicitly exports a plain-text JSON log including the full draft and all event data, with documented fallback export routines if the primary export fails. The poem itself remains the participant's property in a portable format. The design treats data portability as a first-class concern with failure_cases dedicated to rescuing it, which scaffolds rather than undermines exit on the data dimension.
- **exit.workflow_lock_in**: The intervention is a single-participant drafting session in a lab. It does not restructure any collaborative workflow, team cadence, or institutional process. Exit from the tool after the study requires nothing — the participant returns to whatever drafting practice they had before, with no collective switch-back required. The context is bounded to one 90-minute session rather than ongoing use.
- **exit.competence_decay_on_exit**: A single 90-minute session cannot plausibly degrade a practicing poet's unaided compositional skill, and the study does not propose sustained or prolonged use. The research question concerns within-session effects on drafting, not long-term skill trajectories. While the walkthrough notes carryover risk between Poem A and Poem B, this is a within-session methodological concern rather than decay of underlying competence after exit.
- **exit.institutional_dependence**: The entire system runs on localhost with no cloud vendor, no subscription platform, and no internet dependency. Participants do not become tied to a vendor whose policies or existence are outside their control. The research infrastructure is deliberately self-contained, which is a positive design choice against vendor dependence — a small scaffold in favor of exit.
- **legibility.no_failure_signal**: The notion of system 'wrongness' is ill-defined for a creative suggestion tool — a bad candidate is simply rejected by the participant, which is itself the in-flow failure signal the design captures as a reject event. There is no downstream harm from a 'wrong' suggestion that the participant would discover too late, because the participant evaluates every candidate before insertion. The pattern targets systems where error has delayed consequence, which does not fit this drafting context.
- **legibility.unverifiable_summary**: The tool does not produce a summary, synthesis, or distillation that the participant must trust. It produces short candidate word-or-phrase chips that the participant reads in full and inserts or rejects based on direct inspection of the text itself. There is no claim of representing some underlying source material that the participant would need to verify; the chip is the candidate, presented whole.
