// Direction B — "Bench"
// Technical / IDE-like. IBM Plex Mono + IBM Plex Sans.
// Dark graphite, measured severity chips. The workbench that shows the work.

const benchCSS = `
.bnch-root {
  --bg: oklch(16% 0.008 250);
  --bg-2: oklch(19% 0.008 250);
  --bg-3: oklch(22% 0.01 250);
  --panel: oklch(21% 0.008 250);
  --line: oklch(28% 0.01 250);
  --line-dim: oklch(24% 0.008 250);
  --text: oklch(92% 0.005 250);
  --text-dim: oklch(70% 0.01 250);
  --text-muted: oklch(52% 0.01 250);
  --green: oklch(72% 0.14 145);
  --amber: oklch(76% 0.14 70);
  --rose:  oklch(70% 0.16 20);
  --blue:  oklch(74% 0.12 230);
  --purple: oklch(72% 0.14 300);
  --teal: oklch(74% 0.10 200);
  background: var(--bg);
  color: var(--text);
  font-family: 'IBM Plex Sans', 'Inter', system-ui, sans-serif;
}
.bnch-root * { box-sizing: border-box; }
.bnch-mono { font-family: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace; }
.bnch-uc   { text-transform: uppercase; letter-spacing: 0.14em; font-size: 10.5px; font-weight: 500; }
.bnch-btn {
  font-family: 'IBM Plex Mono', monospace; font-size: 11.5px; font-weight: 400;
  padding: 6px 12px; border-radius: 3px; cursor: pointer;
  background: var(--bg-3); border: 1px solid var(--line); color: var(--text);
  transition: border-color .1s, background .1s;
}
.bnch-btn:hover { border-color: var(--text-dim); }
.bnch-btn.primary { background: oklch(80% 0.04 250); color: var(--bg); border-color: oklch(80% 0.04 250); }
.bnch-chip {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: 'IBM Plex Mono', monospace; font-size: 10px;
  padding: 2px 7px; border-radius: 2px;
  border: 1px solid var(--line); color: var(--text-dim);
  background: transparent;
}
.bnch-dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
`;

function BenchStyles() {
  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" />
      <style>{benchCSS}</style>
    </>
  );
}

function BenchTitlebar({ label, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 16px', borderBottom: '1px solid var(--line)', background: 'var(--bg-2)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="bnch-mono" style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>probe ~</div>
        <span className="bnch-mono" style={{ fontSize: 11.5, color: 'var(--green)' }}>● live</span>
        <span className="bnch-mono" style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>{children}</div>
    </div>
  );
}

