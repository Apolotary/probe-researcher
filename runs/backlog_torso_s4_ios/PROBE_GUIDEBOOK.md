## Premise

The researcher has framed a study examining how a mobile recreation of an MPC-style hardware sampler interface creates tension between touchscreen interaction conventions (scroll, long-press, modal sheets) and the hardware's velocity-sensitive, eyes-free, two-handed tactile loop. [RESEARCHER_INPUT]

The sharpened question this guidebook addresses is: when mobile-native novice beatmakers who have never touched an MPC encounter an MPC-faithful mobile app, which hardware-derived interaction idioms do they spontaneously reinvent as mobile conventions, and which do they reject as foreign? [AGENT_INFERENCE]

This study is formative and generative. It is designed to surface design hypotheses and case descriptions about hardware-to-mobile idiom transfer. [AGENT_INFERENCE]

This study cannot support a generalizable taxonomy of "transfer-tolerant" versus "transfer-resistant" idioms, nor population-level convergence claims about mobile-native beatmakers. [DO_NOT_CLAIM]

This study cannot support claims about MPC-experienced producers, disabled mobile producers using assistive technology, or long-term adoption behavior. [DO_NOT_CLAIM]

## Background

Sanders and Stappers position generative toolkits and prototypes within a "designing with people" participatory mindset, distinct from the "designing for people" mindset, and characterize such instruments as making approaches within codesign rather than as data-extraction instruments. [SOURCE_CARD:sanders_stappers_2014]

The same authors frame probes as instruments for inspiration and dialogue rather than for extracting generalizable user data — a framing that should constrain how results from a six-participant workshop are claimed. [SOURCE_CARD:sanders_stappers_2014]

Gaver, Dunne, and Pacenti introduced cultural probes as packages of artefacts designed to elicit inspirational fragments from participants, embracing uncertainty and partial returns rather than seeking comprehensive coverage of user behavior. [SOURCE_CARD:gaver_dunne_pacenti_1999]

Illich's distinction between convivial and industrial tools — whether a tool expands or contracts the range of autonomous action available to its users — offers a frame for asking which hardware-derived idioms afford or foreclose novice mobile agency when ported to glass. [SOURCE_CARD:illich_1973]

The following named literatures were flagged during review as potentially adjacent but are NOT in the Probe corpus. The researcher must locate, verify, and independently ground each before citing in the real study. [UNCITED_ADJACENT]

- NIME-style evaluation work on digital musical instruments and loss of passive haptic feedback when porting physical instruments to touchscreens (Wanderley, Tahiroğlu lineage) — named in the premise analysis, not in corpus. [UNCITED_ADJACENT]
- Finger-drumming accuracy studies comparing touchscreens to velocity-sensitive pads — named in the premise analysis, not in corpus. [UNCITED_ADJACENT]
- Accessibility literature on mobile music production by blind, low-vision, and motor-disabled producers using VoiceOver, Switch Control, and AssistiveTouch — flagged by accessibility reviewer, not in corpus. [UNCITED_ADJACENT]

## Prototype

The prototype is a 120-minute co-design workshop held in a quiet usability lab with one participant, one facilitator, one wizard, and one silent observer. [AGENT_INFERENCE]

The participant sits at a central table with an iPad Pro running a Figma prototype in kiosk mode; the wizard operates a mirrored Figma file from a secondary workstation 1.5 m behind the participant and advances screen states in response to participant gestures relayed through a pre-agreed hand-signal vocabulary. [AGENT_INFERENCE]

The Figma prototype contains a base state (16-pad grid, step sequencer, bank buttons A–D, shift button), 16 individual pad-highlight frames, a shift-chord overlay layer, four bank color variants, and five conflict-card variant screens corresponding to common mobile patterns (long-press overlay, mode-switch toggle, swipe-to-reveal, floating action button, radial context menu). [AGENT_INFERENCE]

The session proceeds through five phases: (1) welcome and consent, (2) silent orientation videos of MPC hardware and the mobile app, (3) fifteen minutes of free exploration of the Figma prototype, (4) conflict-card co-design in which the participant sketches and enacts alternatives to five hardware-derived idioms, and (5) a structured debrief. [AGENT_INFERENCE]

