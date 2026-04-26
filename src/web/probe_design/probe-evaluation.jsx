/* global React */
const { useState, useEffect, useRef } = React;

// Stage 5 — Simulated Evaluation
// User picks N (slider). Probe spins up N synthetic personas, runs them through
// the protocol, then synthesizes Evaluation / Discussion / Conclusion sections.
// Everything obviously labeled SIMULATED. All sections editable.

const palette = window.__probePalette;
const kbdStyle = window.__probeKbd;
const chipStyle = window.__probeChip;
const ghostBtnStyle = window.__probeGhostBtn;

const PERSONA_BANK = [
  { name: 'Maya R.',  role: 'staff engineer',     attrs: ['camera-off advocate', '6 calls/day', 'introvert'],  bias: 'fatigues fast in large meetings' },
  { name: 'Ben L.',   role: 'product manager',    attrs: ['back-to-back days', '8 calls/day', 'extravert'],     bias: 'thrives on meetings; resists rituals' },
  { name: 'Priya S.', role: 'design lead',        attrs: ['agenda-stickler', '4 calls/day'],                    bias: 'high baseline focus, low variance' },
  { name: 'Jonas T.', role: 'backend engineer',   attrs: ['ADHD diagnosed', 'flexible calendar'],               bias: 'high variance, ritual-curious' },
  { name: 'Aisha K.', role: 'UX researcher',      attrs: ['somatically aware', 'walks daily'],                  bias: 'rich qualitative reporter' },
  { name: 'Leo M.',   role: 'engineering manager', attrs: ['9 calls/day', '1:1 heavy'],                          bias: 'fatigue but loves the calls' },
  { name: 'Yuki H.',  role: 'data scientist',     attrs: ['camera-off', 'small org'],                           bias: 'low meeting load baseline' },
  { name: 'Carlos D.',role: 'design technologist', attrs: ['parent of two', 'tight schedule'],                   bias: 'time-pressured, terse responses' },
  { name: 'Nora P.',  role: 'PM, contractor',     attrs: ['multi-org calendar', 'always-on'],                   bias: 'context-switch fatigue dominant' },
  { name: 'Theo G.',  role: 'frontend engineer',  attrs: ['music-while-coding', 'late-shifter'],                bias: 'evening focus is best' },
  { name: 'Sana O.',  role: 'researcher',         attrs: ['EU timezone', 'methods-pedantic'],                   bias: 'critical of any intervention' },
  { name: 'Ravi C.',  role: 'staff design',       attrs: ['8 calls/day', 'team-lead duties'],                   bias: 'prosocial, performs presence' },
  { name: 'Elif A.',  role: 'PM, FAANG',          attrs: ['exec-facing', 'agenda-light meetings'],              bias: 'fatigue tied to status of attendees' },
  { name: 'Kai W.',   role: 'eng intern',         attrs: ['new to remote', 'low call count'],                   bias: 'novelty effect strong' },
  { name: 'Iris B.',  role: 'principal designer', attrs: ['craft-mode', 'guards focus blocks'],                 bias: 'low fatigue; protects calendar' },
  { name: 'Omar F.',  role: 'PM, healthtech',     attrs: ['regulated industry', 'long meetings'],               bias: 'agenda-heavy meetings, mid fatigue' },
  { name: 'Zara V.',  role: 'design researcher',  attrs: ['somatic-aware', 'body-mapping practitioner'],        bias: 'expert at body-mapping protocol' },
  { name: 'Diego E.', role: 'staff backend',      attrs: ['async-preferred', 'calls drain'],                    bias: 'wants ritual to skip meetings entirely' },
  { name: 'Mei L.',   role: 'UX writer',          attrs: ['low call count', 'deep-work blocks'],                bias: 'critical-incident recall is sharp' },
  { name: 'Ahmed N.', role: 'engineering manager', attrs: ['12 calls/day', 'no agenda culture'],                 bias: 'extreme fatigue; ritual skeptic' },
  { name: 'Frida J.', role: 'product designer',   attrs: ['parent', 'school-run boundary'],                     bias: 'morning focus crashes by 3pm' },
  { name: 'Tomás R.', role: 'researcher',         attrs: ['LATAM tz', 'small startup'],                         bias: 'overlap-window pressure' },
  { name: 'Sasha P.', role: 'PM, agency',         attrs: ['client-facing', 'context-switch heavy'],             bias: 'switching cost dominates' },
  { name: 'Nadia O.', role: 'design lead',        attrs: ['camera-on stickler', 'social presence'],             bias: 'mirror-anxiety dominant' },
  { name: 'Ethan K.', role: 'eng',                attrs: ['avoidant of meetings', 'declines aggressively'],     bias: 'baseline focus high; meetings rare' },
  { name: 'Lila B.',  role: 'PM',                 attrs: ['recently promoted', 'meeting overload'],             bias: 'role-transition fatigue' },
  { name: 'Hugo F.',  role: 'staff design',       attrs: ['walking-meeting fan'],                                bias: 'somatic ritual already exists' },
  { name: 'Reem D.',  role: 'researcher · gov',   attrs: ['compliance-heavy', 'consent-cautious'],              bias: 'will scrutinize study design' },
  { name: 'Marko V.', role: 'eng, EU',            attrs: ['cross-tz nightmare'],                                 bias: 'late-call fatigue specifically' },
  { name: 'Yusuf B.', role: 'PM',                 attrs: ['camera-off', 'stand-up advocate'],                   bias: 'short meetings only, defends them' },
];

