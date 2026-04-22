## Premise

The researcher's starting question asked when an AI assistant's proactive reminders feel supportive versus paternalistic in ADHD-adjacent knowledge worker contexts. [RESEARCHER_INPUT]

Sharpening surfaced that "ADHD-adjacent" was doing ambiguous work — recruitment criterion, design target, or hedge against committing to a clinical population — and that the supportive/paternalistic dichotomy is a researcher-imposed frame worth decomposing rather than accepting. [AGENT_INFERENCE]

This guidebook plans a formative elicitation study whose purpose is to recover the dimensions adults scoring at or above the ASRS v1.1 threshold actually use when sorting reminder vignettes, without being primed on the supportive/paternalistic dichotomy. [AGENT_INFERENCE]

The study can support the generation of a candidate taxonomy of participant-named dimensions to be carried into a subsequent evaluative study. [DO_NOT_CLAIM]

The study cannot support claims that any recovered dimension predicts acceptability, generalizes to adults with ADHD as a diagnostic population, or represents a population-level pattern across diagnosis status, medication status, gender, or comorbidity. [DO_NOT_CLAIM]

## Background

Gaver, Dunne, and Pacenti framed probes as instruments for inspiration and dialogue, embracing uncertainty and partial returns rather than seeking comprehensive coverage of user behavior. [SOURCE_CARD:gaver_dunne_pacenti_1999]

Sanders and Stappers positioned probes alongside generative toolkits and prototypes, arguing that probe-derived material is for inspiration rather than for extracting generalizable user data — a posture this guidebook adopts by treating card-sort output as candidate vocabulary, not as measured effects. [SOURCE_CARD:sanders_stappers_2014]

Buijsman, Carter, and Bermúdez distinguish domain-specific autonomy as having two components — skilled competence and authentic value-formation — and argue that AI decision-support can erode these via absent failure indicators and unconscious value shifts; this frames why "supportive vs. controlling" is too coarse for the folk dichotomy the study is trying to decompose. [SOURCE_CARD:buijsman_carter_bermudez_2025]

Longoni and colleagues identify "uniqueness neglect" — the belief that AI cannot account for consumers' unique characteristics — as a primary driver of resistance to AI in consequential domains, suggesting that perceived fit between the system's model of the user and the user's self-model is a candidate dimension to watch for in sorting behavior. [SOURCE_CARD:longoni_2019_medical_ai_resistance]

Illich's convivial/industrial tool distinction — whether a tool expands or contracts the range of autonomous action — offers a theoretical anchor for why reversibility and user-initiated goal-setting may surface as participant-named dimensions rather than as researcher-imposed ones. [SOURCE_CARD:illich_1973]

Named outside-corpus literature the reviewer flagged which the researcher must verify and ground before citing: the Mark, Iqbal, and Czerwinski lineage on notification interruption and acceptability; Calvo and Peters on wellbeing-supportive and autonomy-supportive design in behavior-change apps; Deci and Ryan's Basic Psychological Needs Scale as the source of the 5-item autonomy-perception adaptation; Nielsen's and Tullis & Wood's published card-sort sample-size guidance as comparators for the N=12 justification. [UNCITED_ADJACENT]

## Prototype

The prototype is a single 90-minute in-person or remote session in which one participant sorts 40 reminder-scenario vignette cards into participant-constructed piles while thinking aloud, supported by a facilitator, a wizard operating the card-display and logging interface, and a silent observer taking timestamped non-verbal notes. [AGENT_INFERENCE]

The 40 vignettes are constructed on a 4-variable fractional factorial (resolution IV minimum) varying timing (immediate / +15 min / +2 hr), framing (informational / directive / collaborative), source of goal (user-initiated / system-inferred / third-party), and reversibility (dismissible / snooze-only / not-dismissible). [AGENT_INFERENCE]

The session opens with consent, then a 3-card warm-up on an unrelated topic (weather) to rehearse the think-aloud protocol before the reminder-sorting phase begins. [AGENT_INFERENCE]

