// Interactive Dossier prototype — fullscreen, working state.
// Navigates stages with pause/resume, opens artifacts, kills branches,
// toggles provenance badges, opens source-card side panel.

const { useState, useEffect, useRef } = React;

function DossierApp() {
  const [pane, setPane] = useState('home');                 // home | run
  const [stage, setStage] = useState(1);                    // 1..8
  const [running, setRunning] = useState(false);            // auto-advance
  const [paused, setPaused] = useState(true);               // checkpoint paused
  const [openedPane, setOpenedPane] = useState('premise');  // premise | branches | audit | reviewers | guidebook
  const [branchState, setBranchState] = useState({ a: 'live', b: 'live', c: 'live' });
  const [selectedBranch, setSelectedBranch] = useState('b');
  const [sourceOpen, setSourceOpen] = useState(null);
  const [confirmKill, setConfirmKill] = useState(null);
  const [editing, setEditing] = useState(false);
  const [chosenOption, setChosenOption] = useState(1);
  const [groupBy, setGroupBy] = useState('severity');
  const [editedClaim, setEditedClaim] = useState("The ARIA-live disclosure channel is legible to BLV users independent of phrasing.");

  useEffect(() => {
    if (!running || paused) return;
    const t = setTimeout(() => {
      setStage((s) => {
        if (s >= 8) { setRunning(false); setPaused(true); return 8; }
        return s + 1;
      });
    }, 1400);
    return () => clearTimeout(t);
  }, [running, paused, stage]);

  const pipelineStart = () => {
    setPane('run'); setStage(1); setPaused(true); setRunning(true); setOpenedPane('premise');
  };

  const stageNames = window.PROBE_STAGES;

  const headerBar = (
    <div style={{
      padding: '10px 20px', borderBottom: '1px solid var(--rule)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'var(--paper)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <span className="dsr-mono" style={{ fontSize: 13, fontWeight: 500, cursor: 'pointer' }} onClick={() => setPane('home')}>probe</span>
        {pane === 'run' && (
          <>
            <span className="dsr-folio">›</span>
            <span className="dsr-mono" style={{ fontSize: 11.5, color: 'var(--ink-dim)' }}>demo_run</span>
            <span className="dsr-folio">·</span>
            <span className="dsr-uc" style={{ color: 'var(--ink-muted)' }}>stage {stage} of 8</span>
          </>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="dsr-mono" style={{ fontSize: 10.5, color: 'var(--ink-muted)' }}>127.0.0.1:4470</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--moss)' }} className="dsr-mono">
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--moss)' }} /> doctor ok
        </span>
      </div>
    </div>
  );

  if (pane === 'home') {
    return (
      <div className="dsr-root" style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {headerBar}
        <HomeView onBegin={pipelineStart} />
      </div>
    );
  }

  return (
    <div className="dsr-root" style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {headerBar}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: 0 }}>
        <Sidebar
          stage={stage} stageNames={stageNames}
          branchState={branchState} setConfirmKill={setConfirmKill}
          openedPane={openedPane} setOpenedPane={setOpenedPane}
          selectedBranch={selectedBranch} setSelectedBranch={setSelectedBranch}
          running={running} paused={paused}
        />
        <div style={{ overflow: 'auto', background: 'var(--paper)', position: 'relative' }}>
          <MainArea
            openedPane={openedPane} stage={stage} paused={paused}
            chosenOption={chosenOption} setChosenOption={setChosenOption}
            editing={editing} setEditing={setEditing}
            editedClaim={editedClaim} setEditedClaim={setEditedClaim}
            groupBy={groupBy} setGroupBy={setGroupBy}
            selectedBranch={selectedBranch} branchState={branchState}
            setSourceOpen={setSourceOpen}
          />
          {paused && openedPane === 'premise' && stage === 1 && (
            <CheckpointBar onContinue={() => { setPaused(false); setOpenedPane('branches'); }} />
          )}
        </div>
      </div>
      {sourceOpen && <SourcePanel id={sourceOpen} onClose={() => setSourceOpen(null)} />}
      {confirmKill && <KillConfirm branch={confirmKill} onCancel={() => setConfirmKill(null)} onConfirm={() => {
        setBranchState((b) => ({ ...b, [confirmKill]: 'killed' }));
        setConfirmKill(null);
      }} />}
    </div>
  );
}

