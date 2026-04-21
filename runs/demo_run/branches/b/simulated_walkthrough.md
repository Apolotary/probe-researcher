## Session opening

Imagining the first ten minutes of a session, the facilitator would be reading consent language aloud while the participant is still in an unfamiliar auditory environment — their own screen reader announcing an unfamiliar Zoom interface layered with the facilitator's voice. A participant might plausibly experience cognitive load from competing audio streams before the experimental tasks have even begun, which could affect baseline comfort with the think-aloud protocol. [SIMULATION_REHEARSAL]

During the screener and warm-up phase (10–20 minutes), a rehearsal pass suggests the screen-reader familiarity screener could feel redundant to a participant recruited through a disability-led organization who has already self-identified as an expert daily user. This framing could subtly shift the rapport dynamic toward a testing posture rather than a collaborative one, which would plausibly make participants more likely to over-explain their navigation choices later. The warm-up article is probably the most load-bearing part of the opening, because it is the only opportunity for the wizard to confirm that the screen-share feed exposes enough detail (speech viewer overlay, cursor position, audible keystrokes) to fire the late-banner trigger reliably. [SIMULATION_REHEARSAL]

A technical ambiguity likely to surface in the opening concerns the Braille-display screener question. Asking 'Do you use a Braille display as your primary output?' would reasonably produce a partial-yes response from participants who use Braille alongside speech rather than exclusively, and the binary branching protocol may not cover that hybrid case cleanly. [SIMULATION_REHEARSAL]

## Task flow walkthrough

### Step 1 — Page load and variant confirmation

Walking through the page-load step, a wizard observing via screen-share would need to judge two events in close succession: that the correct article variant has loaded, and that the H1 announcement has completed. Under typical NVDA + Firefox timing, these could occur within 2–4 seconds of each other, and a wizard who fires the banner too eagerly might plausibly clip the tail of the H1 announcement, producing an artifact where the disclosure string begins before the title has been fully absorbed. [SIMULATION_REHEARSAL]

A participant in this step is being asked to 'explore as you normally would,' but their environment is atypical — a researcher is listening, a screen-share is active, and they have been primed by a consent form that mentions AI disclosures in some form. Reactivity to this framing would likely compress normal browsing patterns into a more deliberate, demonstrative mode of navigation. [SIMULATION_REHEARSAL]

The 8-second page-load threshold for fallback activation seems tight when tunneling through ngrok from a residential connection, and a rehearsal suggests the wizard would face a recurring borderline-decision at around 6–10 seconds where it is unclear whether to wait or switch to the offline fallback. [SIMULATION_REHEARSAL]

### Step 2 — Banner injection during heading navigation

This step is where the experimental manipulation lives, and it is also where the rehearsal surfaces the most friction. For the late-banner condition specifically, the wizard must detect in real time that the participant's cursor has passed the second H2, and then fire the injection — but a participant who jumps rapidly from H2 to H2 using the H key could plausibly traverse all three headings in under 4 seconds, giving the wizard almost no window to fire between the second and third heading. The late-banner timing precision would reasonably degrade under fast navigators, potentially collapsing the early/late distinction for a subset of trials. [SIMULATION_REHEARSAL]

A user encountering the early AI-disclosure banner before the first H2 would likely hear it inserted into their navigation flow as an unrequested announcement, and the polite live-region queue would cause it to be spoken only after the current utterance completes. If the participant is mid-jump between headings, the announcement could plausibly arrive while they are already on the next heading, making it hard to localize in their mental model of the page. [SIMULATION_REHEARSAL]

The human-framed condition ('Written by a staff journalist') is substantially shorter than the AI disclosure string, which introduces a confound the rehearsal cannot ignore: announcement duration differs across conditions by several seconds. A participant in the AI condition would plausibly experience a longer interruption before resuming heading navigation, and any condition difference in dwell-onset latency could partly reflect announcement length rather than content. [SIMULATION_REHEARSAL]

The mode-suppression failure case (participant in forms mode when injection fires) is plausible especially in trials 2 and 3, where the participant has recently returned from the credibility form. A rehearsal suggests the 'RE-INJECT' fallback protocol would introduce observable artifacts — the facilitator's instruction to press Escape and re-read from the top would itself be a prime — and flagging these trials for sensitivity analysis may not fully absorb the contamination. [SIMULATION_REHEARSAL]

### Step 3 — Section selection under credibility probe

Reaching the credibility-probe step, a participant is being asked to nominate 'the section most important for deciding whether this article is trustworthy.' This phrasing would plausibly cue participants toward sourcing and methodology sections regardless of condition, because the word 'trustworthy' semantically pulls toward evidence. The predicted AI-disclosure effect on section selection could therefore be partially pre-empted by the probe wording itself. [SIMULATION_REHEARSAL]

A participant in the late-AI condition who hears the disclosure only after navigating past the second H2 might reasonably be in the middle of selecting a section when the banner fires, producing a sequence where the disclosure arrives during section evaluation rather than before it. This ordering would be qualitatively different from the early-AI condition and could complicate within-subject comparisons on the section-selection measure. [SIMULATION_REHEARSAL]

### Step 4 — Credibility rating form

The rating form step invites friction because it asks the participant to switch from reading mode into form-completion mode, which is exactly the mode transition most likely to trigger the forms-mode suppression bug for the *next* trial's banner. A rehearsal suggests the order of operations — read article, rate credibility, load next article — creates a structural risk that trial 2 and trial 3 banners will be suppressed at higher rates than trial 1 banners. [SIMULATION_REHEARSAL]

