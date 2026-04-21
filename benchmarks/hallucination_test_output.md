
## Premise

The researcher's original framing asked how BLV screen-reader users interpret page hierarchy on AI-generated news articles. [RESEARCHER_INPUT]

After sharpening, the question this guidebook addresses is narrower: when hierarchy is held constant across articles, does disclosing AI authorship via an ARIA-live provenance banner shift BLV screen-reader users' navigation strategies and credibility judgments compared to undisclosed or human-authored framing, and does the effect depend on where the disclosure sits in the heading tree? [AGENT_INFERENCE]

This guidebook plans a formative study whose purpose is to characterize how auditory provenance disclosures interact with screen-reader navigation and credibility judgment, not to establish a population-level effect size. [AGENT_INFERENCE]

The study, as currently scoped, cannot support claims that generalize across the BLV population, across output modalities, or across authorship-disclosure phrasings beyond the ones tested. [DO_NOT_CLAIM]

The study cannot support claims that disclosure is a wanted or welcome intervention for BLV screen-reader users in everyday web use; that question is upstream of what this design measures. [DO_NOT_CLAIM]

Before this guidebook is executed, the researcher must make a scoping choice that Probe cannot make on their behalf: whether this study is a confound-controlled disclosure-effects experiment, a participatory co-design investigation, or a theoretically differentiated extension of prior disclosure-effects work. [HUMAN_REQUIRED]

## Background

Gaver, Dunne, and Pacenti framed probes as instruments for inspiration and dialogue, not as systematic requirement-extraction tools, establishing a tradition in which artifacts are offered to participants rather than imposed on them. [SOURCE_CARD:gaver_dunne_pacenti_1999]

Sanders and Stappers distinguished a "designing for" posture from a participatory "designing with" posture, noting that the choice of posture is prior to the choice of artifact and shapes whose knowledge counts. [SOURCE_CARD:sanders_stappers_2014]

Kafer advances a political/relational model of disability that locates access needs in social and structural arrangements rather than in individual deficit, which reframes any intervention for BLV users as a negotiation with existing practices rather than a correction of them. [SOURCE_CARD:kafer_2013]

Buijsman, Carter, and Bermúdez argue that AI decision-support can erode domain-specific autonomy when failure indicators are absent, motivating the general premise that provenance disclosure mechanisms may matter for critical evaluation of AI-generated content. [SOURCE_CARD:buijsman_carter_bermudez_2025]

Liang et al. report that in a prospective user study, 57.4% of researchers rated GPT-4 feedback as helpful or very helpful, which indicates that perceived source identity shapes credibility judgments about AI-generated content in at least some populations. [SOURCE_CARD:liang_nejm_ai_2024]

Illich's analysis of tools past a threshold of scale argues that beyond a point, tools begin conditioning humans to serve them rather than the reverse, which foregrounds the risk that undisclosed AI authorship could silently reshape reader trust and navigation behavior. [SOURCE_CARD:illich_1973]

Jakesch and colleagues have examined how labeling text as AI-generated shifts reader judgments in sighted populations, establishing the baseline paradigm against which any BLV-specific claim must be differentiated. [SOURCE_CARD:jakesch_2023_cowriting]

Longoni and collaborators have shown resistance effects to AI in consequential domains such as medical advice, which suggests that disclosure effects are not uniform across content type and stakes. [SOURCE_CARD:longoni_2019_medical_ai_resistance]

Sundar's MAIN model articulates how source cues interact with modality and agency heuristics to produce credibility judgments, providing a theoretical vocabulary for predicting why an auditory disclosure cue might produce different effects than a visual banner. [SOURCE_CARD:sundar_2008_main_model]

The researcher's notes reference Smithson and Watanabe (2024) as directly relevant prior art on auditory provenance cues and BLV navigation. This citation has not been verified against the corpus and Probe has no source card for it; before this guidebook is executed, the researcher must independently confirm the citation exists, read it, and revise the differentia in light of it. [HUMAN_REQUIRED]

## Prototype

The prototype is a Wizard-of-Oz apparatus for evaluating ARIA-live provenance banners during BLV screen-reader navigation of news articles. [AGENT_INFERENCE]

A participant navigates one of three matched article HTML pages on their own device using their preferred screen reader (NVDA on Firefox, or VoiceOver on Safari). Each page contains an identical structural skeleton: one H1 title, three H2 section headings labeled "Background," "Current Status," and "What Experts Say," and approximately 800 words of body text on a neutral civic topic. [AGENT_INFERENCE]

An ARIA-live region with role="status", aria-live="polite", and aria-atomic="true" is present in the DOM immediately after the H1 element, with empty textContent on page load. [AGENT_INFERENCE]

