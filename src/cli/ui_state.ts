/**
 * Workflow state — what gets carried across stages of the Probe UI
 * pipeline. The text content is generated client-side from the user's
 * typed premise so the demo feels responsive. Replace `makeBrainstorm`,
 * `makeLiterature`, etc. with real LLM calls when the pipeline is
 * wired up.
 */

export interface SubRQ {
  letter: string;       // 'A' | 'B' | 'C' | …
  rq: string;           // the question text
  angle: string;        // 'mechanism' | 'intervention' | 'lived experience' | 'custom'
  method: string;       // method tag
  n: string;            // sample size hint
  custom?: boolean;
}

export interface LiteratureBlock {
  letter: string;
  stateOfArt: string;
  similar: Array<{ cite: string; title: string; venue: string }>;
  gaps: string[];
}

export interface CandidateDesign {
  id: string;
  name: string;
  weeks: number;
  arc: string;             // one-line tagline
  summary: string;
  // RQ coverage matrix: rqLetter → 'core' | 'partial' | 'none'
  coverage: Record<string, 'core' | 'partial' | 'none'>;
  strengths: string[];
  tensions: string[];
}

export interface Phase {
  weeks: number;
  name: string;
  detail: string;
}

export interface StudyPlan {
  phases: Phase[];
  deliverables: string[];
  recruitment: string;
  totalWeeks: number;
  risks: string[];
}

export interface Artifact {
  id: string;
  title: string;
  kind: 'spec' | 'protocol' | 'survey' | 'irb' | 'diary';
  body: string;
}

export interface Persona {
  id: string;
  name: string;
  role: string;
  bias: string;
  /** Optional attribute chips (used by the web persona pool). */
  attrs?: string[];
}

export interface Friction {
  id: string;
  severity: 'critical' | 'medium' | 'low';
  title: string;
  trigger: string;
  evidence: string;
  fix: string;
}

export interface ReviewerCard {
  id: string;                        // 'R1' | 'R2' | 'R3'
  rec: 'A' | 'ARR' | 'RR' | 'RRX' | 'X';
  // Specialization profile (probe-review.jsx v2):
  field: string;                     // free-text expertise area
  affiliation: 'academic' | 'industry' | 'independent';
  topicConfidence: 'expert' | 'confident' | 'tentative' | 'outsider';
  oneLine: string;
  strengths: string[];
  weaknesses: string[];
  toAuthors: string;
  toChairs: string;
}

export interface MetaReview {
  ac: string;
  verdict: 'accept' | 'minor' | 'major' | 'reject';
  summary: string;
  proposed: string;
  consensusPoints: Array<{ tag: 'all-3' | '2-of-3' | '1-of-3'; text: string; priority: 'high' | 'medium' | 'low' }>;
}

export interface ReviewSession {
  paperTitle: string;
  reviewers: ReviewerCard[];
  meta: MetaReview;
}

export interface ProbeWorkflowState {
  premise: string;
  rqs: SubRQ[];
  selectedRqLetters: string[];
  rqNotes: Record<string, string>;
  // Literature (one entry per selected RQ letter)
  literature: LiteratureBlock[];
  // Methodology
  candidates: CandidateDesign[];
  chosenDesignId: string | null;
  studyNotes: string;
  plan: StudyPlan | null;
  // Artifacts
  artifacts: Artifact[];
  // Evaluation
  evalN: number;
  personas: Persona[];
  findings: Friction[];
  // Report
  paperTitle: string;
  discussion: string;
  conclusion: string;
  projectName: string;
  // Review (stage 07 — ARR-style peer review session)
  reviewSession: ReviewSession | null;
}

export const EMPTY_STATE: ProbeWorkflowState = {
  premise: '',
  rqs: [],
  selectedRqLetters: [],
  rqNotes: {},
  literature: [],
  candidates: [],
  chosenDesignId: null,
  studyNotes: '',
  plan: null,
  artifacts: [],
  evalN: 12,
  personas: [],
  findings: [],
  paperTitle: '',
  discussion: '',
  conclusion: '',
  projectName: '',
  reviewSession: null,
};

/* ── canned content generators ─────────────────────────────────────── */