Core sorting (cards 1–40) proceeds at participant-directed pace with a silence-prompt every 90 seconds; the wizard advances cards only after the participant has finished reading, speaking, and dragging. [AGENT_INFERENCE]

After all cards are placed, the participant reviews each pile, assigns a label in their own words, and provides a 2–3 sentence rationale; the wizard captures the final state as a screenshot and as a JSON export. [AGENT_INFERENCE]

A 10-minute semi-structured debrief covers the hardest-to-place card, the single most important criterion the participant used, and any reminder type they feel belongs in none of their piles. [AGENT_INFERENCE]

A 5-item autonomy-perception questionnaire adapted from the Basic Psychological Needs Scale autonomy subscale is administered at session end, referencing the reminders seen in the study rather than general life contexts. [AGENT_INFERENCE]

Data capture comprises think-aloud audio (transcribed), card-placement event logs (Google Sheet and SQLite fallback), pile labels and rationales, observer non-verbal notes, a final-state screenshot and JSON export, and the autonomy-perception questionnaire. [AGENT_INFERENCE]

## Study protocol

### Recruitment criteria

Target N: to be set by a saturation-based stopping rule or justified against a comparable published card-sort (e.g., Nielsen; Tullis & Wood) rather than fixed at N=12 without justification. [AGENT_INFERENCE]

Include adults (18+) who either (a) score at or above the ASRS v1.1 Part A threshold on a research-team-administered screener, or (b) self-identify as having ADHD with or without formal diagnosis; record both screener and self-identification status separately rather than collapsing them. [AGENT_INFERENCE]

Record and report per participant: formal diagnosis status (self-report), medication status, gender, co-occurring anxiety/depression/autism self-report, age at identification, current reminder-tool use, and recruitment source (ADHD community forum vs. university access panel vs. other). [AGENT_INFERENCE]

Do not collapse recruitment sources in analysis without reporting an emergent-dimension breakdown stratified by source, because community-forum recruitment may introduce the supportive/paternalistic discourse the protocol is trying not to prime. [AGENT_INFERENCE]

### Accommodations and accessibility

Offer in recruitment materials: font size and typeface alternatives (sans-serif and OpenDyslexic available on request), audio administration of ASRS and autonomy questionnaire, plain-language consent, and a 60-minute reduced-vignette option or a two-session split for participants who prefer that structure. [AGENT_INFERENCE]

Ask at scheduling which reading/format preferences each participant has and record uptake to inform sample characterization. [AGENT_INFERENCE]

### Procedure

Compensate participants at an expertise rate (e.g., $75–100 for 90 minutes) rather than at a minimum-wage participation rate, and state compensation explicitly in recruitment materials and consent. [AGENT_INFERENCE]

Introduce a scripted participant-initiated break channel during the welcome: "You can say 'I need a minute' at any point, as many times as you want, and we pause. You don't need to explain why." Remove the single-break ceiling between cards 20–35. [AGENT_INFERENCE]

Retain the wizard-triggered Rest Break Signal as a redundancy, not as a substitute for participant self-determination. [AGENT_INFERENCE]

Remove the wizard-types-label-on-behalf rule. If pacing becomes a concern, the facilitator may read the scripted pile-label prompt a second time at 30 seconds, but labels are entered by the participant or explicitly declined ("I don't want to name this one yet" is a valid and logged response). [AGENT_INFERENCE]

Clarify during orientation which surface (monitor or iPad) is canonical for reading the vignette text, with an explicit scripted line. [AGENT_INFERENCE]

### Materials list

40 vignette cards rendered in the card-sort SPA, each showing a 3–4 sentence reminder scenario, a card ID, and a wizard-only metadata footer showing design-variable levels. [AGENT_INFERENCE]

3-card warm-up deck on unrelated non-reminder content. [AGENT_INFERENCE]

Card-sort single-page application with drag-and-drop placement, wizard admin panel, WebSocket connection with a local SQLite fallback log, snapshot API, and JSON export. [AGENT_INFERENCE]