function pickPersonas(n) {
  // deterministic-ish shuffle so the same N produces a stable sample within session
  const arr = [...PERSONA_BANK];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, n);
}

function defaultEvaluation(rqs, n) {
  return `Across ${n} simulated participants, the deployment produced ${n * 14} post-meeting prompts, ${Math.round(n * 0.7)} weekly check-ins, and ${n} exit interviews.

Findings, organized by RQ:

${rqs.map((r) => `${r.letter}. ${r.rq.slice(0, 80)}${r.rq.length > 80 ? '…' : ''}
   • Quantitative: focus self-rating dropped a mean of 0.9 points (1–7 scale) on days with ≥ 5 back-to-back meetings vs. ≤ 2 (within-subject, p < .01).
   • Qualitative: participants described the drop as ${r.angle === 'lived experience' ? 'somatic before cognitive — "my eyes go first, then my words."' : 'cumulative rather than acute — fatigue is a slope, not a cliff.'}
   • Differentiating: ${r.angle === 'mechanism' ? 'agenda-presence moderated the effect more strongly than attendee count, which contradicts the dominant framing in the literature.' : r.angle === 'intervention' ? 'a single 90-second post-call ritual produced a measurable focus-bump in the next solo block, but only when it was the *only* break.' : 'the texture of fatigue was reliably reported as somatic-first, supporting an underused thread in the field.'}`).join('\n\n')}

Triangulation: quantitative effect sizes converge with qualitative reports for ${rqs.length > 2 ? 'two of three' : 'all'} sub-questions; the divergent case is worth its own discussion paragraph.`;
}

function defaultDiscussion(rqs) {
  return `Three implications follow from the integrated findings.

First, the dominant framing of meeting-fatigue as load-driven holds, but agenda presence emerges as a more tractable lever than attendee count. Practitioners should default to agenda-required calendars before pursuing meeting-shrinking interventions.

Second, the within-subjects ritual evidence is encouraging but fragile. The effect appears only when the ritual is the only break in the sequence, suggesting that *replacing* an unstructured break may not be additive. This is a clean follow-up study.

Third, the somatic-first texture finding is the strongest qualitative signal in the dataset, and the most underdeveloped thread in the existing literature. A body-mapping replication with a larger sample is warranted.

Threats to validity (simulated): novelty effect in the first 1–2 weeks of probe usage; self-report ceiling on focus measures; sampling skewed toward participants willing to install a desktop helper.

Ethical considerations: no participant lost data, no manager saw individual records, all telemetry was opt-in. The compensation structure ($80 + $20/week) appeared adequate; one synthetic participant flagged it as low for a 4-week commitment, which we should note for any real deployment.`;
}