function HomeView({ onBegin }) {
  const [premise, setPremise] = useState('evaluate an ARIA-live AI-disclosure banner for BLV screen-reader users');
  const [stepMode, setStepMode] = useState(true);
  return (
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 380px', minHeight: 0 }}>
      <div style={{ padding: '72px 80px 48px', borderRight: '1px solid var(--rule)', overflow: 'auto' }}>
        <div className="dsr-uc" style={{ color: 'var(--amber)' }}>A new premise</div>
        <div style={{ fontSize: 38, lineHeight: 1.15, fontWeight: 400, marginTop: 14, letterSpacing: '-0.01em', maxWidth: 680 }}>
          State the study you're considering in one sentence.
        </div>
        <div style={{ fontSize: 15, color: 'var(--ink-dim)', marginTop: 14, lineHeight: 1.55, maxWidth: 540, fontStyle: 'italic' }}>
          Probe will interrogate it, diverge into three programs, rehearse each, and assemble a guidebook for anything that survives. You steer at every stage.
        </div>
        <div style={{ marginTop: 28, border: '1px solid var(--ink-dim)', borderRadius: 3, background: 'var(--paper)', maxWidth: 720 }}>
          <textarea
            value={premise}
            onChange={(e) => setPremise(e.target.value)}
            style={{
              width: '100%', minHeight: 130, padding: '20px 22px',
              background: 'transparent', border: 'none', outline: 'none', resize: 'none',
              fontFamily: 'Newsreader, Georgia, serif', fontSize: 19, lineHeight: 1.45,
              color: 'var(--ink)', fontStyle: 'italic',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 18px', borderTop: '1px solid var(--rule-dim)' }}>
            <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
              <label className="dsr-sans" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-dim)', cursor: 'pointer' }}>
                <input type="checkbox" checked={stepMode} onChange={(e) => setStepMode(e.target.checked)} /> pause at every stage
              </label>
              <label className="dsr-sans" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-dim)', cursor: 'pointer' }}>
                <input type="checkbox" /> replay cache (zero API cost)
              </label>
            </div>
            <button className="dsr-btn primary" onClick={onBegin}>Begin run →</button>
          </div>
        </div>
        <div style={{ marginTop: 36, maxWidth: 720, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ padding: 16, border: '1px solid var(--rule-dim)', borderRadius: 2 }}>
            <div className="dsr-uc" style={{ color: 'var(--ink-muted)' }}>Import draft</div>
            <div style={{ fontSize: 13, color: 'var(--ink-dim)', marginTop: 6, lineHeight: 1.5 }}>
              Drop a PDF or .tex file. Adversarial reviewers will run against it.
            </div>
          </div>
          <div style={{ padding: 16, border: '1px solid var(--rule-dim)', borderRadius: 2 }}>
            <div className="dsr-uc" style={{ color: 'var(--ink-muted)' }}>Replay demo</div>
            <div style={{ fontSize: 13, color: 'var(--ink-dim)', marginTop: 6, lineHeight: 1.5 }}>
              Watch the canonical <span className="dsr-mono" style={{ fontSize: 11.5 }}>demo_run</span> animate from cache. $0.
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding: '32px 28px', background: 'var(--panel)', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div className="dsr-uc" style={{ color: 'var(--ink-muted)' }}>Recent runs</div>
          <div className="dsr-mono" style={{ fontSize: 10.5, color: 'var(--ink-muted)' }}>{window.PROBE_RUNS.length}</div>
        </div>
        <div style={{ marginTop: 14 }}>
          {window.PROBE_RUNS.map((r, i) => (
            <div key={r.id} style={{ padding: '14px 0', borderTop: i === 0 ? 'none' : '1px solid var(--rule-dim)', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                <div className="dsr-mono" style={{ fontSize: 11, color: 'var(--navy)' }}>{r.id}</div>
                <div className="dsr-mono" style={{ fontSize: 10, color: 'var(--ink-muted)' }}>{r.stamp}</div>
              </div>
              <div style={{ fontSize: 13.5, lineHeight: 1.4, marginTop: 5, color: 'var(--ink)', fontStyle: 'italic' }}>
                "{r.premise}"
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8, alignItems: 'center' }}>
                <span className="dsr-mono" style={{ fontSize: 10.5, color: 'var(--ink-muted)' }}>${r.cost.toFixed(2)}</span>
                <span className="dsr-mono" style={{ fontSize: 10.5, color: 'var(--ink-muted)' }}>{r.duration}</span>
                <span style={{
                  fontSize: 10.5, padding: '1px 7px', borderRadius: 2,
                  background: r.verdict === 'all blocked' ? 'oklch(94% 0.04 20)' : 'oklch(94% 0.04 145)',
                  color: r.verdict === 'all blocked' ? 'var(--rose)' : 'var(--moss)',
                }} className="dsr-sans">{r.verdict}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Sidebar({ stage, stageNames, branchState, setConfirmKill, openedPane, setOpenedPane, selectedBranch, setSelectedBranch, running, paused }) {
  return (
    <div style={{ borderRight: '1px solid var(--rule)', background: 'var(--panel)', padding: '20px 16px', overflow: 'auto' }}>
      <div className="dsr-uc" style={{ color: 'var(--ink-muted)' }}>Pipeline</div>
      <div style={{ marginTop: 12 }}>
        {stageNames.map((st) => {
          const done = st.n < stage;
          const cur = st.n === stage;
          return (
            <div key={st.n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '5px 0' }}>
              <div style={{ width: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 5 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: 2,
                  background: done ? 'var(--moss)' : cur ? 'var(--amber)' : 'transparent',
                  border: `1px solid ${done ? 'var(--moss)' : cur ? 'var(--amber)' : 'var(--rule)'}`,
                }}/>
                {st.n < 8 && <div style={{ width: 1, height: 16, background: 'var(--rule-dim)' }}/>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, color: cur ? 'var(--ink)' : done ? 'var(--ink-dim)' : 'var(--ink-muted)', fontWeight: cur ? 500 : 400 }}>
                  <span className="dsr-mono" style={{ fontSize: 10, color: 'var(--ink-muted)', marginRight: 6 }}>0{st.n}</span>
                  {st.name}
                </div>
                {cur && running && !paused && (
                  <div className="dsr-mono" style={{ fontSize: 10, color: 'var(--amber)', marginTop: 2 }}>writing…</div>
                )}
                {cur && paused && (
                  <div className="dsr-mono" style={{ fontSize: 10, color: 'var(--amber)', marginTop: 2 }}>⏸ paused</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="dsr-uc" style={{ color: 'var(--ink-muted)', marginTop: 24 }}>Branches</div>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {window.PROBE_BRANCHES.map((b) => {
          const state = branchState[b.id];
          const sel = selectedBranch === b.id;
          return (
            <div key={b.id} style={{
              padding: '10px 12px', border: `1px solid ${sel ? 'var(--ink-dim)' : 'var(--rule-dim)'}`,
              borderRadius: 2, cursor: 'pointer', background: state === 'killed' ? 'oklch(94% 0.02 85)' : 'var(--paper)',
              opacity: state === 'killed' ? 0.55 : 1,
            }} onClick={() => { setSelectedBranch(b.id); setOpenedPane('branches'); }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6, whiteSpace: 'nowrap' }}>
                <span className="dsr-mono" style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--navy)', whiteSpace: 'nowrap' }}>branch&nbsp;{b.letter}</span>
                {state === 'killed' ? (
                  <span className="dsr-mono" style={{ fontSize: 9.5, color: 'var(--rose)', whiteSpace: 'nowrap' }}>stopped</span>
                ) : (
                  <span className="dsr-mono" style={{ fontSize: 9.5, color: 'var(--ink-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.method}</span>
                )}
              </div>
              <div style={{ fontSize: 12, marginTop: 4, lineHeight: 1.35, color: 'var(--ink-dim)' }}>{b.title}</div>
              {state === 'live' && (
                <button
                  className="dsr-btn"
                  style={{ marginTop: 8, fontSize: 10.5, padding: '3px 8px', width: '100%', color: 'var(--rose)', borderColor: 'oklch(85% 0.04 20)' }}
                  onClick={(e) => { e.stopPropagation(); setConfirmKill(b.id); }}
                >
                  stop branch
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="dsr-uc" style={{ color: 'var(--ink-muted)', marginTop: 24 }}>Views</div>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {[
          { id: 'premise', label: 'Premise card' },
          { id: 'branches', label: 'Branch card' },
          { id: 'audit', label: 'Pattern audit' },
          { id: 'reviewers', label: 'Reviewer panel' },
          { id: 'guidebook', label: 'Guidebook' },
        ].map((v) => (
          <div key={v.id} style={{
            padding: '6px 10px', marginLeft: -10, borderRadius: 2, cursor: 'pointer', fontSize: 13,
            background: openedPane === v.id ? 'var(--paper)' : 'transparent',
            color: openedPane === v.id ? 'var(--ink)' : 'var(--ink-dim)',
            borderLeft: openedPane === v.id ? '2px solid var(--amber)' : '2px solid transparent',
          }} onClick={() => setOpenedPane(v.id)}>
            {v.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function CheckpointBar({ onContinue }) {
  return (
    <div style={{
      position: 'sticky', bottom: 0, left: 0, right: 0,
      borderTop: '1px solid var(--ink-dim)', background: 'oklch(97% 0.04 60)',
      padding: '12px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      boxShadow: '0 -8px 24px -12px rgba(0,0,0,0.08)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span className="dsr-uc" style={{ color: 'var(--amber)' }}>Checkpoint</span>
        <span style={{ fontSize: 13, color: 'var(--ink-dim)', fontStyle: 'italic' }}>
          Run paused after Stage 1. Accept, edit the card, or quit.
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="dsr-btn">Edit card</button>
        <button className="dsr-btn">Quit run</button>
        <button className="dsr-btn primary" onClick={onContinue}>Continue to Stage 2 →</button>
      </div>
    </div>
  );
}

function MainArea(props) {
  const { openedPane } = props;
  if (openedPane === 'premise')   return <PremiseView {...props} />;
  if (openedPane === 'branches')  return <BranchesView {...props} />;
  if (openedPane === 'audit')     return <AuditView {...props} />;
  if (openedPane === 'reviewers') return <ReviewersView {...props} />;
  if (openedPane === 'guidebook') return <GuidebookView {...props} />;
  return null;
}

function PremiseView({ chosenOption, setChosenOption, editing, setEditing, editedClaim, setEditedClaim }) {
  return (
    <div style={{ padding: '36px 56px 120px', maxWidth: 960 }}>
      <div className="dsr-uc" style={{ color: 'var(--ink-muted)' }}>Sharpest question</div>
      <div style={{ fontSize: 26, lineHeight: 1.3, marginTop: 10, letterSpacing: '-0.005em', maxWidth: 760 }}>
        {window.PROBE_SHARPEST_QUESTION}
      </div>
      <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, maxWidth: 760 }}>
        <div>
          <div className="dsr-uc" style={{ color: 'var(--ink-muted)' }}>Nearest template</div>
          <div style={{ marginTop: 6, fontSize: 14.5, lineHeight: 1.5 }}>
            Disclosure-label credibility study, adapted from <em>Jakesch et al. 2023</em>.
          </div>
        </div>
        <div>
          <div className="dsr-uc" style={{ color: 'var(--ink-muted)' }}>Differentia</div>
          <div style={{ marginTop: 6, fontSize: 14.5, lineHeight: 1.5 }}>
            Audio-first disclosure channel via ARIA-live; navigation speed confounds exposure.
          </div>
        </div>
      </div>
      <div style={{ marginTop: 28, maxWidth: 760 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div className="dsr-uc" style={{ color: 'var(--ink-muted)' }}>Claim (agent's reading)</div>
          <button className="dsr-btn" style={{ padding: '3px 10px', fontSize: 11 }} onClick={() => setEditing(!editing)}>
            {editing ? 'Save' : 'Edit'}
          </button>
        </div>
        {editing ? (
          <textarea
            value={editedClaim} onChange={(e) => setEditedClaim(e.target.value)}
            style={{
              width: '100%', marginTop: 8, padding: '12px 14px',
              border: '1px solid var(--ink-dim)', borderRadius: 2, background: 'var(--paper)',
              fontFamily: 'Newsreader, serif', fontSize: 15, lineHeight: 1.55, color: 'var(--ink)',
              resize: 'vertical', minHeight: 70, outline: 'none',
            }}
          />
        ) : (
          <div style={{ marginTop: 8, fontSize: 15, lineHeight: 1.55, color: 'var(--ink)' }}>{editedClaim}</div>
        )}
        <div className="dsr-mono" style={{ fontSize: 10.5, color: 'var(--moss)', marginTop: 6 }}>
          ✓ lint pass · tag: [RESEARCHER_INPUT]
        </div>
      </div>
      <div style={{ marginTop: 36, maxWidth: 820 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div className="dsr-uc" style={{ color: 'var(--ink-muted)' }}>Sharpened options</div>
          <div className="dsr-mono" style={{ fontSize: 10.5, color: 'var(--ink-muted)' }}>click to choose</div>
        </div>
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {window.PROBE_SHARPENED_OPTIONS.map((opt) => {
            const picked = chosenOption === opt.id;
            return (
              <div key={opt.id} className="dsr-card" style={{
                padding: '14px 18px', cursor: 'pointer',
                borderColor: picked ? 'var(--ink-dim)' : 'var(--rule)',
                background: picked ? 'oklch(97% 0.02 85)' : 'var(--paper)',
                boxShadow: picked ? '0 0 0 3px oklch(94% 0.04 60)' : 'none',
              }} onClick={() => setChosenOption(opt.id)}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                    <span className="dsr-mono" style={{ color: 'var(--amber)', fontSize: 11 }}>0{opt.id}</span>
                    <span style={{ fontWeight: 500, fontSize: 14.5 }}>{opt.label}</span>
                  </div>
                  <span className="dsr-pill">axis: {opt.axis}</span>
                </div>
                <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.55, color: 'var(--ink-dim)', fontStyle: 'italic' }}>{opt.text}</div>
                {picked && (
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--amber)', fontWeight: 500 }} className="dsr-sans">✓ chosen</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BranchesView({ selectedBranch, branchState }) {
  return (
    <div style={{ padding: '36px 56px 60px' }}>
      <div className="dsr-uc" style={{ color: 'var(--ink-muted)' }}>Branch divergence</div>
      <div style={{ fontSize: 24, lineHeight: 1.25, marginTop: 8, letterSpacing: '-0.005em' }}>
        Three research programs, differing along method and relationship.
      </div>
      <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {window.PROBE_BRANCHES.map((b) => {
          const state = branchState[b.id];
          const sel = selectedBranch === b.id;
          return (
            <div key={b.id} className="dsr-card" style={{
              padding: 20, borderColor: sel ? 'var(--ink-dim)' : 'var(--rule)',
              opacity: state === 'killed' ? 0.5 : 1,
              background: b.verdict === 'BLOCKED' ? 'oklch(98% 0.015 20)' : b.verdict === 'REVISION_REQUIRED' ? 'oklch(98% 0.02 60)' : 'var(--paper)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="dsr-mono" style={{ fontSize: 13, fontWeight: 500, color: 'var(--navy)' }}>Branch {b.letter}</span>
                <span style={{
                  fontSize: 10.5, padding: '2px 8px', borderRadius: 2,
                  background: b.verdict === 'BLOCKED' ? 'oklch(92% 0.06 20)' : 'oklch(94% 0.05 60)',
                  color: b.verdict === 'BLOCKED' ? 'var(--rose)' : 'var(--amber)',
                }} className="dsr-mono">{b.verdict}</span>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.25, marginTop: 8 }}>{b.title}</h3>
              <div style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-dim)', marginTop: 10, fontStyle: 'italic' }}>{b.question}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
                <span className="dsr-pill">{b.method}</span>
                <span className="dsr-pill">{b.relationship}</span>
              </div>
              {state === 'killed' && (
                <div className="dsr-mono" style={{ fontSize: 10.5, color: 'var(--rose)', marginTop: 12 }}>
                  branch stopped · saved ~$1.40
                </div>
              )}
              {state !== 'killed' && b.verdict !== 'PASSED' && (
                <div style={{ fontSize: 12, color: 'var(--ink-dim)', marginTop: 12, lineHeight: 1.5, paddingTop: 12, borderTop: '1px solid var(--rule-dim)' }}>
                  {b.verdictReason}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AuditView({ groupBy, setGroupBy }) {
  const findingColor = (score) => {
    if (score <= -2) return { bg: 'oklch(94% 0.06 20)',  fg: 'oklch(42% 0.18 20)',  rule: 'oklch(55% 0.18 20)'  };
    if (score === -1) return { bg: 'oklch(96% 0.05 60)',  fg: 'oklch(38% 0.14 60)',  rule: 'oklch(58% 0.15 60)'  };
    if (score === 0)  return { bg: 'oklch(96% 0.02 85)',  fg: 'oklch(42% 0.03 250)', rule: 'oklch(70% 0.02 85)'  };
    return { bg: 'oklch(95% 0.05 145)', fg: 'oklch(32% 0.10 145)', rule: 'oklch(52% 0.10 145)' };
  };
  const findings = [...window.PROBE_AUDIT_FINDINGS].sort((a, b) => {
    if (groupBy === 'severity') return a.score - b.score;
    return a.axis.localeCompare(b.axis);
  });
  return (
    <div style={{ padding: '36px 56px 60px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div className="dsr-uc" style={{ color: 'var(--ink-muted)' }}>Pattern audit · branch B</div>
          <div style={{ fontSize: 24, lineHeight: 1.25, marginTop: 8 }}>Four patterns fired. Fixable before fielding.</div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span className="dsr-uc" style={{ color: 'var(--ink-muted)' }}>Group</span>
          <button className="dsr-btn" style={{
            padding: '4px 10px', fontSize: 11,
            background: groupBy === 'severity' ? 'var(--ink)' : 'var(--paper)',
            color: groupBy === 'severity' ? 'var(--paper)' : 'var(--ink)',
            borderColor: groupBy === 'severity' ? 'var(--ink)' : 'var(--rule)',
          }} onClick={() => setGroupBy('severity')}>severity</button>
          <button className="dsr-btn" style={{
            padding: '4px 10px', fontSize: 11,
            background: groupBy === 'axis' ? 'var(--ink)' : 'var(--paper)',
            color: groupBy === 'axis' ? 'var(--paper)' : 'var(--ink)',
            borderColor: groupBy === 'axis' ? 'var(--ink)' : 'var(--rule)',
          }} onClick={() => setGroupBy('axis')}>axis</button>
        </div>
      </div>
      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 920 }}>
        {findings.map((f, idx) => {
          const c = findingColor(f.score);
          return (
            <div key={f.id} className="dsr-card" style={{
              padding: '18px 22px',
              borderLeft: `3px solid ${c.rule}`,
              opacity: f.fired ? 1 : 0.65,
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                  <span className="dsr-mono" style={{ fontSize: 12.5, fontWeight: 500 }}>{f.pattern_id}</span>
                  <span className="dsr-pill" style={{ fontSize: 10.5 }}>{f.axis}</span>
                  <span className="dsr-mono" style={{ fontSize: 11, padding: '2px 8px', borderRadius: 2, background: c.bg, color: c.fg, fontWeight: 500 }}>
                    score {f.score > 0 ? `+${f.score}` : f.score}
                  </span>
                  {!f.fired && <span className="dsr-pill" style={{ fontSize: 10.5, color: 'var(--moss)' }}>did not fire</span>}
                </div>
                <span className="dsr-folio">#{String(idx + 1).padStart(2, '0')}</span>
              </div>
              <blockquote style={{ margin: '12px 0 0', padding: '8px 14px', borderLeft: '2px solid var(--rule)', fontSize: 14, lineHeight: 1.55, color: 'var(--ink-dim)', fontStyle: 'italic' }}>
                {f.evidence}
                <div className="dsr-mono" style={{ fontStyle: 'normal', fontSize: 10.5, marginTop: 6, color: 'var(--ink-muted)' }}>
                  → {f.evidence_source}
                </div>
              </blockquote>
              <div style={{ fontSize: 14, lineHeight: 1.55, marginTop: 12 }}>{f.rationale}</div>
              {f.suggested_revision && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--panel)', borderRadius: 2, fontSize: 13, lineHeight: 1.5 }}>
                  <span className="dsr-uc" style={{ color: 'var(--ink-muted)', marginRight: 8 }}>Revise</span>
                  {f.suggested_revision}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewersView() {
  const accent = (a) => ({
    navy:  'oklch(40% 0.10 250)',
    teal:  'oklch(45% 0.10 200)',
    amber: 'oklch(50% 0.13 60)',
  }[a]);
  return (
    <div style={{ padding: '36px 56px 60px' }}>
      <div className="dsr-uc" style={{ color: 'var(--ink-muted)' }}>Reviewer panel · branch B</div>
      <div style={{ fontSize: 24, lineHeight: 1.25, marginTop: 8 }}>Three reviewers. They don't agree.</div>
      <div style={{ marginTop: 14, padding: '12px 16px', borderLeft: '2px solid var(--amber)', background: 'oklch(98% 0.02 60)' }}>
        <div className="dsr-uc" style={{ color: 'var(--amber)' }}>Meta-reviewer</div>
        <div style={{ fontSize: 14.5, lineHeight: 1.5, marginTop: 4, fontStyle: 'italic' }}>
          {window.PROBE_META_VERDICT.note}
        </div>
      </div>
      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
        {window.PROBE_REVIEWERS.map((rv) => (
          <div key={rv.id} className="dsr-card" style={{ padding: 20, borderTop: `3px solid ${accent(rv.accent)}` }}>
            <div className="dsr-uc" style={{ color: accent(rv.accent) }}>{rv.name}</div>
            <div style={{ fontSize: 16, lineHeight: 1.4, marginTop: 10, fontWeight: 500 }}>{rv.headline}</div>
            <div className="dsr-mono" style={{ fontSize: 10.5, color: 'var(--ink-muted)', marginTop: 6 }}>verdict: {rv.verdict}</div>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {rv.points.map((p, j) => (
                <div key={j} style={{ display: 'flex', gap: 10 }}>
                  <span className="dsr-mono" style={{ fontSize: 11, color: accent(rv.accent), marginTop: 2 }}>▸</span>
                  <span style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-dim)' }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GuidebookView({ setSourceOpen }) {
  return (
    <div style={{ padding: '44px 64px 60px', maxWidth: 780 }}>
      <div className="dsr-uc" style={{ color: 'var(--amber)' }}>§2 Background</div>
      <h2 style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.2, marginTop: 10, letterSpacing: '-0.01em' }}>
        Prior work on disclosure and the relational model of access
      </h2>
      <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {window.PROBE_GUIDEBOOK_PARAGRAPHS.map((p) => {
          const [key, value] = p.tag.includes(':') ? p.tag.split(':') : [p.tag, null];
          const t = window.PROBE_PROVENANCE_TAGS[key];
          return (
            <p key={p.id} style={{ fontSize: 16.5, lineHeight: 1.62, margin: 0 }}>
              {p.text}{' '}
              <span
                className="dsr-tag"
                style={{ background: t.bg, color: t.fg, cursor: 'pointer' }}
                onClick={() => value && setSourceOpen(value)}
              >
                {key.toLowerCase()}{value ? `:${value}` : ''}
              </span>
            </p>
          );
        })}
      </div>
      <div className="dsr-mono" style={{ marginTop: 28, fontSize: 11, color: 'var(--moss)' }}>
        ✓ lint pass · 21 of 21 rules · 77 tagged elements
      </div>
    </div>
  );
}

function SourcePanel({ id, onClose }) {
  const cards = {
    kafer_2013: {
      title: 'Feminist, Queer, Crip',
      author: 'Alison Kafer',
      year: 2013,
      pub: 'Indiana University Press',
      claim: 'political/relational model of disability',
      quote: '"Disability is not a flaw in the individual but a feature of the arrangement."',
      pages: '3–27',
      used_by: ['§2.1', '§5.3'],
    },
    jakesch_2023: {
      title: 'Co-Writing with Opinionated Language Models',
      author: 'Jakesch et al.',
      year: 2023,
      pub: 'CHI 2023',
      claim: 'AI-authorship disclosure reduces credibility 8–14%',
      quote: '"Disclosure reliably dampens perceived trustworthiness but is moderated by domain expertise."',
      pages: '112:1–112:17',
      used_by: ['§2.2', '§4.3'],
    },
  };
  const c = cards[id] || cards.kafer_2013;
  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
      background: 'var(--panel)', borderLeft: '1px solid var(--rule)',
      padding: '24px 24px', overflow: 'auto',
      boxShadow: '-12px 0 30px -18px rgba(0,0,0,0.2)',
      fontFamily: 'Newsreader, serif', color: 'var(--ink)', zIndex: 50,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div className="dsr-uc" style={{ color: 'var(--ink-muted)' }}>Source card · {id}</div>
        <button className="dsr-btn" style={{ padding: '3px 10px', fontSize: 11 }} onClick={onClose}>close</button>
      </div>
      <div style={{ marginTop: 14, padding: 16, background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 2 }}>
        <div style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.3 }}>{c.title}</div>
        <div style={{ fontSize: 13, color: 'var(--ink-dim)', marginTop: 4, fontStyle: 'italic' }}>{c.author} · {c.year} · {c.pub}</div>
        <div className="dsr-hairline-dim" style={{ margin: '14px 0' }} />
        <div className="dsr-mono" style={{ fontSize: 11, color: 'var(--ink-muted)', lineHeight: 1.7 }}>
          claim: {c.claim}<br />
          pages: {c.pages}<br />
          used_by: {c.used_by.join(', ')}
        </div>
        <div className="dsr-hairline-dim" style={{ margin: '14px 0' }} />
        <div style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--ink-dim)', fontStyle: 'italic' }}>{c.quote}</div>
      </div>
      <button className="dsr-btn" style={{ marginTop: 14, width: '100%' }}>open YAML on disk</button>
    </div>
  );
}

function KillConfirm({ branch, onCancel, onConfirm }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(30, 25, 20, 0.25)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60,
    }} onClick={onCancel}>
      <div className="dsr-root dsr-card" style={{ padding: 24, maxWidth: 420, background: 'var(--paper)', border: '1px solid var(--ink-dim)' }} onClick={(e) => e.stopPropagation()}>
        <div className="dsr-uc" style={{ color: 'var(--rose)' }}>Stop branch {branch.toUpperCase()}</div>
        <div style={{ fontSize: 15, lineHeight: 1.5, marginTop: 10 }}>
          This branch will not proceed past its current stage. Partial artifacts are kept; no further API calls.
        </div>
        <div className="dsr-mono" style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 10 }}>
          est savings: ~$1.40 · reversible via resume
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
          <button className="dsr-btn" onClick={onCancel}>Cancel</button>
          <button className="dsr-btn" style={{ background: 'var(--rose)', color: 'var(--paper)', borderColor: 'var(--rose)' }} onClick={onConfirm}>
            Stop branch
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DossierApp });