export function makeBrainstorm(premise: string): SubRQ[] {
  // We synthesize three sub-questions from the premise. The phrasing
  // is deterministic so the demo reads cleanly, but the topic word
  // (extracted from the premise) gets sprinkled in so it feels
  // responsive to the input.
  const topic = topicWord(premise);
  return [
    {
      letter: 'A',
      rq: `What underlying mechanism explains how ${topic} affects the outcome of interest?`,
      angle: 'mechanism',
      method: 'diary study + telemetry',
      n: 'n≈18',
    },
    {
      letter: 'B',
      rq: `Which intervention reliably shifts ${topic} in a measurable direction?`,
      angle: 'intervention',
      method: 'within-subjects field trial',
      n: 'n≈24',
    },
    {
      letter: 'C',
      rq: `How do practitioners experience ${topic} in their day-to-day work?`,
      angle: 'lived experience',
      method: 'semi-structured interviews',
      n: 'n≈12',
    },
  ];
}

export function makeLiterature(rqs: SubRQ[]): LiteratureBlock[] {
  return rqs.map((rq) => ({
    letter: rq.letter,
    stateOfArt:
      `Recent HCI work on ${shortAngle(rq.angle)} converges on three findings: (1) self-report and ` +
      `behavioral telemetry diverge under high cognitive load; (2) most published interventions ` +
      `target the moment of friction rather than the conditions that produced it; (3) sample ` +
      `recruitment in this space skews toward high-trust knowledge workers, which weakens ` +
      `external validity. The space is overdue for studies that triangulate self-report with ` +
      `objective measures over weeks rather than minutes.`,
    similar: [
      { cite: 'Liao et al. 2024',  title: 'Cognitive load and self-report drift in remote work', venue: 'CHI' },
      { cite: 'Park & Kim 2023',   title: 'Field measurement of attention recovery rituals',     venue: 'CSCW' },
      { cite: 'Mehrotra 2023',     title: 'Telemetry-based studies of fragmented work',          venue: 'IMWUT' },
      { cite: 'Saha & Hall 2022',  title: 'Diary-as-instrument: methodological review',          venue: 'TOCHI' },
    ],
    gaps: [
      `multi-week deployments measuring ${shortAngle(rq.angle)} at scale`,
      'cross-population validity beyond high-trust knowledge workers',
      'instrumentation that resists demand characteristics in field settings',
      'analyses that surface the cost of context-switching, not just its frequency',
    ],
  }));
}

export function makeCandidates(rqLetters: string[]): CandidateDesign[] {
  const cov = (a: 'core' | 'partial' | 'none', b: 'core' | 'partial' | 'none', c: 'core' | 'partial' | 'none') => {
    const map: Record<string, 'core' | 'partial' | 'none'> = {};
    rqLetters.forEach((L, i) => { map[L] = [a, b, c][i] ?? 'partial'; });
    return map;
  };
  return [
    {
      id: 'longi',
      name: 'Mixed-methods longitudinal field study',
      weeks: 12,
      arc: 'one cohort · three lenses · one paper',
      summary: 'A 12-week deployment with one cohort. Diary entries address mechanism (RQ A), a within-subjects ritual trial in weeks 6–10 addresses intervention (RQ B), and exit interviews address lived experience (RQ C).',
      coverage: cov('core', 'core', 'partial'),
      strengths: ['triangulated evidence', 'shared sample reduces variance', 'one IRB, one paper'],
      tensions: ['12 weeks is long for a hackathon-style timeline', 'attrition risk on the back half'],
    },
    {
      id: 'probe',
      name: 'Tech-probe deployment',
      weeks: 8,
      arc: 'a probe is a question instrument, not a product',
      summary: 'Build a minimal Slack-bot or browser-extension probe that captures behavioral telemetry. Deploy for 8 weeks. The probe doubles as a measurement instrument and a gentle intervention.',
      coverage: cov('partial', 'core', 'partial'),
      strengths: ['behavioral data, not just self-report', 'lower per-participant burden'],
      tensions: ['engineering effort required', 'IRB may flag continuous capture'],
    },
    {
      id: 'twophase',
      name: 'Two-phase: descriptive survey → focused intervention',
      weeks: 10,
      arc: 'wide first, deep second',
      summary: 'A descriptive survey of ~200 participants establishes the landscape (RQ A), followed by a focused 4-week intervention with 24 of those participants (RQ B). Lived experience emerges from open-ended survey + post-intervention interviews.',
      coverage: cov('core', 'core', 'partial'),
      strengths: ['representative sample for descriptive arm', 'clean intervention design'],
      tensions: ['survey arm is shallow on RQ C', 'recruitment costs scale with phase 1 sample size'],
    },
    {
      id: 'qualcore',
      name: 'Qualitative core with quantitative scaffolding',
      weeks: 6,
      arc: 'thick description, light measurement',
      summary: 'Twelve in-depth interviews with light pre/post measurement. Builds rich theory about lived experience first, instrumented findings second.',
      coverage: cov('partial', 'partial', 'core'),
      strengths: ['rich theory', 'fast to field', 'low IRB friction'],
      tensions: ['weak on causal claims', 'small n limits generalization'],
    },
    {
      id: 'rapid',
      name: 'Rapid mixed pilot',
      weeks: 4,
      arc: 'enough to know if the bigger study is worth running',
      summary: 'A 4-week pilot of ~10 participants combining a mini-diary, a single intervention, and exit interviews. Decision: green-light the longitudinal study or pivot.',
      coverage: cov('partial', 'partial', 'partial'),
      strengths: ['quick decision-grade evidence', 'cheap to run'],
      tensions: ['underpowered for any single RQ', 'pilot artifacts often get published when they shouldn\'t'],
    },
  ];
}

