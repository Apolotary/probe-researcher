## Session opening

Reaching the consent and warm-up phase with a practicing poet, a participant would plausibly arrive with some ambivalence: poetry drafting is typically solitary and unobserved, and the presence of a facilitator in the room — even seated at 90 degrees and looking away — would likely create a mild performance pressure during the first few minutes. The warm-up prompt ('a door left open') is neutral enough that it should not bias the core draft, but a participant might reasonably treat the warm-up itself as the "real" task and invest more craft in it than intended, particularly if they are uncertain whether the 5-minute cap is strict. [SIMULATION_REHEARSAL]

The task brief is dense: it specifies the line-break trigger, the accept/reject mechanic, the 5-word minimum, and the option to speak the reason aloud. A participant skimming this on screen would likely register the mechanic but miss the "at least 5 words" constraint until they encounter it for the first time, at which point the interface lock would plausibly feel more coercive than the brief had implied. The wizard's step-1 decision about whether reading time is sufficient is therefore load-bearing: under-reading would concentrate confusion in the first one or two rejections of the core phase. [SIMULATION_REHEARSAL]

A poet accustomed to composing in longhand or in a minimalist text editor would likely find the split-pane layout (textarea on the left, annotation panel on the right) cognitively intrusive even before any alternative appears, because the right-hand panel signals that surveillance and response are imminent. This pre-injection ambient awareness would plausibly shape the drafting register itself, pushing the participant toward shorter, more cautious lines than they might otherwise write. [SIMULATION_REHEARSAL]

## Task flow walkthrough

### Step 1 — reading the brief and starting the clock

A participant encountering the 'Begin Drafting' button would likely press it before fully absorbing the 5-word annotation constraint, because green primary-action buttons pull the eye past surrounding instructional text. The wizard's reliance on reading time as a proxy for comprehension is a weak signal here; a fast reader and a skimmer would be hard to distinguish from the control-panel view alone. [SIMULATION_REHEARSAL]

The "no alternative on the first line" design choice would plausibly help the participant settle, but it also creates an asymmetric expectation: if the second line produces an injection while the first did not, the participant may reasonably infer that the system is reacting to the content of line two specifically, rather than following a fixed schedule. This misattribution could contaminate early rejection annotations with content-specific reasoning that does not generalise. [SIMULATION_REHEARSAL]

### Step 2 — receiving the first injected alternative

Reaching the first injection, a participant would likely experience a sharp attentional break: the textarea blurs, the annotation panel slides in, and a suggested line ending appears from an unexplained source. Under the task framing, confusion would plausibly concentrate around authorship — specifically, whether the alternative represents a machine suggestion, a human collaborator's suggestion, or something else — and this attribution would in turn shape the rejection reason. A participant who imagines a human source may reasonably produce more polite or hedged rejections than one who imagines an algorithm. [SIMULATION_REHEARSAL]

The wizard's decision among the four candidate categories (metric, phonetic, semantic, syntactic) happens in a 3-second window and is rehearsed as "diagnostic given the line just written." In practice, a wizard reading a freshly written line under time pressure would likely default to whichever candidate is most readily available in the bank rather than the one most diagnostic, which would bias early injections toward well-stocked categories and could distort the category-to-taxonomy-node contingency analysis downstream. [SIMULATION_REHEARSAL]

The interface-lock design (textarea blurred until the participant acts) is intended to force engagement, but it would plausibly be experienced as an interruption to compositional flow rather than a neutral prompt. A participant mid-thought about a later line would likely lose that thought during the lock, and the resulting rejection annotation could then reflect frustration at interruption as much as disagreement with the alternative itself. [SIMULATION_REHEARSAL]

### Step 3 — typing or speaking the rejection reason

Reaching the annotation field with the 5-word minimum enforced, a participant would likely encounter a pragmatic tension: the most lexically accessible rejection reasons for poetic choices are often short ("wrong rhythm", "off-key", "too flat"), and padding these to five words could produce annotations whose extra words are filler rather than content. The "X more words needed" counter would plausibly nudge some participants toward formulaic padding ("the rhythm feels wrong to me") rather than elaboration of a new criterion. [SIMULATION_REHEARSAL]

