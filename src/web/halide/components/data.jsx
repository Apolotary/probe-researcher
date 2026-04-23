// Shared realistic data derived from the Probe CLI reference.
// Priya's ARIA-live BLV run. Everything here is plausible content the
// CLI would emit — no invented features.

const PROBE_PREMISE_RAW = "evaluate an ARIA-live AI-disclosure banner for BLV screen-reader users";

const PROBE_SHARPEST_QUESTION =
  "What specifically does disclosing AI authorship via ARIA-live add to a BLV user's navigation or credibility judgment that a static byline wouldn't?";

const PROBE_SHARPENED_OPTIONS = [
  {
    id: 1,
    label: "Phrasing-only within-subjects",
    text: "Compare AI-disclosed-early vs. AI-disclosed-late vs. human-framed as a phrasing-only within-subjects design — hold layout and content constant, vary only the ARIA-live string.",
    axis: "isolation",
  },
  {
    id: 2,
    label: "Navigation-pressure between-subjects",
    text: "Compare H-key fast navigators to arrow-key readers on a fixed article; study whether the disclosure lands at all under fast-reading conditions.",
    axis: "realism",
  },
  {
    id: 3,
    label: "Credibility over time",
    text: "Four-week longitudinal study: does repeated AI-disclosure via ARIA-live change trust calibration, or does the announcement become acoustic wallpaper?",
    axis: "timescale",
  },
  {
    id: 4,
    label: "Co-design of the banner itself",
    text: "Work with BLV users to co-design three candidate ARIA-live phrasings, then evaluate against a baseline — moves BLV users from subjects to authors.",
    axis: "relationship",
  },
];

const PROBE_BRANCHES = [
  {
    id: "a",
    letter: "A",
    title: "Corpus audit",
    method: "corpus-audit",
    relationship: "infrastructural",
    question: "What ARIA-live disclosure phrasings exist in the wild across news CMSes, and how do screen readers render them?",
    verdict: "BLOCKED",
    verdictReason: "legibility.no_failure_signal fired at −2 — study cannot distinguish between a working and non-working disclosure.",
    stages: [1, 2, 3, 4, 5, 6, 7, 8],
    color: "rose",
  },
  {
    id: "b",
    letter: "B",
    title: "Wizard-of-Oz disclosure",
    method: "evaluative",
    relationship: "scaffolding",
    question: "Does an ARIA-live disclosure banner change BLV screen-reader users' credibility judgment of an article, compared to a static byline?",
    verdict: "REVISION_REQUIRED",
    verdictReason: "Four Legibility patterns fired. Methodologist and accessibility reviewer split on whether BLV users are subjects or co-designers.",
    stages: [1, 2, 3, 4, 5, 6, 7, 8],
    color: "amber",
  },
  {
    id: "c",
    letter: "C",
    title: "Longitudinal co-design",
    method: "longitudinal",
    relationship: "co-design",
    question: "Over 4 weeks of daily reading, does repeated ARIA-live disclosure recalibrate or habituate BLV users' trust judgments?",
    verdict: "BLOCKED",
    verdictReason: "Timeline incompatible with hackathon scope; legibility.no_failure_signal fired at −2.",
    stages: [1, 2, 3, 4, 5, 6, 7, 8],
    color: "rose",
  },
];