A wizard in an adjacent room or off-site location monitors the participant's screen-share and audio via Zoom and, according to Latin-square assignment, fires one of three banner injections per trial: an early AI-disclosure banner announced after the H1 completes, a late AI-disclosure banner announced after the participant's cursor passes the second H2, or a human-framed banner announced on the same schedule as the early condition. [AGENT_INFERENCE]

A second researcher observes silently and codes verbal utterances and behavioral hesitations against a predefined four-category think-aloud scheme. A facilitator co-located with the participant (or on the same call) reads standardized task instructions and administers a post-trial 7-item credibility rating form. [AGENT_INFERENCE]

Each participant completes three within-subject trials covering the three conditions in counterbalanced order, with a debrief interview at the end. [AGENT_INFERENCE]

The prototype has five wizard controls (inject_early_banner, inject_late_banner, inject_human_banner, clear_banner, log_heading_navigation_event) and three documented failure cases (forms-mode suppression, ngrok tunnel drop, Braille-display-only output) each with a scripted fallback protocol. [AGENT_INFERENCE]

The full actor roster, materials list, and per-step task flow are specified in the prototype_spec artifact accompanying this guidebook. [AGENT_INFERENCE]

## Study protocol

### Recruitment

Recruit 8–12 BLV screen-reader users with at least 6 months of daily screen-reader use, through a disability-led community organization that has agreed in advance to the partnership terms. [AGENT_INFERENCE]

Before recruiting study participants, recruit and compensate 2–3 BLV co-designers (distinct from participants) to shape the disclosure phrasing, placement, and the prior question of whether an ARIA-live banner is a wanted intervention at all. If the co-design phase reveals that ARIA-live banners are not what BLV users want evaluated, the study pivots or stops rather than proceeds. [AGENT_INFERENCE]

Screener questions must include a configuration inventory (speech only, Braille only, hybrid with usage proportions) developed with co-designers, replacing any binary "primary output" framing. [AGENT_INFERENCE]

### Compensation

Specify the compensation rate in the final protocol before IRB submission. Benchmark against consultant rates for lived-expertise contributors rather than generic participant-pool rates; $75–150 per 75–90 minute session is a defensible floor for expert screen-reader users, with co-designers compensated at consultant rates separately. [AGENT_INFERENCE]

### Procedure

Each session runs 75–100 minutes including: consent and screener (10 min), warm-up task on a neutral practice article (10 min), three counterbalanced experimental trials with per-trial credibility rating form (35–50 min), semi-structured debrief (15 min), and compensation and explanation (5 min). [AGENT_INFERENCE]

The consent form must be provided in a screen-reader-accessible format at least 24 hours before the session so participants can review independently; facilitator reading aloud is a supplement, not the primary consent channel. [AGENT_INFERENCE]

The credibility rating form must be piloted with at least three BLV screen-reader users (compensated, distinct from study participants) across both NVDA and VoiceOver, with and without Braille display, before data collection begins. [AGENT_INFERENCE]

### Materials

Three matched article HTML files passing automated WCAG 2.1 AA checks via axe-core; an ARIA-live region injected identically into each file; a Node.js static file server with /inject-banner and /record-rating endpoints; a wizard control panel HTML page with five labeled buttons and Latin-square condition display; a credibility rating HTML form; an observer coding sheet; a facilitator script document; a debrief explanation card at approximately 8th-grade reading level with audio QR link. [AGENT_INFERENCE]

### Ethics and handoff

All recordings stored in a password-protected folder keyed by participant ID only; no names. [AGENT_INFERENCE]

A structured member-check phase follows initial analysis: each participant receives their own session log (wizard-coded events, think-aloud category assignments, selected debrief quotations) and is paid at the session rate to review, correct, or contest any interpretation. Member-check outcomes, including disputed codings, are surfaced in any writeup. [AGENT_INFERENCE]

### Scope of claims

This study can support characterization of how a small number of BLV screen-reader users, recruited through one partner organization, navigate and rate three specific article stimuli under three specific disclosure conditions. [DO_NOT_CLAIM]

This study cannot support claims about the BLV population in general, about Braille-primary or hybrid users as a stratum unless they are separately powered, about long-term behavior, or about whether disclosure is desirable as a design intervention. [DO_NOT_CLAIM]

This study cannot support quantitative effect-size claims; with n=8–12 and three within-subject conditions, only exploratory descriptive patterns and qualitative themes are defensible. [DO_NOT_CLAIM]

## Failure hypotheses to test

The following are falsifiable hypotheses the real study can answer — phrased as predictions the session can disconfirm, not as expected outcomes. [AGENT_INFERENCE]

