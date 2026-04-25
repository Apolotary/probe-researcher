/* global React */
const { useState, useEffect, useRef } = React;

// Literature review screen — one panel per selected RQ.
// Each panel walks through: search → read → synthesize, then reveals
// (1) state-of-the-art paragraph, (2) similar papers, (3) research gaps.
// Plus a per-RQ notes textarea the user fills in for later stages.

// ─── Stock literature data, keyed loosely by RQ angle ───
const stockLiterature = {
  mechanism: {
    soa: `The dominant account of "video-call fatigue" frames it as a cumulative load problem: continuous self-view, restricted gaze cues, and reduced micro-mobility tax executive function over the day. Bailenson (2021) sketched four mechanisms — mirror anxiety, gaze hyper-arousal, immobility, and increased cognitive load — and follow-up work has produced converging diary and EEG evidence that drop-off is steepest in back-to-back, large-attendee sessions. Quantitative effects, however, vary widely with calendar structure and individual differences, and most published work measures fatigue at end-of-day rather than within the session.`,
    papers: [
      { cite: 'Bailenson, 2021',          title: 'Nonverbal overload: A theoretical argument for the causes of Zoom fatigue',     venue: 'Technology, Mind, and Behavior' },
      { cite: 'Fauville et al., 2021',    title: 'Zoom Exhaustion & Fatigue Scale',                                                 venue: 'Computers in Human Behavior' },
      { cite: 'Shockley et al., 2021',    title: 'The fatiguing effects of camera use in virtual meetings',                         venue: 'J. Applied Psychology' },
      { cite: 'Riedl, 2022',              title: 'On the stress potential of videoconferencing: a review',                          venue: 'Electronic Markets' },
    ],
    gaps: [
      'Most studies measure fatigue end-of-day, not the within-session focus drop the question is about.',
      'Calendar-structural variables (back-to-back density, agenda presence, attendee count) are rarely modelled jointly.',
      'Self-report dominates; ecologically-valid behavioural traces (typing cadence, app-switching) are underused.',
    ],
  },
  intervention: {
    soa: `Interventions for meeting recovery cluster into three families: structural (Microsoft's 5-minute buffer default, "speed meetings"), individual rituals (micro-breaks, breathing protocols), and environmental (camera-off norms, walking meetings). Microsoft Research's 2021 brain-EEG study showed short inter-meeting breaks measurably reduce stress accumulation; subsequent field trials of buffered calendars produced mixed effects, often diluted by participants filling the buffer with email. Within-subjects designs that compare an explicit ritual to an unstructured break are still rare.`,
    papers: [
      { cite: 'Microsoft Human Factors Lab, 2021', title: 'Research proves your brain needs breaks',                                venue: 'WorkLab Report' },
      { cite: 'Blasche et al., 2018',              title: 'Effects of rest-break intention on recovery from work',                  venue: 'Ergonomics' },
      { cite: 'Kim et al., 2017',                  title: 'Micro-break activities at work to recover from daily work demands',     venue: 'J. Organizational Behavior' },
      { cite: 'Mark et al., 2014',                 title: 'Bored Mondays and focused afternoons: rhythms of attention',             venue: 'CHI' },
    ],
    gaps: [
      'Few studies isolate a *single* short ritual against a no-ritual control under matched calendar load.',
      'Almost no work measures the *next* solo work block — the dependent variable the question actually targets.',
      'Adherence and ritual-design preferences are under-reported, making replication hard.',
    ],
  },
  'lived experience': {
    soa: `Qualitative work on remote-work fatigue (Karl et al., 2022; Standaert et al., 2021) consistently surfaces three textures: cognitive ("brain fog after the third call"), social ("performing presence"), and somatic ("eyes, shoulders, breath"). However most accounts pool fatigue with general burnout, and few studies separate texture-of-experience from frequency-of-experience. Phenomenological framings borrowed from HCI (Höök, 2018) remain underused in this literature.`,
    papers: [
      { cite: 'Karl et al., 2022',          title: 'Virtual meeting fatigue: A qualitative inquiry',              venue: 'J. Business Comm.' },
      { cite: 'Standaert et al., 2021',     title: 'How shall we meet? Understanding richness needs',             venue: 'CSCW' },
      { cite: 'Sandstrom & Dunn, 2014',     title: 'Social interactions and well-being',                          venue: 'Pers. Soc. Psych. Bulletin' },
      { cite: 'Höök, 2018',                 title: 'Designing with the body (somaesthetic interaction design)',   venue: 'MIT Press' },
    ],
    gaps: [
      'Texture vs. frequency is rarely teased apart — interviews collapse "tired often" with "tired in a specific way".',
      'Somatic dimension is acknowledged but seldom probed with body-mapping or felt-sense protocols.',
      'Cross-role comparison (engineer vs. PM vs. designer) is largely missing from existing samples.',
    ],
  },
  custom: {
    soa: `Probe could not find a confidently matched literature for this user-defined angle. The agents performed an open-domain sweep (Semantic Scholar, ACM DL, arXiv cs.HC) and surfaced loosely-related work below; treat the synthesis as a starting frame, not consensus.`,
    papers: [
      { cite: 'open search', title: 'Top-ranked candidates from broad query', venue: 'Semantic Scholar' },
      { cite: 'open search', title: 'HCI venue scan for adjacent constructs', venue: 'ACM DL · arXiv' },
    ],
    gaps: [
      'Define construct precisely — current phrasing yields low-precision retrieval.',
      'Add 2–3 anchor terms (population · setting · outcome) before re-running.',
    ],
  },
};