const PROBE_AUDIT_FINDINGS = [
  {
    id: "f1",
    pattern_id: "legibility.announcement_duration_confound",
    axis: "Legibility",
    score: -1,
    severity: "major",
    fired: true,
    evidence: "Disclosure phrasing: \"This article was written with assistance from an AI model.\" (17 syllables, ~6.0s at 180 wpm.) Control phrasing: \"By J. Nguyen.\" (3 syllables, ~1.8s.)",
    evidence_source: "prototype_spec.md §3.2",
    rationale: "The AI-disclosed condition interrupts reading for ~4.2 additional seconds. Any difference in credibility judgment confounds disclosure content with interruption duration. Matching phrasing duration is a necessary control.",
    suggested_revision: "Pad the control to match syllable count (e.g., \"Bylined reporting, J. Nguyen, staff.\") OR measure duration as a covariate.",
  },
  {
    id: "f2",
    pattern_id: "legibility.navigation_speed_floor",
    axis: "Legibility",
    score: -1,
    severity: "major",
    fired: true,
    evidence: "Task flow step 4: \"Participant is free to navigate by heading (H key) or arrow key.\" Article has 3 H2 headings spanning the disclosure.",
    evidence_source: "prototype_spec.json:task_flow[3]",
    rationale: "Fast H-key navigators will traverse all three H2s in under 4 seconds, before the late-banner condition has fired. Late condition is not observable for a measurable subset of BLV users.",
    suggested_revision: "Either constrain navigation to arrow keys, or stratify analysis by primary navigation mode collected in pre-task survey.",
  },
  {
    id: "f3",
    pattern_id: "legibility.single_exposure_insufficient",
    axis: "Legibility",
    score: 0,
    severity: "minor",
    fired: true,
    evidence: "Each participant reads one article under one condition.",
    evidence_source: "prototype_spec.md §2.1",
    rationale: "Credibility calibration is a process, not a snapshot. A single exposure cannot separate first-impression from habituation effects.",
    suggested_revision: "Within-subjects across 3 articles with varied conditions; or explicitly scope findings to first-exposure judgments.",
  },
  {
    id: "f4",
    pattern_id: "capture.reviewer_subject_role_ambiguity",
    axis: "Capture",
    score: -1,
    severity: "major",
    fired: true,
    evidence: "Methods section 4.1: \"We will recruit 12 BLV participants as study subjects.\"",
    evidence_source: "branch_card.json:method_family",
    rationale: "BLV users are framed as subjects of an evaluation, not experts in their own accessibility tooling. This reproduces the pattern the study is ostensibly critiquing.",
    suggested_revision: "Add a formative co-design phase; or reframe recruitment language to foreground BLV expertise.",
  },
  {
    id: "f5",
    pattern_id: "legibility.no_failure_signal",
    axis: "Legibility",
    score: 1,
    severity: "ok",
    fired: false,
    evidence: "Study defines two primary failure modes: (1) disclosure not heard, (2) disclosure heard but judgment unchanged.",
    evidence_source: "prototype_spec.md §5",
    rationale: "Both failure modes are observable and distinguishable. Pattern did not fire.",
  },
];

const PROBE_REVIEWERS = [
  {
    id: "methodologist",
    name: "Methodologist",
    accent: "navy",
    verdict: "major_revision",
    headline: "Announcement-duration confound must be resolved before fielding.",
    points: [
      "The 4.2-second difference between the AI and control string is not acknowledged anywhere in the analysis plan. At n=12 this confound is larger than any plausible credibility effect.",
      "Navigation-mode stratification is absent. Without knowing whether participants are H-key or arrow-key primary, the late-disclosure condition is undefined for an unknown fraction of the sample.",
      "Single-exposure design conflates first-impression with steady-state judgment.",
    ],
  },
  {
    id: "accessibility",
    name: "Accessibility advocate",
    accent: "teal",
    verdict: "major_revision",
    headline: "BLV users are recruited as subjects, not co-designers. Rework.",
    points: [
      "The disclosure phrasing was written by the research team and will be tested on BLV users. The correct sequence is: BLV users write the phrasings, researchers test them.",
      "No consultation with the National Federation of the Blind or comparable orgs is documented.",
      "Compensation ($25 gift card, 45 min) is below the field standard for expert participation.",
    ],
  },
  {
    id: "novelty",
    name: "Novelty hawk",
    accent: "amber",
    verdict: "major_revision",
    headline: "Three adjacent literatures uncited; the study is not positioned.",
    points: [
      "Jakesch et al. 2023 (CHI) — AI-authorship disclosure effects on perceived credibility. Directly adjacent, uncited.",
      "Longoni et al. 2019 (JCR) — algorithm aversion in advisory contexts. Primary theoretical frame, uncited.",
      "Sundar 2008 — MAIN model of technology heuristics. Foundational work, uncited.",
    ],
  },
];

const PROBE_META_VERDICT = {
  classification: "legitimate_methodological_split",
  verdict: "human_judgment_required",
  note: "Methodologist and accessibility advocate disagree on whether the duration confound (methodological) or the subject-framing (ethical) is the load-bearing issue. Both are real. Human researcher must decide which to address in v2.",
};