export function makePlan(designId: string, premise: string): StudyPlan {
  // Plans are mostly the same shape — varying weeks and recruitment
  // strings tied to the chosen design.
  const longi: StudyPlan = {
    phases: [
      { weeks: 1, name: 'Pre-flight & IRB',    detail: 'Pilot the diary form with 3 internal volunteers. Submit IRB amendment for telemetry capture.' },
      { weeks: 1, name: 'Recruit & onboard',   detail: 'Recruit 18 participants via screener. 60-second explainer screen before the OS-level capture prompt.' },
      { weeks: 4, name: 'Diary baseline',      detail: 'Daily 90-second diary entries + passive telemetry. Weekly digest sent Wednesday morning.' },
      { weeks: 4, name: 'Within-subjects trial', detail: 'Introduce the ritual. ABA design: 2 weeks ritual, 1 week off, 1 week ritual.' },
      { weeks: 1, name: 'Exit interviews',     detail: '45-minute interviews. Open-ended on lived experience, then probe on telemetry observations.' },
      { weeks: 1, name: 'Analysis & write-up', detail: 'Mixed-methods analysis. Triangulate diary, telemetry, and interview findings against each RQ.' },
    ],
    deliverables: [
      'cleaned diary + telemetry dataset',
      '18 exit-interview transcripts (coded)',
      'paper draft (CHI / CSCW length)',
      'replication package on OSF',
    ],
    recruitment: 'remote knowledge workers who participate in 4+ video calls per typical workday',
    totalWeeks: 12,
    risks: [
      'attrition at week 6 (mid-study fatigue)',
      'demand characteristics inflate self-reported adherence',
      'IRB may require shorter telemetry retention',
    ],
  };
  void premise;
  void designId;
  return longi; // simplified — same plan shape for all designs in the demo
}

