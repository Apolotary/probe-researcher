/* global React */
const { useState, useEffect, useRef } = React;

// Stages tab — left rail of 7 stages + main detail pane.
// Each stage card is reusable across the Probe project lifecycle:
//   framing · literature · methodology · artifacts · evaluation · report · review
// Reruns are first-class: every stage has a "rerun with these notes" affordance and
// keeps a small history of past runs the researcher can flip back to.

const palette = window.__probePalette;
const kbdStyle = window.__probeKbd;
const chipStyle = window.__probeChip;

// ─── Stage definitions ───
// Each stage carries its own "current run" content + a list of past runs.
// The Run is intentionally small — title, when, summary, and the body sections.
const STAGE_DEFS = [
  {
    id: 'framing',
    label: 'framing',
    glyph: 'F',
    blurb: 'problem statement · main RQ · 3 sub-RQs',
    accent: '#d9a548',
  },
  {
    id: 'literature',
    label: 'literature',
    glyph: 'L',
    blurb: 'literature review · 3 angles in flight',
    accent: '#7dcfff',
  },
  {
    id: 'methodology',
    label: 'methodology',
    glyph: 'M',
    blurb: 'one study, layered to answer all RQs',
    accent: '#d9a548',
  },
  {
    id: 'artifacts',
    label: 'artifacts',
    glyph: 'A',
    blurb: 'handoff documents · 5 artifacts ready',
    accent: '#7fb069',
  },
  {
    id: 'evaluation',
    label: 'evaluation',
    glyph: 'E',
    blurb: 'simulated pilot · friction surfaced',
    accent: '#c8a8e6',
  },
  {
    id: 'report',
    label: 'report',
    glyph: 'R',
    blurb: 'paper draft · 8 sections · 4,200 words',
    accent: '#e26e6e',
  },
  {
    id: 'review',
    label: 'review',
    glyph: 'V',
    blurb: 'simulated peer review · 1AC + 3 reviewers',
    accent: '#c87838',
  },
];

