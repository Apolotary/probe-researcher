# Probe Guidebook — Corpus-Personalized Divergence Probe for Poetry Drafting

## Premise

The researcher arrived with an intent to evaluate a creativity-support tool that gives poets alternative line endings during drafting. [RESEARCHER_INPUT]

Sharpening this premise surfaced a prior question: what is the theory of what a "good" line ending is, and whose judgment constitutes the outcome being measured? [AGENT_INFERENCE]

The surviving branch reframes the premise as a mechanism study rather than a tool evaluation. The research question is whether algorithmically suggested line endings cause poets to diverge from their own habitual lexical and prosodic patterns during drafting, relative to a thesaurus-only baseline. [AGENT_INFERENCE]

This guidebook plans a formative mechanism study. It can support claims about whether within-session drafting behavior and accepted-candidate divergence differ between a corpus-personalized suggestion condition and a thesaurus control, under the tested lab conditions and with the tested population of publication-record-bearing poets. [AGENT_INFERENCE]

This study cannot support claims about craft quality, reader response, long-term skill change, generalization to free-verse or formalist traditions the sample does not cover, or whether the tool is "useful." [DO_NOT_CLAIM]

This study cannot support claims about effects of unspecified "AI line-ending tools" in the wild, since the wizard-of-Oz architecture operationalizes a specific curated candidate bank rather than a deployed model. [DO_NOT_CLAIM]

## Background

Jakesch and colleagues showed that co-writing with a language model configured with a built-in viewpoint shifts both the content of participants' writing and their subsequent attitudes, demonstrating that suggestion mechanisms exert measurable influence on human-authored output beyond conscious awareness. [SOURCE_CARD:jakesch_2023_cowriting]

Buijsman, Carter, and Bermúdez argue that AI decision-support can erode domain-specific autonomy — comprising skilled competence and authentic value-formation — through mechanisms such as absent failure indicators and unconscious value shifts, raising design-level concerns applicable to expert creative workflows. [SOURCE_CARD:buijsman_carter_bermudez_2025]

Sanders and Stappers frame probes as instruments for inspiration and dialogue rather than for extracting generalizable user data, a framing that informs the design of divergence-inducing rather than preference-capturing tool studies. [SOURCE_CARD:sanders_stappers_2014]

Illich's argument that tools past a certain threshold of scale and complexity reverse from serving human purposes to conditioning humans to serve the tool is directly relevant to assessing whether corpus-personalized suggestion engines narrow rather than expand a poet's expressive range. [SOURCE_CARD:illich_1973]

The following adjacent literature has been flagged as likely relevant but is not grounded in a source card in this run's corpus; the researcher must retrieve these directly before relying on them: [AGENT_INFERENCE]

- Clark et al., "Creative Writing with a Machine in the Loop" — the canonical within-subjects study of drafting with AI suggestion; must be read for outcome-construct comparison. [UNCITED_ADJACENT]
- Gero and Chilton's work on metaphor suggestion and figurative-language support in creative writing tools. [UNCITED_ADJACENT]
- Shneiderman and Cherry's Creativity Support Index, which is the nearest-template instrument for creativity-tool evaluation and which this study deliberately does not adopt. [UNCITED_ADJACENT]

## Prototype

The prototype is a single 90-minute lab session in which one practicing poet drafts two poems using a custom web-based interface, with condition counterbalanced within-participant. The interface exposes a textarea, a "Suggest endings" button, a 5-chip suggestion panel, and a "Finish poem" button. No scores, ranks, or provenance labels are shown on the chips. [AGENT_INFERENCE]

Behind the interface, a wizard in an adjacent room monitors the participant's draft via VNC and manually queues batches of 5 line-ending candidates in response to each suggestion request. An observer logs wizard decisions and anomalies. A facilitator delivers briefing, consent, prompts, surveys, and debriefing in the participant's room. [AGENT_INFERENCE]

Two conditions alternate within-session: a corpus-divergence condition, in which the wizard selects candidates confirmed as low-frequency in the participant's indexed prior published work and phonologically distinct from the current line's stress pattern; and a thesaurus control, in which the wizard selects the top 5 WordNet synonyms for the most semantically prominent word in the line. [AGENT_INFERENCE]

The session instruments capture six signals: the accept/reject event stream with candidate texts and timestamps; think-aloud audio transcribed and coded under a pre-specified scheme; a 5-item post-task Likert on perceived stylistic distance, control, and surprise; the finished draft text for prosodic and lexical analysis against the corpus index; wizard decision latency per request; and a structured debriefing interview. [AGENT_INFERENCE]