The 7-item rating scale would likely take a screen-reader user longer to complete than a sighted user, and with three trials stacked, the cumulative time cost could push the session past the 75-minute budget, producing fatigue that would concentrate in the third-trial data. [SIMULATION_REHEARSAL]

### Step 5 — Debrief interview

The debrief step asks whether participants noticed differences between articles, and this is where a rehearsal surfaces a hedging concern: participants who did not consciously register the banner (coded as category A in the think-aloud scheme) may reconstruct a false memory of having noticed it once the facilitator's questions imply that something was present to be noticed. The debrief would plausibly generate over-reports of awareness relative to what the think-aloud window captured. [SIMULATION_REHEARSAL]

The wizard's option to pass a written note flagging specific navigation events for probing creates a subtle asymmetry: trials that produced observable hesitation get deeper debrief treatment than trials that did not, which would reasonably bias the qualitative corpus toward the more dramatic behavioral signatures. [SIMULATION_REHEARSAL]

## Friction hotspots

- Late-banner timing precision under fast heading-jump navigators: the wizard's window to fire between the second and third H2 could plausibly be too short for reliable execution, and the resulting trials might blur the early/late distinction. [SIMULATION_REHEARSAL]
- Announcement-duration confound between the AI disclosure string and the human-framed string: condition differences in post-banner dwell could partly reflect the extra seconds of speech rather than the semantic content of the disclosure. [SIMULATION_REHEARSAL]
- Forms-mode suppression carrying over from the credibility form into the next trial's banner injection: this would concentrate failure cases in trials 2 and 3, biasing the dataset asymmetrically across trial position. [SIMULATION_REHEARSAL]
- Probe wording ('most important for deciding whether this article is trustworthy') semantically priming sourcing-section selection independent of condition, which could dampen the predicted adversarial-check effect. [SIMULATION_REHEARSAL]
- Braille-display confirmation protocol depending on a binary screener question that may not capture hybrid speech + Braille users cleanly, producing trials where delivery confirmation is ambiguous. [SIMULATION_REHEARSAL]
- Session duration pressure from stacking three trials plus debrief into 75 minutes, which would plausibly produce fatigue concentrated in trial 3 and degrade think-aloud quality. [SIMULATION_REHEARSAL]

## Risks to interpretation

Because the same participant rates all three conditions, a demand-characteristic risk is non-trivial: by the third trial, a participant would reasonably have inferred that authorship framing is the experimental variable of interest, and their credibility ratings in trial 3 could plausibly reflect hypothesis-guessing rather than authentic judgment. The Latin-square counterbalancing addresses order effects at the group level but does not neutralize this within-participant awareness drift. [SIMULATION_REHEARSAL]

The think-aloud coding scheme treats verbal acknowledgment of the disclosure as the primary evidence of banner uptake, but a participant who hears the banner and silently updates their credibility judgment without verbalizing it would be coded as category A (no acknowledgment) and thereby appear identical to a participant for whom the banner was suppressed entirely. This collapses a meaningful distinction and would plausibly understate the true rate of disclosure uptake. [SIMULATION_REHEARSAL]

The n=8 within-subject design with three conditions would produce only 24 trial-level observations, and the Friedman test on such a sample would have modest power to detect anything but large effects. A null result on the behavioral measures would not reasonably discriminate between 'no effect' and 'small effect under-detected,' which is a limitation worth naming before the session rather than after. [SIMULATION_REHEARSAL]

The wizard's role as both trigger-firer and real-time logger creates a cognitive-load risk: a wizard who is simultaneously watching cursor position, judging announcement completion, logging heading-jump events, and monitoring for mode suppression would plausibly make more logging errors in the late-AI condition than in the early-AI or human conditions, because the late condition demands the tightest temporal judgment. This would asymmetrically degrade data quality across conditions. [SIMULATION_REHEARSAL]

## Testable questions for the real session

- Does the late-banner trigger window (between second and third H2 traversal) remain operationally feasible for fast-navigating participants, or does the wizard miss the window often enough that the late condition collapses into an effectively-random-timing condition? [SIMULATION_REHEARSAL]
- When the announcement duration differs across conditions by several seconds, can post-hoc analysis disentangle announcement-length effects from semantic-content effects on dwell-onset latency, or will the confound be irreducible? [SIMULATION_REHEARSAL]
- How often does forms-mode suppression occur on trial 2 and trial 3 banners relative to trial 1, and does the frequency justify redesigning the credibility-form-to-article transition to include a mode reset? [SIMULATION_REHEARSAL]
- Do participants coded as category A in the think-aloud scheme nonetheless show condition-differentiated credibility ratings, which would suggest silent uptake of the banner that the verbal-coding method fails to detect? [SIMULATION_REHEARSAL]
- Does the probe wording in Step 3 ('most important for deciding whether this article is trustworthy') produce a ceiling effect where most participants select the sourcing section in all three conditions, masking any condition-driven shift? [SIMULATION_REHEARSAL]
- Do participants report, in debrief, a growing awareness of the disclosure manipulation across trials, and if so does this awareness correlate with changes in credibility rating patterns from trial 1 to trial 3? [SIMULATION_REHEARSAL]
- For participants using a refreshable Braille display, does the 'CHECK-BRAILLE' verbal confirmation protocol reliably distinguish delivered-but-silent banners from failed injections, or does it introduce priming that contaminates subsequent navigation? [SIMULATION_REHEARSAL]
