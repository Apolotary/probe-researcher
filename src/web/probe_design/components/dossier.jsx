// Direction A — "Dossier"
// Editorial / academic. Newsreader serif, JetBrains Mono for tags and
// monospace artifacts. Warm ivory paper, navy ink, amber rules.
// The researcher's bound journal.

const dossierCSS = `
.dsr-root {
  --paper: oklch(98.5% 0.012 85);
  --paper-shadow: oklch(94% 0.02 85);
  --ink: oklch(22% 0.04 250);
  --ink-dim: oklch(42% 0.03 250);
  --ink-muted: oklch(58% 0.02 250);
  --rule: oklch(78% 0.02 85);
  --rule-dim: oklch(88% 0.015 85);
  --amber: oklch(58% 0.15 60);
  --rose:  oklch(52% 0.15 20);
  --moss:  oklch(48% 0.10 145);
  --navy:  oklch(32% 0.08 250);
  --panel: oklch(96% 0.012 85);
  font-family: 'Newsreader', 'Source Serif Pro', Georgia, serif;
  color: var(--ink);
  background: var(--paper);
  font-feature-settings: 'onum', 'liga';
}
.dsr-root * { box-sizing: border-box; }
.dsr-mono { font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace; font-feature-settings: normal; }
.dsr-sans { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
.dsr-uc { text-transform: uppercase; letter-spacing: 0.12em; font-size: 11px; font-weight: 500; }
.dsr-hairline { border-top: 1px solid var(--rule); }
.dsr-hairline-dim { border-top: 1px solid var(--rule-dim); }
.dsr-tag {
  display: inline-flex; align-items: center; gap: 4px;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 10.5px; font-weight: 500;
  padding: 2px 7px; border-radius: 3px;
  white-space: nowrap; vertical-align: 2px;
}
.dsr-pill {
  display: inline-flex; align-items: center; gap: 6px;
  font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 500;
  padding: 3px 9px; border-radius: 999px;
  border: 1px solid var(--rule); background: var(--paper);
  color: var(--ink-dim);
}
.dsr-btn {
  font-family: 'Inter', sans-serif; font-size: 12.5px; font-weight: 500;
  padding: 7px 14px; border-radius: 4px; border: 1px solid var(--rule);
  background: var(--paper); color: var(--ink); cursor: pointer;
  transition: background .12s, border-color .12s;
}
.dsr-btn:hover { background: oklch(96% 0.02 85); border-color: var(--ink-dim); }
.dsr-btn.primary { background: var(--ink); color: var(--paper); border-color: var(--ink); }
.dsr-btn.primary:hover { background: oklch(32% 0.05 250); }
.dsr-card {
  background: var(--paper);
  border: 1px solid var(--rule);
  border-radius: 2px;
}
.dsr-folio {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px; color: var(--ink-muted);
  letter-spacing: 0.08em;
}
`;

function DossierStyles() {
  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" />
      <style>{dossierCSS}</style>
    </>
  );
}