Infrastructure runs entirely on localhost — participant laptop, wizard laptop, VNC, WebSocket candidate push, pre-built per-participant candidate banks as JSON, and TF-IDF pickles of prior work — with no cloud dependency and no vendor lock-in on exit. [AGENT_INFERENCE]

Failure cases the prototype anticipates include wizard inability to find 5 corpus-divergence candidates for an idiosyncratic line (fallback: extend latency then draw lowest-frequency candidates regardless of semantic fit, flagged for exclusion), mid-draft line revision invalidating already-queued candidates (fallback: re-queue with no overlap), and JSON export failure at session end (fallback: bookmarklet serialization, then manual sessionStorage extraction, then screen-recording as last resort). [AGENT_INFERENCE]

## Study protocol

### Recruitment criteria

Recruit poets with at least 10 poems published in traceable venues, willing to cede rights to their published text for corpus indexing, and available for a 90-minute in-person lab session. [AGENT_INFERENCE]

State the target N explicitly, backed by a power calculation for the paired Wilcoxon signed-rank test on per-participant median divergence scores, at the effect-size band the claim requires. [AGENT_INFERENCE]

State the sampling frame (which publication venues, which geographic region) and an explicit stopping rule before recruitment opens. [AGENT_INFERENCE]

Pre-specify the minimum number of within-participant accept events required before a participant's median divergence score is usable, and pre-register the exclusion rule for low-request drafters. [AGENT_INFERENCE]

Specify alternative instrument formats before recruitment opens and state them in the recruitment materials so disabled poets can self-select in rather than discovering exclusion at the session. Minimum required: a digital screen-reader-compatible Likert form as an equal-status alternative to paper; a keyboard-only path through the chip panel with screen-reader labels; a verbal administration option for survey and debriefing. [AGENT_INFERENCE]

### Procedure

The 90-minute structure: 0–10 min briefing, consent, warm-up task not used in analysis; 10–15 min condition introduction; 15–40 min Poem A drafting (25-minute hard limit); 40–45 min post-task survey; 45–50 min condition switch and Prompt B introduction; 50–75 min Poem B drafting; 75–80 min second survey; 80–90 min semi-structured debriefing. [AGENT_INFERENCE]

Condition order and prompt order are counterbalanced across participants using a 2x2 Latin square. However, carryover between Poem A and Poem B cannot be separated from condition effect under the current within-subjects single-session design at realistic N; the revision requirements below address this. [AGENT_INFERENCE]

### Materials list

- Custom localhost drafting interface with WebSocket to wizard control panel; textarea, 5-chip suggestion panel, finish button, passive word count, elapsed-time progress bar. Must be keyboard-navigable and screen-reader-labeled. [AGENT_INFERENCE]
- Wizard control panel on separate localhost page with live VNC mirror, 5 candidate input fields, Queue & Release, Extend Latency, and Manual Log Entry controls. [AGENT_INFERENCE]
- Per-participant corpus-divergence candidate bank (JSON, keyed by semantic cluster, phonologically coded via CMU Pronouncing Dictionary). Pre-computed offline before session. [AGENT_INFERENCE]
- Thesaurus candidate bank (JSON, WordNet 3.1 synonyms for 500 high-frequency English content words). [AGENT_INFERENCE]
- Per-participant TF-IDF index pickle of indexed prior published work. [AGENT_INFERENCE]
- Two task prompt cards, pretested with 3 pilot poets not in the sample. [AGENT_INFERENCE]
- 5-item post-task Likert survey, available in both paper (14pt) and screen-reader-compatible digital formats. [AGENT_INFERENCE]
- Facilitator debriefing script with three fixed questions and probe follow-ups. [AGENT_INFERENCE]
- OBS Studio recording VNC window continuously as backup. [AGENT_INFERENCE]
- Consent form and demographic questionnaire; consent form substantially expanded per the ethics section below. [AGENT_INFERENCE]
- Shared silent-communication phone between facilitator and wizard. [AGENT_INFERENCE]

### Ethics and consent

The consent form must specify exactly what is built from the corpus (TF-IDF index, stress-pattern models, candidate banks); retention and destruction timeline for each artifact; whether derivative statistics will appear in publications and at what aggregation level; withdrawal procedure including destruction of indexed artifacts; and an explicit statement that the corpus will not be used to train any generative model or shared with third parties. [AGENT_INFERENCE]

Pilot the consent language with two or three poets not in the study sample before finalizing, because poets' relationship to corpus ingestion is politically charged and the standard consent-form register may not meet that complexity. [AGENT_INFERENCE]

Specify participant compensation in the recruitment materials, benchmarked against honoraria for poetry readings or visiting-poet talks in the relevant region rather than generic psychology-lab participant rates. The study extracts expert creative consultation plus a licensed corpus, and compensation should reflect that. [AGENT_INFERENCE]