The five conflict cards target: shift-chord two-handed secondary function access, bank switching between four sample banks, pad long-hold for sample assignment, step-lane horizontal scroll for sequence extension, and simultaneous multi-pad press for chord triggering. Each card describes the hardware behavior and the mobile friction in plain language. [AGENT_INFERENCE]

Per the methodologist's blocking requirement, the protocol includes a **pre-enactment verbalization step**: after sketching and before touching the iPad, the participant fully describes their intended interaction in words. This pre-enactment description is recorded and coded as the primary framing measure, with post-enactment narration treated as secondary. [AGENT_INFERENCE]

The wizard's in-session classification sheet (reinvented / rejected / accepted-as-is) is removed from the analysis pipeline. Classification is reconstructed post-hoc from screen recordings, transcripts, and sketches by two coders blinded to which variant the wizard surfaced, with Cohen's kappa reported per idiom. [AGENT_INFERENCE]

## Study protocol

### Recruitment

Recruit six mobile-native novice beatmakers who have produced music exclusively on smartphones or tablets for at least six months. [AGENT_INFERENCE]

Operationalize the MPC-exclusion criterion with specific screener items (e.g., "Have you ever pressed pads on an MPC, Maschine, or Push hardware unit for more than 30 seconds total? Have you installed MPC Beats, Maschine, or Ableton Push software on a laptop or desktop?"). Record a pre-specified decision rule for borderline exposure. [AGENT_INFERENCE]

Add an explicit accessibility-needs item and accommodation offer to the screener and recruitment materials. If the Figma prototype has not been audited for VoiceOver/TalkBack labeling, state this limitation and narrow the population claim accordingly. [AGENT_INFERENCE]

Report the recruitment funnel: how many screened, how many excluded, on what grounds. [AGENT_INFERENCE]

### Materials

- iPad Pro 12.9-inch (6th gen, iPadOS 17), two units: one participant-facing, one wizard-facing, both loaded with the Figma prototype in kiosk mode. [AGENT_INFERENCE]
- Figma file `MPC_Mobile_CoDesign_B_v3` containing base state, 16 pad-highlight frames, shift-chord overlay, four bank variants, five conflict-card variant screens, annotation label zones, thank-you screen, and neutral spinner frame. [AGENT_INFERENCE]
- Five laminated A6 conflict cards written at a 10th-grade reading level, one per target idiom. [AGENT_INFERENCE]
- Three seed-sketch A5 sheets for the no-response fallback (shift-chord, bank-switch, chord-pad), stored face-down. [AGENT_INFERENCE]
- Blank A5 paper (30 sheets), fine-tip markers in four colors, six Likert response cards (one per conflict card plus one spare). [AGENT_INFERENCE]
- Structured observer note sheet with timestamp fields and behavioral event checklist. [AGENT_INFERENCE]
- Wizard hand-signal vocabulary reference card (eight signals mapped to eight session events). [AGENT_INFERENCE]
- Three-minute silent hardware MPC video and two-minute silent app demo video, both 1080p MP4. [AGENT_INFERENCE]
- Screener form, informed consent form, and laminated screenshot card for prototype-crash fallback. [AGENT_INFERENCE]
- Observer iPhone with Signal installed for transferring sketch photographs to the wizard's MacBook. [AGENT_INFERENCE]

### Procedure

0–10 min: Welcome, informed consent review, screener reconfirmation, and ice-breaker about the participant's current mobile beatmaking app. [AGENT_INFERENCE]

10–25 min: Silent orientation videos. Note: the reviewer flagged this phase as a construct-validity risk because the research question references "spontaneous encounter" with the mobile app while participants in fact encounter the hardware first. The researcher must choose before running the study: drop the hardware video and let participants encounter only the app, or reframe the research question to acknowledge that the study measures response to a structured hardware→app comparison. [AGENT_INFERENCE]

25–40 min: Free exploration of the Figma prototype with think-aloud. No assigned task. [AGENT_INFERENCE]

40–75 min: Conflict-card co-design. For each of the five cards, the participant reads the card, sketches on paper, **verbalizes the intended interaction in full before touching the iPad** (this verbalization is the primary framing measure), then enacts on the prototype and narrates. [AGENT_INFERENCE]

75–100 min: Iteration phase — participant selects and refines two earlier sketches. [AGENT_INFERENCE]

100–115 min: Structured six-question debrief. [AGENT_INFERENCE]