// The masthead row — the journal's binding
function DossierMasthead({ children, subtitle, folio }) {
  return (
    <div style={{ padding: '18px 28px 14px', borderBottom: '1px solid var(--rule)', background: 'var(--paper)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <div className="dsr-mono" style={{ fontSize: 13, fontWeight: 500, letterSpacing: '0.02em' }}>probe</div>
          <div className="dsr-uc" style={{ color: 'var(--ink-muted)' }}>{children}</div>
        </div>
        <div className="dsr-folio">{folio}</div>
      </div>
      {subtitle && (
        <div style={{ fontSize: 13, color: 'var(--ink-dim)', marginTop: 6, fontStyle: 'italic' }}>{subtitle}</div>
      )}
    </div>
  );
}

// 01 — HOME / LANDING
function DossierHome() {
  const [premise, setPremise] = React.useState('');
  return (
    <div className="dsr-root" style={{ width: 1200, height: 780, display: 'flex', flexDirection: 'column' }}>
      <DossierMasthead folio="no. 014 · local · 127.0.0.1:4470">Home</DossierMasthead>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 380px', gap: 0 }}>
        <div style={{ padding: '64px 72px 48px', borderRight: '1px solid var(--rule)' }}>
          <div className="dsr-uc" style={{ color: 'var(--amber)' }}>A new premise</div>
          <div style={{ fontSize: 38, lineHeight: 1.15, fontWeight: 400, marginTop: 14, letterSpacing: '-0.01em' }}>
            State the study you're considering in one sentence.
          </div>
          <div style={{ fontSize: 15, color: 'var(--ink-dim)', marginTop: 14, lineHeight: 1.55, maxWidth: 540, fontStyle: 'italic' }}>
            Probe will interrogate it, diverge into three programs, rehearse each, and assemble a guidebook for anything that survives. You steer at every stage.
          </div>
          <div style={{ marginTop: 28, border: '1px solid var(--ink-dim)', borderRadius: 3, background: 'var(--paper)' }}>
            <textarea
              value={premise}
              onChange={(e) => setPremise(e.target.value)}
              placeholder="evaluate an ARIA-live AI-disclosure banner for BLV screen-reader users"
              style={{
                width: '100%', minHeight: 110, padding: '18px 20px',
                background: 'transparent', border: 'none', outline: 'none', resize: 'none',
                fontFamily: 'Newsreader, Georgia, serif', fontSize: 19, lineHeight: 1.45,
                color: 'var(--ink)', fontStyle: 'italic',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderTop: '1px solid var(--rule-dim)' }}>
              <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
                <label className="dsr-sans" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-dim)' }}>
                  <input type="checkbox" defaultChecked /> pause at every stage
                </label>
                <label className="dsr-sans" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-dim)' }}>
                  <input type="checkbox" /> replay cache (zero API cost)
                </label>
              </div>
              <button className="dsr-btn primary">Begin run →</button>
            </div>
          </div>
          <div style={{ marginTop: 32, display: 'flex', gap: 24 }}>
            <div style={{ flex: 1 }}>
              <div className="dsr-uc" style={{ color: 'var(--ink-muted)' }}>Or</div>
              <div style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-dim)', lineHeight: 1.5 }}>
                <span style={{ borderBottom: '1px solid var(--ink-dim)', cursor: 'pointer' }}>Import an existing draft</span>
                {' '}to critique a paper you've already written. The adversarial reviewers will run against it instead of a generated design.
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: '32px 28px', background: 'var(--panel)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div className="dsr-uc" style={{ color: 'var(--ink-muted)' }}>Recent runs</div>
            <div className="dsr-mono" style={{ fontSize: 10.5, color: 'var(--ink-muted)' }}>5</div>
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
                  }} className="dsr-sans">
                    {r.verdict}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--ink-muted)' }} className="dsr-mono">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--moss)', display: 'inline-block' }} />
            doctor · all clear · 12s ago
          </div>
        </div>
      </div>
    </div>
  );
}