The microphone option is a useful safety valve for participants whose articulation is faster spoken than typed, but it introduces a modality confound: spoken rejections are likely to be longer, more associative, and more hedged than typed ones, simply because speech is less effortful. If the taxonomy coding treats typed and spoken annotations as equivalent, the resulting node frequencies would plausibly reflect modality as much as criterion. [SIMULATION_REHEARSAL]

The wizard's real-time categorisation into a provisional taxonomy node, happening while the next line is being drafted, would likely accumulate coder drift across a session. A wizard fatigued at minute 55 would reasonably apply categories differently than at minute 15, and because this live coding also drives the wizard's next injection-category choice, any drift would propagate into the stimulus stream itself rather than only the analysis. [SIMULATION_REHEARSAL]

### Step 4 — continuing through middle and closing stanzas

A participant reaching the middle of the draft would plausibly develop a working model of when injections occur and may begin composing lines with the injection in mind — either writing "safer" lines that are hard to offer alternatives for, or deliberately writing provocative lines to see what the system surfaces. Either adaptation would shift the session from naturalistic drafting toward a meta-task, which the observable-signals analysis plan does not appear to distinguish from the intended behaviour. [SIMULATION_REHEARSAL]

The INJECT_DENSITY_INCREASE control, triggered when rejection counts are low late in the session, would likely produce a visible shift in injection rhythm that a participant would notice. A reasonable inference in that moment is that the tool has "escalated" because earlier responses were inadequate, which could induce either over-elaboration or disengagement in subsequent annotations. [SIMULATION_REHEARSAL]

The 'Finish Poem' transition — revealing accepted alternatives in green and rejected ones in red alongside margin-note annotations — is a substantial surprise. A participant who did not expect their own annotations to be shown back to them would likely re-read them with a critical eye and may regret specific phrasings. This retrospective re-reading could usefully inform the debrief but would also risk the participant mentally revising their criteria in ways that blur the distinction between moment-of-decision and retrospective reasoning, which the branch's core claim rests on. [SIMULATION_REHEARSAL]

### Step 5 — Likert questionnaire and handover to debrief

Reaching the 10-item Likert questionnaire, a participant would likely answer the intrusiveness items in part with reference to the annotation requirement and in part with reference to the injections themselves, but the item wording would need to disambiguate these carefully. A participant who found the injections interesting but the 5-word minimum annoying might reasonably give contradictory-looking scores, and the analysis plan's correlation of intrusiveness with rejection count would plausibly conflate these two sources of burden. [SIMULATION_REHEARSAL]

The 10-minute window for the wizard to prepare 3–5 flagged annotations for debrief is tight given that the questionnaire itself could be completed in 4–5 minutes by a motivated participant. A rushed flagging pass would likely over-select annotations that are merely short over annotations that are substantively ambiguous, which would bias the debrief toward the "tautological" failure case even when it did not occur. [SIMULATION_REHEARSAL]

## Friction hotspots

- The 5-word minimum is the single highest-friction element of the design; a participant would plausibly encounter it as both a cognitive constraint (forcing articulation) and a compliance constraint (forcing padding), and disentangling these two effects from the annotation corpus would be non-trivial. [SIMULATION_REHEARSAL]
- The textarea-blur-and-lock mechanic would likely produce measurable disruption to compositional flow, and a subset of rejection annotations would plausibly reflect annoyance at the interruption rather than properties of the alternative itself. [SIMULATION_REHEARSAL]
- Wizard latency under the 3-second injection window is a realistic operational risk, and the failure-case fallback (Queue Next dropdown) shifts the wizard's cognitive load from "choose in the moment" to "commit in advance," which could reduce the diagnostic fit between line and alternative that the step-2 wizard-decision logic depends on. [SIMULATION_REHEARSAL]
- The authorship attribution of the alternatives is unspecified to the participant, and their implicit model of the source (algorithm, hidden human, pre-written bank) would plausibly shape the tone and content of rejection reasons in ways that are not captured in any observable signal. [SIMULATION_REHEARSAL]
- The accept option has almost no annotation requirement attached to it, so acceptances are effectively silent in the dataset; a participant who accepts a suggestion for complex reasons (curiosity, fatigue, genuine preference) would leave no trace distinguishing these, while rejections carry mandatory articulation — this asymmetry would plausibly under-describe the decision space. [SIMULATION_REHEARSAL]