// ─── Initial demo data for one running project ───
function makeInitialState() {
  return {
    framing: {
      status: 'fresh',
      lastRun: '4d ago',
      currentRunId: 'r2',
      runs: [
        { id: 'r1', when: '13d ago', label: 'first pass from one-line prompt',
          summary: 'main RQ + 3 sub-RQs · loose problem statement' },
        { id: 'r2', when: '4d ago', label: 'tightened after PI feedback',
          summary: 'sharpened wedge · added "why now" section · current' },
      ],
      title: 'Within-day fatigue dynamics in meeting-heavy remote knowledge work',
      mainRq: 'How do remote workers stay focused during long video-call days?',
      problem:
        'Remote knowledge workers report that meeting-heavy days leave them depleted in ways that single end-of-day surveys cannot capture. Existing instruments — ZEFS, NASA-TLX, UWES — sample fatigue once per day or once per study, treating each meeting as interchangeable. In practice, workers describe the texture of fatigue as varying with meeting density, agenda quality, and recovery time between calls. The mechanism by which a day\'s schedule shape produces a felt sense of focus loss is undertheorized.',
      whyNow:
        'Remote and hybrid work has stabilized as the default for knowledge workers. Calendar APIs and lightweight ESM tooling have matured to the point that within-day, calendar-aware sampling is feasible at field scale. The audience — design teams shipping meeting tooling — is asking for guidance now, before the next round of platform decisions.',
      subRqs: [
        { letter: 'A', angle: 'mechanism',
          rq: 'Which call structures (back-to-back, no agenda, large attendee count) most strongly predict mid-day attentional drop-off?',
          accent: '#7dcfff' },
        { letter: 'B', angle: 'intervention',
          rq: 'Does a 90-second post-call decompression ritual improve self-reported focus in the next solo work block?',
          accent: '#d9a548' },
        { letter: 'C', angle: 'lived experience',
          rq: 'How do workers themselves describe the texture of "video-call fatigue" — is it cognitive, social, or somatic?',
          accent: '#c8a8e6' },
      ],
      contributions: [
        'A dataset of within-day, calendar-anchored fatigue + focus measurements across 18 participants over 4 weeks.',
        'A predictive model relating meeting-density features to subjective focus recovery.',
        'A qualitative account of the felt texture of meeting fatigue, grounded in member-checked interviews.',
        'A free, reusable calendar-aware ESM agent (open-source) that future studies can extend.',
      ],
      audience: 'HCI / CSCW research community · meeting-tool product teams · workplace policy researchers',
    },
    literature: {
      status: 'fresh',     // 'fresh' | 'stale' | 'running' | 'queued'
      lastRun: '2d ago',
      currentRunId: 'r3',
      runs: [
        { id: 'r1', when: '11d ago', label: 'first sweep · ACM + arXiv',
          summary: '212 papers · 12 read · 6 themes' },
        { id: 'r2', when: '6d ago',  label: 'broadened to CSCW + Frontiers',
          summary: '248 papers · 15 read · 7 themes · added wellbeing literature' },
        { id: 'r3', when: '2d ago',  label: 'narrowed to remote-knowledge-work focus',
          summary: '186 papers · 18 read · 5 themes · current' },
      ],
      themes: [
        { name: 'Zoom Exhaustion & Fatigue Scale (ZEFS)', count: 14, color: '#7dcfff',
          summary: 'Established self-report instrument for videoconference fatigue. Most studies use it once at end-of-day; few sample it within-day.',
          papers: [
            { title: 'Nonverbal Overload: A Theoretical Argument for the Causes of Zoom Fatigue', authors: 'Bailenson', venue: 'Technology, Mind & Behavior', year: 2021, rel: 0.94, anchor: true },
            { title: 'Construction and Initial Validation of the Zoom Exhaustion & Fatigue Scale', authors: 'Fauville, Luo, Queiroz, Bailenson, Hancock', venue: 'Computers in Human Behavior Reports', year: 2021, rel: 0.92, anchor: true },
            { title: 'Videoconference Fatigue? Exploring Changes in Fatigue After Videoconference Meetings During COVID-19', authors: 'Riedl', venue: 'AIS Transactions on HCI', year: 2022, rel: 0.81 },
            { title: 'Mitigating Zoom Fatigue: A Field Experiment with Camera-Off Norms', authors: 'Shockley et al.', venue: 'Journal of Applied Psychology', year: 2021, rel: 0.78 },
            { title: 'The Empathic Voice: Studies of Vocal Empathy on Video Calls', authors: 'Kraut, Wang', venue: 'CSCW', year: 2022, rel: 0.62 },
          ],
        },
        { name: 'attention residue (Leroy)', count: 9, color: '#7dcfff',
          summary: 'Cognitive carryover after an interrupted task. Documented for task-switching; less studied for meeting-to-meeting transitions.',
          papers: [
            { title: 'Why Is It So Hard to Do My Work? The Challenge of Attention Residue When Switching Between Work Tasks', authors: 'Leroy', venue: 'Organizational Behavior and Human Decision Processes', year: 2009, rel: 0.91, anchor: true },
            { title: 'Interruption and Attention Residue in a Knowledge-Work Setting', authors: 'Leroy, Schmidt', venue: 'Academy of Management Discoveries', year: 2018, rel: 0.84 },
            { title: 'The Hidden Cost of Back-to-Back Meetings: An EEG Study', authors: 'Bohan et al. (Microsoft Research)', venue: 'Microsoft WorkLab Report', year: 2021, rel: 0.79 },
            { title: 'Switching Cost in Task Switching: An Activation-Based Account', authors: 'Altmann, Gray', venue: 'Cognitive Psychology', year: 2008, rel: 0.55 },
          ],
        },
        { name: 'meeting recovery / micro-breaks', count: 11, color: '#d9a548',
          summary: 'Short within-day breaks restore attention and mood. Optimal duration and timing are unsettled.',
          papers: [
            { title: 'Recovery from Work: Advancing the Field Toward the Future', authors: 'Sonnentag, Venz, Casper', venue: 'Journal of Occupational Health Psychology', year: 2017, rel: 0.86, anchor: true },
            { title: 'Micro-Breaks Matter: A Meta-Analysis on the Effects of Short Breaks', authors: 'Albulescu et al.', venue: 'PLOS ONE', year: 2022, rel: 0.83, anchor: true },
            { title: 'Take a Break! A Field Experiment on the Effects of Outdoor Breaks', authors: 'Largo-Wight et al.', venue: 'Applied Ergonomics', year: 2021, rel: 0.71 },
            { title: 'Designing for Calm Technology: Calendar-Aware Break Reminders', authors: 'Cox, Cecchinato', venue: 'CHI', year: 2020, rel: 0.68 },
          ],
        },
        { name: 'agenda quality → cognitive load', count: 6, color: '#7fb069',
          summary: 'Pre-meeting framing reduces in-meeting cognitive load. Mostly self-report; little observational data.',
          papers: [
            { title: 'Meeting Science: A Review and Conceptual Framework', authors: 'Allen, Lehmann-Willenbrock, Rogelberg', venue: 'Annual Review of OBHP', year: 2018, rel: 0.77, anchor: true },
            { title: 'The Curious Case of the Pre-Meeting: Agenda Use and Meeting Effectiveness', authors: 'Mroz, Allen, Verhoeven, Shuffler', venue: 'Group Dynamics', year: 2018, rel: 0.69 },
            { title: 'Cognitive Load in Synchronous Online Meetings', authors: 'Kock et al.', venue: 'Information & Management', year: 2022, rel: 0.61 },
          ],
        },
        { name: 'gap: longitudinal field data', count: 0, color: '#e26e6e',
          summary: 'No published study tracks the same workers across multiple meeting-heavy weeks with calendar-aware sampling. This is the wedge.',
          papers: [],
          gap: 'This is exactly where Probe is positioned. Adjacent work either (a) runs single-day lab studies, (b) uses post-hoc surveys, or (c) analyzes calendar metadata without subjective reports. None combine them across time.',
        },
      ],
    },
    methodology: {
      status: 'fresh',
      lastRun: '2d ago',
      currentRunId: 'r2',
      runs: [
        { id: 'r1', when: '5d ago', label: 'first design sweep',
          summary: '5 design candidates drafted, mixed-methods favored' },
        { id: 'r2', when: '2d ago', label: 'revised after PI feedback',
          summary: 'Mixed-methods longitudinal field study · 4 weeks · current' },
      ],
      design: {
        name: 'Mixed-methods longitudinal field study',
        duration: '4 weeks',
        n: 18,
        components: [
          'baseline ZEFS + demographics',
          'post-meeting ESM (≤90s, calendar-triggered)',
          'opt-in typing-cadence telemetry',
          'weekly digest + Slack check-in',
          'exit interview with member-checking',
        ],
      },
    },
    artifacts: {
      status: 'fresh',
      lastRun: '2d ago',
      currentRunId: 'r1',
      runs: [
        { id: 'r1', when: '2d ago', label: 'first draft set',
          summary: '5 artifacts · 4,800 words total · current' },
      ],
      docs: [
        { name: 'IMPLEMENTATION.md', kind: 'software', tone: '#7fb069', edited: false, words: 540,
          summary: 'Engineering spec for the calendar-aware ESM trigger and typing-cadence telemetry agent.',
          sections: [
            { h: 'overview', body: 'Background daemon that watches the participant\'s calendar (read-only OAuth) and surfaces a 90-second post-meeting prompt. Optional opt-in module records typing-cadence statistics (no keystroke content).' },
            { h: 'tech stack', body: 'Electron shell · Node 20 · SQLite local store · Google Calendar API · Microsoft Graph for Outlook · Sentry for crash reports.' },
            { h: 'storage', body: 'All raw events stored locally; encrypted nightly bundle uploaded to a study S3 bucket. Bundle size budget: ≤ 4 MB / participant / day.' },
            { h: 'open questions', body: '• How to handle meetings that run over their scheduled end?\n• Fallback when the OS denies typing telemetry permission mid-study?' },
          ],
        },
        { name: 'PROTOCOL.md', kind: 'human-study', tone: '#d9a548', edited: true, words: 980,
          summary: 'Step-by-step protocol the researcher follows for each participant — onboarding through exit interview.',
          sections: [
            { h: 'recruitment', body: 'Snowball + Prolific filtered to "remote knowledge worker, ≥ 4 video meetings/week". Target N = 18, oversample 22 to absorb dropout.' },
            { h: 'onboarding (60 min)', body: 'Consent · install agent · calibrate calendar permissions · baseline ZEFS · demographic survey · scheduling weekly 1:1 check-ins.' },
            { h: 'in-study (4 weeks)', body: 'Daily: ESM after every meeting longer than 20 min. Weekly: 15-min Slack check-in + digest email. Mid-study survey on day 14.' },
            { h: 'exit (45 min)', body: 'Semi-structured interview with member-checking on the participant\'s own data. Compensation distributed at end of week 4.' },
          ],
        },
        { name: 'SURVEY.md', kind: 'survey', tone: '#7dcfff', edited: false, words: 720,
          summary: 'Baseline + weekly survey instruments. Mostly assembled from established scales.',
          sections: [
            { h: 'baseline', body: 'ZEFS (15 items) · NASA-TLX (6 items) · UWES-9 work engagement · demographics · meeting load self-estimate.' },
            { h: 'post-meeting ESM (≤ 90s)', body: 'Single-item fatigue (1–7) · single-item focus (1–7) · two open-ended micro-prompts rotated daily.' },
            { h: 'weekly digest', body: 'NASA-TLX · 3 free-response prompts · agency check ("does this study still feel useful?").' },
            { h: 'pilot notes', body: 'Item 7 of ZEFS double-barreled per pilot reviewer 2 — flagged for rewording before IRB submit.' },
          ],
        },
        { name: 'DIARY_KIT.md', kind: 'esm', tone: '#c8a8e6', edited: false, words: 460,
          summary: 'The participant-facing materials for the experience-sampling diary — copy, microcopy, and timing rules.',
          sections: [
            { h: 'trigger logic', body: 'Fires 5 minutes after a meeting ends, but suppressed if the next meeting starts within 10 minutes. Maximum 6 prompts per day.' },
            { h: 'prompt copy', body: '"How did that meeting feel?" → 1–7 fatigue · "How focused do you feel right now?" → 1–7 focus · "One word for the next 10 minutes?" → free text.' },
            { h: 'consent reminders', body: 'Banner at top of week 2 prompt asks for renewed consent for typing telemetry. Opt-out is one tap.' },
            { h: 'silence rules', body: 'No prompts on weekends, holidays, or after participant-marked PTO.' },
          ],
        },
        { name: 'IRB_MEMO.md', kind: 'ethics', tone: '#e26e6e', edited: true, words: 410,
          summary: 'Memo to the IRB describing risk profile, data handling, and participant agency.',
          sections: [
            { h: 'risk profile', body: 'Minimal risk. Subjective fatigue measures + de-identified telemetry. No medical claims. Withdrawal is one click.' },
            { h: 'data handling', body: 'Local-first, encrypted-at-rest, retention 18 months post-publication. PII (calendar event titles) stripped on-device before upload.' },
            { h: 'participant agency', body: 'Each participant gets a personal dashboard showing what we have collected. Member-checking interview lets them retract any segment.' },
            { h: 'open IRB question', body: 'Reviewer 1 flagged: "is reading event titles even on-device a privacy concern for participants whose calendars contain colleagues\' info?" — needs response before approval.' },
          ],
        },
      ],
    },
    evaluation: {
      status: 'stale',
      lastRun: '8d ago',
      currentRunId: 'r1',
      runs: [
        { id: 'r1', when: '8d ago', label: 'pilot of 6, simulated',
          summary: '3 frictions surfaced · adherence model fit · current' },
      ],
      frictions: [
        { sev: 'high', text: 'back-to-back meetings collapse the 5-min trigger window', accent: '#e26e6e',
          trigger: 'ESM agent fires 5 min after meeting end. When the next meeting starts before that window expires, the prompt is suppressed and we lose the data point.',
          evidence: [
            'Simulated calendars showed 28% of meetings had < 5 min gap to the next.',
            'Adherence dropped to 42% on Tuesdays + Thursdays (the densest meeting days).',
            'Two of six pilot participants flagged "I never see the survey on busy days."',
          ],
          rationale: 'Direct hit on the primary outcome — losing the densest days means losing the high-fatigue tail of the distribution. Fixing this is necessary for the study to be valid.',
          fixes: [
            { label: 'shorten window to 90s with optional "remind in 10 min" defer', effort: 'S', recommended: true },
            { label: 'sample at meeting END instead of after, with a 30s minimum buffer', effort: 'M' },
            { label: 'add an end-of-day backfill prompt for missed slots', effort: 'L' },
          ],
        },
        { sev: 'medium', text: 'typing-cadence opt-in confuses participants on first run', accent: '#d9a548',
          trigger: 'On first launch, participants are asked to grant accessibility permissions for typing-cadence telemetry. The OS-level prompt has no Probe context, and participants associate "accessibility" with disability features.',
          evidence: [
            '4 of 6 pilot participants asked the moderator what the prompt meant.',
            'Two declined initially; one re-enabled after a check-in conversation.',
            'Onboarding survey item "I understood what I was opting into" averaged 3.2/7.',
          ],
          rationale: 'Confusion at onboarding compounds: participants who feel surveilled disengage, which biases the sample toward high-trust workers and weakens external validity.',
          fixes: [
            { label: 'add a 60s explainer screen BEFORE the OS prompt', effort: 'S', recommended: true },
            { label: 'rename the feature to "rhythm of work" in user-facing copy', effort: 'XS' },
            { label: 'split typing telemetry into a fully separate study arm', effort: 'L' },
          ],
        },
        { sev: 'low', text: 'weekly digest competes with Friday inbox traffic', accent: '#7fb069',
          trigger: 'The weekly digest email arrives Friday at 3pm — the same window as most teams\' end-of-week summaries.',
          evidence: [
            'Open rate in the simulated pilot: 61% (target: > 75%).',
            'Time-to-open median: 22 hours (target: < 4 hours).',
          ],
          rationale: 'Low priority — the digest is supplemental, not primary data. But it\'s our main lever for participant retention so worth fixing if cheap.',
          fixes: [
            { label: 'move send to Wednesday morning', effort: 'XS', recommended: true },
            { label: 'switch to in-app digest instead of email', effort: 'M' },
          ],
        },
      ],
      stats: { adherence: '74%', dropout: '11%', powered: 'yes (d ≥ 0.5)', cost: '$1,720 + Prolific' },
    },
    report: {
      status: 'queued',
      lastRun: 'never',
      currentRunId: null,
      runs: [],
      sections: [
        'abstract', 'introduction', 'related work',
        'methodology', 'pilot evaluation', 'discussion',
        'limitations', 'references',
      ],
    },
    review: window.makeInitialReviewState ? window.makeInitialReviewState() : {
      status: 'queued', lastRun: 'never', currentRunId: null, runs: [], seed: null,
    },
  };
}