export function makeArtifacts(): Artifact[] {
  return [
    {
      id: 'spec',
      title: 'Implementation plan (CLAUDE.md-style spec)',
      kind: 'spec',
      body: [
        '# Probe — focus-rituals study · implementation spec',
        '',
        '## Scope',
        'A 12-week longitudinal deployment with diary capture + ritual intervention + exit interviews.',
        '',
        '## Components',
        '- diary form (web, mobile-friendly): 90s daily entry',
        '- telemetry hook: macOS+Windows agent or browser extension',
        '- ritual prompt: shows in OS notification at user-set time',
        '- weekly digest: Wednesday morning email',
        '',
        '## Data model',
        '- participant(id, recruited_at, cohort)',
        '- diary_entry(participant_id, ts, mood, focus_score, notes)',
        '- session(participant_id, app, start_ts, end_ts)',
        '- ritual_event(participant_id, prompt_ts, completed_at)',
        '',
        '## Milestones',
        '- M1 (week -2): pilot with 3 internal users, IRB filed',
        '- M2 (week 0):  recruitment open, onboarding flow live',
        '- M3 (week 4):  baseline complete, ritual phase begins',
        '- M4 (week 12): final dataset locked, analysis begins',
      ].join('\n'),
    },
    {
      id: 'protocol',
      title: 'Validation protocol (human-study handbook)',
      kind: 'protocol',
      body: [
        '# Validation protocol',
        '',
        '## Recruitment',
        'Screen for: 4+ video calls/day on typical workdays · ≥6 months tenure in current role · willing to install telemetry agent.',
        '',
        '## Consent',
        '- 60-second explainer screen BEFORE the OS prompt (mitigates surveillance perception)',
        '- written consent form: data retention 18 months, deletion on request, no employer access',
        '- compensation: $80 onboarding + $25/week + $50 exit interview',
        '',
        '## Session script (exit interview, 45 min)',
        '1. opening: tell me about a typical workday last week (10m)',
        '2. probe on telemetry observations the participant\'s data revealed (15m)',
        '3. ritual reflection: when did it help, when didn\'t it (15m)',
        '4. close: anything you wish I had asked (5m)',
        '',
        '## Measures',
        '- daily diary: 5-pt focus, 5-pt fatigue, free-text "what got in the way"',
        '- weekly: PROMIS work-related fatigue (4-item)',
        '- exit: NASA-TLX retrospective + structured interview',
      ].join('\n'),
    },
    {
      id: 'irb',
      title: 'IRB-light memo',
      kind: 'irb',
      body: [
        '# IRB-light memo',
        '',
        '- Risk classification: minimal (no clinical, no employer-shared data).',
        '- Data flow: telemetry → encrypted local store → participant-controlled upload weekly.',
        '- Retention: 18 months post-publication, then secure deletion.',
        '- Withdrawal: any time, full data deletion within 5 business days.',
      ].join('\n'),
    },
  ];
}

export function makePersonas(n: number): Persona[] {
  const seeds: Array<Omit<Persona, 'id'>> = [
    { name: 'Alex (32)',   role: 'staff PM, US-CA',   bias: 'high-trust, low IT friction, values quiet hours' },
    { name: 'Beatrix (28)', role: 'design lead, UK',   bias: 'video-call-heavy, skeptical of telemetry' },
    { name: 'Chen (41)',   role: 'eng director, SG',   bias: 'context-switches every 9 min on average' },
    { name: 'Dahlia (35)', role: 'researcher, NL',     bias: 'has young kids; calendar fragmented' },
    { name: 'Emir (29)',   role: 'product analyst, TR', bias: 'remote since 2020, well-adapted' },
    { name: 'Fern (39)',   role: 'CTO, AU',            bias: 'structurally interrupted; meeting-heavy' },
    { name: 'Greta (44)',  role: 'principal eng, DE',  bias: 'long deep-work blocks valued' },
    { name: 'Hideo (33)',  role: 'tech lead, JP',      bias: 'cross-tz; async-first preference' },
    { name: 'Inez (27)',   role: 'PM, BR',             bias: 'early-career, leans on calendar holds' },
    { name: 'Jude (52)',   role: 'staff researcher, CA', bias: 'distrusts wellness framing' },
    { name: 'Kai (31)',    role: 'eng manager, US-NY', bias: 'rituals as chore-list, not relief' },
    { name: 'Liu (37)',    role: 'senior PM, CN',      bias: 'works split shift across timezones' },
  ];
  const out: Persona[] = [];
  for (let i = 0; i < n; i++) {
    const seed = seeds[i % seeds.length];
    out.push({ id: String(i + 1), name: seed.name, role: seed.role, bias: seed.bias });
  }
  return out;
}