115–120 min: Compensation, data-consent re-confirmation, wrap-up. [AGENT_INFERENCE]

### Ethics and compensation

Name the compensation amount explicitly in the protocol document rather than deferring to "IRB-approved" as a placeholder. Justify the amount against 120 minutes of generative design labor plus pre-session screener time. [AGENT_INFERENCE]

Disclose the cognitive rhythm of the session at consent (five sketch–verbalize–enact–rate cycles plus debrief), and include a participant-initiated break protocol in the consent document itself rather than leaving it to facilitator discretion. [AGENT_INFERENCE]

Specify reading level and plain-language review for the consent form and Likert items, matching the 10th-grade standard already applied to the conflict cards. [AGENT_INFERENCE]

### Scope of claims

This method can support: case-level descriptions of how individual mobile-native novices propose to resolve specific hardware-derived idioms; design hypotheses for future testing; identification of which conflict cards produced convergent versus divergent proposals within this particular sample. [AGENT_INFERENCE]

This method cannot support: a generalizable "design vocabulary" or taxonomy; population-level claims about mobile-native beatmakers as a class; categorical idiom classifications based on threshold rules like 4-of-6 convergence; claims about disabled mobile producers whose accommodation is not built into the protocol. [DO_NOT_CLAIM]

Following the Sanders and Stappers grounding the branch card cites, the contribution is framed as hypothesis-generating case material for design dialogue, not as extraction of generalizable user data. [SOURCE_CARD:sanders_stappers_2014]

## Failure hypotheses to test

H1. Mobile-native participants will not discover the two-finger shift-chord gesture during free exploration, meaning the shift-chord conflict card would introduce the idiom rather than problematize an already-encountered one. [SIMULATION_REHEARSAL]

H2. When the neutral spinner fires, subsequent participant verbal framing would likely shift toward hardware-analogy vocabulary compared to enactments that triggered a clean variant, producing a measurement artifact in the framing-code distribution. [SIMULATION_REHEARSAL]

H3. Participants selecting their "two most right" sketches for iteration would likely favor sketches whose enactments produced clean wizard responses, systematically under-sampling the most prototype-stretching proposals. [SIMULATION_REHEARSAL]

H4. Likert item 5 ("I invented something new here") would likely diverge from the composite transfer-tolerance score across the five idioms, indicating the composite is not capturing the novel-framing construct the study cares about. [SIMULATION_REHEARSAL]

H5. The shift-chord idiom would plausibly require the seed-sketch fallback at a higher rate than the other four idioms, which would affect any classification that rested on sketch data from that card. [SIMULATION_REHEARSAL]

H6. The paper-sketch overlay, when it fires in Step 4, would likely change subsequent narration style toward deictic reference to the participant's own drawing and away from reference to mobile conventions. [SIMULATION_REHEARSAL]

H7. Pre-enactment verbalization and post-enactment narration would likely diverge in framing-code distribution, with post-enactment narration drifting toward the mobile convention embodied by whichever variant the wizard surfaced. [SIMULATION_REHEARSAL]

H8. Fatigue across the 120-minute session would concentrate on the debrief, which is also where the heaviest analytical weight sits under the original plan — a timing mismatch between participant lucidity and data weight. [SIMULATION_REHEARSAL]

## Risks and failure modes

### Instrument–measurement entanglement (blocking in original review)

Risk: the wizard is simultaneously the real-time instrument and the classifier whose judgment produces the headline output, without blinding or inter-rater reliability. [AGENT_INFERENCE]

Mitigation: remove the wizard's classification sheet from the analysis pipeline. Reconstruct reinvented/rejected/accepted-as-is categorization post-hoc from screen recordings, transcripts, and sketches by two coders blinded to wizard variant selection, with kappa reported per idiom. Any idiom whose classification depends on wizard-session judgment alone is reported as unresolved. [AGENT_INFERENCE]

### Wizard variant selection anchoring participant narration (agency: hides options before review)

Risk: when a participant's enactment is ambiguous, the wizard selects one pre-built variant to surface, and the participant's subsequent narration anchors to that selection without seeing the alternatives the wizard chose among. [AGENT_INFERENCE]

