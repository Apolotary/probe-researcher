// Probe Halide · views (home, stage, premise, branch, walkthrough, audit, reviewers, guidebook)

const { useState: hUseState, useEffect: hUseEffect, useRef: hUseRef, useMemo: hUseMemo } = React;

// ─── Home ───
function HalideHomeView({ onBegin }) {
  const [premise, setPremise] = hUseState('evaluate an ARIA-live AI-disclosure banner for BLV screen-reader users');
  const [stepMode, setStepMode] = hUseState(true);
  const [replay, setReplay] = hUseState(false);
  return (
    <div className="hld-scroll" style={{ flex: 1, overflow: 'auto', display: 'grid', gridTemplateColumns: '1fr 360px' }}>
      <div style={{ padding: '60px 64px', maxWidth: 880 }}>
        <div className="hld-uc" style={{ color: 'var(--amber)' }}>A new premise</div>
        <h1 style={{ fontFamily: 'Newsreader, serif', fontSize: 40, fontWeight: 400, lineHeight: 1.1, margin: '10px 0 0', letterSpacing: '-0.015em', color: 'var(--ink)' }}>
          State the study you're considering, in one sentence.
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.6, marginTop: 12, maxWidth: 520 }}>
          Probe will interrogate it, diverge into three programs, rehearse each,
          and assemble a guidebook for anything that survives. You steer at every stage.
        </p>
        <div style={{
          marginTop: 26, border: '1px solid var(--line-2)', borderRadius: 8,
          background: 'var(--bg-1)', maxWidth: 760,
          boxShadow: '0 1px 0 oklch(25% 0.01 255), 0 8px 24px -12px rgba(0,0,0,0.4)',
        }}>
          <textarea
            value={premise} onChange={(e) => setPremise(e.target.value)}
            placeholder="e.g. evaluate an ARIA-live AI-disclosure banner for BLV screen-reader users"
            style={{
              width: '100%', minHeight: 96, padding: '16px 18px',
              background: 'transparent', border: 'none', outline: 'none', resize: 'none',
              fontFamily: 'Newsreader, serif', fontSize: 18, lineHeight: 1.5,
              color: 'var(--ink)', fontStyle: 'italic',
            }}
          />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '8px 10px 8px 16px', borderTop: '1px solid var(--line)',
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-3)', cursor: 'pointer' }}>
              <input type="checkbox" checked={stepMode} onChange={(e) => setStepMode(e.target.checked)} style={{ accentColor: 'oklch(78% 0.14 72)' }} />
              Pause at every stage
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-3)', cursor: 'pointer' }}>
              <input type="checkbox" checked={replay} onChange={(e) => setReplay(e.target.checked)} style={{ accentColor: 'oklch(78% 0.14 72)' }} />
              Replay cache · $0
            </label>
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
              <span className="hld-mono" style={{ fontSize: 10.5, color: 'var(--ink-4)', whiteSpace: 'nowrap' }}>est · 25m · ~$5</span>
              <button className="hld-btn hld-btn-primary" onClick={onBegin}>
                Begin run <span className="hld-kbd" style={{ background: 'oklch(80% 0.02 255)', border: '1px solid oklch(70% 0.02 255)', color: 'var(--bg)' }}>↵</span>
              </button>
            </span>
          </div>
        </div>

        <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 760 }}>
          <div style={{ padding: '14px 16px', background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 8, cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <HIcon k="file" size={13} color="var(--ink-3)" />
              <span style={{ fontSize: 12.5, fontWeight: 500 }}>Import draft</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5, marginTop: 6 }}>
              Drop a PDF or .tex file. Adversarial reviewers run against it; no generation step.
            </div>
          </div>
          <div style={{ padding: '14px 16px', background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 8, cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <HIcon k="flash" size={13} color="var(--amber)" />
              <span style={{ fontSize: 12.5, fontWeight: 500 }}>Replay demo_run</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5, marginTop: 6 }}>
              Watch the canonical run animate from cache. Deterministic. Zero API cost.
            </div>
          </div>
        </div>
      </div>

      <div style={{ borderLeft: '1px solid var(--line)', background: 'var(--bg-1)', padding: '20px 20px', overflow: 'auto' }} className="hld-scroll">
        <div className="hld-uc">Recent runs</div>
        <div style={{ marginTop: 10 }}>
          {window.PROBE_RUNS.map((r, i) => (
            <div key={r.id} style={{
              padding: '12px 12px', margin: '0 -12px',
              borderBottom: i === window.PROBE_RUNS.length - 1 ? 'none' : '1px solid var(--line)',
              borderRadius: 6, cursor: 'pointer',
            }} className="hld-row">
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                <span className="hld-mono" style={{ fontSize: 11, color: 'var(--blue)', whiteSpace: 'nowrap' }}>{r.id}</span>
                <span className="hld-mono" style={{ fontSize: 10, color: 'var(--ink-4)', whiteSpace: 'nowrap' }}>{r.stamp}</span>
              </div>
              <div style={{ fontFamily: 'Newsreader, serif', fontSize: 13.5, lineHeight: 1.4, marginTop: 6, color: 'var(--ink-2)', fontStyle: 'italic' }}>
                "{r.premise}"
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="hld-mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>${r.cost.toFixed(2)}</span>
                <span className="hld-mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>{r.duration}</span>
                <span className="hld-chip-solid" style={{
                  background: r.verdict === 'all blocked' ? 'oklch(25% 0.06 20)' : 'oklch(25% 0.06 155)',
                  color: r.verdict === 'all blocked' ? 'var(--rose)' : 'var(--moss)',
                  whiteSpace: 'nowrap',
                }}>{r.verdict}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Stage / Walkthrough: streaming walkthrough that types live ───
function HalideWalkthrough() {
  const lines = [
    ['0.0s',  'persona: Marcus, 34, daily JAWS user at 320 wpm, H-key primary'],
    ['0.0s',  'page loads — JAWS announces article title'],
    ['1.3s',  'H pressed → jumps to H2 §1 "The city council…"'],
    ['2.4s',  'H pressed → jumps to H2 §2 "Budget shortfall…"'],
    ['3.6s',  'H pressed → jumps to H2 §3 "Outlook for FY26…"'],
    ['3.9s',  '↳ finding: late-banner condition misses — article fully navigated before t=4.0s'],
    ['4.1s',  'ARIA-live dispatch: "This article was written with assistance from an AI model" (6.0s)'],
    ['10.1s', 'Marcus is already reading §3 body; announcement interrupts reading'],
    ['—',     '↳ emit finding: announcement_duration_confound · severity: major'],
  ];
  const [n, setN] = hUseState(0);
  const [sub, setSub] = hUseState(0);
  hUseEffect(() => {
    if (n >= lines.length) return;
    const currentLine = lines[n][1];
    if (sub >= currentLine.length) {
      const t = setTimeout(() => { setN(n + 1); setSub(0); }, 320);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setSub(sub + 1), 14);
    return () => clearTimeout(t);
  }, [n, sub]);

  return (
    <div style={{ padding: '24px 40px 60px', maxWidth: 960 }}>
      <div className="hld-uc" style={{ color: 'var(--amber)' }}>Stage 5 · Simulated walkthrough · Branch B</div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 6 }}>
        <h2 style={{ fontFamily: 'Newsreader, serif', fontSize: 26, fontWeight: 400, margin: 0, letterSpacing: '-0.01em' }}>
          Rehearsing the Wizard-of-Oz protocol
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="hld-chip"><span className="hld-dot hld-pulse" style={{ background: 'var(--amber)' }}/> writing</span>
          <button className="hld-btn hld-btn-ghost"><HIcon k="pause" size={11} /> pause</button>
        </div>
      </div>

      <div style={{
        marginTop: 20, borderRadius: 8, overflow: 'hidden',
        border: '1px solid var(--line)', background: 'var(--bg-1)',
      }}>
        <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-2)' }}>
          <HIcon k="flask" size={12} color="var(--ink-3)" />
          <span className="hld-mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>walkthrough/marcus.ndjson</span>
          <span className="hld-mono" style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--ink-4)' }}>n=12 persona lines · {n + 1}/{lines.length}</span>
        </div>
        <div className="hld-mono" style={{ padding: '14px 18px', fontSize: 12, lineHeight: 1.75 }}>
          {lines.slice(0, n).map(([t, l], i) => (
            <div key={i} style={{ display: 'flex', gap: 12, opacity: i < n - 6 ? 0.5 : 1 }}>
              <span style={{ color: 'var(--blue)', width: 46 }}>{t}</span>
              <span style={{ color: l.startsWith('↳') ? 'var(--amber)' : l.startsWith('persona') ? 'var(--ink-4)' : 'var(--ink-2)', fontStyle: l.startsWith('persona') ? 'italic' : 'normal' }}>
                {l}
              </span>
            </div>
          ))}
          {n < lines.length && (
            <div style={{ display: 'flex', gap: 12 }} className="hld-fade-in">
              <span style={{ color: 'var(--blue)', width: 46 }}>{lines[n][0]}</span>
              <span style={{ color: lines[n][1].startsWith('↳') ? 'var(--amber)' : lines[n][1].startsWith('persona') ? 'var(--ink-4)' : 'var(--ink-2)', fontStyle: lines[n][1].startsWith('persona') ? 'italic' : 'normal' }}>
                {lines[n][1].slice(0, sub)}<span className="hld-caret" />
              </span>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ padding: 14, background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 8 }}>
          <div className="hld-uc">Emitted findings · so far</div>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
              <span className="hld-dot" style={{ background: 'var(--amber)' }}/>
              <span style={{ fontSize: 12.5 }}>announcement_duration_confound</span>
              <span className="hld-chip-solid" style={{ marginLeft: 'auto', background: 'var(--amber-s)', color: 'var(--amber)' }}>−1</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
              <span className="hld-dot" style={{ background: 'var(--amber)' }}/>
              <span style={{ fontSize: 12.5 }}>navigation_speed_floor</span>
              <span className="hld-chip-solid" style={{ marginLeft: 'auto', background: 'var(--amber-s)', color: 'var(--amber)' }}>−1</span>
            </div>
          </div>
        </div>
        <div style={{ padding: 14, background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 8 }}>
          <div className="hld-uc">Coverage</div>
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.55 }}>
            3 personas queued: fast H-key (done), slow arrow, refreshable braille.<br />
            <span style={{ color: 'var(--ink-4)' }}>auto-continues after final persona.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Premise (checkpoint) ───