export function makeFindings(): Friction[] {
  return [
    {
      id: 'F1',
      severity: 'critical',
      title: 'ESM window too short',
      trigger: 'simulated participants drop out of dense meeting days',
      evidence: 'attrition correlates r=0.47 with self-reported meeting density',
      fix: 'shorten window to 90s · optional "remind in 10 min" defer',
    },
    {
      id: 'F2',
      severity: 'medium',
      title: 'perceived surveillance at onboarding',
      trigger: 'participants report confusion at the OS-level capture prompt',
      evidence: '8/12 simulated personas pause before consenting; 2 decline outright',
      fix: 'add a 60-second explainer screen BEFORE the OS prompt',
    },
    {
      id: 'F3',
      severity: 'low',
      title: 'weekly digest open-rate',
      trigger: 'weekly retention digest is sent Friday afternoon',
      evidence: 'open rate ~24% in simulation, vs ~58% projected',
      fix: 'move send to Wednesday morning',
    },
  ];
}

export function makeReport(state: ProbeWorkflowState): { discussion: string; conclusion: string; titleOptions: string[] } {
  const t = topicWord(state.premise);
  return {
    titleOptions: [
      `Rituals, fatigue, and the texture of ${t}: a 12-week field study`,
      `Mixed-methods evidence on ${t} in remote knowledge work`,
      `Field methods for studying ${t} without inflating self-report`,
    ],
    discussion:
      `Across the simulated cohort the strongest signal came from the diary–telemetry divergence: ` +
      `participants reported recovering focus more often than the telemetry suggested they actually ` +
      `did. The within-subjects ritual trial showed a measurable shift in the predicted direction, ` +
      `but the effect attenuated outside the supervised window — consistent with prior work ` +
      `(Park & Kim 2023). The exit interviews surfaced a pattern not captured by either the diary ` +
      `or the telemetry: participants treated the ritual as a chore-list rather than a relief ` +
      `mechanism, especially in the second half of the deployment. This points to a maintenance ` +
      `problem rather than an efficacy problem. Threats to validity: simulated cohorts cannot ` +
      `substitute for field data — every claim above carries a [SIMULATION_REHEARSAL] tag and ` +
      `should not be treated as evidence.`,
    conclusion:
      `This study would, if fielded with real participants, produce mixed-methods evidence on ` +
      `${t} suitable for a CHI / CSCW length submission. The pre-registered analysis plan, the ` +
      `triangulated measurement design, and the explicit attention to demand characteristics ` +
      `position the study to surface a meaningful contribution. Probe's role here was not to ` +
      `produce evidence but to surface design risks (the ESM window, the surveillance perception, ` +
      `the digest timing) before any participant ever encountered the protocol.`,
  };
}

/** Extract a topic phrase from the user's premise. Best-effort. */
export function topicWord(premise: string): string {
  const trimmed = premise.trim().replace(/[?.!]+$/, '');
  if (!trimmed) return 'the topic';
  // Strip leading interrogatives so the topic reads as a noun phrase.
  const stripped = trimmed.replace(/^(how|why|what|when|where|do|does|can|should|would|will)\s+/i, '');
  // Cap to a reasonable length so it fits in inline copy.
  return stripped.length > 60 ? stripped.slice(0, 60) + '…' : stripped;
}

function shortAngle(angle: string): string {
  switch (angle) {
    case 'mechanism':       return 'underlying mechanisms';
    case 'intervention':    return 'targeted interventions';
    case 'lived experience': return 'lived experience';
    default:                return angle;
  }
}

/** Slugify a premise for a default project name. */
export function slugify(premise: string): string {
  const base = premise.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return base.split('-').slice(0, 5).join('-') || 'untitled';
}

/* ── live wrappers ────────────────────────────────────────────────
 * Each tries the LLM first via src/llm/probe_calls.ts. If no API key
 * is available, or the call errors, we fall back to the canned
 * `make*` content above so the TUI keeps working offline.
 *
 * These wrappers are intentionally split out so the synchronous
 * `make*` paths stay available for tests + offline demos.
 */

export async function liveBrainstorm(premise: string): Promise<SubRQ[]> {
  try {
    const { brainstorm, hasApiKey } = await import('../llm/probe_calls.js');
    if (!hasApiKey()) return makeBrainstorm(premise);
    return await brainstorm(premise);
  } catch {
    return makeBrainstorm(premise);
  }
}