// ─── Public component ───
function ProjectStages({ activeStageId, setActiveStageId, project, setProject, density }) {
  const stage = STAGE_DEFS.find((s) => s.id === activeStageId) || STAGE_DEFS[0];
  const stageData = project[stage.id];

  // a small running-rerun simulation
  const [pendingPrompt, setPendingPrompt] = useState('');
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [runStartedAt, setRunStartedAt] = useState(0);
  const [diffOpen, setDiffOpen] = useState(false);
  const [draftRun, setDraftRun] = useState(null);
  const promptRef = useRef(null);

  // reset rerun UI when stage changes
  useEffect(() => { setPendingPrompt(''); setRunning(false); setPhaseIdx(0); setDiffOpen(false); setDraftRun(null); }, [activeStageId]);

  const startRerun = () => {
    if (!pendingPrompt.trim()) return;
    setRunning(true);
    setPhaseIdx(0);
    setRunStartedAt(performance.now());
    // Phase progression: planning → searching/reading → drafting → verifying
    const t1 = setTimeout(() => setPhaseIdx(1),  650);
    const t2 = setTimeout(() => setPhaseIdx(2), 1350);
    const t3 = setTimeout(() => setPhaseIdx(3), 2000);
    const tEnd = setTimeout(() => {
      setRunning(false);
      setDiffOpen(true);
      setDraftRun({
        id: 'r' + (stageData.runs.length + 1),
        when: 'just now',
        label: `rerun · ${pendingPrompt.trim().slice(0, 60)}`,
        summary: synthesizeRerunSummary(stage.id, pendingPrompt.trim()),
      });
    }, 2400);
    return () => { [t1, t2, t3, tEnd].forEach(clearTimeout); };
  };

  const acceptRerun = () => {
    if (!draftRun) return;
    setProject((p) => ({
      ...p,
      [stage.id]: {
        ...p[stage.id],
        status: 'fresh',
        lastRun: 'just now',
        currentRunId: draftRun.id,
        runs: [...p[stage.id].runs, draftRun],
      },
    }));
    setDiffOpen(false); setDraftRun(null); setPendingPrompt('');
  };

  const switchToRun = (runId) => {
    setProject((p) => ({
      ...p,
      [stage.id]: { ...p[stage.id], currentRunId: runId },
    }));
  };

  // Refs into each stage card on the right pane keyed by stage id.
  // The diamond reads `activeStageId` to decide which lane lights up;
  // when a milestone is clicked the diamond can also fire
  // setActiveStageId, which re-renders the right pane onto that stage
  // card. No router change, no scroll juggling: switching the stage in
  // the existing left rail is the same intent as "scroll to that
  // stage" in a flat layout.
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <PipelineDiamond
        project={project}
        activeStageId={activeStageId}
        onStageClick={(sid) => sid && setActiveStageId(sid)}
      />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
      {/* ─── Left rail ─── */}
      <div style={{
        width: 232, flex: 'none', borderRight: `1px solid ${palette.rule}`,
        padding: '16px 0', overflowY: 'auto',
        background: palette.bg,
      }}>
        <div style={{
          padding: '0 16px 12px', color: palette.ink3, fontSize: 11,
          letterSpacing: '0.14em', textTransform: 'uppercase',
        }}>
          ─── stages
        </div>
        {STAGE_DEFS.map((s, i) => {
          const sd = project[s.id];
          const active = s.id === activeStageId;
          return (
            <button key={s.id}
              onClick={() => setActiveStageId(s.id)}
              style={{
                // Per audit §10.16: row height ≥56px (was ~38–44),
                // name fg-strong 14px, "last run · 4d ago" on its
                // own line in fg-mute 11px mono, status pip
                // right-aligned. Sidebar stops competing with the
                // main column.
                display: 'block', width: '100%', textAlign: 'left',
                background: active ? (palette.bgPanel || palette.bg2) : 'transparent',
                border: 'none',
                borderLeft: `3px solid ${active ? s.accent : 'transparent'}`,
                padding: density === 'compact' ? '10px 14px' : '14px 14px',
                color: active ? (palette.fgStrong || palette.ink) : (palette.fgBody || palette.ink2),
                fontFamily: 'inherit', fontSize: 14, cursor: 'pointer',
                minHeight: 56,
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  width: 20, height: 20, borderRadius: 3, display: 'inline-flex',
                  alignItems: 'center', justifyContent: 'center',
                  background: active ? s.accent : 'transparent',
                  color: active ? palette.bg : s.accent,
                  border: `1px solid ${s.accent}`, fontSize: 10, fontWeight: 700,
                  flexShrink: 0,
                }}>{s.glyph}</span>
                <span style={{
                  flex: 1, color: active ? (palette.fgStrong || palette.ink) : (palette.fgBody || palette.ink),
                  fontFamily: palette.fontSans || '"Inter Tight", sans-serif',
                  fontWeight: active ? 600 : 500, fontSize: 14,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{s.label}</span>
                <StatusPip status={sd.status} />
              </div>
              <div style={{
                color: palette.fgSecondary || palette.ink3, fontSize: 12, marginTop: 4, paddingLeft: 30,
                lineHeight: 1.4,
                fontFamily: palette.fontSans || '"Inter Tight", sans-serif',
              }}>{s.blurb}</div>
              <div style={{
                color: palette.fgMute || palette.ink4, fontSize: 11, marginTop: 4, paddingLeft: 30,
                fontFamily: palette.fontMono || 'monospace',
              }}>last run · {sd.lastRun}</div>
            </button>
          );
        })}

        <div style={{
          margin: '24px 16px 12px', paddingTop: 14,
          borderTop: `1px solid ${palette.rule}`, color: palette.ink3, fontSize: 11,
          letterSpacing: '0.14em', textTransform: 'uppercase',
        }}>
          ─── activity
        </div>
        <ActivityList project={project} />
      </div>

      {/* ─── Main pane ─── */}
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', position: 'relative' }}>
        <StageHeader stage={stage} stageData={stageData} switchToRun={switchToRun} density={density} />

        {/* stage-specific content */}
        <div style={{ padding: density === 'compact' ? '14px 28px 28px' : '22px 32px 40px',
          maxWidth: 940 }}>
          {stage.id === 'framing'     && <FramingBody     data={stageData} density={density} />}
          {stage.id === 'literature'  && <LiteratureBody  data={stageData} density={density} />}
          {stage.id === 'methodology' && <MethodologyBody data={stageData} density={density} />}
          {stage.id === 'artifacts'   && <ArtifactsBody   data={stageData} density={density} />}
          {stage.id === 'evaluation'  && <EvaluationBody  data={stageData} density={density} />}
          {stage.id === 'report'      && <ReportBody      data={stageData} density={density} />}
          {stage.id === 'review'      && window.ReviewBody && <window.ReviewBody data={stageData} density={density} />}
        </div>

        {/* rerun prompt + diff dock */}
        <RerunDock
          stage={stage} stageData={stageData}
          pendingPrompt={pendingPrompt} setPendingPrompt={setPendingPrompt}
          running={running} startRerun={startRerun}
          phaseIdx={phaseIdx} runStartedAt={runStartedAt}
          diffOpen={diffOpen} draftRun={draftRun}
          acceptRerun={acceptRerun}
          discard={() => { setDiffOpen(false); setDraftRun(null); setPendingPrompt(''); }}
          density={density}
          promptRef={promptRef}
        />
      </div>
      </div>
    </div>
  );
}

// ─── Status pip ───
function StatusPip({ status }) {
  const map = {
    fresh:    { color: '#7fb069', label: 'fresh' },
    stale:    { color: '#d9a548', label: 'stale' },
    running:  { color: '#7dcfff', label: 'running' },
    queued:   { color: palette.ink4, label: 'queued' },
  };
  const m = map[status] || map.queued;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      color: m.color, fontSize: 10,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: m.color,
      }} />
      {m.label}
    </span>
  );
}

