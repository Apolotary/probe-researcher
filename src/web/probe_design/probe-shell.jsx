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
  const newProjectIframeRef = useRef(null);
  // When the user manually toggles the sidebar, stop auto-managing it on stage changes.
  const [autoCollapse, setAutoCollapse] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [projectIframeSrc, setProjectIframeSrc] = useState(null);
  const [newProjectIframeSrc, setNewProjectIframeSrc] = useState(null);
  // Latest stage reported by the new-project iframe.
  const [npStage, setNpStage] = useState('input');
  const configIframeSrc = 'Probe Config.html';

  // Real API-key resolution state, fetched from /api/probe/status.
  // Defaults to 'none' so a fresh open without a key shows red until
  // the status fetch resolves — better than flashing a misleading
  // green dot. The status endpoint now reports the active provider,
  // so OpenAI-from-env users get an honest "openai · env" label
  // instead of being conflated with config.toml.
  const [keyState, setKeyState] = useState({ source: 'none', label: '— checking' });
  useEffect(() => {
    fetch('/api/probe/status')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (!d) return;
        // Resolve the source string from whichever provider is active.
        // anthropicSource / openaiSource are 'env' | 'config' | 'unset'.
        const isAnthropic = d.provider === 'anthropic';
        const isOpenai    = d.provider === 'openai';
        const src         = isAnthropic ? d.anthropicSource
                          : isOpenai    ? d.openaiSource
                          : 'unset';
        if (src && src !== 'unset') {
          const provLabel = isAnthropic ? 'anthropic'
                          : isOpenai    ? 'openai'
                          : d.provider;
          setKeyState({
            source: src,                                // 'env' | 'config'
            label: `${provLabel} · ${src === 'env' ? 'env' : 'config.toml'}`,
          });
        } else {
          setKeyState({ source: 'none', label: 'no key set' });
        }
      })
      .catch(() => setKeyState({ source: 'none', label: 'unreachable' }));

    // Real recents — replace the hard-coded sample projects in the
    // sidebar with whatever demo recordings actually exist on disk.
    // Falls back to the bundled mock list if the fetch fails so the
    // sidebar never paints empty during the load.
    fetch('/api/probe/demo/list')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (!d || !Array.isArray(d.demos)) return;
        // Promote disk demos into the recents shape the sidebar
        // already understands. Bundled demos get a 'sample' chip so
        // judges see them as starter content, not personal history.
        const realRecents = d.demos.map((demo, i) => ({
          id: demo.name,
          title: demo.name,
          premise: demo.premise || '',
          stage: 'done',
          stageLabel: demo.bundled ? 'sample · bundled' : 'saved demo',
          group: i === 0 ? 'today' : 'last7',
          when: demo.savedAt
            ? new Date(demo.savedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
            : '—',
        }));
        if (realRecents.length > 0) {
          window.PROBE_RECENTS = realRecents;
          // Trigger a re-render by dispatching a fake resize — the
          // sidebar reads window.PROBE_RECENTS lazily; hot-swapping
          // the global plus a tick gets it picked up.
          try {
            const ev = new CustomEvent('probe-recents-updated', { detail: realRecents });
            window.dispatchEvent(ev);
          } catch { /* */ }
        }
      })
      .catch(() => { /* keep mock recents */ });

    // Per-stage model routing — exposed via window global so the
    // iframe stage components can read it without each making its
    // own request. Hydrated from /api/probe/models.
    fetch('/api/probe/models')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (!d) return;
        window.__probeStageModels = d.models;
        window.__probeStageMode   = d.mode;
        // Notify already-mounted iframes so they refresh badge text.
        try {
          const ev = new CustomEvent('probe-models-loaded', { detail: d });
          window.dispatchEvent(ev);
        } catch { /* */ }
      })
      .catch(() => { /* badges fall back to defaults */ });
  }, []);

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

  // mode: 'go' (default) auto-advances to brainstorm — used when the
  // user has committed (typed + Enter, or used the command palette).
  // mode: 'edit' just pre-fills the premise textarea so the user can
  // tweak the wording before advancing — used when clicking a
  // suggestion they haven't yet committed to.
  const onLaunchPrompt = useCallback((prompt, mode = 'go') => {
    const params = new URLSearchParams({ prompt });
    if (mode === 'go') params.set('go', 'brainstorm');
    const url = 'Probe New Project.html?' + params.toString();
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

  // Re-focus the new-project iframe whenever it becomes the active route
  // (e.g. user clicked sidebar then came back). onLoad only fires on
  // initial load, not on route toggles, so this is the ongoing handle.
  useEffect(() => {
    if (route === 'newproject' && newProjectIframeRef.current) {
      try { newProjectIframeRef.current.contentWindow?.focus(); } catch { /* */ }
    }
  }, [route]);

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

  // Cues rail listens for postMessage'd cues from iframes that prefer
  // to defer to the parent. Iframes can also reach
  // window.parent.__probePublishCue directly (same-origin under /ui/),
  // which is the preferred path; this listener is the fallback for any
  // future cross-origin embed or for hand-rolled tooling.
  useEffect(() => {
    const onMsg = (e) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === 'probe-publish-cue' && e.data.cue && window.__probePublishCue) {
        window.__probePublishCue(e.data.cue);
      } else if (e.data.type === 'probe-cue-open' && e.data.cue) {
        // Deep-link from the rail's "open source" button. Best-effort
        // routing: navigate to the project route if no obvious target,
        // since most cue sources live inside the project iframe today.
        if (e.data.cue.href && typeof e.data.cue.href === 'string') {
          // No-op for now — leave routing to the iframe that emitted
          // the cue once it receives the message back via postMessage.
        }
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

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

        {/* NEW PROJECT (iframe) — only mounted once user clicks a suggestion
            or types a prompt. ref + onLoad focus the iframe's contentWindow
            so per-stage keyboard shortcuts (1/2/3 to open artifacts, ↵ to
            advance, ← → to switch RQ) fire even if the user clicked the
            sidebar last. Without this, clicks on parent shell elements
            (sidebar, replay badge, etc.) leave the iframe unfocused and
            keypresses go to the parent's no-op handler. */}
        {newProjectIframeSrc && (
          <iframe
            ref={newProjectIframeRef}
            key={newProjectIframeSrc}
            src={newProjectIframeSrc}
            title="new project"
            onLoad={(e) => {
              if (route === 'newproject') {
                try { e.currentTarget.contentWindow?.focus(); } catch { /* cross-origin no-op */ }
              }
            }}
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

        {/* Hint strip — anchored bottom-LEFT so it doesn't collide with
            the per-stage footer's "continue · …" button on the right.
            Hidden during the new-project iframe flow because each stage
            has its own footer hints (← → switch RQ, ↵ continue, etc.)
            and a second hint strip would overlap them. Shown on home,
            project, and config views where the iframe doesn't paint
            its own bottom bar. */}
        {route !== 'newproject' && (
          <div style={{
            position: 'absolute', bottom: 12, left: 16, zIndex: 10,
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
        )}
      </div>

      {/* RIGHT RAIL — persistent AI-cues sidebar.
          Lives as a flex sibling so it never overlays the iframe;
          collapsed = ~28px badge strip, expanded = ~320px panel.
          User toggle persists in localStorage (probe.cues.collapsed).
          Panel handles its own state — the shell only mounts it. */}
      {window.CuesPanel && <window.CuesPanel />}

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={onNavigate}
        onLaunchPrompt={onLaunchPrompt}
      />
    </div>
  );
};