const PROBE_GUIDEBOOK_PARAGRAPHS = [
  {
    id: "g1",
    section: "Background",
    text: "Kafer develops a political/relational model of disability that situates access needs within social and structural arrangements rather than locating the deficit solely in the individual user, which frames how this study treats BLV participants as expert users of their own tooling rather than as subjects of a corrective intervention.",
    tag: "SOURCE_CARD:kafer_2013",
  },
  {
    id: "g2",
    section: "Background",
    text: "Disclosure of AI authorship has been shown in sighted-reader contexts to reduce perceived credibility by 8–14% across three studies, with the effect moderated by domain expertise and prior exposure to AI-generated text.",
    tag: "SOURCE_CARD:jakesch_2023",
  },
  {
    id: "g3",
    section: "Background",
    text: "Whether the screen-reader's in-line announcement of an ARIA-live region is a functionally equivalent channel to a visually-inspected byline is, to the best of this review, untested.",
    tag: "AGENT_INFERENCE",
  },
  {
    id: "g4",
    section: "Prototype",
    text: "The stimulus is a 640-word news article about municipal budgeting. Three H2 headings partition the article; a sentence-length ARIA-live region announces either \"This article was written with assistance from an AI model\" (early / late conditions) or \"By J. Nguyen\" (control).",
    tag: "RESEARCHER_INPUT",
  },
  {
    id: "g5",
    section: "Prototype",
    text: "In simulated rehearsal with a fast H-key navigator persona, all three H2s were traversed in 3.9 seconds. The late-banner condition — scheduled to fire at the third H2 — did not reach the participant before the task completed.",
    tag: "SIMULATION_REHEARSAL",
  },
  {
    id: "g6",
    section: "Study protocol",
    text: "Next steps before fielding: (1) resolve announcement-duration confound; (2) add formative co-design phase with ≥3 BLV users; (3) register stratification by primary navigation mode; (4) secure compensation at $75/hr honoring expert-participant convention; (5) add Jakesch 2023, Longoni 2019, Sundar 2008 to related work; (6) decide whether to narrow scope to first-exposure judgment or extend to within-subjects.",
    tag: "HUMAN_REQUIRED",
  },
  {
    id: "g7",
    section: "Study protocol",
    text: "Do not frame this study as establishing whether AI disclosure changes trust. The design can at most rehearse whether the ARIA-live channel is legible and whether the phrasing is co-designed.",
    tag: "DO_NOT_CLAIM",
  },
  {
    id: "g8",
    section: "Risks and failure modes",
    text: "Measured: AI phrasing is 17 syllables / ~6.0s; control is 3 syllables / ~1.8s; difference of 4.2s verified against the prototype spec in the deep audit.",
    tag: "TOOL_VERIFIED",
  },
];

const PROBE_PROVENANCE_TAGS = {
  RESEARCHER_INPUT:       { label: "Researcher input",       bg: "#eef4ff", fg: "#1e3a8a" },
  SOURCE_CARD:            { label: "Source card",            bg: "#e6f0ff", fg: "#0f2f6b" },
  SIMULATION_REHEARSAL:   { label: "Simulation rehearsal",   bg: "#fff4e0", fg: "#8a4b00" },
  AGENT_INFERENCE:        { label: "Agent inference",        bg: "#f3e8ff", fg: "#5b21b6" },
  UNCITED_ADJACENT:       { label: "Uncited adjacent",       bg: "#fef0f0", fg: "#8a1a1a" },
  HUMAN_REQUIRED:         { label: "Human required",         bg: "#fff0f0", fg: "#9a1f1f" },
  DO_NOT_CLAIM:           { label: "Do not claim",           bg: "#3a1a1a", fg: "#ffd4d4" },
  TOOL_VERIFIED:          { label: "Tool verified",          bg: "#e5f6ea", fg: "#0f5a1f" },
  IMPORTED_DRAFT:         { label: "Imported draft",         bg: "#f0eeea", fg: "#4a3f2a" },
};