### Explicit scope of claims

This study's method can support claims about within-session differences in accepted-candidate divergence scores, acceptance rates, self-reported perceived stylistic distance, and think-aloud theme distributions between the two conditions as implemented. [AGENT_INFERENCE]

This study's method cannot support claims about "AI creativity tools" in general, about craft quality of the resulting poems, about reader response, or about sustained behavioral change — these would require different designs. [DO_NOT_CLAIM]

The primary outcome is defined over divergence from the poet's *indexed published corpus*; divergence from the poet's broader habitual practice (including unpublished or experimental work) is not what the measure captures, and the written claim must reflect this narrowing. [DO_NOT_CLAIM]

## Failure hypotheses to test

The simulated walkthrough and the audit surface several mechanisms the real study can test as falsifiable hypotheses. These are rehearsal-derived and must not be read as predictions of results. [SIMULATION_REHEARSAL]

- H1 (wizard feasibility): the proportion of suggestion requests meeting the 1.5-second wizard latency without firing `extend_latency` would likely differ between the corpus-divergence and thesaurus conditions, with the corpus-divergence condition requiring extension on a substantially higher fraction of requests. If this hypothesis is borne out, the manipulation is confounded with latency. [SIMULATION_REHEARSAL]
- H2 (suspicion surfacing): a measurable subset of participants would plausibly surface suspicion that the tool is not what it appears to be, and that suspicion would likely concentrate around `extend_latency` events rather than content-mismatch events. [SIMULATION_REHEARSAL]
- H3 (reject interpretability): a substantial share of reject events would carry ambiguous reject-reasons not recoverable from the event stream alone; think-aloud and debriefing commentary would be needed to disambiguate, and poets who do not narrate spontaneously would yield uninterpretable rejects. [SIMULATION_REHEARSAL]
- H4 (trial-insertion inflation): some share of accept events would reflect "tried it to see how it reads" rather than committed choices, and without logging subsequent edits or deletions the divergence score would likely overstate effects by weighting trial-insertions equivalently to committed ones. [SIMULATION_REHEARSAL]
- H5 (carryover): lexical or prosodic territory from Poem A would plausibly bleed into Poem B even under the counterbalanced design, producing an order × condition interaction that the 2x2 Latin square at realistic N cannot estimate. [SIMULATION_REHEARSAL]
- H6 (bimodal yield): per-session data yield would likely split into a high-request pattern generating enough within-participant data for stable medians and a sparse or early-abandonment pattern that does not, making the per-participant median a noisy primary measure. [SIMULATION_REHEARSAL]
- H7 (corpus-scope attenuation): poets whose indexed published corpus is small or unrepresentative of their broader practice would likely produce divergence scores that conflate "divergence from published register" with "convergence to unindexed experimental register," attenuating or inverting the measured effect in a direction that looks like a null. [SIMULATION_REHEARSAL]
- H8 (pause-prompt contamination): the facilitator's 90-second pause prompt would plausibly shift suggestion-request rate in the subsequent two minutes in a direction that contaminates the acceptance-rate comparison between conditions. [SIMULATION_REHEARSAL]

## Risks and failure modes

The following risks are drawn from reviewer findings and must be addressed in revision before the study runs. [AGENT_INFERENCE]

### Blocking risks (methodologist)

Risk: the WoZ architecture does not operationalize the claimed mechanism — the wizard cannot perform a 1.5-second semantic-cluster lookup plus phonological-distinctness filter under realistic load, while the thesaurus condition is a simple lookup. Any measured divergence difference would be indistinguishable from differences in wizard latency, fatigue, and fallback behavior. [AGENT_INFERENCE]

Mitigation: pre-compute the full candidate bank per line-content-cluster offline before the session so the wizard performs only a lookup, not a search-and-filter. Run a feasibility pilot measuring the wizard's latency distribution on real poet drafts; if the 90th percentile exceeds 1.5 seconds, abandon the WoZ architecture in favor of a genuine retrieval-augmented language model with an identical interface, and narrow the claim accordingly. [AGENT_INFERENCE]

Risk: the two conditions differ on at least three dimensions simultaneously (source corpus personalized vs. generic, selection criterion low-frequency-plus-phonological vs. top-synonyms, semantic relationship divergent vs. substitutable). "Corpus-personalization" is therefore unidentifiable as the active ingredient. [AGENT_INFERENCE]

Mitigation: add a third condition that isolates corpus-personalization from the selection criteria — for example, low-frequency-in-general-corpus candidates with the same phonological filter — or redesign the thesaurus arm to match the corpus-divergence arm on selection criterion and vary only the personalization dimension. Without this, the claim about corpus-personalization specifically cannot stand. [AGENT_INFERENCE]

