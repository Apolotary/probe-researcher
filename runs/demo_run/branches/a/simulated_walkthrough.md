## Session opening

In the opening ten minutes, a participant would likely arrive with an already-formed mental model of how online news articles behave under a screen reader, and the warm-up task would plausibly serve less as calibration for the participant and more as calibration for the research team — specifically, to observe whether this participant's default strategy is heading-driven (H key), landmark-driven (D key), or linear. The choice of default strategy would reasonably shape every subsequent observation, because a linear-reading participant would not expose heading-structure defects at all in the early steps. [SIMULATION_REHEARSAL]

The cover story window (minutes 10–15) would plausibly be the first point of ethical friction to rehearse. A participant being told only that the team is "evaluating a news reading interface" while the research team is actually comparing AI-authored and human-authored articles would likely produce a debrief moment at minute 75 where the participant reasonably asks why authorship was concealed. Rehearsing language for that debrief reveal, and confirming that the consent form anticipates this specific withholding, would be an early risk to flag. [SIMULATION_REHEARSAL]

The NVDA speed setting of 60 wpm specified in the spec is notable because it is unusually slow for a screen-reader-proficient adult, many of whom operate at 300–450 wpm in daily use. A participant sitting down to a pre-configured 60 wpm voice would likely either immediately adjust it or experience the warm-up as artificially sluggish, and either response would introduce a variable the analysis plan does not currently account for. [SIMULATION_REHEARSAL]

The partition-separated two-workstation arrangement would reasonably produce an ambient sense — even without the participant being told — that something is being monitored in parallel. Rehearsing whether the wizard workstation is audible (keyboard clicks, chair movement, whispered decisions logged) matters, because any audible cue would plausibly contaminate the "evaluating a news reading interface" framing. [SIMULATION_REHEARSAL]

## Task flow walkthrough

### Step 1 — locating the main argument

A participant asked to "navigate to the section that tells you what the article's main argument is" would likely interpret this prompt in one of two quite different ways: either as "find the thesis or lede paragraph" (a content-semantic task) or as "find the section heading that signals the argument" (a structure-semantic task). These two interpretations would plausibly produce very different navigation traces for the same article, and the wizard's baseline strategy coding would confound interpretation with strategy unless the facilitator probes which one the participant is executing. [SIMULATION_REHEARSAL]

A participant whose first action is to press H immediately would be producing a clean baseline for heading-navigation analysis, but a participant who begins by arrow-reading the first paragraph to orient themselves would likely generate a focus-change trace that looks, in the log, like extended linear reading rather than a strategy choice. The wizard's real-time classification decision would plausibly be more reliable for the H-pressers and noisier for the orient-first participants. [SIMULATION_REHEARSAL]

If the article in step 1 happens to be one of the JS-rendered sites flagged in the failure cases, the wizard would be making baseline strategy judgments against a dashboard showing near-empty structure, which would reasonably create pressure to trigger the freeze_audit_dashboard fallback within the first two minutes of the session — a stressful opening that rehearsal should anticipate. [SIMULATION_REHEARSAL]

### Step 2 — heading traversal

Reaching step 2, where the participant traverses headings with the H key, a user would likely expose heading-structure defects only if they actually use heading navigation as their default; for a D-key-first participant, step 2's explicit "use H key" framing may feel like being asked to perform a non-default strategy, which would plausibly slow them down for reasons unrelated to the article's structure. [SIMULATION_REHEARSAL]

The >8-second pause threshold for triggering the heading annotation overlay is a judgment that would reasonably be very difficult to make in real time. A participant processing an ambiguous heading ("Background" — background of what?) might pause for semantic reasons entirely independent of structural violations, and the wizard would have no reliable live signal to distinguish "semantic parsing pause" from "structural disorientation pause." This decision would plausibly be the highest-variance wizard judgment in the protocol. [SIMULATION_REHEARSAL]

If the overlay is triggered and NVDA begins announcing "H2: Policy Background [H2]", the participant would likely notice the duplicated-seeming announcement immediately and verbalize confusion about it. This would plausibly break the cover story, because no normal news site behaves this way. The overlay mechanism as specified would reasonably be more useful as a probe of the participant's reaction to structural annotation than as an ecologically valid navigation aid. [SIMULATION_REHEARSAL]

