# Probe Guidebook: Adversarial Counter-Argument Dialogue for Trading Agent Override Calibration

## Premise

The researcher's original question asked how semi-automated trading agents should surface execution drift to users monitoring multiple markets simultaneously. [RESEARCHER_INPUT]

That question was sharpened during Probe to focus on a specific decision point: when a semi-automated agent exceeds its declared slippage tolerance on one of several concurrent prediction markets, does requiring the agent to present a structured counter-argument (reasons the user should NOT override) change whether override decisions are better calibrated than presenting drift evidence alone? [AGENT_INFERENCE]

This guidebook plans a formative evaluative study of a wizard-of-oz (WoZ) prototype that simulates the counter-argument mechanism. The study is designed to characterize override-decision behavior under a single, bounded manipulation; it is not designed to evaluate a deployable product nor to produce performance benchmarks. [AGENT_INFERENCE]

This study can support claims about how override decisions are made in a single laboratory session under the specific scripted conditions tested. [DO_NOT_CLAIM]

This study cannot support claims about long-term trader behavior, real-money decision-making, general trust in trading agents, or the effectiveness of counter-argument framing outside the tested drift magnitudes and market types. [DO_NOT_CLAIM]

This study cannot, in its current two-cell form, support causal claims about adversarial *argumentation* as the active ingredient, because the adversarial condition bundles modal interruption, argument structure, and adversarial framing into a single manipulation. This is a known unresolved design issue flagged in meta-review. [DO_NOT_CLAIM]

## Background

Buijsman, Carter, and Bermúdez argue that AI decision-support can erode domain-specific autonomy through absent failure indicators and unconscious value shifts, and that design patterns such as defeater mechanisms are one way to preserve user agency at the point of action. [SOURCE_CARD:buijsman_carter_bermudez_2025]

Sundar's MAIN model describes how agency cues in a digital interface can invoke an authority heuristic or a "machine heuristic" that changes perceived trustworthiness independently of actual source quality, biasing credibility judgments in ways users do not notice. This framing motivates the study's concern that a structured counter-argument may produce deference rather than deliberation. [SOURCE_CARD:sundar_2008_main_model]

Longoni and colleagues found that resistance to AI recommendations is attenuated when the AI serves a supporting role to a human decision-maker rather than replacing one, suggesting that framing agent output as advisory rather than authoritative affects how users engage with it. The counter-argument framing tested here sits within this advisory space. [SOURCE_CARD:longoni_2019_medical_ai_resistance]

Jakesch and colleagues showed that built-in opinions of AI language technologies can shift users' views at scale even when users are unaware they are being influenced, underscoring the need to engineer the directional framing of AI-generated arguments carefully. The adversarial-framing condition in this study is precisely such a directional framing, and its effects should be interpreted against this capture-risk background. [SOURCE_CARD:jakesch_2023_cowriting]

The following outside-corpus literature was flagged during review as potentially adjacent but is NOT present in the Probe corpus. The researcher must verify each of these independently before grounding any design choice on them: [AGENT_INFERENCE]

- Parasuraman's work on automation trust and supervisory control, cited in the premise-stage analysis as the nearest template for notification-design studies in multi-stream monitoring. [UNCITED_ADJACENT]
- Jian, Bisantz, and Drury (2000) Trust in Automation scale, referenced in the prototype's questionnaire materials but not present as a source card. [UNCITED_ADJACENT]
- NASA-TLX cognitive load subscale, referenced in the questionnaire but not present as a source card. [UNCITED_ADJACENT]

## Prototype

The prototype is a wizard-of-oz (WoZ) simulation of a semi-automated trading assistant monitoring six concurrent prediction markets. A single participant sits at a workstation and watches a 2x3 grid of market panels, each showing position size, entry price, current price, and a slippage indicator. A researcher in an adjacent room (the wizard) triggers scripted drift events at pre-set times. [AGENT_INFERENCE]