Risk: within-subjects counterbalancing via 2x2 Latin square at realistic N cannot separate carryover from condition effect, and the primary Wilcoxon test assumes exchangeability that carryover violates. [AGENT_INFERENCE]

Mitigation: move to a between-subjects design with matched poets and a power-justified N; or add a washout session on a separate day; or pre-register the order × condition interaction as a primary test and commit to an N that can detect it. The current counterbalance is cosmetic, not inferential. [AGENT_INFERENCE]

### Major risks

Risk: no target N, power analysis, or stopping rule is specified; the per-participant median divergence score depends on within-participant request volume that the walkthrough rehearses as bimodally distributed. [AGENT_INFERENCE]

Mitigation: state target N with a power calculation; state the sampling frame; state minimum within-participant accept events required before a participant's median is usable; pre-register the low-request exclusion rule. [AGENT_INFERENCE]

Risk: the divergence measure is defined over published corpus, but the construct targeted by the claim is habitual practice; these diverge for poets whose published register is conservative relative to their full practice. [AGENT_INFERENCE]

Mitigation: cross-check the corpus index against a held-out sample of each poet's self-identified "typical" versus "atypical" prior work before accepting enrollment, or narrow the claim to "divergence from published register" and acknowledge the gap in the written claim. [AGENT_INFERENCE]

Risk: qualitative coding plan names inter-rater reliability computation on 20% of utterances but specifies no target kappa, no disagreement-resolution procedure, and no contingency if IRR is poor. The think-aloud stream is load-bearing for interpreting rejects. [AGENT_INFERENCE]

Mitigation: pre-register a kappa threshold (e.g., ≥0.7) and the action taken if unmet; specify disagreement-resolution procedure; pilot the coding scheme on non-study transcripts and report base rates of the three categories before committing to them as primary analysis. [AGENT_INFERENCE]

### Major risks (accessibility advocate)

Risk: instruments presume sighted, mouse-using, handwriting-capable participants (paper Likert at 14pt, mouse-click chip interface, VNC-mirrored screen the wizard reads), though the inclusion criterion is publication record. Blind, low-vision, or motor-impaired poets meet the inclusion criterion and could enroll. [AGENT_INFERENCE]

Mitigation: pre-prepare alternative instrument formats (screen-reader Likert, keyboard-only chip navigation with labels, verbal administration option for survey and debriefing). State available formats in recruitment materials. [AGENT_INFERENCE]

Risk: the consent form does not document retention, destruction, derivative-statistic publication, or withdrawal procedure for a named stylistic corpus, in a political moment where poets have charged relationships to corpus ingestion by AI systems. [AGENT_INFERENCE]

Mitigation: expand consent form per the ethics section of the protocol above, and pilot language with 2–3 non-sample poets. [AGENT_INFERENCE]

### Minor risks

Risk: participant compensation is unspecified despite the study extracting expert creative consultation plus a licensed corpus. [AGENT_INFERENCE]

Mitigation: specify compensation benchmarked against poetry-reading or visiting-poet honoraria. [AGENT_INFERENCE]

### Legibility drift risks (audit)

Risk: the chip interface shows no score, rank, or provenance at the point of action, compressing dense tacit reasoning into a click the event stream cannot decode. This is required by the WoZ illusion but is a legibility cost the participant bears at every decision. [AGENT_INFERENCE]

Mitigation: either surface a minimal provenance affordance (e.g., hover-to-see a neutral "why this candidate" blurb matched to condition so it does not leak the manipulation), or justify the opacity explicitly in the analysis plan and report it as a measurement limitation rather than a neutral design choice. [AGENT_INFERENCE]

### Next steps

Before running this study, the researcher must: (1) run a wizard-feasibility pilot measuring latency distribution on real poet drafts, and commit before the pilot to the specific threshold at which WoZ will be abandoned for a real retrieval-augmented LM; (2) redesign the control condition to isolate corpus-personalization from the co-varying selection criteria, or narrow the claim; (3) choose between a between-subjects design, a washout-session design, or a power-justified within-subjects design and commit to an N; (4) cross-check the corpus index against each poet's self-identified typical-vs-atypical prior work before accepting enrollment, or narrow the claim to "published register"; (5) pilot the expanded consent form with 2–3 non-sample poets and finalize compensation; (6) pre-prepare accessible instrument alternatives and announce them in recruitment materials; (7) pre-register the qualitative coding kappa threshold, the per-participant accept-event minimum, and the order × condition interaction test; (8) obtain IRB approval covering the expanded consent, compensation, and corpus-retention language. [HUMAN_REQUIRED]