Google Sheet template with pre-populated columns for participant ID, card ID, pile ID, pile label, placement timestamp, reconsideration flag, difficult-card flag, latent-dimension flag, catch-all-probe trigger, fatigue-window flag, and wizard notes. [AGENT_INFERENCE]

Randomized deck-order CSV seeded per participant ID. [AGENT_INFERENCE]

Facilitator script (welcome, think-aloud training, silence prompt, three debrief questions, participant-initiated break script, the single permitted post-sort dimension-naming probe). [AGENT_INFERENCE]

Observer note template, printed A4, one sheet per 10-minute block. [AGENT_INFERENCE]

ASRS v1.1 Part A and 5-item autonomy-perception questionnaire, administered per participant accommodation preference. [AGENT_INFERENCE]

Audio recorder, screen recorder (OBS), iPad secondary display, physical partition or remote wizard setup. [AGENT_INFERENCE]

### Ethics framing

The target population has been historically pathologized for executive function; the protocol's authority asymmetries (wizard-adjudicated breaks, wizard-edited first-person records) reproduce that pattern and must be repaired before fielding. [AGENT_INFERENCE]

Before running the study, conduct at least 3 co-design sessions with ADHD adults to review the vignette corpus, session structure, fatigue-management approach, and think-aloud requirement; pay co-designers at an expertise rate; document which elements changed in response; report co-designer input in the methods section of any publication. [AGENT_INFERENCE]

### Scope of claims this method can support

The method can support generation of a candidate taxonomy of participant-named dimensions for reminder acceptability, as input to a subsequent evaluative study. [AGENT_INFERENCE]

The method can support descriptive observation of how those candidate dimensions map (or do not map) onto the four a priori design variables varied in the vignette corpus. [AGENT_INFERENCE]

### Scope of claims this method cannot support

The method cannot support a claim that any recovered dimension predicts acceptability, because no per-vignette acceptability outcome is captured in this protocol. [DO_NOT_CLAIM]

The method cannot support population-level claims about "adults with ADHD"; findings apply at most to the ASRS-screened-and-self-identified sample actually recruited, stratified by the axes the recruitment matrix records. [DO_NOT_CLAIM]

The method cannot support claims about dimensions participants care about that fall outside the four design variables varied in the vignette corpus — such dimensions may surface in labels but cannot be behaviorally confirmed by the co-occurrence clustering. [DO_NOT_CLAIM]

The method cannot support stratification decisions from the autonomy-perception median split at this sample size; any such analysis is descriptive scoping only. [DO_NOT_CLAIM]

## Failure hypotheses to test

H1: A participant's debrief answer to "the single most important criterion" will diverge from their enacted pile structure in the majority of sessions, making the debrief ranking a weaker signal than the log-event cluster analysis. [SIMULATION_REHEARSAL]

H2: Pile labels produced after the Pile Label Prompt (at 60 seconds of cluster stability) will be revised during the labeling phase more often than labels offered spontaneously before any prompt, indicating the prompt catches piles at their most provisional moment. [SIMULATION_REHEARSAL]

H3: Open coding of think-aloud transcripts will fragment a single underlying dimension across 2–3 surface vocabulary codes, such that a ≥50% agreement threshold on raw codes undercounts shared dimensions unless a thematic consolidation step is inserted. [SIMULATION_REHEARSAL]

H4: Cards placed during a masked-fatigue window (rapid placement without verbalization, in participants managing self-presentation) will occur without triggering the wizard's behavioral criteria for the Rest Break Signal. [SIMULATION_REHEARSAL]

H5: Reconsideration events (cards moved after initial placement) will cluster temporally around specific vignette cards whose arrival triggers restructuring, and those trigger cards will share design-variable levels. [SIMULATION_REHEARSAL]

H6: Emergent pile labels (mapping to none of the four a priori dimensions by both raters) will concentrate on vignette subsets uncorrelated with the fractional factorial design, making those dimensions visible in labels but under-powered in the co-occurrence clustering. [SIMULATION_REHEARSAL]