function HalidePremise({ onAccept, chosen, setChosen }) {
  return (
    <div className="hld-scroll" style={{ flex: 1, overflow: 'auto', padding: '28px 40px 120px', maxWidth: 960 }}>
      <div className="hld-uc" style={{ color: 'var(--amber)' }}>Stage 1 · Premise card · paused</div>
      <h2 style={{ fontFamily: 'Newsreader, serif', fontSize: 26, fontWeight: 400, lineHeight: 1.25, margin: '8px 0 0', letterSpacing: '-0.01em' }}>
        {window.PROBE_SHARPEST_QUESTION}
      </h2>
      <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Tile title="Nearest template" body={<>Disclosure-label credibility study, adapted from <em>Jakesch et al. 2023</em>.</>} />
        <Tile title="Differentia" body="Audio-first disclosure channel via ARIA-live; navigation speed confounds exposure." />
      </div>

      <div className="hld-uc" style={{ marginTop: 24 }}>Sharpened options · click to choose</div>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {window.PROBE_SHARPENED_OPTIONS.map((opt) => {
          const picked = chosen === opt.id;
          return (
            <div key={opt.id} onClick={() => setChosen(opt.id)} style={{
              padding: 14, borderRadius: 8,
              background: picked ? 'oklch(22% 0.05 72)' : 'var(--bg-1)',
              border: `1px solid ${picked ? 'var(--amber)' : 'var(--line)'}`,
              cursor: 'pointer', transition: 'background 140ms, border-color 140ms',
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span className="hld-mono" style={{ color: picked ? 'var(--amber)' : 'var(--ink-4)', fontSize: 11 }}>0{opt.id}</span>
                  <span style={{ fontWeight: 500, fontSize: 13.5 }}>{opt.label}</span>
                </div>
                <span className="hld-chip">axis · {opt.axis}</span>
              </div>
              <div style={{ fontFamily: 'Newsreader, serif', fontSize: 14, lineHeight: 1.55, color: 'var(--ink-2)', marginTop: 6, fontStyle: 'italic' }}>
                {opt.text}
              </div>
              {picked && (
                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <HIcon k="check" size={11} /> chosen · will rewrite premise_card.claim
                </div>
              )}
            </div>
          );
        })}
      </div>

      <CheckpointBarHalide onContinue={onAccept} />
    </div>
  );
}

function Tile({ title, body }) {
  return (
    <div style={{ padding: 14, background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 8 }}>
      <div className="hld-uc">{title}</div>
      <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55, marginTop: 6 }}>{body}</div>
    </div>
  );
}