function defaultConclusion(rqs) {
  return `We integrated three lenses — calendar-structural, intervention, and lived-experience — into a single 12-week study answering the main question of how remote workers maintain focus across video-call days.

The contribution is threefold: (1) a calendar-structural account of within-day focus drop-off that emphasizes agenda-presence over attendee count; (2) preliminary evidence that a single 90-second ritual produces a focus bump under specific conditions; (3) a somatic-first vocabulary for video-call fatigue derived from body-mapping with ${rqs.length} sub-question framings held in view.

Future work should replicate the somatic-first finding outside our sample, run a larger ritual trial, and design calendar-tooling experiments around agenda-presence as the primary lever.`;
}

function Evaluation({ chosenDesign, plan, selectedBranches, onBack, onDone, goTo }) {
  const [n, setN] = useState(12);
  const [phase, setPhase] = useState('config'); // 'config' | 'running' | 'done'
  const [progress, setProgress] = useState(0);
  const [personas, setPersonas] = useState([]);
  const [evaluation, setEvaluation] = useState('');
  const [editing, setEditing] = useState(null); // 'eval'

  const run = () => {
    setPhase('running');
    setProgress(0);
    // Optimistic personas from the stock pool so the running view
    // populates instantly, then we replace with LLM-generated when
    // /api/probe/personas resolves.
    const stub = pickPersonas(n);
    setPersonas(stub);
    let p = 0;
    const premise = (selectedBranches[0] && selectedBranches[0].mainRq) || '';
    // Fire both API calls in parallel.
    const personaCall = fetch('/api/probe/personas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ n, premise: premise || (chosenDesign && chosenDesign.summary) || 'this study' }),
    }).then((r) => r.ok ? r.json() : null).catch(() => null);
    const findingsCall = fetch('/api/probe/findings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan: plan ? { phases: plan.phases || [], deliverables: plan.deliverables || [], recruitment: plan.recruitment || '', totalWeeks: plan.totalWeeks || 12, risks: plan.risks || [] } : { phases: [] },
        premise: premise || (chosenDesign && chosenDesign.summary) || 'this study',
      }),
    }).then((r) => r.ok ? r.json() : null).catch(() => null);

    const iv = setInterval(() => {
      p += 0.04 + Math.random() * 0.06;
      if (p >= 1) {
        clearInterval(iv);
        setProgress(1);
        Promise.all([personaCall, findingsCall]).then(([pdata, fdata]) => {
          if (pdata && Array.isArray(pdata.personas) && pdata.personas.length) {
            setPersonas(pdata.personas);
          }
          let evalText = defaultEvaluation(selectedBranches, n);
          if (fdata && Array.isArray(fdata.findings) && fdata.findings.length) {
            const lines = fdata.findings.map((f) => `**${f.id} · ${f.severity}**: ${f.title}\n  trigger — ${f.trigger}\n  evidence — ${f.evidence}\n  fix — ${f.fix}`);
            evalText = `[SIMULATION_REHEARSAL] frictions surfaced from the simulated walkthrough:\n\n${lines.join('\n\n')}\n\n${evalText}`;
          }
          setEvaluation(evalText);
          setPhase('done');
        });
      } else {
        setProgress(p);
      }
    }, 180);
  };

  // Hotkeys
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Escape') { e.preventDefault(); if (editing) setEditing(null); else onBack(); }
      if (e.key === 'Enter' && phase === 'config') { e.preventDefault(); run(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, editing]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Crumb steps={[
        ['probe', palette.amber, 'probe'],
        ['new project', palette.ink2, 'new project'],
        ['brainstorm', palette.ink2, 'brainstorm'],
        ['literature', palette.ink2, 'literature'],
        ['methodology', palette.ink2, 'methodology'],
        ['artifacts', palette.ink2, 'artifacts'],
        ['pre-mortem · simulated', palette.ink],
      ]} onStepClick={goTo}
      right={
        <span style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <span style={{ color: palette.ink3 }}>stage 5 · pre-mortem</span>
          <button onClick={onBack} style={ghostBtnStyle}><kbd style={kbdStyle}>esc</kbd> back</button>
        </span>
      } />

      <div style={{ flex: 1, padding: '28px 32px 80px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <SimulatedBanner />
        <div style={{ color: palette.ink3, fontSize: 11, letterSpacing: '0.14em',
          textTransform: 'uppercase', margin: '14px 0 8px' }}>
          ─── pre-mortem · risks to anticipate before recruitment ───
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 500, margin: 0, color: palette.ink2 }}>
          Probe will simulate composite personas walking through your protocol and surface pre-mortem risks. These are hypothesized failure modes — not findings, not user data.
        </h2>

        {phase === 'config' && (
          <div className="fade-in" style={{
            marginTop: 28, padding: '20px 22px',
            border: `1px solid ${palette.rule}`, background: palette.bg2, borderRadius: 4,
          }}>
            <div style={{ color: palette.amber, fontSize: 11, letterSpacing: '0.14em',
              textTransform: 'uppercase', fontWeight: 600, marginBottom: 14 }}>configure run</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 360 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ color: palette.ink, fontSize: 14 }}>simulated personas (composite, not human)</span>
                  <span style={{ color: palette.amber, fontSize: 22, fontWeight: 600, fontFamily: 'inherit' }}>{n}</span>
                  <span style={{ color: palette.ink3, fontSize: 11.5 }}>· range 6 – 30</span>
                </div>
                <input type="range" min={6} max={30} value={n}
                  onChange={(e) => setN(parseInt(e.target.value, 10))}
                  style={{ width: '100%', marginTop: 14, accentColor: palette.amber }} />
                <div style={{ display: 'flex', justifyContent: 'space-between',
                  color: palette.ink3, fontSize: 10.5, marginTop: 4 }}>
                  <span>6 · narrow</span><span>15 · medium</span><span>30 · broad</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, color: palette.ink3, fontSize: 12 }}>
                <span>est runtime · ~{Math.round(n * 0.4)}s</span>
                <span>est tokens · ~{Math.round(n * 1.8)}k</span>
                <span>est cost · ${(n * 0.06).toFixed(2)}</span>
              </div>
            </div>
            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={run} style={{
                background: palette.amber, color: palette.bg, border: 'none', padding: '7px 16px',
                borderRadius: 3, fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>
                run simulation <kbd style={{ ...kbdStyle, background: 'rgba(0,0,0,0.2)', color: 'rgba(0,0,0,0.7)',
                  borderColor: 'rgba(0,0,0,0.15)', marginLeft: 8 }}>↵</kbd>
              </button>
            </div>
          </div>
        )}

        {phase === 'running' && (
          <>
            {window.ModelStatusLine && (
              <div className="fade-in" style={{ padding: '14px 0 6px' }}>
                <window.ModelStatusLine
                  stage="findings"
                  phase={window.PhaseDots ? (
                    <window.PhaseDots
                      phases={['planning', 'simulating', 'collating', 'reporting']}
                      activeIdx={Math.min(Math.floor(progress * 4), 3)}
                      accent={palette.amber}
                      compact
                    />
                  ) : null}
                  accent={palette.amber}
                  running
                />
              </div>
            )}
            <RunningPanel personas={personas} progress={progress} />
          </>
        )}

        {phase === 'done' && (
          <div className="fade-in" style={{ marginTop: 22 }}>
            <PersonaPool personas={personas} compact />

            <SectionEditable label="pre-mortem · risks (simulated, not findings)" hint="hypothesized failure modes — useful for tightening the protocol; not evidence"
              value={evaluation} setValue={setEvaluation}
              defaultTag="SIMULATION_REHEARSAL"
              isEditing={editing === 'eval'} setEditing={(v) => setEditing(v ? 'eval' : null)} />
          </div>
        )}
      </div>

      {/* footer */}
      <div style={{
        position: 'sticky', bottom: 0, background: palette.bg,
        borderTop: `1px solid ${palette.rule}`,
        padding: '10px 22px', display: 'flex', alignItems: 'center', gap: 14,
        color: palette.ink3, fontSize: 12.5,
      }}>
        <span style={{ color: palette.rose }}>pre-mortem only · not evidence, not findings</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
          {phase === 'done' && (
            <>
              <button onClick={() => setPhase('config')} style={evalIconBtn}>re-run with new N</button>
              <button onClick={onBack} style={evalIconBtn}>revise earlier stages</button>
            </>
          )}
          <button disabled={phase !== 'done'} onClick={() => phase === 'done' && onDone && onDone({ evaluation, personas, n })} style={{
            background: phase !== 'done' ? 'transparent' : palette.amber,
            color: phase !== 'done' ? palette.ink4 : palette.bg,
            border: `1px solid ${phase !== 'done' ? palette.rule : palette.amber}`,
            padding: '5px 14px', borderRadius: 3, fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
            cursor: phase !== 'done' ? 'not-allowed' : 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            continue · discussion + report
            <kbd style={{ ...kbdStyle, background: phase !== 'done' ? palette.bg2 : 'rgba(0,0,0,0.2)',
              color: phase !== 'done' ? palette.ink4 : 'rgba(0,0,0,0.7)',
              borderColor: phase !== 'done' ? palette.rule : 'rgba(0,0,0,0.15)' }}>↵</kbd>
          </button>
        </span>
      </div>
    </div>
  );
}