H7: Participants recruited from ADHD community forums will produce supportive/paternalistic vocabulary more frequently than participants recruited from university access panels, indicating recruitment-source priming of the dichotomy the study is trying not to prime. [SIMULATION_REHEARSAL]

H8: The information signal in the sort will concentrate in cards 1–15, with cards 30–40 functioning as consistency checks rather than as dimension elicitation. [SIMULATION_REHEARSAL]

H9: Participants will produce a "residual" or "doesn't fit" pile whose cards reflect session-late encounter order rather than a shared distinctive design-variable profile, indicating the residual pile indexes fatigue rather than a substantive dimension. [SIMULATION_REHEARSAL]

## Risks and failure modes

Reviewer objection (accessibility advocate, blocking): ADHD adults were not involved in designing the instrument meant to expose the inadequacy of a researcher-constructed frame. [AGENT_INFERENCE]

Mitigation: run at least 3 paid co-design sessions with ADHD adults before fielding; revise vignette corpus, session structure, fatigue-management approach, and think-aloud requirement in response; document and report what changed. [AGENT_INFERENCE]

Reviewer objection (accessibility advocate, blocking): the wizard adjudicates fatigue-break timing using behavioral cues that the walkthrough acknowledges will miss masked-fatigue cases in exactly this population. [AGENT_INFERENCE]

Mitigation: add a scripted participant-initiated break channel, remove the single-break ceiling, and retain wizard-triggered breaks only as redundancy. [AGENT_INFERENCE]

Reviewer objection (accessibility advocate, major): the wizard-types-label-on-behalf rule appropriates the participant's voice and creates commitment framing after 15 seconds of field inactivity. [AGENT_INFERENCE]

Mitigation: remove the rule; allow the facilitator to re-read the prompt at 30 seconds; accept "I don't want to name this one yet" as a logged response. [AGENT_INFERENCE]

Reviewer objection (accessibility advocate, major): materials assume a specific reading modality without accommodation paths for co-occurring conditions common in ADHD populations. [AGENT_INFERENCE]

Mitigation: offer typeface/font/audio/plain-language accommodations; ask at scheduling; record uptake. [AGENT_INFERENCE]

Reviewer objection (accessibility advocate, major): "adults with high ASRS scores" collapses within-group variation relevant to the research question. [AGENT_INFERENCE]

Mitigation: record diagnosis, medication, gender, comorbidity, and current tool use; report stratified; state in claim that N does not support generalization across these axes. [AGENT_INFERENCE]

Reviewer objection (accessibility advocate, major): the 90-minute session with one break is extractive for this population, and compensation is unspecified. [AGENT_INFERENCE]

Mitigation: set expertise-rate compensation, offer a 60-minute reduced-vignette or two-session split, document participant choice in results. [AGENT_INFERENCE]

Reviewer objection (accessibility advocate, minor): ASRS ≥14 as a gatekeeper uses a screener as diagnostic and excludes self-identifying adults scoring below threshold. [AGENT_INFERENCE]

Mitigation: accept self-identification alongside ASRS, record both separately, describe the groups' sort structures descriptively. [AGENT_INFERENCE]

Reviewer objection (methodologist, blocking): the one-sentence claim asserts that participant-named dimensions "predict acceptability better than valence of framing alone," but no per-vignette acceptability DV is captured. [AGENT_INFERENCE]

Mitigation: either add a per-vignette acceptability Likert before sorting each card, OR rewrite the claim as strictly descriptive ("identify candidate participant-named dimensions for a subsequent evaluative study") and drop the predictive language from the branch card and any writeup. [AGENT_INFERENCE]

Reviewer objection (methodologist, blocking): N=12 with a ≥50% agreement threshold and Ward clustering on a 40×40 summed binary matrix cannot sustain dimension-recovery claims, especially under surface-vocabulary fragmentation. [AGENT_INFERENCE]