H1 — Announcement-duration confound: if dwell-onset latency differs across the three conditions in proportion to announcement word-count (AI-disclosed conditions ~6s of speech vs. human-framed ~2s), the effect is attributable to interruption length rather than disclosure content, and any claim about semantic disclosure effects on behavioral DVs is unrecoverable from the current stimulus set. [AGENT_INFERENCE]

H2 — Late-banner timing failure: if the wizard misses the firing window between H2-2 and H2-3 on a substantial fraction of fast-navigator trials, the late condition degrades into arbitrary-timing and the early/late distinction collapses. A rehearsal suggests fast H-key navigators could traverse all three H2s in under 4 seconds, which would plausibly make the wizard-gated protocol unreliable. [SIMULATION_REHEARSAL]

H3 — Forms-mode suppression across trials: if ARIA-live announcements are suppressed at higher rates on trial 2 and trial 3 than on trial 1 because the credibility form pushes the screen reader into forms mode, the dataset would be asymmetrically contaminated by trial position. [SIMULATION_REHEARSAL]

H4 — Probe-wording ceiling effect: if the Step 3 probe ("most important for deciding whether this article is trustworthy") semantically primes selection of sourcing-heavy sections regardless of condition, the predicted disclosure effect on section selection could be dampened or eliminated by the probe itself. [SIMULATION_REHEARSAL]

H5 — Silent uptake invisibility: if participants coded as category A (no verbal acknowledgment) nonetheless show condition-differentiated credibility ratings, the think-aloud coding scheme would be understating disclosure uptake by treating verbalization as a necessary indicator. [SIMULATION_REHEARSAL]

H6 — Demand-characteristic drift across trials: by trial 3, a participant in a within-subject design could reasonably have inferred that authorship framing is the variable of interest, and ratings on later trials would plausibly reflect hypothesis-guessing rather than authentic judgment; Latin-square counterbalancing addresses group-level order effects but not within-participant awareness drift. [SIMULATION_REHEARSAL]

H7 — Braille confirmation priming: for participants using a refreshable Braille display, the scripted "CHECK-BRAILLE" verbal probe intended to confirm delivery would plausibly itself prime attention to the banner in a way speech-output participants do not experience, producing modality-dependent measurement error. [SIMULATION_REHEARSAL]

H8 — Session-duration fatigue concentration: if the stacked three-trial structure pushes the session past the 75-minute budget, fatigue would plausibly concentrate in trial 3 data and degrade think-aloud quality asymmetrically. [SIMULATION_REHEARSAL]

## Risks and failure modes

### Risk register

Risk — Announcement-duration confound is baked into the stimulus set: the AI-disclosed string is roughly 18 words and ~6 seconds; the human-framed string is 5 words and ~2 seconds. Every time-bounded behavioral DV is mechanically sensitive to this difference. [AGENT_INFERENCE]

Mitigation: add a fourth, length-matched human-framed condition (e.g., "Written by a staff journalist and reviewed by a senior editor for this publication") so that phrasing-content is separable from announcement-duration; alternatively, restrict claims to credibility rating and section-selection measures, which are less duration-coupled. [AGENT_INFERENCE]

Risk — Sample size is inadequate for the quantitative apparatus the analysis plan describes. With n=8 and three conditions, Friedman and Wilcoxon tests can detect only very large effects, and a null is uninterpretable. [AGENT_INFERENCE]

Mitigation: reframe the study as exploratory/qualitative, remove the Friedman/Wilcoxon hypothesis-testing apparatus in favor of descriptive statistics plus thematic analysis; OR commit to an n justified by a simulation-based power analysis for the smallest effect size of interest on the primary DV. [AGENT_INFERENCE]

Risk — Wizard-gated late injection cannot be reliably instantiated for fast navigators, causing the late condition to collapse into timing-noise. [AGENT_INFERENCE]

Mitigation: replace human-gated triggering with programmatic triggering via IntersectionObserver or focus tracker that fires the banner automatically when the virtual cursor reaches a specific DOM landmark; pilot with 2–3 screen-reader users and report the measured latency distribution before main data collection. [AGENT_INFERENCE]

Risk — BLV users are recruited as subjects but not as co-designers of the disclosure artifact, reproducing an extractive design pattern and locating the access question in the artifact rather than in the collaborative process. [AGENT_INFERENCE]

Mitigation: add a paid co-design phase with 2–3 BLV screen-reader users before the evaluation phase, covering whether auditory provenance disclosure is a wanted intervention at all, the phrasing and granularity of disclosure strings, and the placement and interruption model. Document co-designers as named contributors. [AGENT_INFERENCE]