// 02 — PREMISE CARD (Stage 1 output, checkpoint open)
function DossierPremise() {
  return (
    <div className="dsr-root" style={{ width: 1200, height: 780, display: 'flex', flexDirection: 'column' }}>
      <DossierMasthead folio="demo_run · stage 1 of 8 · paused"
        subtitle="The premise has been interrogated. Choose how to sharpen it, or edit the card directly, before divergence runs.">
        Premise card
      </DossierMasthead>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 420px', overflow: 'hidden' }}>
        <div style={{ padding: '36px 56px 40px', overflow: 'auto' }}>
          <div className="dsr-uc" style={{ color: 'var(--ink-muted)' }}>Sharpest question</div>
          <div style={{ fontSize: 26, lineHeight: 1.3, marginTop: 10, letterSpacing: '-0.005em' }}>
            {window.PROBE_SHARPEST_QUESTION}
          </div>
          <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
            <div>
              <div className="dsr-uc" style={{ color: 'var(--ink-muted)' }}>Nearest template</div>
              <div style={{ marginTop: 6, fontSize: 14.5, lineHeight: 1.5 }}>
                Disclosure-label credibility study, adapted from <em>Jakesch et al. 2023</em>.
              </div>
            </div>
            <div>
              <div className="dsr-uc" style={{ color: 'var(--ink-muted)' }}>Differentia</div>
              <div style={{ marginTop: 6, fontSize: 14.5, lineHeight: 1.5 }}>
                Audio-first disclosure channel (ARIA-live) rather than visual byline; BLV users' navigation speeds confound exposure.
              </div>
            </div>
          </div>
          <div style={{ marginTop: 28 }}>
            <div className="dsr-uc" style={{ color: 'var(--ink-muted)' }}>Missing evidence</div>
            <ul style={{ marginTop: 8, paddingLeft: 0, listStyle: 'none' }}>
              {[
                'baseline BLV rate of skepticism re: AI-authored text',
                'distribution of H-key vs. arrow-key navigators in candidate pool',
                'measured latency of JAWS / NVDA ARIA-live dispatch (conservatively ≥ 120ms)',
              ].map((e, i) => (
                <li key={i} style={{ display: 'flex', gap: 10, padding: '4px 0', fontSize: 14 }}>
                  <span className="dsr-mono" style={{ color: 'var(--amber)', fontSize: 12, width: 22 }}>—</span>
                  <span style={{ color: 'var(--ink-dim)' }}>{e}</span>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div className="dsr-uc" style={{ color: 'var(--ink-muted)' }}>Sharpened options</div>
              <div className="dsr-mono" style={{ fontSize: 10.5, color: 'var(--ink-muted)' }}>4 rewrites along 4 axes</div>
            </div>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {window.PROBE_SHARPENED_OPTIONS.map((opt) => {
                const picked = opt.id === 1;
                return (
                  <div key={opt.id} className="dsr-card" style={{
                    padding: '14px 18px',
                    borderColor: picked ? 'var(--ink-dim)' : 'var(--rule)',
                    background: picked ? 'oklch(97% 0.02 85)' : 'var(--paper)',
                    boxShadow: picked ? '0 0 0 3px oklch(94% 0.04 60)' : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                        <span className="dsr-mono" style={{ color: 'var(--amber)', fontSize: 11 }}>0{opt.id}</span>
                        <span style={{ fontWeight: 500, fontSize: 14.5 }}>{opt.label}</span>
                      </div>
                      <span className="dsr-pill">axis: {opt.axis}</span>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.55, color: 'var(--ink-dim)', fontStyle: 'italic' }}>
                      {opt.text}
                    </div>
                    {picked && (
                      <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                        <span className="dsr-sans" style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 500 }}>✓ chosen by researcher</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div style={{ background: 'var(--panel)', padding: '28px 28px 24px', borderLeft: '1px solid var(--rule)', display: 'flex', flexDirection: 'column' }}>
          <div className="dsr-uc" style={{ color: 'var(--ink-muted)' }}>Checkpoint</div>
          <div style={{ fontSize: 16, marginTop: 8, lineHeight: 1.45 }}>
            Run paused after Stage 1. Accept the sharpened premise, edit the card JSON, or quit.
          </div>
          <div className="dsr-mono" style={{ marginTop: 18, background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 2, padding: 14, fontSize: 11.5, lineHeight: 1.55, color: 'var(--ink-dim)', flex: 1, overflow: 'hidden' }}>
            <div style={{ color: 'var(--ink-muted)' }}>premise_card.json</div>
            <div style={{ marginTop: 8 }}>
              <span style={{ color: 'var(--navy)' }}>"raw_premise"</span>: <span style={{ color: 'var(--moss)' }}>"evaluate…"</span>,
              <br /><span style={{ color: 'var(--navy)' }}>"sharpest_question"</span>: <span style={{ color: 'var(--moss)' }}>"What specifically…"</span>,
              <br /><span style={{ color: 'var(--navy)' }}>"claim"</span>: <span style={{ color: 'var(--moss)' }}>"Phrasing-only…"</span>,
              <br /><span style={{ color: 'var(--navy)' }}>"differentia"</span>: <span style={{ color: 'var(--moss)' }}>"Audio-first…"</span>,
              <br /><span style={{ color: 'var(--navy)' }}>"nearest_template"</span>: <span style={{ color: 'var(--moss)' }}>"Jakesch 2023"</span>,
              <br /><span style={{ color: 'var(--navy)' }}>"provenance"</span>: {'{ … }'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button className="dsr-btn" style={{ flex: 1 }}>Edit card</button>
            <button className="dsr-btn" style={{ flex: 1 }}>Quit run</button>
          </div>
          <button className="dsr-btn primary" style={{ marginTop: 10 }}>Continue to Stage 2 →</button>
        </div>
      </div>
    </div>
  );
}

// 03 — AUDIT CARDS
function DossierAudit() {
  const findingColor = (score) => {
    if (score <= -2) return { bg: 'oklch(94% 0.06 20)',  fg: 'oklch(42% 0.18 20)',  rule: 'oklch(55% 0.18 20)'  };
    if (score === -1) return { bg: 'oklch(96% 0.05 60)',  fg: 'oklch(38% 0.14 60)',  rule: 'oklch(58% 0.15 60)'  };
    if (score === 0)  return { bg: 'oklch(96% 0.02 85)',  fg: 'oklch(42% 0.03 250)', rule: 'oklch(70% 0.02 85)'  };
    return { bg: 'oklch(95% 0.05 145)', fg: 'oklch(32% 0.10 145)', rule: 'oklch(52% 0.10 145)' };
  };
  return (
    <div className="dsr-root" style={{ width: 1200, height: 780, display: 'flex', flexDirection: 'column' }}>
      <DossierMasthead folio="branch B · audit · stage 6 of 8"
        subtitle="Four patterns fired. Branch continues to reviewer panel — no −2 blocker — but the announcement-duration confound must be resolved before fielding.">
        Pattern audit
      </DossierMasthead>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '220px 1fr', overflow: 'hidden' }}>
        <div style={{ padding: '28px 22px', borderRight: '1px solid var(--rule)', background: 'var(--panel)' }}>
          <div className="dsr-uc" style={{ color: 'var(--ink-muted)' }}>Verdict</div>
          <div style={{ marginTop: 10, padding: '12px 14px', border: '1px solid var(--amber)', borderRadius: 2, background: 'oklch(97% 0.04 60)' }}>
            <div className="dsr-mono" style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 500 }}>REVISION_REQUIRED</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-dim)', marginTop: 5, lineHeight: 1.4 }}>
              Fixable before fielding.
            </div>
          </div>
          <div className="dsr-uc" style={{ color: 'var(--ink-muted)', marginTop: 26 }}>Axes</div>
          <div style={{ marginTop: 10 }}>
            {[
              { name: 'Legibility', score: -1, fired: 3 },
              { name: 'Capture',    score: -1, fired: 1 },
              { name: 'Novelty',    score:  0, fired: 0 },
              { name: 'Feasibility', score: 1, fired: 0 },
            ].map((ax) => (
              <div key={ax.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--rule-dim)' }}>
                <span style={{ fontSize: 13 }}>{ax.name}</span>
                <span className="dsr-mono" style={{
                  fontSize: 11, padding: '2px 6px', borderRadius: 2,
                  background: findingColor(ax.score).bg, color: findingColor(ax.score).fg,
                }}>
                  {ax.score > 0 ? `+${ax.score}` : ax.score}
                </span>
              </div>
            ))}
          </div>
          <div className="dsr-uc" style={{ color: 'var(--ink-muted)', marginTop: 26 }}>Group by</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button className="dsr-btn" style={{ padding: '4px 10px', fontSize: 11, background: 'var(--ink)', color: 'var(--paper)', borderColor: 'var(--ink)' }}>severity</button>
            <button className="dsr-btn" style={{ padding: '4px 10px', fontSize: 11 }}>axis</button>
          </div>
          <div className="dsr-uc" style={{ color: 'var(--ink-muted)', marginTop: 26 }}>Deep audit</div>
          <button className="dsr-btn" style={{ marginTop: 8, width: '100%', fontSize: 11.5 }}>
            Run managed agent · ~$1.20
          </button>
          <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 8, lineHeight: 1.5, fontStyle: 'italic' }}>
            Opus 4.7 with bash, grep, web search. Measures what this pass could only reason about.
          </div>
        </div>
        <div style={{ padding: '28px 40px', overflow: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {window.PROBE_AUDIT_FINDINGS.map((f, idx) => {
              const c = findingColor(f.score);
              return (
                <div key={f.id} className="dsr-card" style={{
                  padding: '18px 22px',
                  borderLeft: `3px solid ${c.rule}`,
                  opacity: f.fired ? 1 : 0.62,
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                      <span className="dsr-mono" style={{ fontSize: 12.5, color: 'var(--ink)', fontWeight: 500 }}>{f.pattern_id}</span>
                      <span className="dsr-pill" style={{ fontSize: 10.5 }}>{f.axis}</span>
                      <span className="dsr-mono" style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 2,
                        background: c.bg, color: c.fg, fontWeight: 500,
                      }}>
                        score {f.score > 0 ? `+${f.score}` : f.score}
                      </span>
                      {!f.fired && <span className="dsr-pill" style={{ fontSize: 10.5, color: 'var(--moss)' }}>did not fire</span>}
                    </div>
                    <span className="dsr-folio">#{String(idx + 1).padStart(2, '0')}</span>
                  </div>
                  <blockquote style={{
                    margin: '14px 0 0',
                    padding: '10px 16px',
                    borderLeft: '2px solid var(--rule)',
                    fontSize: 14, lineHeight: 1.55, color: 'var(--ink-dim)',
                    fontStyle: 'italic', fontFamily: 'Newsreader, serif',
                  }}>
                    {f.evidence}
                    <div className="dsr-mono" style={{ fontStyle: 'normal', fontSize: 10.5, marginTop: 6, color: 'var(--ink-muted)' }}>
                      → {f.evidence_source} <span style={{ borderBottom: '1px dotted var(--ink-muted)', cursor: 'pointer' }}>open in source</span>
                    </div>
                  </blockquote>
                  <div style={{ fontSize: 14.5, lineHeight: 1.55, marginTop: 14 }}>
                    {f.rationale}
                  </div>
                  {f.suggested_revision && (
                    <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--panel)', borderRadius: 2, fontSize: 13.5, lineHeight: 1.5 }}>
                      <span className="dsr-uc" style={{ color: 'var(--ink-muted)', marginRight: 8 }}>Suggested revision</span>
                      {f.suggested_revision}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// 04 — GUIDEBOOK with provenance badges
function DossierGuidebook() {
  return (
    <div className="dsr-root" style={{ width: 1200, height: 780, display: 'flex', flexDirection: 'column' }}>
      <DossierMasthead folio="PROBE_GUIDEBOOK.md · 77 tagged elements · lint ✓"
        subtitle="Every content-bearing element carries exactly one provenance tag. Click any tag to open its source; edit inline to refine, tags must be preserved.">
        Guidebook
      </DossierMasthead>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '200px 1fr 340px', overflow: 'hidden' }}>
        <div style={{ padding: '28px 20px', borderRight: '1px solid var(--rule)', background: 'var(--panel)' }}>
          <div className="dsr-uc" style={{ color: 'var(--ink-muted)' }}>Contents</div>
          <div style={{ marginTop: 12 }}>
            {['Premise', 'Background', 'Prototype', 'Study protocol', 'Failure hypotheses', 'Risks'].map((s, i) => (
              <div key={s} style={{
                padding: '6px 8px', marginLeft: -8, borderRadius: 2, cursor: 'pointer',
                background: i === 1 ? 'var(--paper)' : 'transparent',
                border: i === 1 ? '1px solid var(--rule)' : '1px solid transparent',
                fontSize: 13, color: i === 1 ? 'var(--ink)' : 'var(--ink-dim)',
              }}>
                <span className="dsr-mono" style={{ fontSize: 10.5, color: 'var(--ink-muted)', marginRight: 8 }}>§{i + 1}</span>
                {s}
              </div>
            ))}
          </div>
          <div className="dsr-uc" style={{ color: 'var(--ink-muted)', marginTop: 26 }}>Tag legend</div>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {Object.entries(window.PROBE_PROVENANCE_TAGS).slice(0, 6).map(([k, v]) => (
              <div key={k} className="dsr-tag" style={{ background: v.bg, color: v.fg, alignSelf: 'flex-start' }}>
                {k.toLowerCase()}
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '44px 64px 40px', overflow: 'auto', background: 'var(--paper)' }}>
          <div className="dsr-uc" style={{ color: 'var(--amber)' }}>§2 Background</div>
          <h2 style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.2, marginTop: 10, letterSpacing: '-0.01em' }}>
            Prior work on disclosure and the relational model of access
          </h2>
          <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
            {window.PROBE_GUIDEBOOK_PARAGRAPHS.slice(0, 5).map((p, i) => {
              const [key, value] = p.tag.includes(':') ? p.tag.split(':') : [p.tag, null];
              const t = window.PROBE_PROVENANCE_TAGS[key];
              return (
                <p key={p.id} style={{
                  fontSize: 16.5, lineHeight: 1.62, margin: 0,
                  fontFamily: 'Newsreader, serif',
                  background: i === 4 ? 'oklch(99% 0.01 85)' : 'transparent',
                  padding: i === 4 ? '8px 12px' : 0,
                  borderLeft: i === 4 ? '2px solid var(--amber)' : 'none',
                  marginLeft: i === 4 ? -14 : 0,
                }}>
                  {p.text}{' '}
                  <span className="dsr-tag" style={{ background: t.bg, color: t.fg, cursor: 'pointer' }}>
                    {key.toLowerCase()}{value ? `:${value}` : ''}
                  </span>
                </p>
              );
            })}
          </div>
        </div>
        <div style={{ padding: '28px 24px', borderLeft: '1px solid var(--rule)', background: 'var(--panel)' }}>
          <div className="dsr-uc" style={{ color: 'var(--ink-muted)' }}>Source card · kafer_2013</div>
          <div style={{ marginTop: 10, padding: 14, background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 2 }}>
            <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.35 }}>Feminist, Queer, Crip</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-dim)', marginTop: 3, fontStyle: 'italic' }}>Alison Kafer · 2013 · Indiana UP</div>
            <div className="dsr-hairline-dim" style={{ margin: '12px 0' }} />
            <div className="dsr-mono" style={{ fontSize: 10.5, color: 'var(--ink-muted)', lineHeight: 1.6 }}>
              claim: political/relational<br />
              pages: 3–27<br />
              used_by: §2.1, §5.3<br />
              imported: 2026-04-22
            </div>
            <div className="dsr-hairline-dim" style={{ margin: '12px 0' }} />
            <div style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--ink-dim)', fontStyle: 'italic' }}>
              "Disability is not a flaw in the individual but a feature of the arrangement."
            </div>
          </div>
          <div className="dsr-uc" style={{ color: 'var(--ink-muted)', marginTop: 24 }}>Linter</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 12, color: 'var(--moss)' }} className="dsr-mono">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--moss)' }} />
            21 of 21 rules pass
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  DossierHome,
  DossierPremise,
  DossierAudit,
  DossierGuidebook,
  DossierStyles,
});