const PROBE_RUNS = [
  { id: "demo_run", premise: "evaluate an ARIA-live AI-disclosure banner for BLV screen-reader users", cost: 5.93, duration: "25m 12s", verdict: "1 surviving", stamp: "Today · 14:02" },
  { id: "backlog_torso_s4_ios", premise: "understand how high-volume creators manage their iOS notification backlog", cost: 4.12, duration: "21m 04s", verdict: "2 surviving", stamp: "Yesterday · 11:17" },
  { id: "adversarial_trivial_darkmode", premise: "measure dark-mode preference stability across sessions", cost: 3.28, duration: "18m 30s", verdict: "all blocked", stamp: "Apr 19" },
  { id: "teacher_calc_feedback", premise: "formative feedback on middle-school calculator-use norms", cost: 4.77, duration: "22m 41s", verdict: "1 surviving", stamp: "Apr 17" },
  { id: "creator_onboarding_friction", premise: "onboarding friction for first-time livestream creators", cost: 5.05, duration: "23m 50s", verdict: "2 surviving", stamp: "Apr 14" },
];

const PROBE_STAGES = [
  { n: 1, name: "Premise interrogation", role: "critic", duration: "1m 48s", model: "Opus", cost: 0.22 },
  { n: 2, name: "Branch divergence",     role: "planner", duration: "2m 13s", model: "Opus", cost: 0.31 },
  { n: 3, name: "Grounding + sources",   role: "researcher", duration: "3m 04s", model: "Sonnet", cost: 0.41 },
  { n: 4, name: "Prototype spec",        role: "designer", duration: "3m 52s", model: "Sonnet", cost: 0.58 },
  { n: 5, name: "Simulated walkthrough", role: "rehearsal", duration: "4m 21s", model: "Sonnet", cost: 0.67 },
  { n: 6, name: "Pattern audit",         role: "critic", duration: "3m 18s", model: "Opus", cost: 0.92 },
  { n: 7, name: "Reviewer panel",        role: "adversary", duration: "4m 06s", model: "Opus", cost: 1.34 },
  { n: 8, name: "Guidebook assembly",    role: "writer", duration: "2m 30s", model: "Sonnet", cost: 0.48 },
];

const PROBE_TOOL_CALLS = [
  { t: "00:04", tool: "bash", cmd: "wc -w runs/demo_run/branches/b/prototype_spec.md", out: "1,247 runs/demo_run/branches/b/prototype_spec.md" },
  { t: "00:09", tool: "grep", cmd: "grep -n 'aria-live' prototype_spec.md", out: "§3.2: \"This article was written with assistance from an AI model.\"\n§3.2: \"By J. Nguyen.\"" },
  { t: "00:21", tool: "calculate", cmd: "syllables('This article was written with assistance from an AI model') / (180/60)", out: "17 syllables ÷ 3 syl/sec = 5.67s" },
  { t: "00:28", tool: "calculate", cmd: "syllables('By J. Nguyen') / (180/60)", out: "3 syllables ÷ 3 syl/sec = 1.00s" },
  { t: "00:34", tool: "bash", cmd: "cat runs/demo_run/branches/b/task_flow.json | jq '.task_flow[3]'", out: "{\n  \"step\": 4,\n  \"action\": \"free navigation\",\n  \"modes\": [\"H-key\", \"arrow\"]\n}" },
  { t: "00:41", tool: "web_search", cmd: "JAWS default reading rate words per minute", out: "180-300 wpm default; advanced users routinely run 450+ wpm." },
  { t: "00:52", tool: "bash", cmd: "grep -c 'H2' runs/demo_run/branches/b/stimulus.html", out: "3" },
  { t: "01:03", tool: "note", cmd: "measurement complete", out: "4.67s delta between conditions; confounds credibility measurement at n=12." },
];

Object.assign(window, {
  PROBE_PREMISE_RAW,
  PROBE_SHARPEST_QUESTION,
  PROBE_SHARPENED_OPTIONS,
  PROBE_BRANCHES,
  PROBE_AUDIT_FINDINGS,
  PROBE_REVIEWERS,
  PROBE_META_VERDICT,
  PROBE_GUIDEBOOK_PARAGRAPHS,
  PROBE_PROVENANCE_TAGS,
  PROBE_RUNS,
  PROBE_STAGES,
  PROBE_TOOL_CALLS,
});
