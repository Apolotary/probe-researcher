// Probe Halide · app shell (sidebar + topbar)
// Simplified pass: sidebar is data-driven. No hardcoded "Priya's workspace"
// or fake stage-5-of-8 progress. When a real run is loaded, the sidebar
// reflects its actual branches and artifacts. When no run is loaded, the
// sidebar shows just the nav and a quiet "no run open" state.

const { useState, useEffect, useRef, useMemo } = React;

// ───────── Sidebar ─────────
function HalideSidebar({ route, setRoute, branches, killBranch, loadedRun }) {
  const [open, setOpen] = useState({ branches: true, artifacts: true });
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  const hasRun = !!(loadedRun && loadedRun.run_id);
  const runBranches = hasRun
    ? Object.values(loadedRun.branches || {}).map((b) => {
        const letter = (b.branch_id || '').toUpperCase();
        const card = b.branch_card || {};
        const audit = b.audit || {};
        const meta = b.meta_review || {};
        const title = card.title || card.research_question || `Branch ${letter}`;
        const verdict = meta.verdict || audit.verdict || '—';
        return {
          id: b.branch_id,
          letter,
          title: String(title).slice(0, 40),
          verdict,
        };
      })
    : window.PROBE_BRANCHES;

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

  const verdictColor = (v) => {
    const s = String(v || '').toUpperCase();
    if (s.includes('BLOCK') || s.includes('REJECT')) return 'var(--rose)';
    if (s.includes('REVIS') || s.includes('HUMAN')) return 'var(--amber)';
    if (s === 'PASSED' || s.includes('ACCEPT') || s === 'SURVIVING') return 'var(--moss)';
    return 'var(--line-2)';
  };

  return (
    <div className="hld-scroll" style={{
      width: 272, background: 'var(--bg)', borderRight: '1px solid var(--line)',
      display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto',
    }}>
      {/* workspace header — real, quiet, unbranded */}
      <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--line)' }}>
        <div style={{
          width: 22, height: 22, borderRadius: 5,
          background: 'linear-gradient(135deg, oklch(60% 0.15 72), oklch(42% 0.10 30))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--bg)', fontWeight: 600, fontSize: 12,
          boxShadow: '0 1px 0 oklch(28% 0.02 255) inset',
        }}>◇</div>
        <div style={{ fontSize: 13, fontWeight: 550, letterSpacing: '-0.005em' }}>probe</div>
        <span className="hld-mono" style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--ink-4)' }}>local</span>
      </div>

      {/* Nav */}
      <div style={{ padding: '6px 6px 8px' }}>
        <div className="hld-row" onClick={() => setRoute({ kind: 'home' })} style={{
          display: 'flex', alignItems: 'center', gap: 8, height: 28, padding: '0 10px',
          borderRadius: 'var(--r-1)', cursor: 'pointer', color: route.kind === 'home' ? 'var(--ink)' : 'var(--ink-2)',
          background: route.kind === 'home' ? 'var(--bg-2)' : 'transparent',
        }}>
          <HIcon k="home" size={13} color="var(--ink-3)" />
          <span style={{ fontSize: 12.5, fontWeight: 450 }}>Home</span>
        </div>
      </div>

      {/* Open run header — only when a run is loaded */}
      {hasRun && (
        <div style={{ padding: '10px 12px 4px', borderTop: '1px solid var(--line)' }}>
          <div className="hld-uc" style={{ fontSize: 10 }}>Run</div>
          <div className="hld-mono" style={{ fontSize: 11, color: 'var(--ink-2)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {loadedRun.run_id}
          </div>
        </div>
      )}

      {/* Branches */}
      {hasRun && (
        <div style={{ padding: '4px 6px 0' }}>
          <TreeHead k="branches" label="Branches" right={`${runBranches.length}`} />
          {open.branches && runBranches.map((b) => {
            const state = branches[b.id];
            const killed = state === 'killed';
            const active = route.kind === 'branch' && route.id === b.id;
            const color = verdictColor(b.verdict);
            return (
              <div key={b.id} className={active ? 'hld-row hld-row-sel' : 'hld-row'} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                height: 28, padding: '0 8px 0 22px',
                borderRadius: 'var(--r-1)', cursor: 'pointer', fontSize: 12.5,
                color: killed ? 'var(--ink-4)' : active ? 'var(--ink)' : 'var(--ink-2)',
                textDecoration: killed ? 'line-through' : 'none',
                whiteSpace: 'nowrap', overflow: 'hidden',
              }} onClick={() => setRoute({ kind: 'branch', id: b.id })}>
                <span className="hld-dot" style={{ background: killed ? 'var(--line-2)' : color }} />
                <span style={{ fontWeight: active ? 500 : 450, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {b.letter} · {b.title}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Artifacts — single flat list, scoped to loaded run */}
      {hasRun && (
        <div style={{ padding: '4px 6px 0' }}>
          <TreeHead k="artifacts" label="Artifacts" right="" />
          {open.artifacts && (() => {
            const entries = [];
            entries.push({ k: 'file', l: 'premise_card.json', route: { kind: 'premise' } });
            Object.values(loadedRun.branches || {}).forEach((b) => {
              const letter = (b.branch_id || '').toUpperCase();
              if (b.branch_card) entries.push({ k: 'file', l: `branch_card · ${letter}`, route: { kind: 'branch', id: b.branch_id } });
              if (b.audit) entries.push({ k: 'file', l: `audit · ${letter}`, route: { kind: 'audit', branch: b.branch_id } });
            });
            if (loadedRun.guidebook_exists) entries.push({ k: 'book', l: 'PROBE_GUIDEBOOK.md', route: { kind: 'guidebook' } });
            return entries.map((a, i) => {
              const active = JSON.stringify(route) === JSON.stringify(a.route);
              return (
                <div key={i} className={active ? 'hld-row hld-row-sel' : 'hld-row'} style={{
                  display: 'flex', alignItems: 'center', gap: 8, height: 26, padding: '0 8px 0 22px',
                  borderRadius: 'var(--r-1)', cursor: 'pointer', fontSize: 12,
                  color: active ? 'var(--ink)' : 'var(--ink-2)', whiteSpace: 'nowrap', overflow: 'hidden',
                }} onClick={() => setRoute(a.route)}>
                  <HIcon k={a.k} size={12} color="var(--ink-4)" />
                  <span style={{ fontFamily: a.l.includes('.json') || a.l.includes('.md') || a.l.includes('walkthrough') || a.l.includes('spec') || a.l.includes('audit') || a.l.includes('branch_card') ? 'JetBrains Mono, monospace' : 'inherit', fontSize: 11.5, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.l}</span>
                </div>
              );
            });
          })()}
        </div>
      )}

      {/* Empty state when no run is open */}
      {!hasRun && (
        <div style={{ padding: '18px 16px', color: 'var(--ink-4)', fontSize: 12, lineHeight: 1.6 }}>
          No run open. Pick one from the Home view, or start a new one with{' '}
          <span className="hld-mono" style={{ color: 'var(--ink-3)' }}>probe run "&lt;premise&gt;"</span>{' '}
          in your terminal.
        </div>
      )}

      <div style={{ marginTop: 'auto', borderTop: '1px solid var(--line)', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="hld-dot" style={{ background: 'var(--moss)' }} />
        <span className="hld-mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>server · 127.0.0.1</span>
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
            <span style={{ fontSize: 12.5, color: i === crumb.length - 1 ? 'var(--ink)' : 'var(--ink-3)', fontWeight: i === crumb.length - 1 ? 500 : 450, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 300 }}>{c}</span>
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
