// Outer Probe shell. Owns route state, sidebar, and right-pane content.
//
// Routes:
//   home    → window.ProbeHome (suggested directions + compact input)
//   project → iframe to Probe Project.html (kept mounted; src bound to active project)
//   config  → iframe to Probe Config.html (kept mounted; preserves edits across nav)
//
// We keep iframes mounted and toggle visibility so user state survives navigation.

const { useState, useEffect, useRef, useCallback } = React;
const palette = window.__probePalette;

function CommandPalette({ open, onClose, onNavigate, onLaunchPrompt }) {
  const [q, setQ] = useState('');
  const inputRef = useRef(null);
  useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);
  if (!open) return null;

  const recents = window.PROBE_RECENTS;
  const items = [
    { kind: 'action', label: 'new project',   hint: 'home', run: () => onNavigate('home') },
    { kind: 'action', label: 'open config',   hint: 'config', run: () => onNavigate('config') },
    ...recents.map((r) => ({
      kind: 'project', label: r.title, hint: r.stageLabel + ' · ' + r.when,
      run: () => onNavigate('project', r.id),
    })),
  ];
  const filtered = q.trim()
    ? items.filter((it) => it.label.toLowerCase().includes(q.toLowerCase()))
    : items;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '12vh', zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 520, maxWidth: '90vw',
          background: palette.bg2, border: `1px solid ${palette.rule}`,
          borderRadius: 4, overflow: 'hidden',
        }}
      >
        <div style={{
          padding: '12px 14px', borderBottom: `1px solid ${palette.rule}`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ color: palette.amber }}>›</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'Enter' && filtered[0]) { filtered[0].run(); onClose(); }
            }}
            placeholder="jump to project, action, or page…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: palette.ink, fontFamily: 'inherit', fontSize: 14,
            }}
          />
          <span style={{
            color: palette.ink4, fontSize: 10, padding: '1px 6px',
            border: `1px solid ${palette.rule}`, borderRadius: 2,
          }}>esc</span>
        </div>
        <div style={{ maxHeight: 360, overflowY: 'auto', padding: '6px 0' }}>
          {filtered.length === 0 && (
            <div style={{ padding: '14px', color: palette.ink4, fontSize: 12 }}>no matches</div>
          )}
          {filtered.map((it, i) => (
            <button
              key={i}
              onClick={() => { it.run(); onClose(); }}
              style={{
                display: 'flex', width: '100%', alignItems: 'center', gap: 12,
                padding: '8px 14px',
                background: i === 0 ? '#13181f' : 'transparent',
                border: 'none', borderLeft: `2px solid ${i === 0 ? palette.amber : 'transparent'}`,
                color: palette.ink2, fontFamily: 'inherit', fontSize: 13,
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <span style={{ color: palette.ink4, fontSize: 11, width: 60 }}>{it.kind}</span>
              <span style={{ color: palette.ink, flex: 1 }}>{it.label}</span>
              <span style={{ color: palette.ink4, fontSize: 11 }}>{it.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

window.ProbeShell = function ProbeShell() {
  const [route, setRoute] = useState('home');           // 'home' | 'newproject' | 'project' | 'config'
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  // When the user manually toggles the sidebar, stop auto-managing it on stage changes.
  const [autoCollapse, setAutoCollapse] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [projectIframeSrc, setProjectIframeSrc] = useState(null);
  const [newProjectIframeSrc, setNewProjectIframeSrc] = useState(null);
  // Latest stage reported by the new-project iframe.
  const [npStage, setNpStage] = useState('input');
  const configIframeSrc = 'Probe Config.html';

  // mock key resolution state — would normally come from config
  const keyState = { source: 'config', label: 'config.toml' };

  const onToggleCollapsed = useCallback(() => {
    setCollapsed((v) => !v);
    setAutoCollapse(false);
  }, []);

  const onNavigate = useCallback((next, projectId) => {
    if (next === 'project') {
      setActiveProjectId(projectId || null);
      if (!projectIframeSrc) setProjectIframeSrc('Probe Project.html');
      setRoute('project');
      // re-arm auto behavior on top-level navigation
      setAutoCollapse(true);
    } else if (next === 'home') {
      setRoute('home');
      setAutoCollapse(true);
      setCollapsed(false);
    } else if (next === 'config') {
      setRoute('config');
      setAutoCollapse(true);
      setCollapsed(false);
    }
  }, [projectIframeSrc]);

  const onLaunchPrompt = useCallback((prompt) => {
    const url = 'Probe New Project.html?prompt=' + encodeURIComponent(prompt) + '&go=brainstorm';
    setNewProjectIframeSrc(url);
    setRoute('newproject');
    setAutoCollapse(true);
  }, []);

  // Listen for postMessage from child iframes (new project flow).
  useEffect(() => {
    const onMsg = (e) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === 'probe-nav' && e.data.target === 'home') {
        setRoute('home'); setAutoCollapse(true); setCollapsed(false);
      } else if (e.data.type === 'probe-stage') {
        setNpStage(e.data.stage);
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  // Auto-collapse sidebar when user is past the brainstorm step in the new-project flow.
  // Only acts when autoCollapse is still true (user hasn't manually overridden).
  useEffect(() => {
    if (!autoCollapse) return;
    if (route !== 'newproject') return;
    const past = ['literature','methodology','artifacts','evaluation','report','done'];
    if (past.indexOf(npStage) >= 0) setCollapsed(true);
    else setCollapsed(false);
  }, [route, npStage, autoCollapse]);

  // ⌘K / Ctrl+K command palette + ⌘N for new project + ⌘B toggle sidebar
  useEffect(() => {
    const onKey = (e) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      } else if (meta && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setRoute('home');
        setCollapsed(false);
        setAutoCollapse(true);
      } else if (meta && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        onToggleCollapsed();
      } else if (e.key === 'Escape' && paletteOpen) {
        setPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paletteOpen, onToggleCollapsed]);

  return (
    <div style={{ display: 'flex', height: '100%', background: palette.bg }}>
      <window.ProbeSidebar
        active={route === 'newproject' ? 'home' : route}
        activeProjectId={activeProjectId}
        onNavigate={onNavigate}
        collapsed={collapsed}
        onToggleCollapsed={onToggleCollapsed}
        keyState={keyState}
      />

      <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
        {/* HOME */}
        <div style={{
          position: 'absolute', inset: 0,
          display: route === 'home' ? 'block' : 'none',
        }}>
          <window.ProbeHome
            onLaunchPrompt={onLaunchPrompt}
            onOpenProject={(id) => onNavigate('project', id)}
          />
        </div>

        {/* NEW PROJECT (iframe) — only mounted once user clicks a suggestion or types a prompt */}
        {newProjectIframeSrc && (
          <iframe
            key={newProjectIframeSrc}
            src={newProjectIframeSrc}
            title="new project"
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              border: 'none', background: palette.bg,
              display: route === 'newproject' ? 'block' : 'none',
            }}
          />
        )}

        {/* PROJECT (iframe) */}
        {projectIframeSrc && (
          <iframe
            src={projectIframeSrc}
            title="project"
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              border: 'none', background: palette.bg,
              display: route === 'project' ? 'block' : 'none',
            }}
          />
        )}

        {/* CONFIG (iframe — mounted lazily, then kept alive) */}
        {(route === 'config' || (configIframeSrc && false)) && (
          <iframe
            src={configIframeSrc}
            title="config"
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              border: 'none', background: palette.bg,
              display: route === 'config' ? 'block' : 'none',
            }}
          />
        )}

        {/* hint strip — always visible, shows ⌘B + ⌘K */}
        <div style={{
          position: 'absolute', bottom: 12, right: 16, zIndex: 10,
          display: 'flex', alignItems: 'center', gap: 14,
          color: palette.ink4, fontSize: 10.5,
          background: palette.bg, padding: '4px 10px',
          border: `1px solid ${palette.rule}`, borderRadius: 2,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              padding: '0 5px', border: `1px solid ${palette.rule}`, borderRadius: 2,
              color: palette.ink3,
            }}>⌘B</span>
            <span>{collapsed ? 'show sidebar' : 'hide sidebar'}</span>
          </span>
          <span style={{ color: palette.ink4 }}>·</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              padding: '0 5px', border: `1px solid ${palette.rule}`, borderRadius: 2,
              color: palette.ink3,
            }}>⌘K</span>
            <span>command palette</span>
          </span>
        </div>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={onNavigate}
        onLaunchPrompt={onLaunchPrompt}
      />
    </div>
  );
};