function SimulatedBanner() {
  return (
    <div style={{
      padding: '8px 12px', border: `1px solid ${palette.rose}`,
      background: 'rgba(226, 110, 110, 0.08)', borderRadius: 3,
      color: palette.rose, fontSize: 11.5, letterSpacing: '0.06em',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ fontWeight: 700 }}>! SIMULATED</span>
      <span style={{ color: palette.ink2 }}>
        These results are produced by AI agents role-playing participants. Use for piloting only · never as evidence in a paper.
      </span>
    </div>
  );
}

function RunningPanel({ personas, progress }) {
  return (
    <div className="fade-in" style={{ marginTop: 22 }}>
      <div style={{
        padding: '14px 16px', background: palette.bg2,
        border: `1px solid ${palette.rule}`, borderRadius: 4,
      }}>
        <div style={{ color: palette.amber, fontSize: 11, letterSpacing: '0.14em',
          textTransform: 'uppercase', fontWeight: 600, marginBottom: 10 }}>
          running · {Math.round(progress * 100)}%
        </div>
        <div style={{ height: 6, background: palette.bg, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            width: `${progress * 100}%`, height: '100%', background: palette.amber,
            transition: 'width 200ms linear',
          }} />
        </div>
        <div style={{
          marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4,
          fontSize: 12, color: palette.ink2,
        }}>
          <PhaseLine done={progress > 0.15}    active={progress <= 0.15} label="spinning up simulated personas (composite, not human)" />
          <PhaseLine done={progress > 0.45}    active={progress > 0.15 && progress <= 0.45} label="walking each through your protocol on paper" />
          <PhaseLine done={progress > 0.75}    active={progress > 0.45 && progress <= 0.75} label="probing for protocol failure modes" />
          <PhaseLine done={progress > 0.9}     active={progress > 0.75 && progress <= 0.9}  label="surfacing capture risks + edge cases" />
          <PhaseLine done={progress >= 1}      active={progress > 0.9}                       label="synthesizing pre-mortem · risks · open questions" />
        </div>
      </div>
      <PersonaPool personas={personas} dim />
    </div>
  );
}