## Risks to interpretation

The branch's core claim — that moment-of-decision annotation yields criteria not recoverable from other formats — depends on a meaningful contrast between the typed annotation corpus and the think-aloud corpus. A risk here is that the think-aloud protocol may be sparsely populated, because the annotation mechanic itself consumes the verbal channel: a participant typing or dictating a rejection reason is unlikely to also be thinking aloud in parallel. This could plausibly yield a think-aloud corpus too thin to support the elicitation-completeness comparison as specified. [SIMULATION_REHEARSAL]

A second risk is that the alternative-category-to-taxonomy-node contingency analysis conflates three distinct sources of association: genuine cognitive alignment between stimulus and criterion, wizard selection bias (choosing the category they expect will provoke a particular reason), and coder drift in the live categorisation. The chi-square result would remain uninterpretable without a design feature that separates these sources, such as randomised category assignment or blind post-hoc coding. [SIMULATION_REHEARSAL]

A third risk concerns the relationship between the warm-up poem and the core draft. A participant who uses the warm-up to develop a strategy for meeting the 5-word minimum would likely carry that strategy into the core phase, and the annotations collected in minutes 10–70 would plausibly reflect the participant's rehearsed answering style as much as their live criteria. The design does not currently mark warm-up-phase annotations as distinct from core-phase ones in a way that would let this be examined. [SIMULATION_REHEARSAL]

A fourth risk is that the single-session, within-participant structure cannot distinguish stable craft criteria from session-specific responses. A poet who rejects three semantic-congruent-but-tonally-flat alternatives in a row may be articulating a deep criterion or may be pattern-matching to their own earlier rejections; the repeat-category wizard decision in step 3 is intended to probe this, but in practice the participant's awareness of repetition would likely contaminate the test. [SIMULATION_REHEARSAL]

## Testable questions for the real session

- Does the 5-word minimum produce a detectable distribution shift toward formulaic padding phrases, and if so, at what word count does elaboration appear to become voluntary rather than compliance-driven? [SIMULATION_REHEARSAL]
- Do typed annotations and spoken (microphone) annotations differ systematically in length, taxonomic diversity, or hedging, such that modality should be treated as a covariate in the coding scheme? [SIMULATION_REHEARSAL]
- What implicit model of authorship do participants form about the injected alternatives, and does prompting them in debrief to name this model reveal variation that correlates with their rejection style? [SIMULATION_REHEARSAL]
- Does the accept/reject asymmetry in annotation requirement produce an interpretable acceptance rate, or are accepts so under-described that they function as noise in the record? [SIMULATION_REHEARSAL]
- Do participants adapt their drafting register or line-length distribution across the 60-minute core phase in ways consistent with gaming the injection schedule, and if so, does this adaptation correlate with the INJECT_DENSITY_INCREASE trigger moment? [SIMULATION_REHEARSAL]
- Do the debrief responses to flagged annotations reveal criteria that were present at the moment of decision but not articulated in the 5-word-minimum text, supporting or undermining the branch's elicitation-completeness claim? [SIMULATION_REHEARSAL]
- Does wizard live-categorisation of taxonomy nodes during the session agree with post-hoc blind coding by independent researchers, and where they diverge, does the divergence concentrate in specific node types? [SIMULATION_REHEARSAL]
- Do hesitation events logged by the observer predict annotations that introduce novel taxonomy nodes rather than annotations that elaborate existing ones, which would help distinguish deliberation about criterion from deliberation about wording? [SIMULATION_REHEARSAL]