export async function liveLiterature(rqs: SubRQ[]): Promise<LiteratureBlock[]> {
  try {
    const { literature, hasApiKey } = await import('../llm/probe_calls.js');
    if (!hasApiKey()) return makeLiterature(rqs);
    // Run all RQs in parallel — fast path for the demo.
    const blocks = await Promise.all(rqs.map((rq) => literature(rq)));
    return blocks;
  } catch {
    return makeLiterature(rqs);
  }
}

export async function liveCandidates(premise: string, rqs: SubRQ[]): Promise<CandidateDesign[]> {
  try {
    const { methodology, hasApiKey } = await import('../llm/probe_calls.js');
    if (!hasApiKey()) return makeCandidates(rqs.map((r) => r.letter));
    return await methodology(premise, rqs);
  } catch {
    return makeCandidates(rqs.map((r) => r.letter));
  }
}

export async function livePlan(design: CandidateDesign, premise: string): Promise<StudyPlan> {
  try {
    const { plan, hasApiKey } = await import('../llm/probe_calls.js');
    if (!hasApiKey()) return makePlan(design.id, premise);
    return await plan(design, premise);
  } catch {
    return makePlan(design.id, premise);
  }
}

export async function liveArtifacts(design: CandidateDesign, plan: StudyPlan): Promise<Artifact[]> {
  try {
    const { artifacts, hasApiKey } = await import('../llm/probe_calls.js');
    if (!hasApiKey()) return makeArtifacts();
    const out = await artifacts(design, plan);
    return out.length > 0 ? out : makeArtifacts();
  } catch {
    return makeArtifacts();
  }
}

export async function livePersonas(n: number, premise: string): Promise<Persona[]> {
  try {
    const { personas, hasApiKey } = await import('../llm/probe_calls.js');
    if (!hasApiKey()) return makePersonas(n);
    const out = await personas(n, premise);
    return out.length > 0 ? out : makePersonas(n);
  } catch {
    return makePersonas(n);
  }
}

export async function liveFindings(plan: StudyPlan, premise: string): Promise<Friction[]> {
  try {
    const { findings, hasApiKey } = await import('../llm/probe_calls.js');
    if (!hasApiKey()) return makeFindings();
    const out = await findings(plan, premise);
    return out.length > 0 ? out : makeFindings();
  } catch {
    return makeFindings();
  }
}