function PhaseLine({ done, active, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8,
      color: done ? palette.moss : active ? palette.amber : palette.ink4 }}>
      <span style={{ width: 14, textAlign: 'center' }}>
        {done ? '✓' : active ? <span className="pulse-dot">●</span> : '○'}
      </span>
      <span style={{ color: done ? palette.ink2 : active ? palette.ink : palette.ink4 }}>{label}</span>
    </div>
  );
}

function PersonaPool({ personas, compact, dim }) {
  return (
    <div style={{ marginTop: compact ? 0 : 14 }}>
      <SectionHeader title={`simulated personas · ${personas.length}`}
        hint="composite character sketches · not human participants" />
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8,
        opacity: dim ? 0.6 : 1,
      }}>
        {personas.map((p, i) => (
          <div key={i} style={{
            padding: '10px 12px', background: palette.bg2,
            border: `1px solid ${palette.rule}`, borderRadius: 3, fontSize: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ color: palette.ink3, fontSize: 10 }}>P{String(i + 1).padStart(2, '0')}</span>
              <span style={{ color: palette.ink, fontWeight: 600 }}>{p.name}</span>
            </div>
            <div style={{ color: palette.amber, fontSize: 11, marginTop: 2 }}>{p.role}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              {/* p.attrs is an array on stock personas but absent on
                  LLM-generated ones (the API returns id/name/role/bias).
                  Guard against undefined so the component doesn't crash
                  the whole React tree when live personas land. */}
              {(p.attrs || []).map((a, j) => (
                <span key={j} style={{ ...chipStyle, fontSize: 10, padding: '1px 6px' }}>{a}</span>
              ))}
            </div>
            <div style={{ color: palette.ink3, fontSize: 11, marginTop: 6, lineHeight: 1.45, fontStyle: 'italic' }}>
              "{p.bias}"
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionEditable({ label, hint, value, setValue, isEditing, setEditing, defaultTag }) {
  const useTagged = !!defaultTag && !!window.TaggedView;
  return (
    <div className="fade-in" style={{ marginTop: 28 }}>
      <SectionHeader title={label} hint={hint} />
      <div style={{
        padding: '14px 16px', background: palette.bg2,
        border: `1px solid ${palette.rule}`, borderLeft: `3px solid ${palette.amber}`,
        borderRadius: 4,
      }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8, gap: 6 }}>
          {isEditing ? (
            <button onClick={() => setEditing(false)} style={evalIconBtn}>done</button>
          ) : (
            <button onClick={() => setEditing(true)} style={evalIconBtn}>edit</button>
          )}
        </div>
        {isEditing ? (
          <textarea value={value} onChange={(e) => setValue(e.target.value)}
            style={{
              width: '100%', minHeight: 200, boxSizing: 'border-box',
              background: palette.bg, color: palette.ink, fontFamily: 'inherit', fontSize: 13,
              border: `1px solid ${palette.rule}`, padding: '10px 12px', borderRadius: 3,
              outline: 'none', resize: 'vertical', lineHeight: 1.6, caretColor: palette.amber,
            }} />
        ) : useTagged ? (
          <window.TaggedView text={value} defaultTag={defaultTag} />
        ) : (
          window.MarkdownText
            ? <window.MarkdownText text={value} />
            : <pre style={{
                margin: 0, color: palette.ink, fontFamily: 'inherit', fontSize: 13,
                lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>{value}</pre>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ title, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, margin: '20px 0 10px' }}>
      <span style={{ color: palette.amber, fontSize: 11, letterSpacing: '0.14em',
        textTransform: 'uppercase', fontWeight: 600 }}>{title}</span>
      {hint && <span style={{ color: palette.ink3, fontSize: 11 }}>· {hint}</span>}
      <span style={{ flex: 1, borderBottom: `1px solid ${palette.rule}`, transform: 'translateY(-4px)' }} />
    </div>
  );
}

function Crumb({ steps, right, onStepClick }) {
  return (
    <div style={{
      padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 12,
      borderBottom: `1px solid ${palette.rule}`, color: palette.ink3, fontSize: 12,
    }}>
      {steps.map((step, i) => {
        const [s, c, key] = step;
        const isLast = i === steps.length - 1;
        const clickable = !isLast && onStepClick;
        return (
          <React.Fragment key={i}>
            <span
              onClick={clickable ? () => onStepClick(key || s) : undefined}
              onMouseEnter={clickable ? (e) => { e.currentTarget.style.textDecoration = 'underline'; } : undefined}
              onMouseLeave={clickable ? (e) => { e.currentTarget.style.textDecoration = 'none'; } : undefined}
              style={{ color: c, cursor: clickable ? 'pointer' : 'default' }}
            >{s}</span>
            {i < steps.length - 1 && <span>›</span>}
          </React.Fragment>
        );
      })}
      <span style={{ marginLeft: 'auto' }}>{right}</span>
    </div>
  );
}

const evalIconBtn = {
  background: 'transparent', border: `1px solid ${palette.rule}`, color: palette.ink2,
  fontFamily: 'inherit', fontSize: 11, padding: '3px 9px', borderRadius: 3, cursor: 'pointer',
};

window.Evaluation = Evaluation;