Risk — Cross-disability conflation: Braille-display users are treated as an edge case rather than a first-class population, and binary "primary output" screening fails for hybrid users. [AGENT_INFERENCE]

Mitigation: either restrict to speech-output-primary users in round one with Braille-output users pre-registered as a separate follow-up, or stratify recruitment and power analysis accordingly. Replace binary screener with a configuration inventory co-designed with BLV contributors. [AGENT_INFERENCE]

Risk — Compensation rate is unspecified, deferring a decision that shapes whether the recruitment partnership is equitable. [AGENT_INFERENCE]

Mitigation: specify the rate in the protocol before IRB submission, benchmarked against consultant rates rather than generic participant-pool rates, with the rate determined in consultation with the recruitment organization. [AGENT_INFERENCE]

Risk — Credibility form accessibility is asserted rather than tested; the fallback of facilitator reading items aloud breaks blinding. [AGENT_INFERENCE]

Mitigation: pilot the credibility form with at least three BLV screen-reader users (compensated, distinct from study participants) across both NVDA and VoiceOver with and without Braille, before data collection; pre-register form-workaround trials as excluded from primary analysis rather than retained with a flag. [AGENT_INFERENCE]

Risk — Wizard authority asymmetry: the wizard continuously makes real-time judgments about the participant, and the participant has no parallel channel to contest or inspect those judgments; the debrief-probe protocol additionally gives deeper qualitative treatment to trials with dramatic behavioral signatures. [AGENT_INFERENCE]

Mitigation: add a structured member-check phase after initial analysis, paid at session rate, inviting correction or contest of any interpretation; offer every participant the same prompt bank during debrief rather than conditioning depth on wizard-flagged events. [AGENT_INFERENCE]

Risk — Curative/deficit framing in the branch claim positions disclosure as a mechanism to "preserve" capacity at risk, locating the problem in user vulnerability rather than in authorship concealment practices. [AGENT_INFERENCE]

Mitigation: reframe the research question to foreground existing BLV practices for authorship assessment, add a baseline phase that surfaces current strategies before introducing the intervention, and revise the one-sentence claim away from capacity-preservation language. [AGENT_INFERENCE]

Risk — Legibility gaps flagged by audit: silent injection failures are invisible to participants, the disclosure string contains no inline affordance for the participant to inspect what "AI writing assistant" or "human editor" concretely means, and the authorship claim is unverifiable at the point of judgment. [AGENT_INFERENCE]

Mitigation: add a participant-facing signal that an announcement was attempted (e.g., a reachable landmark listing all provenance announcements fired during the session) and consider adding an on-demand "more about this disclosure" affordance navigable from the banner region. [AGENT_INFERENCE]

Risk — Differentia from prior AI-disclosure-effects literature is undefined; without citing Jakesch, Longoni, Sundar's MAIN model, and the ARIA-live timing literature, the study reads as a population swap without a differential prediction. [AGENT_INFERENCE]

Mitigation: before finalizing the protocol, state a concrete, signed, testable prediction for how the BLV/screen-reader/auditory condition should produce a different effect than prior sighted-visual-banner studies, grounded in the MAIN model's modality and agency heuristics and in the live-region interaction literature. [AGENT_INFERENCE]

Risk — Demand-characteristic drift across trials in a within-subject design where the manipulation is linguistically salient (the word "AI" appears in two of three conditions), making hypothesis-guessing near-certain by trial 3. [AGENT_INFERENCE]

Mitigation: convert to between-subjects, OR add a plausible cover story framing the study as being about layout or heading structure and measure hypothesis-guessing explicitly in debrief, OR treat trial 1 ratings as the primary analysis with trials 2–3 as sensitivity analyses. [AGENT_INFERENCE]

### Next steps

Before running this study, the researcher must: (1) make the scoping decision flagged in the meta-review — whether this study is a confound-controlled disclosure-effects experiment, a participatory co-design investigation, or a theoretically differentiated extension of prior work, since the three paths entail incompatible downstream commitments; (2) independently verify the Smithson & Watanabe (2024) citation from the researcher's notes, read it if it exists, and revise the differentia accordingly; (3) commission and budget the co-design phase with BLV collaborators before finalizing any stimulus; (4) pilot the credibility form, the programmatic late-injection trigger, and the length-matched disclosure strings with compensated BLV pilot users; (5) obtain IRB approval for the revised compensation structure and member-check protocol; (6) finalize the wizard's decision-rule document and the observer's coding scheme (with written category definitions, boundary examples, disagreement-resolution procedure, and an a priori kappa threshold) so that replication is possible. [HUMAN_REQUIRED]