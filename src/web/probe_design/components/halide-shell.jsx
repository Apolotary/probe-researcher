// Probe Halide · app shell + views
// Linear-inspired density + polish, original Probe identity.

const { useState, useEffect, useRef, useMemo } = React;

// ───────── Sidebar (tree) ─────────
function HalideSidebar({ route, setRoute, branches, killBranch, cost }) {
  const [open, setOpen] = useState({ pipeline: true, branches: true, artifacts: true, library: false });
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  const TreeHead = ({ k, label, right }) => (
    <button onClick={() => toggle(k)} style={{
      display: 'flex', alignItems: 'center', gap: 6, width: '100%',
      height: 26, padding: '0 6px', border: 'none', background: 'transparent',
      color: 'var(--ink-3)', cursor: 'pointer', borderRadius: 'var(--r-1)',
    }}>
      <HIcon k={open[k] ? 'caret' : 'caretRight'} size={12} color="var(--ink-4)" />
      <span className="hld-uc" style={{ color: 'var(--ink-3)', letterSpacing: '0.08em' }}>{label}</span>
      <span className="hld-mono" style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--ink-4)', whiteSpace: 'nowrap' }}>{right}</span>
    </button>
  );

  const row = (active, children, onClick, extra, key) => (
    <div
      key={key}
      onClick={onClick}
      className={active ? 'hld-row hld-row-sel' : 'hld-row'}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        height: 28, padding: '0 8px 0 22px',
        borderRadius: 'var(--r-1)',
        color: active ? 'var(--ink)' : 'var(--ink-2)',
        cursor: 'pointer', fontSize: 12.5,
        position: 'relative', whiteSpace: 'nowrap', overflow: 'hidden',
      }}
    >
      {children}
      {extra}
    </div>
  );

  return (
    <div className="hld-scroll" style={{
      width: 272, background: 'var(--bg)', borderRight: '1px solid var(--line)',
      display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto',
    }}>
      {/* workspace header */}
      <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--line)' }}>
        <div style={{
          width: 22, height: 22, borderRadius: 5,
          background: 'linear-gradient(135deg, oklch(60% 0.15 72), oklch(42% 0.10 30))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--bg)', fontWeight: 600, fontSize: 12,
          boxShadow: '0 1px 0 oklch(28% 0.02 255) inset',
        }}>◇</div>
        <div style={{ fontSize: 13, fontWeight: 550, letterSpacing: '-0.005em' }}>Priya's workspace</div>
        <HIcon k="caret" size={12} color="var(--ink-4)" />
      </div>

      <div style={{ padding: '6px 6px 8px' }}>
        <div className="hld-row" onClick={() => setRoute({ kind: 'home' })} style={{
          display: 'flex', alignItems: 'center', gap: 8, height: 28, padding: '0 10px',
          borderRadius: 'var(--r-1)', cursor: 'pointer', color: route.kind === 'home' ? 'var(--ink)' : 'var(--ink-2)',
          background: route.kind === 'home' ? 'var(--bg-2)' : 'transparent',
        }}>
          <HIcon k="home" size={13} color="var(--ink-3)" />
          <span style={{ fontSize: 12.5, fontWeight: 450 }}>Home</span>
        </div>
        <div className="hld-row" style={{
          display: 'flex', alignItems: 'center', gap: 8, height: 28, padding: '0 10px',
          borderRadius: 'var(--r-1)', cursor: 'pointer', color: 'var(--ink-2)',
        }}>
          <HIcon k="search" size={13} color="var(--ink-3)" />
          <span style={{ fontSize: 12.5 }}>Search</span>
          <span className="hld-kbd" style={{ marginLeft: 'auto' }}>⌘K</span>
        </div>
      </div>

      <div style={{ padding: '0 6px' }}>
        <div className="hld-uc" style={{ padding: '10px 8px 4px' }}>Run · demo_run</div>
        <div style={{ padding: '0 4px 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="hld-dot hld-pulse" style={{ background: 'var(--amber)' }} />
          <span className="hld-mono" style={{ fontSize: 11, color: 'var(--ink-2)' }}>stage 5 of 8</span>
          <span className="hld-mono" style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--ink-4)' }}>${cost.toFixed(2)}</span>
        </div>
        <div style={{ height: 3, background: 'var(--bg-2)', borderRadius: 2, margin: '8px 4px 2px 8px', overflow: 'hidden' }}>
          <div style={{ width: '56%', height: '100%', background: 'var(--amber)', borderRadius: 2 }} />
        </div>
      </div>

      <div style={{ padding: '10px 6px 0' }}>
        <TreeHead k="pipeline" label="Pipeline" right="5/8" />
        {open.pipeline && (
          <div>
            {window.PROBE_STAGES.map((st) => {
              const done = st.n < 5, cur = st.n === 5;
              return row(
                route.kind === 'stage' && route.n === st.n,
                <>
                  <span style={{ width: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    {done && <HIcon k="check" size={11} color="var(--moss)" />}
                    {cur && <span className="hld-dot hld-pulse" style={{ background: 'var(--amber)' }} />}
                    {!done && !cur && <span className="hld-dot" style={{ background: 'var(--line-2)' }} />}
                  </span>
                  <span className="hld-mono" style={{ fontSize: 10.5, color: 'var(--ink-4)', width: 16, flexShrink: 0 }}>0{st.n}</span>
                  <span style={{ color: cur ? 'var(--ink)' : done ? 'var(--ink-2)' : 'var(--ink-3)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{st.name}</span>
                  <span className="hld-mono" style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--ink-4)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {done ? st.duration.replace(' ', '') : cur ? '···' : ''}
                  </span>
                </>,
                () => setRoute({ kind: 'stage', n: st.n }),
                null,
                st.n
              );
            })}
          </div>
        )}
      </div>

      <div style={{ padding: '4px 6px 0' }}>
        <TreeHead k="branches" label="Branches" right={`${Object.values(branches).filter(b => b !== 'killed').length}/3`} />
        {open.branches && window.PROBE_BRANCHES.map((b) => {
          const state = branches[b.id];
          const killed = state === 'killed';
          const active = route.kind === 'branch' && route.id === b.id;
          const color = b.verdict === 'BLOCKED' ? 'var(--rose)' : b.verdict === 'REVISION_REQUIRED' ? 'var(--amber)' : 'var(--moss)';
          return (
            <div key={b.id} className={active ? 'hld-row hld-row-sel' : 'hld-row'} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              height: 28, padding: '0 8px 0 22px',
              borderRadius: 'var(--r-1)', cursor: 'pointer', fontSize: 12.5,
              color: killed ? 'var(--ink-4)' : active ? 'var(--ink)' : 'var(--ink-2)',
              textDecoration: killed ? 'line-through' : 'none',
              position: 'relative',
              whiteSpace: 'nowrap', overflow: 'hidden',
            }} onClick={() => setRoute({ kind: 'branch', id: b.id })}>
              <span className="hld-dot" style={{ background: killed ? 'var(--line-2)' : color }} />
              <span style={{ fontWeight: active ? 500 : 450, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.letter} · {b.title}</span>
              {!killed && (
                <button className="hld-btn hld-btn-ghost hld-btn-danger" title={`stop branch ${b.letter}`}
                  style={{ marginLeft: 'auto', height: 20, width: 20, padding: 0, justifyContent: 'center' }}
                  onClick={(e) => { e.stopPropagation(); killBranch(b.id); }}>
                  <HIcon k="close" size={10} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ padding: '4px 6px 0' }}>
        <TreeHead k="artifacts" label="Artifacts" right="12" />
        {open.artifacts && (
          <>
            {[
              { k: 'file', l: 'premise_card.json', meta: 'edited', route: { kind: 'premise' } },
              { k: 'file', l: 'branch_card · A', meta: '', route: { kind: 'branch', id: 'a' } },
              { k: 'file', l: 'branch_card · B', meta: '✓', route: { kind: 'branch', id: 'b' } },
              { k: 'file', l: 'branch_card · C', meta: '', route: { kind: 'branch', id: 'c' } },
              { k: 'file', l: 'prototype_spec · B', meta: '1.2k', route: { kind: 'branch', id: 'b' } },
              { k: 'flask', l: 'walkthrough · B', meta: 'live', route: { kind: 'walkthrough' } },
              { k: 'file', l: 'audit · B', meta: '4 fired', route: { kind: 'audit' } },
              { k: 'chat', l: 'reviewers · B', meta: 'split', route: { kind: 'reviewers' } },
              { k: 'book', l: 'PROBE_GUIDEBOOK.md', meta: '77 ✓', route: { kind: 'guidebook' } },
            ].map((a, i) => {
              const active = JSON.stringify(route) === JSON.stringify(a.route);
              return (
                <div key={i} className={active ? 'hld-row hld-row-sel' : 'hld-row'} style={{
                  display: 'flex', alignItems: 'center', gap: 8, height: 26, padding: '0 8px 0 22px',
                  borderRadius: 'var(--r-1)', cursor: 'pointer', fontSize: 12,
                  color: active ? 'var(--ink)' : 'var(--ink-2)', whiteSpace: 'nowrap', overflow: 'hidden',
                }} onClick={() => setRoute(a.route)}>
                  <HIcon k={a.k} size={12} color="var(--ink-4)" />
                  <span style={{ fontFamily: a.l.endsWith('.json') || a.l.endsWith('.md') || a.l.includes('walkthrough') || a.l.includes('spec') ? 'JetBrains Mono, monospace' : 'inherit', fontSize: 11.5, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.l}</span>
                  <span className="hld-mono" style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--ink-4)', whiteSpace: 'nowrap', flexShrink: 0 }}>{a.meta}</span>
                </div>
              );
            })}
          </>
        )}
      </div>

      <div style={{ padding: '4px 6px 12px' }}>
        <TreeHead k="library" label="Other runs" right="4" />
        {open.library && window.PROBE_RUNS.slice(1).map((r) => (
          <div key={r.id} className="hld-row" style={{
            display: 'flex', alignItems: 'center', gap: 8, height: 26, padding: '0 8px 0 22px',
            borderRadius: 'var(--r-1)', cursor: 'pointer', fontSize: 11.5, color: 'var(--ink-3)', whiteSpace: 'nowrap', overflow: 'hidden',
          }}>
            <HIcon k="folder" size={12} color="var(--ink-4)" />
            <span className="hld-mono" style={{ fontSize: 11, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.id}</span>
            <span className="hld-mono" style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--ink-4)', whiteSpace: 'nowrap', flexShrink: 0 }}>${r.cost.toFixed(0)}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 'auto', borderTop: '1px solid var(--line)', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="hld-dot" style={{ background: 'var(--moss)' }} />
        <span className="hld-mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>doctor ok · 12s ago</span>
        <HIcon k="cog" size={13} color="var(--ink-4)" />
      </div>
    </div>
  );
}

// ───────── Top bar (breadcrumb, actions, shortcuts) ─────────
function HalideTopbar({ title, crumb, right, onCmdK }) {
  return (
    <div style={{
      height: 42, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 12,
      borderBottom: '1px solid var(--line)', background: 'var(--bg)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        {crumb.map((c, i) => (
          <React.Fragment key={i}>
            <span style={{ fontSize: 12.5, color: i === crumb.length - 1 ? 'var(--ink)' : 'var(--ink-3)', fontWeight: i === crumb.length - 1 ? 500 : 450, whiteSpace: 'nowrap' }}>{c}</span>
            {i < crumb.length - 1 && <span style={{ color: 'var(--ink-4)', fontSize: 11 }}>/</span>}
          </React.Fragment>
        ))}
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
        <button className="hld-btn hld-btn-ghost" onClick={onCmdK}>
          <HIcon k="search" size={12} /> <span>Search & jump</span> <span className="hld-kbd">⌘K</span>
        </button>
        {right}
      </div>
    </div>
  );
}

Object.assign(window, { HalideSidebar, HalideTopbar });