// 05 — LIVE RUN: DAG + streaming content
function BenchLiveRun() {
  return (
    <div className="bnch-root" style={{ width: 1200, height: 780, display: 'flex', flexDirection: 'column' }}>
      <BenchTitlebar label="runs/demo_run · stage 5 of 8 · streaming">
        <span className="bnch-chip"><span className="bnch-dot" style={{ background: 'var(--amber)' }}/> $2.19 used</span>
        <span className="bnch-chip">14:08</span>
        <button className="bnch-btn">pause</button>
      </BenchTitlebar>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '280px 1fr 340px', overflow: 'hidden' }}>
        {/* Left: pipeline DAG */}
        <div style={{ background: 'var(--panel)', borderRight: '1px solid var(--line)', padding: '18px 16px', overflow: 'auto' }}>
          <div className="bnch-uc" style={{ color: 'var(--text-muted)' }}>pipeline</div>
          <div style={{ marginTop: 12, position: 'relative' }}>
            {window.PROBE_STAGES.map((st, i) => {
              const state = i < 4 ? 'done' : i === 4 ? 'active' : 'pending';
              const color = state === 'done' ? 'var(--green)' : state === 'active' ? 'var(--amber)' : 'var(--text-muted)';
              return (
                <div key={st.n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '6px 0', position: 'relative' }}>
                  <div style={{ width: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: 2,
                      background: state === 'pending' ? 'transparent' : color,
                      border: `1px solid ${color}`,
                    }}/>
                    {i < 7 && <div style={{ width: 1, flex: 1, background: 'var(--line)', minHeight: 24, marginTop: 4 }}/>}
                  </div>
                  <div style={{ flex: 1, paddingBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span className="bnch-mono" style={{ fontSize: 11.5, color }}>
                        {String(st.n).padStart(2, '0')} · {st.name}
                      </span>
                      <span className="bnch-mono" style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>
                        {state === 'done' ? st.duration : state === 'active' ? '…' : '—'}
                      </span>
                    </div>
                    <div className="bnch-mono" style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 2 }}>
                      {st.role} · {st.model} {state === 'done' ? ` · $${st.cost}` : ''}
                    </div>
                    {state === 'active' && (
                      <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
                        {['a', 'b', 'c'].map((b, bi) => (
                          <div key={b} style={{
                            fontSize: 9, padding: '2px 4px',
                            background: b === 'c' ? 'oklch(30% 0.03 250)' : 'var(--bg-3)',
                            color: b === 'c' ? 'var(--text-muted)' : 'var(--amber)',
                            borderRadius: 2, textAlign: 'center', fontFamily: 'IBM Plex Mono, monospace',
                          }}>
                            {b === 'c' ? '○' : '◐'} {b}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--bg-3)', borderRadius: 3, border: '1px dashed var(--line)' }}>
            <div className="bnch-uc" style={{ color: 'var(--text-muted)' }}>branch C</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Longitudinal co-design</div>
            <button className="bnch-btn" style={{ marginTop: 8, fontSize: 10.5, color: 'var(--rose)', borderColor: 'oklch(35% 0.1 20)', width: '100%' }}>
              stop branch · –$1.40 est
            </button>
          </div>
        </div>

        {/* Center: streaming output */}
        <div style={{ overflow: 'auto', padding: '20px 26px', background: 'var(--bg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <div className="bnch-uc" style={{ color: 'var(--amber)' }}>stage 5 · simulated walkthrough · branch B</div>
              <h2 style={{ fontSize: 20, fontWeight: 500, marginTop: 6, letterSpacing: '-0.005em' }}>
                Rehearsing the Wizard-of-Oz protocol
              </h2>
            </div>
            <span className="bnch-chip"><span className="bnch-dot" style={{ background: 'var(--amber)', animation: 'pulse 1.4s ease-in-out infinite' }}/> writing</span>
          </div>
          <div style={{
            marginTop: 18, fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, lineHeight: 1.7,
            padding: '16px 18px', background: 'var(--panel)', borderLeft: '2px solid var(--amber)', borderRadius: 0,
          }}>
            <div style={{ color: 'var(--text-muted)' }}>{'// persona: Marcus, 34, daily JAWS user at 320 wpm, H-key primary'}</div>
            <div style={{ marginTop: 6 }}>
              <span style={{ color: 'var(--blue)' }}>t=0.0</span> <span style={{ color: 'var(--text-dim)' }}>page loads; JAWS announces title</span>
            </div>
            <div><span style={{ color: 'var(--blue)' }}>t=1.3</span> <span style={{ color: 'var(--text-dim)' }}>Marcus hits H; jumps to H2 §1 "The city council…"</span></div>
            <div><span style={{ color: 'var(--blue)' }}>t=2.4</span> <span style={{ color: 'var(--text-dim)' }}>hits H again; §2 "Budget shortfall…"</span></div>
            <div><span style={{ color: 'var(--blue)' }}>t=3.6</span> <span style={{ color: 'var(--text-dim)' }}>hits H again; §3 "Outlook for FY26…"</span></div>
            <div><span style={{ color: 'var(--rose)' }}>t=3.9</span> <span style={{ color: 'var(--amber)' }}>FINDING: late-banner condition misses — article fully navigated before t=4.0s</span></div>
            <div style={{ marginTop: 6 }}><span style={{ color: 'var(--blue)' }}>t=4.1</span> <span style={{ color: 'var(--text-dim)' }}>ARIA-live dispatch: "This article was written with assistance from an AI model" (6.0s)</span></div>
            <div><span style={{ color: 'var(--blue)' }}>t=10.1</span> <span style={{ color: 'var(--text-dim)' }}>Marcus is already reading §3 body; announcement interrupts reading</span></div>
            <div style={{ marginTop: 6, color: 'var(--green)' }}>
              <span className="bnch-mono" style={{ background: 'oklch(24% 0.03 145)', padding: '2px 5px', borderRadius: 2 }}>↳ emit finding</span> <span style={{ color: 'var(--text-dim)' }}>announcement_duration_confound · severity major</span>
              <span style={{ color: 'var(--amber)', marginLeft: 8 }}>▍</span>
            </div>
          </div>

          <div className="bnch-uc" style={{ color: 'var(--text-muted)', marginTop: 22 }}>just completed</div>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { t: 'prototype_spec.md', meta: '1,247 words · branch B · stage 4' },
              { t: 'branch_card.json',  meta: 'updated · stage 2' },
              { t: 'grounding/sources.yaml', meta: '12 cards · stage 3' },
              { t: 'premise_card.json', meta: 'edited by researcher · 14:03' },
            ].map((f) => (
              <div key={f.t} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--panel)', borderRadius: 3, border: '1px solid var(--line-dim)', cursor: 'pointer' }}>
                <span className="bnch-mono" style={{ color: 'var(--blue)', fontSize: 11.5 }}>▢</span>
                <span className="bnch-mono" style={{ fontSize: 11.5 }}>{f.t}</span>
                <span className="bnch-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>{f.meta}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: branches column */}
        <div style={{ borderLeft: '1px solid var(--line)', background: 'var(--panel)', padding: '18px 16px', overflow: 'auto' }}>
          <div className="bnch-uc" style={{ color: 'var(--text-muted)' }}>branches</div>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {window.PROBE_BRANCHES.map((b) => {
              const active = b.id === 'b';
              const killed = b.id === 'c' && false;
              return (
                <div key={b.id} style={{
                  padding: 12, background: 'var(--bg-3)', border: `1px solid ${active ? 'var(--amber)' : 'var(--line-dim)'}`, borderRadius: 3,
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <span className="bnch-mono" style={{ fontSize: 13, fontWeight: 500, color: active ? 'var(--amber)' : 'var(--text)' }}>
                      branch {b.id.toUpperCase()}
                    </span>
                    <span className="bnch-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{b.method}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6, lineHeight: 1.4 }}>{b.title}</div>
                  <div style={{ marginTop: 10, display: 'flex', gap: 3 }}>
                    {b.stages.map((s) => {
                      const done = s <= 4;
                      const cur = s === 5 && active;
                      return (
                        <div key={s} style={{
                          flex: 1, height: 4, borderRadius: 1,
                          background: done ? 'var(--green)' : cur ? 'var(--amber)' : 'var(--line)',
                          opacity: cur ? 0.7 : 1,
                        }}/>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="bnch-uc" style={{ color: 'var(--text-muted)', marginTop: 22 }}>cost</div>
          <div style={{ marginTop: 8, padding: 12, background: 'var(--bg-3)', borderRadius: 3 }}>
            <div className="bnch-mono" style={{ fontSize: 18 }}>$2.19 <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>/ ~$5.00 est</span></div>
            <div style={{ height: 4, borderRadius: 2, background: 'var(--line)', marginTop: 8, overflow: 'hidden' }}>
              <div style={{ width: '44%', height: '100%', background: 'var(--amber)' }}/>
            </div>
            <div className="bnch-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.6 }}>
              opus: $1.34  ·  sonnet: $0.85<br/>
              repair passes: 1
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}

// 06 — DEEP AUDIT: tool-call stream
function BenchDeepAudit() {
  return (
    <div className="bnch-root" style={{ width: 1200, height: 780, display: 'flex', flexDirection: 'column' }}>
      <BenchTitlebar label="audit-deep demo_run b · managed_agent · Opus 4.7">
        <span className="bnch-chip"><span className="bnch-dot" style={{ background: 'var(--green)' }}/> 21 tool calls</span>
        <span className="bnch-chip">$1.20</span>
      </BenchTitlebar>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 420px', overflow: 'hidden' }}>
        <div style={{ padding: '22px 28px', overflow: 'auto' }}>
          <div className="bnch-uc" style={{ color: 'var(--blue)' }}>objective</div>
          <div style={{ fontSize: 15, marginTop: 6, lineHeight: 1.5, maxWidth: 640 }}>
            Measure the announcement-duration confound in branch B. The shallow audit flagged it at −1 by reasoning; the deep audit should produce exact syllable counts, wpm-adjusted durations, and delta.
          </div>
          <div className="bnch-uc" style={{ color: 'var(--text-muted)', marginTop: 22 }}>tool-call stream</div>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {window.PROBE_TOOL_CALLS.map((c, i) => {
              const toolColor = { bash: 'var(--green)', grep: 'var(--purple)', calculate: 'var(--amber)', web_search: 'var(--blue)', note: 'var(--teal)' }[c.tool] || 'var(--text-dim)';
              return (
                <div key={i} style={{ background: 'var(--panel)', border: '1px solid var(--line-dim)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: '1px solid var(--line-dim)', background: 'var(--bg-2)' }}>
                    <span className="bnch-mono" style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{c.t}</span>
                    <span className="bnch-mono" style={{ fontSize: 10.5, color: toolColor, padding: '1px 6px', border: `1px solid ${toolColor}`, borderRadius: 2 }}>
                      {c.tool}
                    </span>
                    <span className="bnch-mono" style={{ fontSize: 11, color: 'var(--text-dim)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.cmd}
                    </span>
                  </div>
                  <div className="bnch-mono" style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
                    {c.out}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ borderLeft: '1px solid var(--line)', background: 'var(--panel)', padding: '22px 22px', overflow: 'auto' }}>
          <div className="bnch-uc" style={{ color: 'var(--text-muted)' }}>measurement</div>
          <div style={{ marginTop: 10, padding: 14, background: 'var(--bg-3)', borderRadius: 3, border: '1px solid var(--line-dim)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px 12px', fontSize: 12.5 }}>
              <span style={{ color: 'var(--text-dim)' }}>AI string</span>  <span className="bnch-mono">17 syl · 5.67s</span>
              <span style={{ color: 'var(--text-dim)' }}>Control</span>    <span className="bnch-mono">3 syl · 1.00s</span>
              <span style={{ color: 'var(--text-dim)' }}>Δ</span>          <span className="bnch-mono" style={{ color: 'var(--amber)', fontWeight: 500 }}>+4.67s</span>
              <span style={{ color: 'var(--text-dim)' }}>At 320 wpm</span> <span className="bnch-mono">Δ = 3.15s</span>
              <span style={{ color: 'var(--text-dim)' }}>At 450 wpm</span> <span className="bnch-mono">Δ = 2.24s</span>
            </div>
          </div>
          <div className="bnch-uc" style={{ color: 'var(--text-muted)', marginTop: 22 }}>new findings · 9</div>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              'duration Δ quantified: 4.67s @ 180 wpm',
              'stratify by JAWS rate (180 / 320 / 450)',
              'H2 count verified = 3 in stimulus',
              'prototype spec uses 180 wpm assumption nowhere',
              'no IRB-level compensation doc yet',
              'Longoni 2019 — algorithm aversion frame',
              'Jakesch 2023 cited in related work? (no)',
              'Sundar 2008 MAIN model (adjacent, uncited)',
              'task-flow step 4 free-nav permits late-miss',
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, alignItems: 'flex-start', padding: '6px 8px', borderLeft: '2px solid var(--amber)', background: 'var(--bg-3)' }}>
                <span className="bnch-mono" style={{ color: 'var(--amber)', fontSize: 10.5 }}>f{String(i + 1).padStart(2, '0')}</span>
                <span style={{ color: 'var(--text-dim)', lineHeight: 1.4 }}>{f}</span>
              </div>
            ))}
          </div>
          <button className="bnch-btn primary" style={{ marginTop: 18, width: '100%' }}>merge into audit.json</button>
        </div>
      </div>
    </div>
  );
}

// 07 — REVIEWER PANEL
function BenchReviewers() {
  const accent = (a) => ({
    navy:  { bg: 'oklch(22% 0.04 250)', fg: 'var(--blue)', line: 'var(--blue)' },
    teal:  { bg: 'oklch(22% 0.04 200)', fg: 'var(--teal)', line: 'var(--teal)' },
    amber: { bg: 'oklch(22% 0.04 70)',  fg: 'var(--amber)', line: 'var(--amber)' },
  }[a] || { bg: 'var(--panel)', fg: 'var(--text-dim)', line: 'var(--line)' });
  return (
    <div className="bnch-root" style={{ width: 1200, height: 780, display: 'flex', flexDirection: 'column' }}>
      <BenchTitlebar label="branch B · reviewer panel · stage 7">
        <span className="bnch-chip">3 reviewers · split</span>
      </BenchTitlebar>
      <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--line)', background: 'var(--bg-2)' }}>
        <div className="bnch-uc" style={{ color: 'var(--text-muted)' }}>meta-reviewer · classification</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
          <span className="bnch-mono" style={{ fontSize: 12, color: 'var(--amber)', padding: '3px 8px', border: '1px solid var(--amber)', borderRadius: 2 }}>
            {window.PROBE_META_VERDICT.classification}
          </span>
          <span style={{ fontSize: 13.5, color: 'var(--text-dim)', lineHeight: 1.4 }}>{window.PROBE_META_VERDICT.note}</span>
        </div>
      </div>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', overflow: 'hidden' }}>
        {window.PROBE_REVIEWERS.map((rv, i) => {
          const a = accent(rv.accent);
          return (
            <div key={rv.id} style={{
              padding: '20px 22px', overflow: 'auto',
              borderRight: i < 2 ? '1px solid var(--line)' : 'none',
              background: 'var(--bg)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="bnch-dot" style={{ background: a.fg, width: 9, height: 9 }}/>
                <span className="bnch-uc" style={{ color: a.fg }}>{rv.name}</span>
              </div>
              <div style={{ marginTop: 12, fontSize: 15.5, lineHeight: 1.4, fontWeight: 500 }}>
                {rv.headline}
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }} className="bnch-mono">
                verdict: <span style={{ color: 'var(--amber)' }}>{rv.verdict}</span>
              </div>
              <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {rv.points.map((p, j) => (
                  <div key={j} style={{ display: 'flex', gap: 10 }}>
                    <span className="bnch-mono" style={{ color: a.fg, fontSize: 11, marginTop: 2 }}>▸</span>
                    <span style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--text-dim)' }}>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { BenchStyles, BenchLiveRun, BenchDeepAudit, BenchReviewers });