Mitigation: add the pre-enactment verbalization step (participant fully describes intended interaction in words before touching the iPad). Code pre-enactment verbalization as the primary framing measure. Treat post-enactment narration as a secondary measure and report the divergence between the two as its own finding. [AGENT_INFERENCE]

### No rationale at point of action (legibility)

Risk: when the wizard advances to a variant screen, the participant sees the resulting state but has no inline indication of what the "system" attributed to their gesture, so subsequent design reasoning proceeds without knowing what interpretation was applied. [AGENT_INFERENCE]

Mitigation: in the post-session interview, play back the screen recording at key enactment moments and ask the participant what they thought the system understood. Code this reflection separately from in-session narration. [AGENT_INFERENCE]

### Sample size versus categorical claim

Risk: n=6 with a 4-of-6 threshold cannot support categorical taxonomic claims; a single idiosyncratic participant moves an idiom across a boundary. [AGENT_INFERENCE]

Mitigation: remove the 4-of-6 threshold from the analysis plan. Report per-participant results and frame the contribution as hypothesis-generating case descriptions. If categorical claims are later desired, pre-register a larger sample with a stopping rule based on idiom-category stability. [AGENT_INFERENCE]

### Stimulus confound in orientation phase

Risk: the research question concerns "spontaneous encounter" with the mobile app, but participants encounter the MPC hardware video first. [AGENT_INFERENCE]

Mitigation: before running the study, choose one of two paths and document the choice: (a) drop the hardware video entirely, or (b) reframe the research question to acknowledge a structured hardware→app comparison. Do not run both framings in the same study. [AGENT_INFERENCE]

### Composite scale construct validity

Risk: the transfer-tolerance composite averages three of five Likert items with no psychometric validation, and uses numeric cutoffs (3.5, 2.5) to produce categorical classifications. [AGENT_INFERENCE]

Mitigation: report all five Likert items separately. Do not construct the composite unless factor structure is assessed post-hoc and reliability reported. Remove the 3.5 / 2.5 categorical cutoffs. [AGENT_INFERENCE]

### Screener cannot reliably verify "never touched an MPC"

Risk: the key exclusion criterion rests on self-report with no operational definition; recruitment pressure may push toward accepting marginal cases. [AGENT_INFERENCE]

Mitigation: operationalize the exclusion with specific items (30-second pad-press threshold; laptop software install history). Add a same-day re-verification step with a pre-specified decision rule for borderline exposure. Report the recruitment funnel. [AGENT_INFERENCE]

### Accessibility default-exclusion

Risk: silence in the screener, prototype, and session materials about disability accommodation will default-exclude disabled mobile producers, whose idioms are plausibly the most divergent from MPC hardware — laundering the exclusion as "not finding" those proposals. [AGENT_INFERENCE]

Mitigation: add an accessibility-needs question and accommodation offer to the screener and recruitment flyers. Audit the Figma prototype for VoiceOver/TalkBack labeling, or state explicitly that the prototype does not support assistive technology and narrow the population claim to "non-AT-using mobile-native novice beatmakers." [AGENT_INFERENCE]

### Consent hygiene and compensation transparency

Risk: consent does not disclose the cognitive load of the 120-minute five-cycle protocol; compensation amount is unspecified in a document that specifies every other material down to marker color. [AGENT_INFERENCE]

Mitigation: name the compensation amount in the protocol document. Disclose the session rhythm at consent. Specify reading level review for consent form and Likert items. Include a participant-initiated break protocol in the consent document. [AGENT_INFERENCE]

### Next steps

Before running this study, the researcher must: (1) decide and document the orientation-phase framing choice (drop the hardware video or reframe the research question) and revise all study materials to match; (2) audit the Figma prototype for assistive-technology compatibility or explicitly narrow the population claim; (3) finalize the operationalized MPC-exclusion screener items and the borderline-exposure decision rule; (4) prepare the two-coder blinded post-hoc classification protocol including the codebook and kappa reporting plan; (5) name the compensation amount and justify it against 120 minutes of generative design labor; (6) pilot the full protocol including the pre-enactment verbalization step with at least one participant who meets the screener, and revise the hand-signal vocabulary and wizard variant-selection rules based on pilot findings; (7) obtain IRB approval covering the revised consent language, break protocol, and compensation rate; (8) independently verify and ground the uncited adjacent literatures flagged in the Background section before citing them in any write-up. [HUMAN_REQUIRED]