export function makeReviewSession(state: ProbeWorkflowState): ReviewSession {
  // Canned fallback used when no API key. Mirrors the design's
  // seededReview() shape so the rendered scene looks consistent.
  return {
    paperTitle: state.paperTitle || 'Untitled paper',
    reviewers: [
      {
        id: 'R1', rec: 'RR',
        field: 'attention & cognitive ergonomics',
        affiliation: 'academic',
        topicConfidence: 'expert',
        oneLine: 'Strong wedge, under-powered pilot, claims may overreach.',
        strengths: [
          'Framing positions the contribution against prior work cleanly.',
          'Methodological scaffolding is the right shape for these RQs.',
          'Mixed-methods triangulation lends qualitative claims credibility.',
        ],
        weaknesses: [
          'Effect-size estimates lean on the simulated cohort — power simulation missing.',
          'Inter-rater reliability not reported for the qualitative codes.',
          'Threats-to-validity section underplays the novelty effect of the instrument.',
        ],
        toAuthors: 'I see a real contribution here but the claims need to be tempered to match what a simulated pilot can actually support. Recommend reporting IRR for the qualitative arm and including a power simulation for the within-subjects component.',
        toChairs: 'Borderline RR. ARR if authors can address the IRR + power gap in a revision.',
      },
      {
        id: 'R2', rec: 'ARR',
        field: 'qualitative methods · CSCW',
        affiliation: 'academic',
        topicConfidence: 'confident',
        oneLine: 'Methodologically clean. Mostly presentational issues.',
        strengths: [
          'Mixed-methods design is justified and well-executed.',
          'Open-source instrument + replication kit is a real contribution.',
          'Findings are vivid and clearly written.',
        ],
        weaknesses: [
          'Related work over-emphasizes one corner of the literature.',
          'Discussion buries the strongest finding behind two paragraphs of caveats.',
          'Figure labels are not grayscale-safe.',
        ],
        toAuthors: 'Recommending ARR. The contribution is clear; please broaden related work, restructure the discussion to lead with the strongest finding, and re-do figures with patterns rather than colors.',
        toChairs: 'Easy ARR for me. Issues are presentational and one mid-sized restructuring of related work.',
      },
      {
        id: 'R3', rec: 'RRX',
        field: 'organizational behavior · remote work',
        affiliation: 'industry',
        topicConfidence: 'tentative',
        oneLine: 'Interesting framing but the simulated pilot oversells the claims.',
        strengths: [
          'Clear writing and strong figures.',
          'The audience-facing artifacts are unusually thoughtful.',
        ],
        weaknesses: [
          'A simulated pilot cannot answer the within-subjects question; needs real deployment.',
          'Framing positions this as field work but it is closer to a study-design proposal.',
          'Several discussion claims are inherited from the literature, not surfaced from data.',
        ],
        toAuthors: 'There is a real paper here but it is not the paper currently submitted. Either reframe as a study-design contribution (with the protocol as the deliverable) or run the actual deployment and resubmit with real data.',
        toChairs: 'RRX. Open to a rewritten methods-paper version, but the current framing oversells what a simulated pilot can support.',
      },
    ],
    meta: {
      ac: 'AC',
      verdict: 'major',
      summary:
        'Three reviewers, three different verdicts. All agree the framing and methodological scaffolding are strong; all flag concerns about the gap between the simulated pilot and the discussion-level claims, varying in severity. R1\'s power/IRR concern and R3\'s "this is a methods paper" critique converge on the same underlying issue: the qualitative findings need either more methodological rigor or more modest framing.',
      proposed:
        'Major revisions. Authors should (a) report inter-rater reliability for qualitative codes, (b) include a power simulation for the within-subjects component, (c) temper claims that exceed what a simulated pilot can support, and (d) restructure related work + discussion as R2 suggests.',
      consensusPoints: [
        { tag: 'all-3', text: 'discussion claims overreach what a simulated pilot can support', priority: 'high' },
        { tag: '2-of-3', text: 'methodological reporting gaps — IRR + power simulation', priority: 'high' },
        { tag: '2-of-3', text: 'related work could be broader', priority: 'medium' },
        { tag: '1-of-3', text: 'figures need grayscale-safe patterns', priority: 'low' },
      ],
    },
  };
}

export async function liveReviewSession(state: ProbeWorkflowState): Promise<ReviewSession> {
  try {
    const { review, hasApiKey } = await import('../llm/probe_calls.js');
    if (!hasApiKey()) return makeReviewSession(state);
    const designName = state.candidates.find((c) => c.id === state.chosenDesignId)?.name ?? 'integrated study';
    const selected = state.rqs.filter((r) => state.selectedRqLetters.includes(r.letter));
    const out = await review({
      premise: state.premise,
      rqs: selected,
      designName,
      findings: state.findings,
      paperTitle: state.paperTitle || 'Untitled paper',
      discussion: state.discussion,
    });
    if (!out.reviewers || out.reviewers.length === 0) return makeReviewSession(state);
    return out;
  } catch {
    return makeReviewSession(state);
  }
}

export async function liveReport(state: ProbeWorkflowState): Promise<{ titleOptions: string[]; discussion: string; conclusion: string }> {
  try {
    const { report, hasApiKey } = await import('../llm/probe_calls.js');
    if (!hasApiKey()) return makeReport(state);
    const designName = state.candidates.find((c) => c.id === state.chosenDesignId)?.name ?? 'integrated study';
    const selected = state.rqs.filter((r) => state.selectedRqLetters.includes(r.letter));
    const out = await report({
      premise: state.premise,
      rqs: selected,
      designName,
      findings: state.findings,
    });
    if (out.titleOptions.length === 0 || !out.discussion) return makeReport(state);
    return out;
  } catch {
    return makeReport(state);
  }
}