### Step 3 — locating comments

A participant asked to "jump to the comments section or any reader-response area" would reasonably attempt D-key landmark navigation first, then fall back to Ctrl+End to reach page bottom, then to find-in-page for a word like "comment." Each of these fallback strategies would produce a distinct navigation trace, and the 45-second threshold for wizard intervention would likely fire before a participant has exhausted their personal repertoire of fallbacks — meaning the intervention could interrupt an in-progress successful workaround. [SIMULATION_REHEARSAL]

If the article simply does not have a comments section (many news sites have removed them), the task premise breaks: the participant would plausibly search indefinitely for something that isn't there, and the facilitator would need a recovery script. Rehearsing confirmation that all ten corpus articles actually have a reader-response area — and that the target is the same type across articles — would be important. [SIMULATION_REHEARSAL]

The injected landmark breadcrumb, once activated, would likely resolve the blockage within one or two D-key presses as the spec anticipates, but a participant hearing a landmark announce itself where none existed seconds earlier would plausibly remark on the anomaly verbally. The wizard's log would then need to record not just the injection event but the participant's verbalized reaction, which is a data field the current log schema does not explicitly reserve. [SIMULATION_REHEARSAL]

### Step 4 — factual question under time pressure

Under the 3-minute countdown, a participant would reasonably feel more pressure than in steps 1–3, and pressure would plausibly shift navigation strategy toward whatever feels fastest for that individual — typically find-in-page (Ctrl+F) for keywords from the question. If the participant uses Ctrl+F, the heading-ancestry trace becomes almost uninformative for this step, because find-in-page jumps directly to text matches without traversing structure. This would plausibly collapse the structural-versus-content failure distinction the wizard is meant to make. [SIMULATION_REHEARSAL]

The wizard's decision to classify a failure as "navigation structure failure" versus "content comprehension failure" would likely be underdetermined in a non-trivial fraction of cases, because a participant who passes over the correct heading may be doing so for reasons that are neither purely structural nor purely comprehension-based (e.g., heading label is technically correct but uses a near-synonym of the question's keyword). Rehearsing the decision rubric for these gray-zone cases, before the session, would reduce wizard judgment variance. [SIMULATION_REHEARSAL]

### Step 5 — questionnaire and open-ended debrief

After 50 minutes of active navigation across five articles, a participant would likely experience retrospective blurring of which article was which, particularly since the articles are matched on length and topic. The questionnaire asks for per-article ratings, but a participant whose memory of article 2 has fused with article 4 would plausibly either satisfice (rate them identically) or reconstruct ratings from a general impression of difficulty. The 5-article within-session design would reasonably be operating near the upper limit of retrospective discrimination. [SIMULATION_REHEARSAL]

The debrief reveal of the AI/human dimension would likely produce a retrospective reattribution effect: once told that some articles were AI-generated, the participant would plausibly re-narrate their earlier difficulty in those terms regardless of whether the difficulty was actually correlated with authorship. The open-ended responses gathered after the reveal would reasonably be more useful as participant theorizing than as independent signal about article structure. [SIMULATION_REHEARSAL]

## Friction hotspots

- The wizard is asked to make rapid causal attributions (structure vs. strategy, structure vs. comprehension) on the basis of information the dashboard surfaces asymmetrically — structural data is rich, strategy data is inferred from keystroke patterns, and comprehension data is essentially absent. This asymmetry would plausibly bias wizard judgments toward structural attribution. [SIMULATION_REHEARSAL]

- The >8-second pause threshold, the 45-second landmark-search threshold, and the 3-minute factual-answer limit are all phrased as crisp triggers, but a participant's actual behavior would likely straddle these boundaries repeatedly, producing many near-threshold decisions where the wizard must choose whether to intervene. Rehearsing the decision under near-threshold conditions would reasonably be more valuable than rehearsing clear-trigger cases. [SIMULATION_REHEARSAL]

- The JS-rendered article failure case would plausibly occur on at least one of the five articles for a substantial fraction of sessions given that AI-content-producing outlets are often built on modern JS frameworks. The freeze-and-rescan fallback is specified, but the time cost of the fallback (up to 30 seconds) coincides exactly with the window in which the wizard is supposed to be reading the participant's early navigation behavior. This simultaneous demand on wizard attention would reasonably be a friction point. [SIMULATION_REHEARSAL]