function CheckpointBarHalide({ onContinue }) {
  return (
    <div style={{
      position: 'sticky', bottom: 0, marginTop: 32, marginLeft: -40, marginRight: -40,
      padding: '12px 40px', display: 'flex', alignItems: 'center', gap: 12,
      background: 'linear-gradient(oklch(22% 0.05 72 / 0), oklch(22% 0.05 72 / 0.18))',
      borderTop: '1px solid var(--amber-s)',
      backdropFilter: 'blur(10px)',
    }}>
      <span className="hld-dot hld-pulse" style={{ background: 'var(--amber)' }}/>
      <span className="hld-uc" style={{ color: 'var(--amber)' }}>Checkpoint</span>
      <span style={{ fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-2)' }}>
        Run paused after Stage 1. Accept, edit, or quit.
      </span>
      <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
        <button className="hld-btn">Edit JSON <span className="hld-kbd">E</span></button>
        <button className="hld-btn">Quit <span className="hld-kbd">Q</span></button>
        <button className="hld-btn hld-btn-primary" onClick={onContinue}>
          Continue to Stage 2 <span className="hld-kbd" style={{ background: 'oklch(80% 0.02 255)', color: 'var(--bg)', border: '1px solid oklch(70% 0.02 255)' }}>↵</span>
        </button>
      </span>
    </div>
  );
}

// ─── Branch detail ───
function HalideBranch({ id, branches, killBranch }) {
  const b = window.PROBE_BRANCHES.find((x) => x.id === id);
  if (!b) return null;
  const state = branches[id];
  const killed = state === 'killed';
  const verdictColor = b.verdict === 'BLOCKED' ? 'var(--rose)' : b.verdict === 'REVISION_REQUIRED' ? 'var(--amber)' : 'var(--moss)';
  const verdictBg = b.verdict === 'BLOCKED' ? 'var(--rose-s)' : b.verdict === 'REVISION_REQUIRED' ? 'var(--amber-s)' : 'var(--moss-s)';
  return (
    <div className="hld-scroll" style={{ flex: 1, overflow: 'auto', padding: '24px 40px 60px', maxWidth: 960, opacity: killed ? 0.55 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="hld-dot" style={{ background: verdictColor, width: 8, height: 8 }} />
        <span className="hld-uc">Branch {b.letter} · {b.method}</span>
        <span className="hld-chip-solid" style={{ background: verdictBg, color: verdictColor }}>{b.verdict}</span>
        {killed && <span className="hld-chip-solid" style={{ background: 'var(--bg-3)', color: 'var(--ink-4)' }}>STOPPED</span>}
      </div>
      <h2 style={{ fontFamily: 'Newsreader, serif', fontSize: 30, fontWeight: 400, margin: '10px 0 0', letterSpacing: '-0.01em', lineHeight: 1.2 }}>{b.title}</h2>
      <div style={{ fontFamily: 'Newsreader, serif', fontSize: 16, lineHeight: 1.55, color: 'var(--ink-2)', marginTop: 14, fontStyle: 'italic', maxWidth: 700 }}>
        {b.question}
      </div>

      <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <span className="hld-chip">method · {b.method}</span>
        <span className="hld-chip">relationship · {b.relationship}</span>
        <span className="hld-chip">n = 12 BLV users</span>
        <span className="hld-chip">within-subjects</span>
      </div>

      <div style={{ marginTop: 20, padding: 16, background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 8 }}>
        <div className="hld-uc">Verdict rationale</div>
        <div style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-2)', marginTop: 8 }}>{b.verdictReason}</div>
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <button className="hld-btn">Open prototype_spec.md</button>
        <button className="hld-btn">Run deep audit · $1.20</button>
        {!killed && (
          <button className="hld-btn hld-btn-ghost hld-btn-danger" style={{ marginLeft: 'auto' }} onClick={() => killBranch(id)}>
            <HIcon k="stop" size={11} /> Stop branch
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Audit ───
function HalideAudit() {
  const [groupBy, setGroupBy] = hUseState('severity');
  const [selected, setSelected] = hUseState(null);
  const color = (s) => s <= -2 ? ['var(--rose-s)', 'var(--rose)'] : s === -1 ? ['var(--amber-s)', 'var(--amber)'] : s === 0 ? ['var(--bg-3)', 'var(--ink-3)'] : ['var(--moss-s)', 'var(--moss)'];
  const findings = [...window.PROBE_AUDIT_FINDINGS].sort((a, b) => groupBy === 'severity' ? a.score - b.score : a.axis.localeCompare(b.axis));

  const axes = [
    { name: 'Legibility',  score: -1, fired: 3 },
    { name: 'Capture',     score: -1, fired: 1 },
    { name: 'Novelty',     score:  0, fired: 0 },
    { name: 'Feasibility', score:  1, fired: 0 },
  ];

  return (
    <div className="hld-scroll" style={{ flex: 1, overflow: 'auto', padding: '24px 40px 60px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div className="hld-uc" style={{ color: 'var(--amber)' }}>Stage 6 · Pattern audit · Branch B</div>
          <h2 style={{ fontFamily: 'Newsreader, serif', fontSize: 26, fontWeight: 400, margin: '8px 0 0', letterSpacing: '-0.01em' }}>
            Four patterns fired. No −2 blocker — fixable before fielding.
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-2)', padding: 3, borderRadius: 6 }}>
          {['severity', 'axis'].map((g) => (
            <button key={g} onClick={() => setGroupBy(g)} style={{
              height: 24, padding: '0 10px', borderRadius: 4, border: 'none', cursor: 'pointer',
              background: groupBy === g ? 'var(--bg-hv)' : 'transparent',
              color: groupBy === g ? 'var(--ink)' : 'var(--ink-3)',
              fontSize: 11.5, fontWeight: 500, textTransform: 'capitalize', fontFamily: 'inherit',
            }}>{g}</button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {axes.map((ax) => {
          const [bg, fg] = color(ax.score);
          return (
            <div key={ax.name} style={{ padding: '10px 12px', background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="hld-uc">{ax.name}</span>
                <span className="hld-chip-solid" style={{ background: bg, color: fg }}>{ax.score > 0 ? `+${ax.score}` : ax.score}</span>
              </div>
              <div style={{ display: 'flex', gap: 2, marginTop: 8 }}>
                {[-2, -1, 0, 1, 2].map((s) => (
                  <div key={s} style={{
                    flex: 1, height: 4, borderRadius: 1,
                    background: s === ax.score ? color(s)[1] : 'var(--bg-3)',
                  }} />
                ))}
              </div>
              <div className="hld-mono" style={{ fontSize: 10.5, color: 'var(--ink-4)', marginTop: 8 }}>{ax.fired} fired</div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {findings.map((f, i) => {
            const [bg, fg] = color(f.score);
            const open = selected === f.id;
            return (
              <div key={f.id} onClick={() => setSelected(open ? null : f.id)} style={{
                padding: '14px 16px', background: 'var(--bg-1)',
                border: `1px solid ${open ? 'var(--line-2)' : 'var(--line)'}`,
                borderLeft: `3px solid ${fg}`, borderRadius: 6,
                cursor: 'pointer', opacity: f.fired ? 1 : 0.6,
              }} className="hld-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className="hld-chip-solid" style={{ background: bg, color: fg }}>{f.score > 0 ? `+${f.score}` : f.score}</span>
                  <span className="hld-mono" style={{ fontSize: 12, color: 'var(--ink)' }}>{f.pattern_id}</span>
                  <span className="hld-chip">{f.axis}</span>
                  {!f.fired && <span className="hld-chip" style={{ color: 'var(--moss)' }}>did not fire</span>}
                  <span className="hld-mono" style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--ink-4)' }}>#{String(i + 1).padStart(2, '0')}</span>
                </div>
                <div style={{ fontFamily: 'Newsreader, serif', fontSize: 14, lineHeight: 1.5, color: 'var(--ink-2)', marginTop: 10, fontStyle: 'italic', paddingLeft: 10, borderLeft: '2px solid var(--line)' }}>
                  {f.evidence}
                </div>
                <div style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--ink-2)', marginTop: 10 }}>{f.rationale}</div>
              </div>
            );
          })}
        </div>
        {selected && (
          <div className="hld-fade-in" style={{ padding: 16, background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 8, height: 'fit-content', position: 'sticky', top: 10 }}>
            <div className="hld-uc">Suggested revision</div>
            <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-2)', marginTop: 8 }}>
              {findings.find((f) => f.id === selected)?.suggested_revision}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
              <button className="hld-btn">Open evidence</button>
              <button className="hld-btn hld-btn-amber">Apply to spec</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Reviewers ───
function HalideReviewers() {
  const accent = (a) => ({ navy: 'var(--blue)', teal: 'var(--teal)', amber: 'var(--amber)' }[a]);
  return (
    <div className="hld-scroll" style={{ flex: 1, overflow: 'auto', padding: '24px 40px 60px' }}>
      <div className="hld-uc" style={{ color: 'var(--amber)' }}>Stage 7 · Reviewer panel · Branch B</div>
      <h2 style={{ fontFamily: 'Newsreader, serif', fontSize: 26, fontWeight: 400, margin: '8px 0 0', letterSpacing: '-0.01em' }}>
        Three reviewers. They don't agree.
      </h2>

      <div style={{ marginTop: 16, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'center',
        background: 'oklch(22% 0.05 72)', border: '1px solid var(--amber-s)', borderRadius: 8 }}>
        <span className="hld-chip-solid" style={{ background: 'var(--amber-s)', color: 'var(--amber)' }}>META</span>
        <span className="hld-mono" style={{ fontSize: 11, color: 'var(--amber)' }}>{window.PROBE_META_VERDICT.classification}</span>
        <span style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--ink-2)' }}>{window.PROBE_META_VERDICT.note}</span>
      </div>

      <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {window.PROBE_REVIEWERS.map((rv) => (
          <div key={rv.id} style={{
            padding: 18, background: 'var(--bg-1)', border: '1px solid var(--line)',
            borderTop: `3px solid ${accent(rv.accent)}`, borderRadius: '0 0 8px 8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 22, height: 22, borderRadius: 4, background: accent(rv.accent),
                color: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 600,
              }}>
                {rv.name[0]}
              </div>
              <span className="hld-uc" style={{ color: accent(rv.accent) }}>{rv.name}</span>
            </div>
            <div style={{ fontFamily: 'Newsreader, serif', fontSize: 15.5, lineHeight: 1.35, marginTop: 12, fontWeight: 500 }}>{rv.headline}</div>
            <div className="hld-mono" style={{ fontSize: 10.5, color: 'var(--ink-4)', marginTop: 6 }}>verdict · <span style={{ color: 'var(--amber)' }}>{rv.verdict}</span></div>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {rv.points.map((p, j) => (
                <div key={j} style={{ display: 'flex', gap: 8 }}>
                  <span className="hld-mono" style={{ color: accent(rv.accent), fontSize: 11 }}>▸</span>
                  <span style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--ink-2)' }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Guidebook ───
function HalideGuidebook({ setSourceOpen }) {
  return (
    <div className="hld-scroll" style={{ flex: 1, overflow: 'auto', padding: '36px 56px 60px', maxWidth: 820 }}>
      <div className="hld-uc" style={{ color: 'var(--amber)' }}>§2 Background</div>
      <h2 style={{ fontFamily: 'Newsreader, serif', fontSize: 32, fontWeight: 400, margin: '10px 0 0', letterSpacing: '-0.015em', lineHeight: 1.2 }}>
        Prior work on disclosure and the relational model of access
      </h2>
      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {window.PROBE_GUIDEBOOK_PARAGRAPHS.map((p) => {
          const [key, value] = p.tag.includes(':') ? p.tag.split(':') : [p.tag, null];
          const t = window.PROBE_PROVENANCE_TAGS[key];
          const darkenBg = (bg) => {
            const map = {
              '#eef4ff': 'oklch(28% 0.05 255)',
              '#e6f0ff': 'oklch(28% 0.06 250)',
              '#fff4e0': 'oklch(30% 0.06 72)',
              '#f3e8ff': 'oklch(28% 0.06 295)',
              '#fef0f0': 'oklch(28% 0.06 20)',
              '#fff0f0': 'oklch(28% 0.06 20)',
              '#3a1a1a': 'oklch(26% 0.08 20)',
              '#e5f6ea': 'oklch(28% 0.06 155)',
              '#f0eeea': 'oklch(28% 0.01 85)',
            };
            return map[bg] || 'var(--bg-2)';
          };
          const darkenFg = (fg) => {
            const map = {
              '#1e3a8a': 'var(--blue)', '#0f2f6b': 'var(--blue)',
              '#8a4b00': 'var(--amber)',
              '#5b21b6': 'var(--purple)',
              '#8a1a1a': 'var(--rose)', '#9a1f1f': 'var(--rose)', '#ffd4d4': 'var(--rose)',
              '#0f5a1f': 'var(--moss)',
              '#4a3f2a': 'var(--ink-2)',
            };
            return map[fg] || 'var(--ink-2)';
          };
          return (
            <p key={p.id} style={{
              fontFamily: 'Newsreader, serif', fontSize: 17, lineHeight: 1.65, margin: 0, color: 'var(--ink)',
            }}>
              {p.text}{' '}
              <span
                className="hld-chip-solid"
                style={{
                  background: darkenBg(t.bg), color: darkenFg(t.fg),
                  cursor: 'pointer', verticalAlign: '2px', border: '1px solid oklch(40% 0.03 255 / 0.4)',
                }}
                onClick={() => value && setSourceOpen(value)}
              >
                {key.toLowerCase()}{value ? `:${value}` : ''}
              </span>
            </p>
          );
        })}
      </div>
      <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--moss)' }} className="hld-mono">
        <HIcon k="check" size={12} color="var(--moss)" />
        lint pass · 21 of 21 rules · 77 tagged elements · no HUMAN_REQUIRED unresolved in §2
      </div>
    </div>
  );
}

// ─── Source panel ───
function HalideSourcePanel({ id, onClose }) {
  const cards = {
    kafer_2013: { title: 'Feminist, Queer, Crip', author: 'Alison Kafer', year: 2013, pub: 'Indiana University Press', claim: 'political/relational model of disability', quote: '"Disability is not a flaw in the individual but a feature of the arrangement."', pages: '3–27', used_by: ['§2.1', '§5.3'] },
    jakesch_2023: { title: 'Co-Writing with Opinionated Language Models', author: 'Jakesch et al.', year: 2023, pub: 'CHI 2023', claim: 'AI-authorship disclosure reduces credibility 8–14%', quote: '"Disclosure reliably dampens perceived trustworthiness but is moderated by domain expertise."', pages: '112:1–112:17', used_by: ['§2.2', '§4.3'] },
  };
  const c = cards[id] || cards.kafer_2013;
  return (
    <div className="hld-fade-in" style={{
      position: 'absolute', top: 0, right: 0, bottom: 0, width: 400, zIndex: 50,
      background: 'var(--bg-1)', borderLeft: '1px solid var(--line-2)',
      padding: 20, overflow: 'auto', boxShadow: '-20px 0 40px -20px rgba(0,0,0,0.5)',
    }} className="hld-scroll">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="hld-chip-solid" style={{ background: 'oklch(28% 0.06 250)', color: 'var(--blue)' }}>SOURCE_CARD</span>
          <span className="hld-mono" style={{ fontSize: 11.5, color: 'var(--ink-2)' }}>{id}</span>
        </div>
        <button className="hld-btn hld-btn-ghost" onClick={onClose} style={{ width: 24, padding: 0, justifyContent: 'center' }}>
          <HIcon k="close" size={11} />
        </button>
      </div>
      <div style={{ marginTop: 14, padding: 16, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8 }}>
        <div style={{ fontFamily: 'Newsreader, serif', fontSize: 20, fontWeight: 500, lineHeight: 1.25, letterSpacing: '-0.005em' }}>{c.title}</div>
        <div style={{ fontFamily: 'Newsreader, serif', fontSize: 13, color: 'var(--ink-3)', marginTop: 4, fontStyle: 'italic' }}>{c.author} · {c.year} · {c.pub}</div>
        <div style={{ height: 1, background: 'var(--line)', margin: '14px 0' }} />
        <div className="hld-mono" style={{ fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.8 }}>
          <div><span style={{ color: 'var(--ink-4)' }}>claim:</span> {c.claim}</div>
          <div><span style={{ color: 'var(--ink-4)' }}>pages:</span> {c.pages}</div>
          <div><span style={{ color: 'var(--ink-4)' }}>used_by:</span> {c.used_by.join(', ')}</div>
        </div>
        <div style={{ height: 1, background: 'var(--line)', margin: '14px 0' }} />
        <div style={{ fontFamily: 'Newsreader, serif', fontSize: 14, lineHeight: 1.55, color: 'var(--ink-2)', fontStyle: 'italic' }}>{c.quote}</div>
      </div>
      <button className="hld-btn" style={{ marginTop: 12, width: '100%' }}><HIcon k="ext" size={11} /> open YAML on disk</button>
    </div>
  );
}

// ─── Command palette ───
function HalideCmdK({ open, onClose, setRoute }) {
  const [q, setQ] = hUseState('');
  hUseEffect(() => { if (open) setQ(''); }, [open]);
  if (!open) return null;
  const items = [
    { label: 'Go to home', kind: 'nav', route: { kind: 'home' }, icon: 'home' },
    { label: 'Premise card', kind: 'nav', route: { kind: 'premise' }, icon: 'file' },
    { label: 'Walkthrough · Branch B · streaming', kind: 'nav', route: { kind: 'walkthrough' }, icon: 'flask' },
    { label: 'Pattern audit · Branch B', kind: 'nav', route: { kind: 'audit' }, icon: 'file' },
    { label: 'Reviewer panel · Branch B', kind: 'nav', route: { kind: 'reviewers' }, icon: 'chat' },
    { label: 'Guidebook', kind: 'nav', route: { kind: 'guidebook' }, icon: 'book' },
    { label: 'Run deep audit on branch B · $1.20', kind: 'act', icon: 'flash' },
    { label: 'Stop branch C', kind: 'act', icon: 'stop' },
    { label: 'Render report · PDF', kind: 'act', icon: 'ext' },
  ].filter((it) => it.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'oklch(10% 0.01 255 / 0.55)', backdropFilter: 'blur(4px)',
      zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 120,
    }}>
      <div className="hld hld-fade-in" onClick={(e) => e.stopPropagation()} style={{
        width: 560, background: 'var(--bg-1)', border: '1px solid var(--line-2)', borderRadius: 10,
        boxShadow: '0 20px 60px -10px rgba(0,0,0,0.6)', overflow: 'hidden',
      }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <HIcon k="search" size={14} color="var(--ink-3)" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search artifacts, branches, commands…"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--ink)', fontSize: 14, fontFamily: 'inherit' }} />
          <span className="hld-kbd">esc</span>
        </div>
        <div style={{ maxHeight: 320, overflow: 'auto', padding: 6 }}>
          {items.map((it, i) => (
            <div key={i} className="hld-row" onClick={() => {
              if (it.route) setRoute(it.route);
              onClose();
            }} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 5,
              fontSize: 13, color: 'var(--ink-2)', cursor: 'pointer',
            }}>
              <HIcon k={it.icon} size={13} color={it.kind === 'act' ? 'var(--amber)' : 'var(--ink-3)'} />
              <span>{it.label}</span>
              <span className="hld-chip-solid" style={{ marginLeft: 'auto', background: 'var(--bg-3)', color: 'var(--ink-4)' }}>
                {it.kind}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  HalideHomeView, HalidePremise, HalideBranch, HalideWalkthrough,
  HalideAudit, HalideReviewers, HalideGuidebook,
  HalideSourcePanel, HalideCmdK,
});