// ─── Activity list (sidebar) ───
function ActivityList({ project }) {
  // Flatten runs across stages, sort by recency keyword (cheap heuristic)
  const order = ['just now', '2d ago', '5d ago', '6d ago', '8d ago', '11d ago', 'never'];
  const all = [];
  STAGE_DEFS.forEach((s) => {
    project[s.id].runs.forEach((r) => {
      all.push({ stage: s, run: r });
    });
  });
  all.sort((a, b) => order.indexOf(a.run.when) - order.indexOf(b.run.when));
  return (
    <div style={{ padding: '0 16px' }}>
      {all.slice(0, 6).map(({ stage, run }, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0',
          color: palette.ink3, fontSize: 11.5, lineHeight: 1.4,
        }}>
          <span style={{ color: stage.accent, fontSize: 10 }}>●</span>
          <span style={{ flex: 1 }}>
            <span style={{ color: palette.ink2 }}>{stage.label}</span>{' · '}
            {run.label.replace(/^rerun · /, '')}
          </span>
          <span style={{ color: palette.ink4 }}>{run.when}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Header for the main pane ───
function StageHeader({ stage, stageData, switchToRun, density }) {
  return (
    <div style={{
      padding: density === 'compact' ? '14px 28px 0' : '22px 32px 0',
      borderBottom: `1px solid ${palette.rule}`, paddingBottom: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span style={{ color: palette.ink3, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          stage · {stage.label}
        </span>
        <StatusPip status={stageData.status} />
        <span style={{ marginLeft: 'auto', color: palette.ink3, fontSize: 11.5 }}>
          last run · {stageData.lastRun}
        </span>
      </div>
      <h2 style={{
        margin: '8px 0 0', color: palette.ink, fontWeight: 500, fontSize: 18,
      }}>
        {stage.blurb}
      </h2>

      {/* run history strip */}
      {stageData.runs.length > 0 && (
        <div style={{ marginTop: 14, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: palette.ink3, fontSize: 11 }}>runs ›</span>
          {stageData.runs.map((r) => {
            const cur = r.id === stageData.currentRunId;
            return (
              <button key={r.id} onClick={() => switchToRun(r.id)} style={{
                background: cur ? stage.accent : 'transparent',
                color: cur ? palette.bg : palette.ink2,
                border: `1px solid ${cur ? stage.accent : palette.rule}`,
                padding: '3px 9px', borderRadius: 3, fontFamily: 'inherit',
                fontSize: 11, cursor: 'pointer',
              }} title={r.label}>
                {r.id}
                <span style={{ color: cur ? 'rgba(0,0,0,0.55)' : palette.ink4, marginLeft: 6 }}>{r.when}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Rerun dock (sticky bottom) ───
function RerunDock({
  stage, stageData, pendingPrompt, setPendingPrompt,
  running, startRerun, phaseIdx, runStartedAt,
  diffOpen, draftRun, acceptRerun, discard,
  density, promptRef,
}) {
  return (
    <div style={{
      position: 'sticky', bottom: 0,
      background: palette.bg,
      borderTop: `1px solid ${palette.rule}`,
    }}>
      {diffOpen && draftRun && (
        <DiffStrip stage={stage} stageData={stageData} draftRun={draftRun}
          accept={acceptRerun} discard={discard} />
      )}
      {running && (
        <div style={{
          padding: density === 'compact' ? '6px 28px 0' : '10px 32px 0',
        }}>
          <window.ModelStatusLine
            stage={uiStageFor(stage.id)}
            model={stageModel(stage.id)}
            phase={
              <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                <window.PhaseDots
                  phases={stagePhases(stage.id)}
                  activeIdx={phaseIdx}
                  accent={stage.accent}
                  compact
                />
              </span>
            }
            accent={stage.accent}
            running
            resetKey={runStartedAt}
          />
        </div>
      )}
      <div style={{
        padding: density === 'compact' ? '8px 28px' : '12px 32px',
        display: 'flex', gap: 10, alignItems: 'center',
      }}>
        <span style={{ color: stage.accent, fontSize: 12, fontWeight: 600 }}>↻</span>
        <span style={{ color: palette.ink3, fontSize: 11.5 }}>rerun {stage.label} ›</span>
        <input
          ref={promptRef}
          value={pendingPrompt}
          disabled={running || diffOpen}
          onChange={(e) => setPendingPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') startRerun(); }}
          placeholder={rerunPlaceholder(stage.id)}
          style={{
            flex: 1, background: palette.bg2, border: `1px solid ${palette.rule}`,
            color: palette.ink, fontFamily: 'inherit', fontSize: 12.5,
            padding: '6px 10px', borderRadius: 3, outline: 'none',
          }} />
        <button onClick={startRerun} disabled={!pendingPrompt.trim() || running || diffOpen}
          style={{
            background: !pendingPrompt.trim() || running || diffOpen ? 'transparent' : stage.accent,
            color: !pendingPrompt.trim() || running || diffOpen ? palette.ink4 : palette.bg,
            border: `1px solid ${!pendingPrompt.trim() || running || diffOpen ? palette.rule : stage.accent}`,
            padding: '5px 12px', borderRadius: 3, fontFamily: 'inherit',
            fontSize: 12, fontWeight: 600,
            cursor: !pendingPrompt.trim() || running || diffOpen ? 'not-allowed' : 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
          {running
            ? <><window.Spinner color={palette.ink3} size={11} /><span>running</span></>
            : <span>rerun</span>}
          <kbd style={{ ...kbdStyle, marginLeft: 0,
            background: !pendingPrompt.trim() || running || diffOpen ? palette.bg2 : 'rgba(0,0,0,0.18)',
            color: !pendingPrompt.trim() || running || diffOpen ? palette.ink4 : 'rgba(0,0,0,0.7)',
            borderColor: !pendingPrompt.trim() || running || diffOpen ? palette.rule : 'rgba(0,0,0,0.15)',
          }}>↵</kbd>
        </button>
      </div>
    </div>
  );
}

function DiffStrip({ stage, stageData, draftRun, accept, discard }) {
  const prev = stageData.runs[stageData.runs.length - 1];
  return (
    <div style={{
      borderTop: `1px solid ${palette.rule}`, borderBottom: `1px solid ${palette.rule}`,
      background: palette.bg2, padding: '10px 32px',
    }}>
      <div style={{ color: palette.ink3, fontSize: 11, letterSpacing: '0.14em',
        textTransform: 'uppercase', marginBottom: 8 }}>
        ─── new run · review before adopting ───
      </div>
      <div style={{ display: 'flex', gap: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: palette.ink4, fontSize: 11 }}>previous · {prev?.id}</div>
          <div style={{ color: palette.ink2, fontSize: 12.5, marginTop: 4 }}>{prev?.summary || '—'}</div>
        </div>
        <div style={{ flex: 1, borderLeft: `1px dashed ${palette.rule}`, paddingLeft: 14 }}>
          <div style={{ color: stage.accent, fontSize: 11 }}>new · {draftRun.id}</div>
          <div style={{ color: palette.ink, fontSize: 12.5, marginTop: 4 }}>{draftRun.summary}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
          <button onClick={accept} style={{
            background: stage.accent, color: palette.bg, border: 'none',
            padding: '4px 10px', borderRadius: 3, fontFamily: 'inherit', fontSize: 12,
            fontWeight: 600, cursor: 'pointer',
          }}>adopt</button>
          <button onClick={discard} style={{
            background: 'transparent', color: palette.ink3,
            border: `1px solid ${palette.rule}`,
            padding: '4px 10px', borderRadius: 3, fontFamily: 'inherit', fontSize: 12,
            cursor: 'pointer',
          }}>discard</button>
        </div>
      </div>
    </div>
  );
}

// Map this view's stage taxonomy to the canonical UiStage values used
// by /api/probe/models so ModelStatusLine resolves the live model id
// (and works correctly when the active provider is OpenAI). When the
// fetch resolves, ModelStatusLine swaps in the actual provider model
// id; the static stageModel() below is the first-paint fallback.
function uiStageFor(stageId) {
  switch (stageId) {
    case 'framing':     return 'brainstorm';
    case 'literature':  return 'literature';
    case 'methodology': return 'methodology';
    case 'artifacts':   return 'artifacts';
    case 'evaluation':  return 'findings';
    case 'report':      return 'report';
    case 'review':      return 'review';
    default:            return undefined;
  }
}

// First-paint fallback only — overridden by ModelStatusLine once
// /api/probe/models resolves. Values match the 'mixed' preset from
// CLAUDE.md (Opus on orchestration, Sonnet on execution) and use
// current model ids — earlier entries pointed at retired claude-opus-4-5.
function stageModel(stageId) {
  switch (stageId) {
    case 'framing':     return 'claude-opus-4-7';
    case 'literature':  return 'claude-sonnet-4-6';
    case 'methodology': return 'claude-opus-4-7';
    case 'artifacts':   return 'claude-sonnet-4-6';
    case 'evaluation':  return 'claude-opus-4-7';
    case 'report':      return 'claude-sonnet-4-6';
    case 'review':      return 'claude-opus-4-7';
    default:            return 'claude-sonnet-4-6';
  }
}

function stagePhases(stageId) {
  switch (stageId) {
    case 'framing':     return ['planning', 'sharpening', 'drafting', 'verifying'];
    case 'literature':  return ['planning', 'searching', 'reading', 'synthesizing'];
    case 'methodology': return ['planning', 'comparing designs', 'drafting', 'verifying'];
    case 'artifacts':   return ['planning', 'generating', 'cross-checking', 'finalizing'];
    case 'evaluation':  return ['planning', 'simulating', 'collating', 'reporting'];
    case 'report':      return ['planning', 'drafting', 'citing', 'polishing'];
    case 'review':      return ['planning', 'simulating panel', 'aggregating', 'verdict'];
    default:            return ['planning', 'thinking', 'drafting', 'verifying'];
  }
}

function rerunPlaceholder(stageId) {
  switch (stageId) {
    case 'framing':     return 'e.g. sharpen the wedge against existing ZEFS-only studies';
    case 'literature':  return 'e.g. focus on agenda quality and pre-meeting framing studies';
    case 'methodology': return 'e.g. swap field study for a 2-week diary + interviews';
    case 'artifacts':   return 'e.g. tighten PROTOCOL.md to fit a single 60-min session';
    case 'evaluation':  return 'e.g. simulate with N=12 instead of 6, weight engineering roles';
    case 'report':      return 'e.g. emphasize the qualitative findings over the quant table';
    case 'review':      return window.reviewRerunPlaceholder ? window.reviewRerunPlaceholder() : 'simulate a CHI-style panel · 1AC + 3 reviewers';
    default: return 'tell the agent what to change';
  }
}

function synthesizeRerunSummary(stageId, prompt) {
  const short = prompt.slice(0, 80);
  switch (stageId) {
    case 'framing':     return `re-framed · revised problem statement and sub-RQs · "${short}"`;
    case 'literature':  return `re-scoped sweep · 142 papers · 9 read · added 1 theme · "${short}"`;
    case 'methodology': return `revised design · same N · adjusted phases per "${short}"`;
    case 'artifacts':   return `regenerated 5 docs (3 changed, 2 unchanged) · "${short}"`;
    case 'evaluation':  return `re-simulated pilot · 4 frictions surfaced · "${short}"`;
    case 'report':      return `re-drafted · 8 sections · 4,400 words · "${short}"`;
    case 'review':      return window.synthesizeReviewSummary ? window.synthesizeReviewSummary(prompt) : `re-simulated panel · 1AC + 3 reviewers · "${short}"`;
    default:            return prompt;
  }
}

// ─── Stage bodies ───
function FramingBody({ data }) {
  const [openSubRq, setOpenSubRq] = useState(null);
  return (
    <>
      <Section title="working title" accent="#d9a548">
        <div style={{
          marginTop: 6, padding: '12px 14px',
          background: palette.bg2, border: `1px solid ${palette.rule}`,
          borderLeft: `3px solid #d9a548`, borderRadius: 3,
          color: palette.ink, fontSize: 15, lineHeight: 1.5,
        }}>
          {data.title}
        </div>
      </Section>

      <Section title="main research question" accent="#d9a548">
        <div style={{
          marginTop: 6, padding: '14px 16px',
          background: 'rgba(217, 165, 72, 0.08)',
          border: `1px solid #d9a548`, borderRadius: 3,
          boxShadow: `0 0 0 4px ${palette.bg}, 0 0 18px -6px #d9a548`,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ color: '#d9a548', fontWeight: 700, fontSize: 11,
              letterSpacing: '0.14em', textTransform: 'uppercase' }}>main RQ</span>
          </div>
          <div style={{
            marginTop: 8, color: palette.ink, fontSize: 15, lineHeight: 1.55,
          }}>
            <span style={{ color: '#d9a548', marginRight: 8 }}>›</span>
            {data.mainRq}
          </div>
        </div>
      </Section>

      <Section title={`sub-RQs · ${data.subRqs.length} angles`} accent="#d9a548">
        <div style={{ color: palette.ink3, fontSize: 11.5, marginTop: 4, marginBottom: 8 }}>
          each sub-RQ funnels into the same study but answers a different slice
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {data.subRqs.map((s, i) => {
            const isOpen = openSubRq === i;
            return (
              <div key={i} style={{
                background: palette.bg2,
                border: `1px solid ${isOpen ? s.accent : palette.rule}`,
                borderLeft: `3px solid ${s.accent}`, borderRadius: 3,
                overflow: 'hidden',
              }}>
                <button onClick={() => setOpenSubRq(isOpen ? null : i)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '8px 12px', background: 'transparent', border: 'none',
                  color: 'inherit', fontFamily: 'inherit', fontSize: 13,
                  cursor: 'pointer', textAlign: 'left',
                }}>
                  <span style={{
                    display: 'inline-block', width: 10, color: s.accent,
                    transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 140ms',
                  }}>›</span>
                  <span style={{ color: s.accent, fontWeight: 600 }}>RQ {s.letter}</span>
                  <span style={{ ...chipStyle, color: s.accent, borderColor: s.accent }}>{s.angle}</span>
                  <span style={{ color: palette.ink, flex: 1, marginLeft: 4,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.rq}
                  </span>
                </button>
                {isOpen && (
                  <div className="fade-in" style={{
                    padding: '12px 14px 14px 35px',
                    borderTop: `1px dashed ${palette.rule}`,
                    color: palette.ink, fontSize: 13.5, lineHeight: 1.6,
                  }}>
                    {s.rq}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="problem statement" accent="#d9a548">
        <div style={{
          color: palette.ink, fontSize: 13.5, lineHeight: 1.7, marginTop: 4,
          textWrap: 'pretty',
        }}>{data.problem}</div>
      </Section>

      <Section title="why now" accent="#d9a548">
        <div style={{
          color: palette.ink2, fontSize: 13, lineHeight: 1.65, marginTop: 4,
          textWrap: 'pretty',
        }}>{data.whyNow}</div>
      </Section>

      <Section title={`expected contributions · ${data.contributions.length}`} accent="#d9a548">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
          {data.contributions.map((c, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '24px 1fr', gap: 8,
              padding: '6px 0', borderBottom: `1px dashed ${palette.rule}`,
              color: palette.ink, fontSize: 13, lineHeight: 1.55,
            }}>
              <span style={{ color: palette.ink4, fontVariantNumeric: 'tabular-nums' }}>
                C{i + 1}
              </span>
              <span>{c}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="audience" accent="#d9a548">
        <div style={{ color: palette.ink2, fontSize: 13, lineHeight: 1.6, marginTop: 4 }}>
          {data.audience}
        </div>
      </Section>
    </>
  );
}

function LiteratureBody({ data }) {
  const [openIdx, setOpenIdx] = useState(null);
  const paperCount = data.runs.find((r) => r.id === data.currentRunId)?.summary?.match(/\d+/)?.[0] || '186';

  return (
    <>
      <Section title="research gap" accent="#7dcfff">
        Most existing instruments (ZEFS, NASA-TLX) measure fatigue at end-of-day; we lack
        within-day, calendar-aware accounts of how meeting density shapes focus recovery.
        That gap defines this project's wedge.
      </Section>
      <Section title={`themes from ${paperCount} papers`} accent="#7dcfff">
        <div style={{ color: palette.ink3, fontSize: 11.5, marginTop: 4, marginBottom: 8 }}>
          click a theme to inspect its papers
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {data.themes.map((t, i) => {
            const isOpen = openIdx === i;
            const isGap = t.count === 0;
            return (
              <div key={i} style={{
                background: palette.bg2,
                border: `1px solid ${isOpen ? t.color : palette.rule}`,
                borderLeft: `3px solid ${t.color}`, borderRadius: 3,
                overflow: 'hidden',
                transition: 'border-color 120ms',
              }}>
                <button onClick={() => setOpenIdx(isOpen ? null : i)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '8px 10px', background: 'transparent', border: 'none',
                  color: 'inherit', fontFamily: 'inherit', fontSize: 13,
                  cursor: 'pointer', textAlign: 'left',
                }}>
                  <span style={{
                    display: 'inline-block', width: 10, color: t.color,
                    transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 140ms',
                  }}>›</span>
                  <span style={{ color: palette.ink }}>{t.name}</span>
                  <span style={{ marginLeft: 'auto', color: palette.ink3, fontSize: 11 }}>
                    {isGap ? 'gap · 0 papers' : `${t.count} papers`}
                  </span>
                </button>
                {isOpen && (
                  <div className="fade-in" style={{
                    padding: '0 10px 10px 23px',
                    borderTop: `1px dashed ${palette.rule}`,
                  }}>
                    {t.summary && (
                      <div style={{
                        padding: '10px 0 8px',
                        color: palette.ink2, fontSize: 12.5, lineHeight: 1.55,
                      }}>{t.summary}</div>
                    )}
                    {isGap ? (
                      <div style={{
                        margin: '4px 0 6px', padding: '10px 12px',
                        border: `1px dashed ${t.color}`, borderRadius: 3,
                        color: palette.ink2, fontSize: 12.5, lineHeight: 1.55,
                      }}>
                        <span style={{ color: t.color, fontWeight: 600 }}>Why this is the wedge › </span>
                        {t.gap}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {t.papers.map((p, pi) => (
                          <PaperRow key={pi} paper={p} accent={t.color} />
                        ))}
                        <div style={{
                          marginTop: 6, color: palette.ink4, fontSize: 11,
                          paddingLeft: 2,
                        }}>
                          showing {t.papers.length} of {t.count} · sorted by relevance
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>
    </>
  );
}

function PaperRow({ paper, accent }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'grid', gridTemplateColumns: '40px 1fr auto',
        gap: 10, alignItems: 'baseline',
        padding: '7px 8px',
        borderBottom: `1px dashed ${palette.rule}`,
        background: hover ? palette.bg : 'transparent',
        transition: 'background 100ms',
      }}>
      <span style={{
        color: paper.rel >= 0.85 ? accent : palette.ink3,
        fontSize: 11, fontVariantNumeric: 'tabular-nums',
      }}>
        {paper.rel.toFixed(2)}
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ color: palette.ink, fontSize: 12.5, lineHeight: 1.4 }}>
          {paper.title}
          {paper.anchor && (
            <span style={{
              marginLeft: 6, padding: '0 5px', borderRadius: 2,
              background: 'transparent', border: `1px solid ${accent}`,
              color: accent, fontSize: 9.5, letterSpacing: '0.08em',
              textTransform: 'uppercase', verticalAlign: '1px',
            }}>anchor</span>
          )}
        </div>
        <div style={{ color: palette.ink3, fontSize: 11, marginTop: 3 }}>
          {paper.authors} · {paper.venue} · {paper.year}
        </div>
      </div>
      <span style={{
        color: hover ? accent : palette.ink4, fontSize: 11,
        transition: 'color 100ms',
      }}>open ›</span>
    </div>
  );
}

function MethodologyBody({ data }) {
  const d = data.design;
  return (
    <>
      <Section title="study design" accent="#d9a548">
        <div style={{
          background: palette.bg2, border: `1px solid ${palette.rule}`,
          borderLeft: `3px solid #d9a548`, padding: '12px 14px', borderRadius: 3, marginTop: 6,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ color: palette.ink, fontWeight: 600, fontSize: 14 }}>{d.name}</span>
            <span style={chipStyle}>{d.duration}</span>
            <span style={chipStyle}>N = {d.n}</span>
          </div>
          <ul style={{
            margin: '12px 0 0', paddingLeft: 18, color: palette.ink2,
            fontSize: 13, lineHeight: 1.55,
          }}>
            {d.components.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>
      </Section>
      <Section title="why this beats the alternatives" accent="#d9a548">
        Pure survey misses within-day dynamics. Pure interview misses scale. The mixed-methods
        scaffold preserves both — survey-grade external validity around a longitudinal core.
      </Section>
    </>
  );
}

function ArtifactsBody({ data }) {
  const [openIdx, setOpenIdx] = useState(0); // first one open by default
  return (
    <>
      <Section title="handoff documents" accent="#7fb069">
        <div style={{ color: palette.ink3, fontSize: 11.5, marginTop: 4, marginBottom: 8 }}>
          click a doc to expand · these are the artifacts a researcher hands to engineering, ops, and IRB
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {data.docs.map((d, i) => {
            const isOpen = openIdx === i;
            return (
              <div key={i} style={{
                background: palette.bg2,
                border: `1px solid ${isOpen ? d.tone : palette.rule}`,
                borderLeft: `3px solid ${d.tone}`, borderRadius: 3,
                overflow: 'hidden', transition: 'border-color 120ms',
              }}>
                <button onClick={() => setOpenIdx(isOpen ? null : i)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '8px 12px', background: 'transparent', border: 'none',
                  color: 'inherit', fontFamily: 'inherit', fontSize: 13,
                  cursor: 'pointer', textAlign: 'left',
                }}>
                  <span style={{
                    display: 'inline-block', width: 10, color: d.tone,
                    transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 140ms',
                  }}>›</span>
                  <span style={{ color: palette.ink, fontWeight: 600 }}>{d.name}</span>
                  <span style={{ ...chipStyle, color: d.tone, borderColor: d.tone }}>{d.kind}</span>
                  <span style={{ color: palette.ink3, fontSize: 11.5 }}>{d.words} words</span>
                  {d.edited && (
                    <span style={{ color: palette.amber, fontSize: 11 }}>● edited</span>
                  )}
                  <span style={{ marginLeft: 'auto', color: palette.ink4, fontSize: 11 }}>
                    {isOpen ? 'collapse' : 'preview ›'}
                  </span>
                </button>
                {isOpen && (
                  <div className="fade-in" style={{
                    borderTop: `1px dashed ${palette.rule}`,
                    background: palette.bg,
                  }}>
                    <DocPreview doc={d} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>
    </>
  );
}

function DocPreview({ doc }) {
  return (
    <div style={{ padding: '14px 18px 16px' }}>
      {/* file-header line — pseudo-terminal styling */}
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 8,
        color: palette.ink3, fontSize: 11, marginBottom: 6,
      }}>
        <span style={{ color: doc.tone }}>$</span>
        <span>cat</span>
        <span style={{ color: palette.ink2 }}>{doc.name}</span>
        <span style={{ marginLeft: 'auto', color: palette.ink4 }}>
          {doc.sections.length} sections · {doc.words} words
        </span>
      </div>
      {doc.summary && (
        <div style={{
          padding: '8px 10px', marginBottom: 12,
          background: palette.bg2, borderLeft: `2px solid ${doc.tone}`,
          color: palette.ink2, fontSize: 12.5, lineHeight: 1.55,
        }}>
          {doc.summary}
        </div>
      )}
      {doc.sections.map((s, i) => (
        <div key={i} style={{ marginBottom: 14 }}>
          <div style={{
            color: doc.tone, fontSize: 12, fontWeight: 600,
            letterSpacing: '0.04em',
          }}>
            ## {s.h}
          </div>
          <div style={{
            marginTop: 4, color: palette.ink, fontSize: 13, lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
          }}>
            {s.body}
          </div>
        </div>
      ))}
      <div style={{
        marginTop: 4, paddingTop: 10, borderTop: `1px dashed ${palette.rule}`,
        display: 'flex', gap: 14, color: palette.ink3, fontSize: 11,
      }}>
        <button style={{
          background: 'transparent', border: 'none', color: palette.ink2,
          fontFamily: 'inherit', fontSize: 11.5, cursor: 'pointer', padding: 0,
        }}>edit</button>
        <span style={{ color: palette.ink4 }}>·</span>
        <button style={{
          background: 'transparent', border: 'none', color: palette.ink2,
          fontFamily: 'inherit', fontSize: 11.5, cursor: 'pointer', padding: 0,
        }}>copy raw</button>
        <span style={{ color: palette.ink4 }}>·</span>
        <button style={{
          background: 'transparent', border: 'none', color: palette.ink2,
          fontFamily: 'inherit', fontSize: 11.5, cursor: 'pointer', padding: 0,
        }}>download .md</button>
        <span style={{ marginLeft: 'auto', color: palette.ink4 }}>last regenerated · {doc.edited ? 'manually edited' : '2d ago by agent'}</span>
      </div>
    </div>
  );
}

function EvaluationBody({ data }) {
  const [openIdx, setOpenIdx] = useState(0);
  return (
    <>
      <Section title="frictions surfaced" accent="#c8a8e6">
        <div style={{ color: palette.ink3, fontSize: 11.5, marginTop: 4, marginBottom: 8 }}>
          click a friction to see evidence and proposed fixes
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {data.frictions.map((f, i) => {
            const isOpen = openIdx === i;
            return (
              <div key={i} style={{
                background: palette.bg2,
                border: `1px solid ${isOpen ? f.accent : palette.rule}`,
                borderLeft: `3px solid ${f.accent}`, borderRadius: 3,
                overflow: 'hidden', transition: 'border-color 120ms',
              }}>
                <button onClick={() => setOpenIdx(isOpen ? null : i)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '8px 12px', background: 'transparent', border: 'none',
                  color: 'inherit', fontFamily: 'inherit', fontSize: 13,
                  cursor: 'pointer', textAlign: 'left', lineHeight: 1.5,
                }}>
                  <span style={{
                    display: 'inline-block', width: 10, color: f.accent,
                    transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 140ms', flex: 'none',
                  }}>›</span>
                  <span style={{
                    ...chipStyle, color: f.accent, borderColor: f.accent,
                    textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 10,
                    flex: 'none',
                  }}>{f.sev}</span>
                  <span style={{ color: palette.ink, flex: 1 }}>{f.text}</span>
                  <span style={{ color: palette.ink4, fontSize: 11, flex: 'none' }}>
                    {f.fixes.length} fix{f.fixes.length !== 1 ? 'es' : ''}
                  </span>
                </button>
                {isOpen && <FrictionDetail friction={f} />}
              </div>
            );
          })}
        </div>
      </Section>
      <Section title="pilot statistics" accent="#c8a8e6">
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginTop: 8,
          fontSize: 13,
        }}>
          {Object.entries(data.stats).map(([k, v]) => (
            <div key={k} style={{
              padding: '8px 12px', background: palette.bg2,
              border: `1px solid ${palette.rule}`, borderRadius: 3,
            }}>
              <div style={{ color: palette.ink3, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{k}</div>
              <div style={{ color: palette.ink, marginTop: 2 }}>{v}</div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

function FrictionDetail({ friction: f }) {
  return (
    <div className="fade-in" style={{
      padding: '14px 18px 14px 35px',
      borderTop: `1px dashed ${palette.rule}`,
      background: palette.bg,
    }}>
      <DetailBlock label="trigger" accent={f.accent}>
        {f.trigger}
      </DetailBlock>

      <DetailBlock label={`evidence · ${f.evidence.length} from sim pilot`} accent={f.accent}>
        <ul style={{
          margin: '4px 0 0', paddingLeft: 18, color: palette.ink, fontSize: 13,
          lineHeight: 1.6,
        }}>
          {f.evidence.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      </DetailBlock>

      <DetailBlock label="severity rationale" accent={f.accent}>
        {f.rationale}
      </DetailBlock>

      <DetailBlock label={`proposed fixes · ${f.fixes.length}`} accent={f.accent}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
          {f.fixes.map((fix, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '32px 32px 1fr auto',
              alignItems: 'center', gap: 10,
              padding: '7px 10px',
              background: fix.recommended ? 'rgba(125,207,255,0.06)' : palette.bg2,
              border: `1px solid ${fix.recommended ? '#7dcfff' : palette.rule}`,
              borderRadius: 3, fontSize: 12.5,
            }}>
              <span style={{
                display: 'inline-flex', justifyContent: 'center', alignItems: 'center',
                color: fix.recommended ? '#7dcfff' : palette.ink4,
                fontSize: 11, fontWeight: 700,
              }}>
                {fix.recommended ? '★' : `#${i + 1}`}
              </span>
              <span style={{
                display: 'inline-flex', justifyContent: 'center',
                padding: '1px 0', borderRadius: 2,
                background: effortColor(fix.effort).bg,
                color: effortColor(fix.effort).fg,
                fontSize: 10.5, fontWeight: 700,
                letterSpacing: '0.04em',
              }}>{fix.effort}</span>
              <span style={{ color: palette.ink }}>
                {fix.label}
                {fix.recommended && (
                  <span style={{
                    marginLeft: 8, color: '#7dcfff', fontSize: 10,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                  }}>recommended</span>
                )}
              </span>
              <span style={{ color: palette.ink4, fontSize: 11 }}>apply ›</span>
            </div>
          ))}
        </div>
      </DetailBlock>
    </div>
  );
}

function DetailBlock({ label, accent, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        color: accent, fontSize: 11, fontWeight: 600,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        marginBottom: 4,
      }}>
        ─── {label}
      </div>
      <div style={{ color: palette.ink, fontSize: 13, lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  );
}

function effortColor(e) {
  switch (e) {
    case 'XS': return { bg: 'rgba(127,176,105,0.18)', fg: '#7fb069' };
    case 'S':  return { bg: 'rgba(127,176,105,0.18)', fg: '#7fb069' };
    case 'M':  return { bg: 'rgba(217,165,72,0.18)',  fg: '#d9a548' };
    case 'L':  return { bg: 'rgba(226,110,110,0.18)', fg: '#e26e6e' };
    default:   return { bg: palette.bg2, fg: palette.ink2 };
  }
}

function ReportBody({ data }) {
  return (
    <>
      <Section title="report not drafted yet" accent="#e26e6e">
        Once the pilot evaluation passes, Probe will draft a paper-shaped report
        with the sections below. Use the rerun dock to start it whenever ready.
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
          {data.sections.map((s, i) => (
            <span key={i} style={{
              padding: '4px 10px', border: `1px dashed ${palette.rule}`,
              borderRadius: 3, color: palette.ink3, fontSize: 12,
            }}>{s}</span>
          ))}
        </div>
      </Section>
    </>
  );
}

function Section({ title, accent, children }) {
  return (
    <div style={{ marginTop: 22 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6,
      }}>
        <span style={{ color: accent, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          ─── {title}
        </span>
      </div>
      <div style={{ color: palette.ink2, fontSize: 13.5, lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  );
}

// ─── Pipeline diamond ───
//
// Diamond-shaped overview of Probe's pipeline (borrow #1, MultiColleagues,
// Quan et al. CHI '26). The pipeline is conceptually:
//
//     premise (1)  →  3 RQ branches (diverge)  →  3 design candidates
//                  (still diverging)            →  synthesis (1, converge)
//
// A flat top-to-bottom stage list hides that fan-out / fan-in shape. This
// diamond makes it the first thing a reader sees when they open the
// project page. They learn at a glance "where am I" and "is this widening
// or narrowing now?"
//
// This component is INFORMATIONAL chrome — not a guidebook artifact —
// so it carries no provenance tag in the markup. The lane labels do
// match `STAGE_DEFS` IDs so the visual maps onto the canonical stage
// taxonomy from CLAUDE.md.
//
// Lane assignments are stable: branch A reuses `accentLink` (cool),
// branch B reuses `accentGood` (green), branch C reuses `accentAmber`
// (warm). All three are existing palette accents — no new colors.
function PipelineDiamond({ project, activeStageId, onStageClick }) {
  // Lane definitions. Each lane carries a label + stable color.
  // The 3 lanes correspond to Probe's 3 divergent branches; in the
  // current single-project demo state the stages are shared across
  // branches (same evaluation/report/review for the synthesized flow),
  // but the 3 lanes still read the per-stage state to drive the glow
  // when a stage is `running` or active.
  const palette = window.__probePalette;
  const lanes = [
    { id: 'A', color: palette.accentLink  || '#7eaad2', label: 'branch A' },
    { id: 'B', color: palette.accentGood  || '#7ab686', label: 'branch B' },
    { id: 'C', color: palette.accentAmber || '#d9a548', label: 'branch C' },
  ];

  // Milestone definitions. Each milestone is anchored by the stageId
  // it represents — so clicking it can drive the right pane to the
  // matching stage card.
  //
  // The 3-zone layout left-to-right:
  //   zone 0 = premise (single dot at top of diamond)
  //   zone 1..3 = divergent middle (literature → methodology → artifacts)
  //   zone 4 = parallel evaluation (still 3 lanes)
  //   zone 5 = adversarial review (still 3 lanes, glow color flips)
  //   zone 6 = synthesis (single dot at right of diamond — convergence)
  const milestones = [
    { x: 0.04, stage: 'premise',     stageId: null,          desc: 'Probe sharpens the rough premise into a working title and main RQ.' },
    { x: 0.20, stage: 'framing',     stageId: 'framing',     desc: 'Probe interrogates the premise and surfaces three sub-RQs.' },
    { x: 0.34, stage: 'literature',  stageId: 'literature',  desc: 'Probe maps the corpus onto each branch and flags gaps.' },
    { x: 0.50, stage: 'methodology', stageId: 'methodology', desc: 'Probe drafts a study design per branch, scoped to one comparable plan.' },
    { x: 0.62, stage: 'artifacts',   stageId: 'artifacts',   desc: 'Probe produces the handoff documents: protocol, survey, IRB memo.' },
    { x: 0.74, stage: 'evaluation',  stageId: 'evaluation',  desc: 'Probe rehearses a simulated pilot and surfaces friction (rehearsal, not evidence).' },
    { x: 0.86, stage: 'review',      stageId: 'review',      desc: 'Probe rehearses an adversarial peer-review panel: 1 AC plus 3 reviewers.' },
    { x: 0.96, stage: 'synthesis',   stageId: 'report',      desc: 'Probe converges the three branches into one report and a labeled guidebook.' },
  ];

  // Diamond canvas geometry. width = 880 (matches existing 880px hero
  // measure on the home page), height = 280 so it's hero-sized but not
  // overwhelming.
  const W = 880, H = 280;
  // The premise dot sits at the left tip; synthesis dot at the right.
  const leftX = W * 0.04, rightX = W * 0.96;
  const midX  = (leftX + rightX) / 2;
  const cy    = H / 2;
  // Vertical spread between lanes at the widest middle.
  const laneSpread = 56; // px between A and C at widest point
  const laneOffset = (idx) => (idx - 1) * laneSpread; // A=-spread, B=0, C=+spread

  // For each lane we compute a quadratic curve from premise → mid → synthesis.
  // The control point at midX gives the "fan-out then fan-in" diamond.
  const lanePathFor = (idx) => {
    const oy = laneOffset(idx);
    return `M ${leftX} ${cy} Q ${midX} ${cy + oy * 1.45}, ${rightX} ${cy}`;
  };

  // Helper: where does milestone at fractional x sit on lane idx?
  // We approximate the quadratic Bezier B(t) at t=fractional-along
  // for each lane. t = (x - leftX) / (rightX - leftX).
  function pointOnLane(idx, frac) {
    const t = Math.max(0, Math.min(1, frac));
    const oy = laneOffset(idx);
    // Quadratic Bezier: (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
    // P0 = (leftX, cy), P1 = (midX, cy + oy*1.45), P2 = (rightX, cy)
    const u = 1 - t;
    const px = u * u * leftX + 2 * u * t * midX + t * t * rightX;
    const py = u * u * cy   + 2 * u * t * (cy + oy * 1.45) + t * t * cy;
    return [px, py];
  }

  // Drive lane glow off the project state. A lane is "lit" if (a) the
  // active stage maps to this milestone, OR (b) the stage is currently
  // running. Otherwise lanes render in fgFaint outline.
  //
  // For demo purposes we treat the active stage as lit on ALL three
  // lanes — the divergent triplet runs in parallel in the actual
  // pipeline. Once the demo state grows per-branch status this can
  // narrow to just the running branch.
  function isLit(stageId) {
    if (!stageId) return false;
    if (stageId === activeStageId) return true;
    const sd = project && project[stageId];
    return !!(sd && sd.status === 'running');
  }

  // Tooltip state
  const [hover, setHover] = useState(null); // milestone obj or null

  return (
    <div style={{
      width: '100%', display: 'flex', justifyContent: 'center',
      padding: '18px 16px 8px',
      borderBottom: `1px solid ${palette.rule}`,
      background: palette.bgPage || palette.bg,
    }}>
      <div style={{
        position: 'relative', width: '100%', maxWidth: W + 24,
        background: palette.bgPanel || palette.bg2,
        border: `1px solid ${palette.border || palette.rule}`,
        borderRadius: 4,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
      }}>
        {/* Header row */}
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 12,
          padding: '10px 16px 6px',
          borderBottom: `1px dashed ${palette.border || palette.rule}`,
        }}>
          <span style={{
            color: palette.fgMute || palette.ink3, fontSize: 11,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            fontFamily: palette.fontMono || 'monospace',
          }}>─── pipeline · diamond view</span>
          <span style={{
            color: palette.fgSecondary || palette.ink2, fontSize: 11.5,
            fontFamily: palette.fontSans || 'sans-serif',
          }}>
            premise <span style={{ color: palette.fgFaint || palette.ink4 }}>›</span> 3 branches diverge <span style={{ color: palette.fgFaint || palette.ink4 }}>›</span> synthesis
          </span>
          <span style={{ marginLeft: 'auto', color: palette.fgMute || palette.ink3, fontSize: 11 }}>
            click a milestone to focus its stage
          </span>
        </div>

        {/* SVG body */}
        <div style={{ position: 'relative', padding: '6px 12px 14px' }}>
          <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet"
            style={{ display: 'block' }}>
            {/* SVG defs for soft glow on lit lanes */}
            <defs>
              {lanes.map((ln) => (
                <filter key={ln.id} id={`pd-glow-${ln.id}`} x="-20%" y="-50%" width="140%" height="200%">
                  <feGaussianBlur stdDeviation="3.4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              ))}
            </defs>

            {/* Faint baseline through the middle for visual anchoring */}
            <line x1={leftX} y1={cy} x2={rightX} y2={cy}
              stroke={palette.fgFaint || palette.ink4} strokeWidth="0.5"
              strokeDasharray="2 6" opacity="0.6"/>

            {/* The three lanes */}
            {lanes.map((ln, idx) => {
              // A lane "lights" if the active milestone touches it.
              // For the divergent middle stages the lane visualization
              // is per-lane on every branch; only the lane color
              // distinguishes them.
              const litAny = milestones.some((m) => m.stageId === activeStageId && m.stageId);
              const litColor = ln.color;
              return (
                <g key={ln.id}>
                  {/* Soft halo behind lit lane */}
                  {litAny && (
                    <path
                      d={lanePathFor(idx)}
                      fill="none"
                      stroke={litColor}
                      strokeOpacity="0.18"
                      strokeWidth="14"
                      strokeLinecap="round"
                    />
                  )}
                  {/* Main lane stroke */}
                  <path
                    d={lanePathFor(idx)}
                    fill="none"
                    stroke={litAny ? litColor : (palette.fgFaint || palette.ink4)}
                    strokeWidth={litAny ? 1.6 : 1}
                    strokeLinecap="round"
                  />
                  {/* Lane label at the widest point */}
                  <text
                    x={midX}
                    y={cy + laneOffset(idx) * 1.45 + (idx === 2 ? 16 : (idx === 0 ? -8 : -8))}
                    fill={litAny ? litColor : (palette.fgMute || palette.ink3)}
                    fontSize="10.5"
                    fontFamily={palette.fontMono || 'monospace'}
                    textAnchor="middle"
                    opacity={idx === 1 && !litAny ? 0.7 : 0.95}
                  >
                    {ln.label}
                  </text>
                </g>
              );
            })}

            {/* Premise dot (left tip) and Synthesis dot (right tip) */}
            <PipelineEndDot
              x={leftX} y={cy}
              label="premise"
              sublabel="rough idea"
              accent={palette.accentAmber}
              active={!activeStageId || activeStageId === 'framing'}
              onClick={() => onStageClick && onStageClick('framing')}
              palette={palette}
              align="left"
            />
            <PipelineEndDot
              x={rightX} y={cy}
              label="synthesis"
              sublabel="guidebook"
              accent={palette.accentAmber}
              active={activeStageId === 'report' || activeStageId === 'review'}
              onClick={() => onStageClick && onStageClick('report')}
              palette={palette}
              align="right"
            />

            {/* Stage milestones — three dots per stage (one per lane), except premise + synthesis */}
            {milestones.slice(1, -1).map((m) => {
              const lit = isLit(m.stageId);
              return lanes.map((ln, idx) => {
                const [px, py] = pointOnLane(idx, m.x);
                return (
                  <g key={`${m.stage}-${ln.id}`}
                    onMouseEnter={() => setHover(m)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => onStageClick && m.stageId && onStageClick(m.stageId)}
                    style={{ cursor: m.stageId ? 'pointer' : 'default' }}>
                    {lit && (
                      <circle cx={px} cy={py} r={9}
                        fill={ln.color} fillOpacity="0.18" />
                    )}
                    <circle cx={px} cy={py} r={lit ? 4.5 : 3}
                      fill={lit ? ln.color : (palette.bgPanel || palette.bg2)}
                      stroke={lit ? ln.color : (palette.fgFaint || palette.ink4)}
                      strokeWidth={lit ? 1 : 1}/>
                    {/* label only for the middle lane (B), so the row
                        stays uncluttered */}
                    {idx === 1 && (
                      <text x={px} y={H - 26}
                        fill={lit ? (palette.fgStrong || palette.ink) : (palette.fgMute || palette.ink3)}
                        fontSize="11"
                        fontWeight={lit ? 600 : 500}
                        fontFamily={palette.fontMono || 'monospace'}
                        textAnchor="middle">
                        {m.stage}
                      </text>
                    )}
                  </g>
                );
              });
            })}

            {/* Phase grouping labels along the bottom: divergent / parallel review / convergent */}
            <text x={leftX + 8} y={H - 6}
              fill={palette.fgMute || palette.ink3}
              fontSize="10" letterSpacing="0.14em"
              fontFamily={palette.fontMono || 'monospace'}>
              IN
            </text>
            <text x={midX} y={H - 6}
              fill={palette.fgMute || palette.ink3}
              fontSize="10" letterSpacing="0.14em"
              fontFamily={palette.fontMono || 'monospace'}
              textAnchor="middle">
              ── 3 branches in parallel ──
            </text>
            <text x={rightX - 8} y={H - 6}
              fill={palette.fgMute || palette.ink3}
              fontSize="10" letterSpacing="0.14em"
              fontFamily={palette.fontMono || 'monospace'}
              textAnchor="end">
              OUT
            </text>
          </svg>

          {/* Tooltip */}
          {hover && (
            <div style={{
              position: 'absolute', top: 10, right: 14,
              maxWidth: 320, padding: '8px 12px',
              background: palette.bgPage || palette.bg,
              border: `1px solid ${palette.borderStrong || palette.rule}`,
              borderRadius: 3,
              boxShadow: '0 8px 24px -10px rgba(0,0,0,0.55)',
              color: palette.fgBody || palette.ink,
              fontFamily: palette.fontSans || 'sans-serif',
              fontSize: 12, lineHeight: 1.5,
              pointerEvents: 'none',
              zIndex: 5,
            }}>
              <div style={{
                color: palette.accentAmber || palette.amber,
                fontFamily: palette.fontMono || 'monospace',
                fontSize: 10.5, letterSpacing: '0.14em',
                textTransform: 'uppercase', marginBottom: 3,
              }}>{hover.stage}</div>
              <div>{hover.desc}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PipelineEndDot({ x, y, label, sublabel, accent, active, onClick, palette, align }) {
  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      {active && (
        <circle cx={x} cy={y} r={14} fill={accent} fillOpacity="0.16" />
      )}
      <circle cx={x} cy={y} r={6}
        fill={active ? accent : (palette.bgPanel || palette.bg2)}
        stroke={accent} strokeWidth="1.4"/>
      <text
        x={align === 'right' ? x - 12 : x + 12}
        y={y - 12}
        fill={palette.fgStrong || palette.ink}
        fontSize="11.5" fontWeight="600"
        fontFamily={palette.fontMono || 'monospace'}
        textAnchor={align === 'right' ? 'end' : 'start'}>
        {label}
      </text>
      <text
        x={align === 'right' ? x - 12 : x + 12}
        y={y + 18}
        fill={palette.fgMute || palette.ink3}
        fontSize="10"
        fontFamily={palette.fontMono || 'monospace'}
        textAnchor={align === 'right' ? 'end' : 'start'}>
        {sublabel}
      </text>
    </g>
  );
}

window.PipelineDiamond = PipelineDiamond;
window.ProjectStages = ProjectStages;
window.PROBE_STAGE_DEFS = STAGE_DEFS;
window.makeInitialProjectState = makeInitialState;