Mitigation: insert a thematic consolidation step before the threshold is applied, with a reliability estimate; replace fixed N=12 with a saturation-based stopping rule or justify N against a comparable published card-sort; run sensitivity analysis across clustering methods and a leave-one-participant-out robustness check. [AGENT_INFERENCE]

Reviewer objection (methodologist, major): the fractional factorial vignette corpus structurally constrains which dimensions the behavioral clustering can recover, making the emergent-dimension triangulation circular. [AGENT_INFERENCE]

Mitigation: either pilot-elicit candidate dimensions with 3–4 unstructured interviews before fixing the fractional factorial, OR explicitly concede in the claim and writeup that behavioral clustering can only confirm a priori dimensions and that emergent-dimension claims rest on verbal/label data alone. [AGENT_INFERENCE]

Reviewer objection (methodologist, major): the autonomy-perception median split on N=12 is statistically meaningless and invites over-interpretation. [AGENT_INFERENCE]

Mitigation: remove the re-clustering analysis; if autonomy-perception scoping is needed, report it as a correlation with pile count and state explicitly that N cannot support stratification decisions. [AGENT_INFERENCE]

Reviewer objection (methodologist, major): recruiting from ADHD community forums confounds the "non-primed" condition because the supportive/paternalistic framing is live discourse in those communities. [AGENT_INFERENCE]

Mitigation: record recruitment source per participant and report emergent-dimension analysis stratified by source, or recruit from a single source and justify the choice. [AGENT_INFERENCE]

Reviewer objection (methodologist, major): coder blinding to vignette text makes transcript codes uninterpretable for a placement task whose meaning depends on the card being placed. [AGENT_INFERENCE]

Mitigation: unblind coders to vignette text, blind them to the four a priori design-variable labels; pre-register the coding protocol and run a calibration exercise on pilot transcripts with a documented codebook. [AGENT_INFERENCE]

Reviewer objection (methodologist, minor): ASRS Part A is a screener, not a diagnostic, and the cohort is heterogeneous on diagnosis, medication, and comorbidity. [AGENT_INFERENCE]

Mitigation: collect and report diagnosis, medication, and comorbidity per participant; state target population as "ASRS-screened adults" rather than "adults with ADHD"; do not accept unadministered self-report ASRS as equivalent to the research-team-administered screener. [AGENT_INFERENCE]

Audit finding (agency, -1): the wizard-types-label rule is a weak-override pattern where the repair path (editing the wizard's entry) is more effortful than accepting it. [AGENT_INFERENCE]

Mitigation: already covered above — remove the rule. [AGENT_INFERENCE]

Audit finding (agency, -1): wizard-adjudicated rest breaks without a participant-initiated channel is a paternalistic default for a population where the default lands with particular weight. [AGENT_INFERENCE]

Mitigation: already covered above — add participant-initiated break channel; remove break ceiling. [AGENT_INFERENCE]

Meta-review finding: the methodologist's and accessibility advocate's blocking objections target non-overlapping defects that interact — co-design may reshape the vignette corpus in ways that invalidate the current fractional factorial; removing wizard authority changes the behavioral log data feeding the co-occurrence clustering; adding an acceptability DV does not address co-design absence. The sequencing and scope of revision cannot be adjudicated by the review agents. [AGENT_INFERENCE]

### Next steps

Before running this study, the researcher must: (1) decide the sequencing question between co-design-first (which may reshape corpus, session structure, and sample size justification) versus methodology-lock-then-accommodate (which preserves the current analytic plan but leaves the instrument miscalibrated); (2) decide whether the contribution is descriptive (drop predictive language from the claim) or predictive (add a per-vignette acceptability DV and rebuild the analysis around it); (3) run at least 3 paid co-design sessions with ADHD adults and document changes; (4) obtain IRB approval for the compensation structure, accommodation options, and participant-initiated break channel; (5) pre-register the coding protocol, the saturation stopping rule (or N justification), the thematic consolidation step, and the clustering sensitivity analyses; (6) specify the recruitment matrix (diagnosis, medication, gender, comorbidity, recruitment source) and the stratified reporting plan. [HUMAN_REQUIRED]