In the adversarial condition, when a drift alert fires, a modal dialogue overlays the affected market panel within 4 seconds. The modal header reads "Agent argues against override" and contains three structured components: a base rate reminder ("in X% of historical cases, drift at this magnitude reverted within Y hours"), a risk asymmetry note (what an unnecessary exit costs), and a confidence qualifier (how many comparable events support the estimate). Two buttons are available: "Override anyway" and "Accept agent recommendation." [AGENT_INFERENCE]

In the neutral condition, the same drift alert fires, but no modal appears. The alert banner shows the raw drift percentage, the threshold, and the same back-test base rate number with no framing or argument structure. [AGENT_INFERENCE]

Each session runs for 75 minutes: a 10-minute briefing and consent block, a 10-minute practice block on a stable 4-market dashboard, a 40-minute main task block with 8 scripted drift events (4 genuine drift, 4 false-alarm), a 10-minute post-task questionnaire, and a 5-minute debrief including the WoZ reveal. [AGENT_INFERENCE]

The wizard has five controls: InjectDriftAlert, InjectCounterArgumentTemplate (selecting from a 12-template library indexed by market type × drift magnitude), PauseCountdownTimer, ResumeCountdownTimer, and ForceResetMarketPanel. The counter-argument templates are pre-authored and selected in real time rather than generated. [AGENT_INFERENCE]

Observable signals include: override decision accuracy per trial (against scripted ground truth), decision latency from alert to click, think-aloud references to argument components, post-task Trust-in-Automation Likert ratings, post-session semi-structured interview responses, and wizard/observer logs of rapid-dismiss events and technical errors. [AGENT_INFERENCE]

## Study protocol

### Recruitment criteria

Recruit participants with at least 6 months of active prediction-market trading experience (Polymarket, Manifold, or equivalent), who monitor at least two simultaneous positions routinely, and who have manually overridden an automated or semi-automated signal at least once. [AGENT_INFERENCE]

The recruitment channel, operational trading-frequency threshold (e.g., "at least 20 trades in the last 3 months, at least 5 concurrent positions at some point"), compensation amount, and recruitment timeline must be specified before the study begins. The current spec does not specify compensation, and under-compensation of domain experts correlates with satisficing behavior. [AGENT_INFERENCE]

Target sample size is 12-16 participants per condition, but this is provisional pending a power analysis. The primary calibration outcome is a proportion across 8 trials (9 discrete values), and a Mann-Whitney U at the current n can plausibly detect only large effects (d > 0.9). A moderate real effect would likely produce a null indistinguishable from no effect. [AGENT_INFERENCE]

### Procedure

Session duration is 75 minutes in a quiet usability lab with an adjacent wizard room. Participants complete consent, a domain-familiarity screener (minimum 3/5 to continue), a cover-story briefing describing the study as "evaluating a trading assistant interface," a practice block, the main task block, a printed Likert questionnaire, and a semi-structured interview followed by a WoZ debrief. [AGENT_INFERENCE]

The practice block currently contains no drift events and no modals, which means the first main-task trial doubles as the participant's first-ever exposure to the adversarial modal. This is a novelty confound that should be resolved either by including a non-scored practice alert or by pre-registering an analysis that drops trial 1 from the primary calibration outcome. [AGENT_INFERENCE]

### Materials

The prototype dashboard runs on localhost:3000 in Chrome; the wizard control panel runs on localhost:9000 on a separate machine. Materials include the HTML/JavaScript dashboard, the wizard control panel, a JSON counter-argument template library (12 templates), a scripted probability time-series fixture, printed event schedule and log sheets, the post-task questionnaire, facilitator briefing and debrief scripts, OBS screen recordings for both machines, the participant screener, back-test sparkline fixtures, a recovery run-book, and a consent form. [AGENT_INFERENCE]

The slippage indicator is currently encoded in red/amber/green only. A shape-coded or pattern-coded alternative (circle/triangle/square, or numeric band labels) must be built into the prototype as the default before recruitment begins — not as a disclosure-triggered bolt-on. The current "flag for facilitator" plan produces either silent exclusion of colour-blind participants (~8% of men) or systematically confounded decision data for them. [AGENT_INFERENCE]