const palette = window.__probePalette;
const kbdStyle = window.__probeKbd;
const chipStyle = window.__probeChip;
const ghostBtnStyle = window.__probeGhostBtn;

function Literature({ mainRq, selectedBranches, onBack, onContinue }) {
  // selectedBranches: array of { letter, angle, rq, custom? }
  const [stage, setStage] = useState(0); // 0 search, 1 read, 2 synthesize, 3 done
  const [activeIdx, setActiveIdx] = useState(0);
  const [notes, setNotes] = useState({}); // letter → text
  const tabRef = useRef(null);

  // Stage advancement timing
  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 900);
    const t2 = setTimeout(() => setStage(2), 1900);
    const t3 = setTimeout(() => setStage(3), 3100);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // Hotkeys
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'ArrowLeft' || e.key === 'h') { e.preventDefault(); setActiveIdx((i) => Math.max(0, i - 1)); }
      if (e.key === 'ArrowRight' || e.key === 'l') { e.preventDefault(); setActiveIdx((i) => Math.min(selectedBranches.length - 1, i + 1)); }
      if (e.key === 'Escape') { e.preventDefault(); onBack(); }
      const digit = parseInt(e.key, 10);
      if (!Number.isNaN(digit) && digit >= 1 && digit <= selectedBranches.length) {
        e.preventDefault(); setActiveIdx(digit - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedBranches.length]);

  const active = selectedBranches[activeIdx];
  const lit = stockLiterature[active.angle] || stockLiterature.custom;
  const noteVal = notes[active.letter] || '';
  const setNote = (v) => setNotes((n) => ({ ...n, [active.letter]: v }));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Crumb steps={[
        ['probe', palette.amber],
        ['new project', palette.ink2],
        ['brainstorm', palette.ink2],
        ['literature', palette.ink],
      ]} right={
        <span style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <span style={{ color: palette.ink3 }}>stage 2 · literature</span>
          <button onClick={onBack} style={ghostBtnStyle}><kbd style={kbdStyle}>esc</kbd> back</button>
        </span>
      } />

      <div style={{ flex: 1, padding: '28px 32px 80px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div style={{
          color: palette.ink3, fontSize: 11, letterSpacing: '0.14em',
          textTransform: 'uppercase', marginBottom: 8,
        }}>
          ─── literature review · {selectedBranches.length} {selectedBranches.length === 1 ? 'angle' : 'angles'} in flight ───
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 500, margin: 0, color: palette.ink2 }}>
          What's already known, what's missing, and where you can plant a flag.
        </h2>

        {/* Pipeline progress */}
        <PipelineRow stage={stage} />

        {/* RQ tabs */}
        <div style={{
          marginTop: 28, display: 'flex', borderBottom: `1px solid ${palette.rule}`,
        }}>
          {selectedBranches.map((b, i) => {
            const sel = i === activeIdx;
            return (
              <button key={b.letter}
                onClick={() => setActiveIdx(i)}
                style={{
                  background: 'transparent', border: 'none', fontFamily: 'inherit',
                  padding: '10px 16px',
                  borderBottom: `2px solid ${sel ? palette.amber : 'transparent'}`,
                  color: sel ? palette.ink : palette.ink3,
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
                  fontSize: 13,
                }}>
                <span style={{ ...kbdStyle, fontSize: 10 }}>{i + 1}</span>
                <span style={{ fontWeight: 600 }}>RQ {b.letter}</span>
                <span style={{ color: palette.ink3 }}>·</span>
                <span style={{ color: palette.ink3, maxWidth: 220, overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {b.angle}
                </span>
                {(notes[b.letter] || '').trim() && (
                  <span title="has notes" style={{
                    width: 6, height: 6, borderRadius: '50%', background: palette.cyan,
                    marginLeft: 4,
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Active panel */}
        <div key={active.letter} className="fade-in" style={{ marginTop: 22, display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 22, alignItems: 'start' }}>
          {/* main column */}
          <div>
            <div style={{
              padding: '14px 16px', border: `1px solid ${palette.rule}`,
              borderLeft: `3px solid ${active.custom ? palette.cyan : palette.amber}`,
              background: palette.bg2, borderRadius: 4,
            }}>
              <div style={{ color: palette.ink3, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                RQ {active.letter} · {active.angle}
              </div>
              <div style={{ color: palette.ink, fontSize: 14, marginTop: 6, lineHeight: 1.55 }}>
                {active.rq}
              </div>
            </div>

            {/* state of the art */}
            <Section title="state of the art" hint="synthesis from agent read" reveal={stage >= 3}>
              <p style={{ margin: 0, color: palette.ink, fontSize: 14, lineHeight: 1.65 }}>
                {lit.soa}
              </p>
            </Section>

            {/* similar papers */}
            <Section title="most similar work" hint={`${lit.papers.length} top matches`} reveal={stage >= 3}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {lit.papers.map((p, i) => (
                  <div key={i} style={{
                    display: 'grid', gridTemplateColumns: '24px 160px 1fr 160px',
                    gap: 12, padding: '8px 10px',
                    background: i % 2 ? palette.bg2 : 'transparent',
                    color: palette.ink, fontSize: 13, alignItems: 'center', borderRadius: 2,
                  }}>
                    <span style={{ color: palette.ink3 }}>[{i + 1}]</span>
                    <span style={{ color: palette.amber, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.cite}
                    </span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.title}
                    </span>
                    <span style={{ color: palette.ink3, fontSize: 12, textAlign: 'right',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.venue}
                    </span>
                  </div>
                ))}
              </div>
            </Section>

            {/* gaps */}
            <Section title="research gaps · where you can differentiate" hint="agent recommends"
                     reveal={stage >= 3} accent={palette.moss}>
              <ul style={{ margin: 0, paddingLeft: 20, color: palette.ink, fontSize: 14, lineHeight: 1.65 }}>
                {lit.gaps.map((g, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>
                    <span style={{ color: palette.moss, marginRight: 6 }}>▸</span>
                    {g}
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          {/* notes column */}
          <aside style={{ position: 'sticky', top: 16 }}>
            <div style={{
              padding: '14px 16px', border: `1px solid ${palette.cyan}`,
              borderLeft: `3px solid ${palette.cyan}`,
              background: 'rgba(125, 207, 255, 0.05)', borderRadius: 4,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ color: palette.cyan, fontSize: 11, letterSpacing: '0.14em',
                  textTransform: 'uppercase', fontWeight: 600 }}>
                  your notes
                </div>
                <div style={{ marginLeft: 'auto', color: palette.ink3, fontSize: 11 }}>
                  RQ {active.letter}
                </div>
              </div>
              <div style={{ color: palette.ink3, fontSize: 11.5, marginTop: 6, lineHeight: 1.5 }}>
                Sketch your angle, constraints, anything Probe should treat as a hard requirement when designing the study.
              </div>
              <textarea
                value={noteVal}
                onChange={(e) => setNote(e.target.value)}
                placeholder={`e.g. limit to participants who use Slack daily; avoid sensors; budget caps at $200…`}
                rows={9}
                style={{
                  marginTop: 10, width: '100%', boxSizing: 'border-box',
                  background: palette.bg, border: `1px solid ${palette.rule}`,
                  color: palette.ink, padding: '10px 12px', fontSize: 13, lineHeight: 1.5,
                  borderRadius: 3, resize: 'vertical', outline: 'none',
                  caretColor: palette.cyan, fontFamily: 'inherit',
                }}
              />
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                color: palette.ink3, fontSize: 11 }}>
                <span>{noteVal.length} chars · saved locally</span>
                <span>fed into stage 3</span>
              </div>
            </div>

            {/* Mini summary */}
            <div style={{
              marginTop: 14, padding: '12px 14px', border: `1px solid ${palette.rule}`,
              background: palette.bg2, borderRadius: 4, fontSize: 11.5, color: palette.ink3,
            }}>
              <div style={{ color: palette.ink2, fontWeight: 600, marginBottom: 6 }}>across all angles</div>
              <div>papers read · {selectedBranches.length * 4}</div>
              <div>gaps identified · {selectedBranches.length * 3}</div>
              <div>notes attached · {Object.values(notes).filter((v) => (v || '').trim()).length}/{selectedBranches.length}</div>
            </div>
          </aside>
        </div>
      </div>

      {/* footer action bar */}
      <div style={{
        position: 'sticky', bottom: 0, background: palette.bg,
        borderTop: `1px solid ${palette.rule}`,
        padding: '10px 22px', display: 'flex', alignItems: 'center', gap: 14,
        color: palette.ink3, fontSize: 12.5,
      }}>
        <span><kbd style={kbdStyle}>←</kbd><kbd style={kbdStyle}>→</kbd> switch RQ</span>
        <span><kbd style={kbdStyle}>1</kbd>..<kbd style={kbdStyle}>{selectedBranches.length}</kbd> jump</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
          <span>{Object.values(notes).filter((v) => (v || '').trim()).length} of {selectedBranches.length} notes added</span>
          <button onClick={() => stage >= 3 && onContinue && onContinue()} disabled={stage < 3} style={{
            background: stage < 3 ? 'transparent' : palette.amber,
            color: stage < 3 ? palette.ink4 : palette.bg,
            border: `1px solid ${stage < 3 ? palette.rule : palette.amber}`,
            padding: '5px 14px', borderRadius: 3, fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
            cursor: stage < 3 ? 'not-allowed' : 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            continue · design study
            <kbd style={{ ...kbdStyle, background: stage < 3 ? palette.bg2 : 'rgba(0,0,0,0.2)',
              color: stage < 3 ? palette.ink4 : 'rgba(0,0,0,0.7)',
              borderColor: stage < 3 ? palette.rule : 'rgba(0,0,0,0.15)' }}>↵</kbd>
          </button>
        </span>
      </div>
    </div>
  );
}

function PipelineRow({ stage }) {
  const steps = [
    { label: 'searching arxiv · acm · semantic scholar', count: 248 },
    { label: 'reading top-ranked papers',                count: 12  },
    { label: 'synthesizing soa · gaps',                  count: null },
  ];
  return (
    <div style={{
      marginTop: 16, padding: '10px 14px',
      background: palette.bg2, border: `1px solid ${palette.rule}`, borderRadius: 4,
      display: 'flex', alignItems: 'center', gap: 18, fontSize: 12,
    }}>
      {steps.map((s, i) => {
        const done = stage > i;
        const active = stage === i;
        const color = done ? palette.moss : active ? palette.amber : palette.ink4;
        return (
          <React.Fragment key={i}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color }}>
              <span style={{ fontFamily: 'inherit', width: 16, display: 'inline-block', textAlign: 'center' }}>
                {done ? '✓' : active ? <span className="pulse-dot">●</span> : '○'}
              </span>
              <span style={{ color: done ? palette.ink2 : active ? palette.ink : palette.ink4 }}>
                {s.label}
              </span>
              {s.count != null && stage >= i && (
                <span style={{ color: palette.ink3, marginLeft: 4 }}>· {s.count}</span>
              )}
            </div>
            {i < steps.length - 1 && (
              <span style={{ color: palette.ink4, flex: 1, borderTop: `1px dashed ${palette.rule}` }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function Section({ title, hint, children, reveal, accent }) {
  if (!reveal) {
    return (
      <div style={{ marginTop: 24, color: palette.ink4, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="pulse-dot" style={{
          display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: palette.amber,
        }} />
        <span>{title} pending…</span>
      </div>
    );
  }
  return (
    <div className="fade-in" style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
        <span style={{
          color: accent || palette.amber, fontSize: 11, letterSpacing: '0.14em',
          textTransform: 'uppercase', fontWeight: 600,
        }}>{title}</span>
        {hint && <span style={{ color: palette.ink3, fontSize: 11 }}>· {hint}</span>}
        <span style={{ flex: 1, borderBottom: `1px solid ${palette.rule}`, transform: 'translateY(-4px)' }} />
      </div>
      {children}
    </div>
  );
}

function Crumb({ steps, right }) {
  return (
    <div style={{
      padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 12,
      borderBottom: `1px solid ${palette.rule}`, color: palette.ink3, fontSize: 12,
    }}>
      {steps.map(([s, c], i) => (
        <React.Fragment key={i}>
          <span style={{ color: c }}>{s}</span>
          {i < steps.length - 1 && <span>›</span>}
        </React.Fragment>
      ))}
      <span style={{ marginLeft: 'auto' }}>{right}</span>
    </div>
  );
}

window.Literature = Literature;