- The overlay intervention (inject_heading_annotation_overlay) causes NVDA to announce text that would not appear on any real website ("[H2]" spoken aloud), which would likely be noticed by any proficient screen-reader user as an artifact rather than accepted as part of the page. Rehearsing the participant's probable reaction — and whether that reaction itself is the data of interest — would clarify what the intervention is actually measuring. [SIMULATION_REHEARSAL]

- The observer's real-time tallying of NVDA keystrokes is already acknowledged in the failure cases as unreliable at fast speech rates, and the screen-recording-based post-hoc tally is specified as the primary source. This would reasonably raise the question of whether the observer role, as specified, is adding signal during the session or could be reallocated. [SIMULATION_REHEARSAL]

## Risks to interpretation

A single participant per session, combined with five articles per session, would plausibly produce a dataset where within-participant variation across articles is confounded with participant-specific navigation style. The analysis plan's two-sample permutation test across AI and human groups assumes an n that accumulates across sessions, but any single-session walkthrough would reasonably risk being read as more generalizable than it is. The rehearsal should clarify that a single session produces pilot signal only. [SIMULATION_REHEARSAL]

The cover story's concealment of the AI/human dimension would plausibly hold through the navigation tasks but would reasonably be compromised if the AI-authored articles have systematically different surface features (generic phrasing, predictable heading labels, absent bylines) that a screen-reader-proficient participant would notice via content cues rather than via the structural features the study is designed to measure. Content-based leakage of the authorship condition would confound any structural interpretation. [SIMULATION_REHEARSAL]

The wizard-intervention exclusion rule ("wizard-intervened tasks are excluded from primary analysis") would likely interact badly with the trigger structure, because interventions are triggered precisely on the most structurally problematic articles — meaning the primary analysis would plausibly systematically exclude the articles with the strongest structural signal, biasing effect sizes toward null. This is a rehearsal-level concern about analysis design, not about session execution. [SIMULATION_REHEARSAL]

Counterbalancing across 12 sessions in ABBA-A order with 5 articles per session would reasonably produce confounds between article identity and position-in-session unless the article-to-position mapping is fully crossed, which the spec describes as pre-computed. Rehearsing a single session cannot test the counterbalancing itself, but it would reasonably surface whether fatigue effects across the 50-minute task block are strong enough to dominate article-level variance. [SIMULATION_REHEARSAL]

## Testable questions for the real session

- Does a screen-reader-proficient participant, given the "find the main argument" prompt, interpret it as a content-semantic or structure-semantic task, and does that interpretation correlate with their default navigation strategy? [SIMULATION_REHEARSAL]

- When the heading annotation overlay is triggered, does the participant verbalize noticing the "[H2]" announcement as an artifact, or does it pass without remark — and does this reaction vary with the participant's self-reported NVDA experience level? [SIMULATION_REHEARSAL]

- On JS-rendered articles where the audit dashboard is stale, can the wizard reliably detect the mismatch from NVDA behavior within the first 30 seconds of the participant's navigation, or does detection typically arrive after a task-relevant decision has already been made? [SIMULATION_REHEARSAL]

- At the >8-second pause threshold in step 2, what proportion of pauses reflect structural disorientation versus semantic parsing of an ambiguous heading, and can the think-aloud track reliably discriminate the two post-hoc? [SIMULATION_REHEARSAL]

- When a participant under step-4 time pressure falls back to Ctrl+F, does the navigation trace retain any interpretable signal about the article's structural properties, or does find-in-page effectively null the measurement? [SIMULATION_REHEARSAL]

- After the debrief reveal, do participants' retrospective attributions to AI-versus-human authorship align with the axe-core violation counts per article, or do they align more closely with content-surface features that leaked authorship through non-structural channels? [SIMULATION_REHEARSAL]

- Is the observer's real-time tally of NVDA keystrokes close enough to the screen-recording-derived tally to justify retaining the observer role, or does the observer's attention produce more value when redirected toward free-text behavioral notes? [SIMULATION_REHEARSAL]

- Across the five articles in a single session, does retrospective blurring at the questionnaire stage produce detectable rating compression (similar scores across articles), and if so, does that compression vary with time elapsed between the article task and the questionnaire item? [SIMULATION_REHEARSAL]