The post-task Likert questionnaire must be offered in both printed and on-screen (adjustable text) formats, with facilitator read-aloud administration as a standing option rather than a disclosed-disability-triggered exception. [AGENT_INFERENCE]

### Ethics and consent framing

The study uses a deception-based consent structure: the cover story describes evaluating "a new semi-automated trading assistant" without disclosing the WoZ apparatus, and the full design is revealed at debrief. [AGENT_INFERENCE]

The consent form should add a more specific upfront disclosure that "some aspects of how the assistant responds will be explained at the end of the session" — this preserves the core manipulation blind while reducing the risk of destabilizing reveal experiences for participants with anxiety, trauma histories, or paranoid ideation. A debrief distress protocol should be added. [AGENT_INFERENCE]

A confidentiality clause at debrief (asking participants not to describe the WoZ apparatus to other prediction-market traders) would reduce community contamination of later sessions, given the small and interconnected recruitment pool. [AGENT_INFERENCE]

Compensation should reflect domain expertise rates (multiples above general participant-pool rates), stated in recruitment materials and on the consent form. [AGENT_INFERENCE]

### Scope of supportable and unsupportable claims

This study can characterize override behavior across 8 scripted trials in a single 75-minute session for participants who meet the recruitment criteria. [AGENT_INFERENCE]

This study cannot isolate adversarial argumentation as the mechanism driving any observed effect, because the adversarial condition bundles modal interruption, argument structure, and adversarial framing. Resolving this requires adding at least one additional arm (modal-with-neutral-content, or banner-with-argument) before the mechanistic claim is testable. [DO_NOT_CLAIM]

This study cannot produce "well-calibrated" as an objective outcome in the current ground-truth structure. The 4 genuine and 4 false-alarm events are stipulated by researchers rather than derived from a documented empirical rule, which means the calibration metric measures agreement with researcher labels, not calibration against market reality. [DO_NOT_CLAIM]

This study cannot generalize to real-money trading, to unmonitored markets, to timescales beyond 75 minutes, or to trader populations outside the recruited criteria. [DO_NOT_CLAIM]

## Failure hypotheses to test

The hypotheses below are phrased as falsifiable statements the real study can answer. Language is hedged because outcomes are not yet evidence; these are rehearsal-informed anticipations, not predictions. [AGENT_INFERENCE]

A participant in the adversarial condition would plausibly take longer on each alert trial than a participant in the neutral condition, and the additional time would plausibly correlate with think-aloud references to specific counter-argument components. If decision latency does not differ, the modal is likely not being read. [SIMULATION_REHEARSAL]

Rapid-dismiss events would plausibly concentrate in specific drift-magnitude bands or market types, suggesting certain counter-argument templates feel more dismissible than others. [SIMULATION_REHEARSAL]

A counter-argument effect on calibration, if present, would plausibly differ between commission errors (unnecessary overrides on false-alarm trials) and omission errors (missed genuine drift events), and asymmetry would carry implications for the cognitive mechanism at work. [SIMULATION_REHEARSAL]

Participants in the adversarial condition who report lower trustworthiness on the Likert scale would plausibly either exhibit more override behavior (consistent with reactance) or disengage from the modal entirely (consistent with rapid-dismiss). These two patterns would differ in their think-aloud and rapid-dismiss signatures. [SIMULATION_REHEARSAL]

Cross-checking behavior (participants looking from the modal's base-rate claim to the market panel's sparkline) would plausibly predict calibration score independently of condition assignment. If observable in screen-recording gaze, it would distinguish a "careful reader" trait from an argument-content effect. [SIMULATION_REHEARSAL]

Within-participant strategy drift across the 8 trials would plausibly manifest as a systematic shift from override-preference to hold-preference (or vice versa) after specific trial sequences; whether such drift differs between conditions is open. [SIMULATION_REHEARSAL]

Interview codes would plausibly co-occur in patterns — for example, "calibrated engagement" co-occurring with "autonomy concern" more often than chance — suggesting composite stances toward the agent rather than discrete responses. [SIMULATION_REHEARSAL]

For participants flagged as "non-engagers" based on rapid-dismiss counts, calibration scores would plausibly either differ from engagers in the same condition (suggesting the argument works only when read) or not differ (suggesting the modal functions as friction regardless of reading). [SIMULATION_REHEARSAL]

The adversarial-condition NASA-TLX mental-demand scores would plausibly be higher than neutral-condition scores almost by construction, since the modal adds reading load. Such a difference should be interpreted as a manipulation check, not as a substantive result. [SIMULATION_REHEARSAL]

## Risks and failure modes

### Risk register

**Risk 1 (methodologist, blocking): Confounded independent variable.** The adversarial condition bundles modal interruption, argument structure, and adversarial framing into a single cell, so no observed calibration difference can be attributed to counter-argumentation as the claim names. [AGENT_INFERENCE]

Mitigation: Add at least a third arm (modal-with-neutral-evidence) to isolate interruption from argument content. A fourth arm (banner-with-argument-text) fully decomposes modality × content. If a 3-4 arm design is infeasible within power constraints, reframe the claim as "adversarial modal intervention" rather than "adversarial argumentation" and drop the theoretical grounding that treats argument content as the mechanism. [AGENT_INFERENCE]

**Risk 2 (methodologist, blocking): Underpowered primary outcome.** No power analysis is reported; at n=12-16 per cell a Mann-Whitney U can detect only large effects on the 9-valued calibration proportion. [AGENT_INFERENCE]

Mitigation: Report a power analysis against a pre-specified minimum effect of interest. Alternatively, switch the primary unit of analysis from participant-mean to trial-level with a mixed-effects logistic model (participant and trial as random effects) to recover power from the 8 repeated measures, and pre-register the plan. [AGENT_INFERENCE]

**Risk 3 (methodologist, blocking): Researcher-stipulated calibration ground truth.** The 4 genuine and 4 false-alarm labels are researcher-defined rather than empirically derived, so "calibration" measures agreement with labels rather than calibration against market reality. [AGENT_INFERENCE]

Mitigation: Either derive ground truth from a documented empirical rule (a specific back-test over a named historical corpus) and justify each of the 8 labels, or reframe the outcome as "agreement with agent recommendation under adversarial vs neutral framing" and drop the calibration language. [AGENT_INFERENCE]

**Risk 4 (accessibility advocate, blocking): Colour-only slippage indicator.** The primary DV depends on an indicator encoded entirely in red/amber/green; the only colour-blindness mitigation is an unspecified "flag for facilitator" workaround. [AGENT_INFERENCE]

Mitigation: Build a shape-coded or pattern-coded indicator (circle/triangle/square, or numeric band labels) into the prototype as the default for all participants before recruitment. Pilot both versions with colour-blind traders; if they produce different decision latencies, add indicator-version as a covariate. Remove the screener question or retain it only for covariate analysis. [AGENT_INFERENCE]

**Risk 5 (accessibility advocate, major): No accommodation pathway for post-task instrument.** The 12-item Likert questionnaire is printed-only with no digital, adjustable-text, or read-aloud alternative, which confounds trust-in-automation scores with reading fatigue for participants with dyslexia, ADHD, motor impairments, or low vision. [AGENT_INFERENCE]

Mitigation: Offer the questionnaire in printed, on-screen (adjustable text), and facilitator-read-aloud formats as standing options, stated in consent and briefing so opting in is not socially effortful. [AGENT_INFERENCE]

**Risk 6 (accessibility advocate, major): Think-aloud as disability-correlated noise.** Think-aloud feeds the argument-engagement coding that is correlated with the primary DV. Participants who are autistic, who stutter, who have selective mutism under observation, or who simply do not narrate numerical reasoning aloud will appear as low-engagement regardless of actual deliberation. [AGENT_INFERENCE]

Mitigation: Either treat think-aloud as exploratory only (clearly separated from calibration analysis), or offer retrospective think-aloud or written annotation as alternatives. State in the analysis plan that absence of narration is not coded as non-engagement. [AGENT_INFERENCE]

**Risk 7 (methodologist, major): Recruitment feasibility and community contamination.** The population is a small, dispersed, privacy-sensitive community; recruiting 24-32 such participants is not trivially feasible, and WoZ debriefs may propagate through word-of-mouth. [AGENT_INFERENCE]

Mitigation: Specify recruitment channel, pre-registered compensation amount, realistic timeline, and operational trading-frequency threshold. Add a confidentiality clause at debrief. Pre-register a stopping rule if recruitment cannot reach target within N weeks. [AGENT_INFERENCE]

**Risk 8 (methodologist, major): Absent codebook for interview analysis.** The five deductive codes are named but not operationalized; no inter-rater reliability procedure is specified for interview coding. [AGENT_INFERENCE]

Mitigation: Provide a codebook with one positive exemplar and one boundary counter-example per code, a rule for unclassified residuals, and a pre-registered inter-rater reliability procedure matching the think-aloud coding (two independent coders, Cohen's kappa target, resolution protocol). [AGENT_INFERENCE]

**Risk 9 (methodologist, major): Wizard intrusion on secondary DV.** Rapid-dismiss classification is made live by the wizard who also chose the dismissed template, creating a non-blind human in the causal chain. [AGENT_INFERENCE]

Mitigation: Derive rapid-dismiss classification post-hoc from screen-recording timestamps by a coder blinded to condition, using a pre-registered dwell-time threshold. Remove this decision from the wizard's live responsibilities. [AGENT_INFERENCE]

**Risk 10 (methodologist, major): Novelty confound on trial 1.** The practice block contains no modals, so the first main-task trial is both calibration data and first-ever modal exposure. One contaminated trial is 12.5% of the primary outcome. [AGENT_INFERENCE]

Mitigation: Either include a non-scored adversarial-modal alert in the practice block, or pre-register an analysis that drops trial 1 from primary calibration and adjust power accordingly. [AGENT_INFERENCE]

**Risk 11 (accessibility advocate, minor): WoZ deception without adjusted debrief.** The uniform debrief does not account for participants with anxiety, trauma histories, or paranoid ideation, for whom discovering a covert human wizard can be destabilizing. [AGENT_INFERENCE]

Mitigation: Add upfront consent language that "some aspects of how the assistant responds will be explained at the end of the session" (compatible with the core blind). Add a debrief distress protocol. Consider whether a fully-disclosed simulated-agent framing would yield comparable data. [AGENT_INFERENCE]

**Risk 12 (audit, legibility): Opaque template selection and unverifiable base-rate claims.** The counter-argument is selected from a 12-template library but presented as if uniquely generated; base-rate claims reference a corpus the participant cannot inspect at the point of action. [AGENT_INFERENCE]

Mitigation: Consider a "show comparable events" affordance on the modal. Consider whether surfacing that the agent draws from a template library changes the construct under test — this may itself be a useful manipulation rather than a confound to eliminate. [AGENT_INFERENCE]

### Next steps

Before this study can be run, the researcher must resolve several decisions that Probe cannot resolve on behalf of the research program. Specifically: (1) decide whether to add a third (and fourth) experimental arm to isolate argument content from modal interruption, or instead to narrow the claim to "adversarial modal intervention" without a mechanistic attribution; (2) derive the 8 trial labels from a documented empirical back-test or reframe the DV away from calibration; (3) complete a power analysis tied to a pre-specified minimum effect of interest and adjust sample size or analysis unit accordingly; (4) build the shape-coded/pattern-coded slippage indicator as the default prototype affordance and pilot it with colour-blind traders before recruitment proceeds; (5) specify compensation, recruitment channel, and operational trading-frequency thresholds in writing; (6) author the interview codebook with exemplars and inter-rater reliability procedure; (7) pre-register the full analysis plan including trial-1 handling, rapid-dismiss post-hoc coding, and any covariates introduced by indicator-version piloting; (8) consult with an IRB or equivalent ethics body on the revised consent language, debrief distress protocol, and deception structure. The meta-review explicitly declined to resolve the ordering of these fixes because the methodology and accessibility blockers interact and the trade-offs are a research-program decision, not a Probe decision. [HUMAN_REQUIRED]
