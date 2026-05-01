// Persistent right-rail "AI cues" sidebar.
//
// Background. Rayan et al. (C&C '24) measured that 44% of AI-emitted
// conversational cues went unseen because the cue surface lived inside
// whichever stage emitted them — once the user navigated away, the
// rehearsal note was gone. This rail keeps every cue visible across
// route changes: pre-mortem frictions, adversarial-review consensus,
// disagreement-audit "real disagreements," and capture-risk pattern
// hits all land here with a timestamp, severity color, and source-stage
// badge.
//
// Architecture.
//   * Module-level array `_cues` holds the bus. Subscribers register
//     via `_subscribers`; `__probePublishCue` writes to the array and
//     fans out to every subscriber.
//   * `window.__probePublishCue(cue)` is exposed at the global so
//     iframe-loaded views can call `window.parent.__probePublishCue`.
//   * `window.useCues()` is a hook for components (and the panel
//     itself) to read the live array without prop-drilling.
//   * `window.CuesPanel` is the rail React component the shell mounts.
//
// Provenance discipline.
//   The panel renders AI rehearsal output, not findings. Every cue
//   carries a provenance chip; default is AGENT_INFERENCE. A slim
//   accentWarn-colored banner at the top of the expanded rail says
//   "rehearsal notes — not user findings" so a glance never confuses
//   these for evidence. Empty-state and filter copy were screened
//   against the forbidden-phrase list in CLAUDE.md.

const palette = window.__probePalette;

// ─── module-level cue bus ────────────────────────────────────
// Keep these outside React state so any caller — including ones that
// only have access to `window.__probePublishCue` from inside an iframe
// — can publish a cue and have every mounted CuesPanel re-render.

const _cues = [];                    // newest-last; we sort on read
const _seenIds = new Set();          // dedupe stable ids
const _subscribers = new Set();      // Set<() => void>
let _nextSeq = 1;                    // monotonic tiebreaker for sort

function _notify() {
  // Snapshot to avoid set-mutation-during-iteration if a subscriber
  // unmounts during fan-out.
  const subs = [..._subscribers];
  for (const fn of subs) {
    try { fn(); } catch { /* swallow — one bad subscriber must not break the bus */ }
  }
}

// Public publisher. Returns the canonical cue object (with `ts`,
// `seq`, `dismissed=false` filled in) or `null` if the cue was a
// duplicate by id. Idempotent on duplicate id.
function publishCue(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = raw.id || `cue_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  if (_seenIds.has(id)) return null;
  _seenIds.add(id);

  const cue = {
    id,
    ts: typeof raw.ts === 'number' ? raw.ts : Date.now(),
    seq: _nextSeq++,
    source: raw.source || 'agent',
    stage: raw.stage || raw.source || 'agent',
    severity: raw.severity || 'info',
    title: String(raw.title || '').slice(0, 80),
    body: raw.body ? String(raw.body).slice(0, 300) : undefined,
    provenance: raw.provenance || 'AGENT_INFERENCE',
    reviewerId: raw.reviewerId,
    axis: raw.axis,
    href: raw.href,
    dismissed: false,
    applied: false,
    unread: true,
  };
  _cues.push(cue);
  _notify();
  return cue;
}

// Per-cue state mutators. Used by the panel's × button (dismiss),
// "applied" toggle, and the unread-clear when a cue scrolls into view
// of the expanded rail.
function _setCueFlag(id, patch) {
  const idx = _cues.findIndex((c) => c.id === id);
  if (idx < 0) return;
  _cues[idx] = { ..._cues[idx], ...patch };
  _notify();
}

// Subscription primitive used by useCues.
function _subscribe(fn) {
  _subscribers.add(fn);
  return () => _subscribers.delete(fn);
}

// Public hook — components can read the live array. We return a copy
// sorted newest-first so callers don't accidentally mutate the bus.
function useCues() {
  const [, setTick] = React.useState(0);
  React.useEffect(() => _subscribe(() => setTick((t) => t + 1)), []);
  return React.useMemo(() => {
    const copy = [..._cues];
    copy.sort((a, b) => b.ts - a.ts || b.seq - a.seq);
    return copy;
  }, [_cues.length, _cues.map((c) => c.id + ':' + (c.dismissed ? 'd' : '') + (c.applied ? 'a' : '')).join('|')]);
  // eslint-disable-line — the join() above is intentional to invalidate the memo on flag changes
}

// ─── severity & source maps ──────────────────────────────────

const SEVERITY_COLOR = {
  critical: palette.accentWarn,
  high:     palette.accentWarn,
  medium:   palette.accentAmber,
  low:      palette.accentInfo,
  info:     palette.fgMute,
};

const SEVERITY_RANK = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };

const SOURCE_LABEL = {
  'review':       'review',
  'audit':        'audit',
  'pre-mortem':   'pre-mortem',
  'capture-risk': 'capture-risk',
  'rebuttal':     'rebuttal',
  'agent':        'agent',
};

const ALL_SOURCES   = ['review', 'audit', 'pre-mortem', 'capture-risk', 'rebuttal', 'agent'];
const ALL_SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'];

// ─── small UI helpers ────────────────────────────────────────

function relativeTime(ts) {
  const delta = Math.max(0, Date.now() - ts);
  const s = Math.floor(delta / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function ProvenanceChip({ tag }) {
  const taxonomy = window.ProvenanceTaxonomy || {};
  const meta = taxonomy[tag] || taxonomy.AGENT_INFERENCE
    || { color: palette.fgMute, label: 'agent reasoning' };
  return (
    <span
      title={meta.hint || meta.label}
      style={{
        display: 'inline-block', padding: '0 6px',
        fontSize: 9, letterSpacing: '0.10em', textTransform: 'uppercase',
        color: meta.color, border: `1px solid ${meta.color}55`,
        borderRadius: 999, fontWeight: 600,
      }}>
      {meta.label}
    </span>
  );
}

function FilterChip({ label, count, on, color, onClick }) {
  const tint = color || palette.fgSecondary;
  return (
    <button
      onClick={onClick}
      style={{
        background: on ? `${tint}1a` : 'transparent',
        border: `1px solid ${on ? tint : palette.border}`,
        color: on ? tint : palette.fgMute,
        fontFamily: 'inherit', fontSize: 10.5, padding: '1px 8px',
        borderRadius: 999, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 5,
      }}>
      <span>{label}</span>
      {typeof count === 'number' && (
        <span style={{ opacity: 0.7 }}>· {count}</span>
      )}
    </button>
  );
}

function CueRow({ cue, onDismiss, onApply, onOpen }) {
  const sevColor = SEVERITY_COLOR[cue.severity] || palette.fgMute;
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="fade-in"
      style={{
        position: 'relative',
        padding: '8px 10px 8px 12px',
        marginBottom: 6,
        borderLeft: `3px solid ${sevColor}`,
        background: hover ? palette.bgPanelHover : palette.bgPanel,
        borderRadius: '0 3px 3px 0',
        opacity: cue.dismissed ? 0.55 : 1,
      }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap',
        marginBottom: 4,
      }}>
        <span style={{
          color: sevColor, fontSize: 9, fontWeight: 700,
          letterSpacing: '0.10em', textTransform: 'uppercase',
        }}>{cue.severity}</span>
        <span style={{
          color: palette.fgSecondary, fontSize: 10,
          padding: '0 5px', border: `1px solid ${palette.border}`,
          borderRadius: 2, fontFamily: palette.fontMono,
        }}>{SOURCE_LABEL[cue.source] || cue.source}</span>
        {cue.axis && (
          <span style={{
            color: palette.fgMute, fontSize: 10, fontFamily: palette.fontMono,
          }}>· {cue.axis}</span>
        )}
        <span style={{
          marginLeft: 'auto', color: palette.fgMute, fontSize: 10,
        }}>{relativeTime(cue.ts)}</span>
        <button
          onClick={() => onDismiss(cue.id)}
          title={cue.dismissed ? 'restore' : 'dismiss'}
          style={{
            background: 'transparent', border: 'none', color: palette.fgMute,
            cursor: 'pointer', fontSize: 12, lineHeight: 1, padding: '0 2px',
          }}>{cue.dismissed ? '↺' : '×'}</button>
      </div>
      <div style={{
        color: palette.fgStrong, fontSize: 12.5, lineHeight: 1.45,
        marginBottom: cue.body ? 4 : 0,
        textDecoration: cue.dismissed ? 'line-through' : 'none',
      }}>{cue.title}</div>
      {cue.body && (
        <div style={{
          color: palette.fgBody, fontSize: 11.5, lineHeight: 1.5,
          marginBottom: 6,
        }}>{cue.body}</div>
      )}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
      }}>
        <ProvenanceChip tag={cue.provenance} />
        {cue.reviewerId && (
          <span style={{
            color: palette.fgMute, fontSize: 9.5, fontFamily: palette.fontMono,
          }}>· {cue.reviewerId}</span>
        )}
        <span style={{ flex: 1 }} />
        {cue.href && (
          <button
            onClick={() => onOpen(cue)}
            style={{
              background: 'transparent', border: 'none', color: palette.accentLink,
              fontFamily: 'inherit', fontSize: 10.5, cursor: 'pointer',
              textDecoration: 'underline', padding: 0,
            }}>open source</button>
        )}
        {!cue.dismissed && (
          <button
            onClick={() => onApply(cue.id)}
            title={cue.applied ? 'mark un-applied' : 'mark as applied'}
            style={{
              background: cue.applied ? `${palette.accentGood}22` : 'transparent',
              border: `1px solid ${cue.applied ? palette.accentGood : palette.border}`,
              color: cue.applied ? palette.accentGood : palette.fgMute,
              fontFamily: 'inherit', fontSize: 10, padding: '0 6px',
              borderRadius: 2, cursor: 'pointer',
            }}>{cue.applied ? '✓ applied' : 'mark applied'}</button>
        )}
      </div>
    </div>
  );
}

// ─── empty state ─────────────────────────────────────────────
// Single Braille glyph + a one-liner. Wording screened against the
// forbidden-phrase list (no "users preferred" / "validated" / etc.).

function EmptyState() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 8, padding: '28px 14px', color: palette.fgMute, textAlign: 'center',
    }}>
      <div style={{
        fontFamily: palette.fontMono, fontSize: 18,
        color: palette.fgFaint, letterSpacing: '0.2em',
      }}>⠿</div>
      <div style={{ fontSize: 11, lineHeight: 1.5, maxWidth: 220 }}>
        AI suggestions appear here as the pipeline runs.
      </div>
      <div style={{ fontSize: 10, color: palette.fgFaint, lineHeight: 1.5, maxWidth: 240 }}>
        Pre-mortem frictions, audit hits, and reviewer notes accumulate so nothing slips while you're elsewhere.
      </div>
    </div>
  );
}

// ─── the rail itself ─────────────────────────────────────────

const RAIL_W           = 320;
const COLLAPSED_W      = 28;
const PULSE_DURATION   = 600;   // ms — see CLAUDE.md "Visibility without distraction"
const COLLAPSE_KEY     = 'probe.cues.collapsed';

// Default initial collapse:
//   - if there are already cues at mount time, expand
//   - otherwise collapse and quietly wait
//   - user override always wins via localStorage
function _readInitialCollapsed(currentCueCount) {
  try {
    const stored = window.localStorage.getItem(COLLAPSE_KEY);
    if (stored === '1') return true;
    if (stored === '0') return false;
  } catch { /* localStorage may be unavailable in a sandboxed iframe */ }
  return currentCueCount === 0;
}

function CuesPanel() {
  const cues = useCues();
  const [collapsed, setCollapsed] = React.useState(() => _readInitialCollapsed(cues.length));
  const [tab, setTab] = React.useState('active');           // 'active' | 'dismissed'
  const [sourceFilter, setSourceFilter] = React.useState(new Set(ALL_SOURCES));
  const [severityFilter, setSeverityFilter] = React.useState(new Set(ALL_SEVERITIES));
  const [pulse, setPulse] = React.useState(false);
  const lastSeenSeqRef = React.useRef(0);
  const listRef = React.useRef(null);

  // Persist collapse state. Don't write on first render or we'd
  // overwrite a no-cue startup with whatever the default flips to.
  const collapseTouchedRef = React.useRef(false);
  React.useEffect(() => {
    if (!collapseTouchedRef.current) return;
    try { window.localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0'); } catch { /* */ }
  }, [collapsed]);

  // Pulse the collapse handle when a brand-new cue (seq we haven't
  // seen before) lands. The unread badge ticks up regardless.
  React.useEffect(() => {
    const newest = cues[0];
    if (!newest) return;
    if (newest.seq > lastSeenSeqRef.current) {
      lastSeenSeqRef.current = newest.seq;
      setPulse(true);
      const t = setTimeout(() => setPulse(false), PULSE_DURATION);
      return () => clearTimeout(t);
    }
  }, [cues.length, cues[0] && cues[0].seq]);

  // When the rail is expanded, mark the visible (active-tab) cues as
  // read so the unread count stops ticking. Dismissed-tab views don't
  // count as reading.
  React.useEffect(() => {
    if (collapsed) return;
    if (tab !== 'active') return;
    let dirty = false;
    for (const c of _cues) {
      if (c.unread && !c.dismissed) {
        c.unread = false;
        dirty = true;
      }
    }
    if (dirty) _notify();
  }, [collapsed, tab, cues.length]);

  const onToggleCollapsed = React.useCallback(() => {
    collapseTouchedRef.current = true;
    setCollapsed((v) => !v);
  }, []);

  const onDismiss = React.useCallback((id) => {
    const c = _cues.find((x) => x.id === id);
    if (!c) return;
    _setCueFlag(id, { dismissed: !c.dismissed });
  }, []);
  const onApply = React.useCallback((id) => {
    const c = _cues.find((x) => x.id === id);
    if (!c) return;
    _setCueFlag(id, { applied: !c.applied });
  }, []);
  const onOpen = React.useCallback((cue) => {
    if (!cue.href) return;
    // postMessage to parent if we're inside one — this keeps deep-link
    // routing in the shell's hands. Fall back to direct nav otherwise.
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'probe-cue-open', cue }, '*');
        return;
      }
    } catch { /* */ }
    try { window.location.assign(cue.href); } catch { /* */ }
  }, []);

  const toggleSource = (s) => setSourceFilter((prev) => {
    const next = new Set(prev);
    if (next.has(s)) next.delete(s); else next.add(s);
    return next;
  });
  const toggleSeverity = (s) => setSeverityFilter((prev) => {
    const next = new Set(prev);
    if (next.has(s)) next.delete(s); else next.add(s);
    return next;
  });

  // Partition + filter
  const active    = cues.filter((c) => !c.dismissed);
  const dismissed = cues.filter((c) =>  c.dismissed);
  const filtered  = (tab === 'active' ? active : dismissed).filter((c) =>
    sourceFilter.has(c.source) && severityFilter.has(c.severity)
  );
  const unread = active.filter((c) => c.unread).length;

  const sourceCounts = React.useMemo(() => {
    const m = {};
    for (const s of ALL_SOURCES) m[s] = active.filter((c) => c.source === s).length;
    return m;
  }, [active.length, active.map((c) => c.source).join(',')]);
  const severityCounts = React.useMemo(() => {
    const m = {};
    for (const s of ALL_SEVERITIES) m[s] = active.filter((c) => c.severity === s).length;
    return m;
  }, [active.length, active.map((c) => c.severity).join(',')]);

  // ─── collapsed rendering ───────────────────────────────────
  if (collapsed) {
    return (
      <div style={{
        width: COLLAPSED_W, flexShrink: 0,
        borderLeft: `1px solid ${palette.border}`, background: palette.bgPage,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '10px 0', position: 'relative',
      }}>
        <button
          onClick={onToggleCollapsed}
          title="show AI cues"
          style={{
            width: 24, height: 24, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: pulse ? palette.amberSoft : 'transparent',
            border: `1px solid ${pulse ? palette.accentAmber : palette.border}`,
            borderRadius: 3, color: palette.fgSecondary,
            fontFamily: 'inherit', fontSize: 12, cursor: 'pointer',
            transition: 'background 200ms, border-color 200ms',
          }}>‹</button>
        {unread > 0 && (
          <div
            title={`${unread} unseen cue${unread === 1 ? '' : 's'}`}
            style={{
              marginTop: 6, minWidth: 18, padding: '0 4px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 999, background: palette.accentAmber,
              color: palette.bgPage, fontSize: 10, fontWeight: 700,
              lineHeight: '16px', fontFamily: palette.fontMono,
            }}>{unread > 99 ? '99+' : unread}</div>
        )}
        <div style={{
          marginTop: 12, writingMode: 'vertical-rl', transform: 'rotate(180deg)',
          color: palette.fgMute, fontSize: 10, letterSpacing: '0.20em',
          textTransform: 'uppercase', userSelect: 'none',
        }}>cues · rehearsal</div>
      </div>
    );
  }

  // ─── expanded rendering ────────────────────────────────────
  return (
    <div style={{
      width: RAIL_W, flexShrink: 0,
      borderLeft: `1px solid ${palette.border}`, background: palette.bgPage,
      display: 'flex', flexDirection: 'column', minHeight: 0,
    }}>
      {/* HEAD — title + collapse */}
      <div style={{
        padding: '10px 12px', borderBottom: `1px solid ${palette.border}`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{
          color: palette.accentAmber, fontSize: 11, fontWeight: 700,
          letterSpacing: '0.10em', textTransform: 'uppercase',
        }}>AI cues</span>
        <span style={{
          color: palette.fgMute, fontSize: 10, fontFamily: palette.fontMono,
        }}>{active.length} active{dismissed.length > 0 ? ` · ${dismissed.length} hidden` : ''}</span>
        <button
          onClick={onToggleCollapsed}
          title="collapse cues"
          style={{
            marginLeft: 'auto', background: 'transparent', border: 'none',
            color: palette.fgMute, fontSize: 13, cursor: 'pointer', padding: '0 4px',
          }}>›</button>
      </div>

      {/* BANNER — rehearsal-not-evidence framing. CLAUDE.md commitment. */}
      <div style={{
        padding: '6px 12px', background: palette.bgPanel,
        borderBottom: `1px solid ${palette.border}`,
        color: palette.accentWarn, fontSize: 10.5, lineHeight: 1.4,
        letterSpacing: '0.02em',
      }}>
        rehearsal notes — not user findings. Each cue is AI output flagged for the researcher to weigh.
      </div>

      {/* TABS */}
      <div style={{
        display: 'flex', borderBottom: `1px solid ${palette.border}`,
      }}>
        {[
          { id: 'active',    label: 'active',    count: active.length },
          { id: 'dismissed', label: 'dismissed', count: dismissed.length },
        ].map((t) => {
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: '7px 10px',
                background: on ? palette.bgPanel : 'transparent',
                border: 'none',
                borderBottom: `2px solid ${on ? palette.accentAmber : 'transparent'}`,
                color: on ? palette.fgStrong : palette.fgMute,
                fontFamily: 'inherit', fontSize: 11.5, cursor: 'pointer',
              }}>
              {t.label} <span style={{
                opacity: 0.7, marginLeft: 4, fontFamily: palette.fontMono, fontSize: 10,
              }}>{t.count}</span>
            </button>
          );
        })}
      </div>

      {/* FILTERS */}
      {cues.length > 0 && (
        <div style={{
          padding: '8px 10px', borderBottom: `1px solid ${palette.border}`,
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap',
          }}>
            <span style={{
              color: palette.fgMute, fontSize: 9.5, letterSpacing: '0.10em',
              textTransform: 'uppercase', marginRight: 2,
            }}>source</span>
            {ALL_SOURCES.filter((s) => sourceCounts[s] > 0 || sourceFilter.has(s) === false).map((s) => (
              <FilterChip
                key={s}
                label={SOURCE_LABEL[s]}
                count={sourceCounts[s] || 0}
                on={sourceFilter.has(s)}
                onClick={() => toggleSource(s)} />
            ))}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap',
          }}>
            <span style={{
              color: palette.fgMute, fontSize: 9.5, letterSpacing: '0.10em',
              textTransform: 'uppercase', marginRight: 2,
            }}>severity</span>
            {ALL_SEVERITIES.filter((s) => severityCounts[s] > 0 || severityFilter.has(s) === false).map((s) => (
              <FilterChip
                key={s}
                label={s}
                count={severityCounts[s] || 0}
                on={severityFilter.has(s)}
                color={SEVERITY_COLOR[s]}
                onClick={() => toggleSeverity(s)} />
            ))}
          </div>
        </div>
      )}

      {/* LIST */}
      <div ref={listRef} style={{
        flex: 1, minHeight: 0, overflowY: 'auto', padding: '8px 8px 12px',
      }}>
        {cues.length === 0 ? (
          <EmptyState />
        ) : filtered.length === 0 ? (
          <div style={{
            padding: '20px 14px', color: palette.fgMute, fontSize: 11,
            textAlign: 'center', border: `1px dashed ${palette.border}`,
            borderRadius: 3, margin: '8px 4px',
          }}>
            No cues match the current filters.
          </div>
        ) : filtered.map((cue) => (
          <CueRow
            key={cue.id}
            cue={cue}
            onDismiss={onDismiss}
            onApply={onApply}
            onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

// ─── exports ─────────────────────────────────────────────────

// If this script loads inside an iframe whose parent already has its
// own __probePublishCue (the shell), publish UP to the parent so the
// rail there receives the cue. Falls back to the local bus when the
// page is opened standalone (e.g. /ui/project in a fresh tab) so cues
// still go somewhere instead of erroring.
const _isFramed = (() => {
  try { return window.parent && window.parent !== window; }
  catch { return false; }
})();

const _parentPublisher = (() => {
  if (!_isFramed) return null;
  try {
    const p = window.parent.__probePublishCue;
    return typeof p === 'function' ? p : null;
  } catch { return null; }
})();

window.__probePublishCue = _parentPublisher
  // Forward to the shell's bus when we're inside an iframe.
  ? function publishCueViaParent(raw) {
      try { return _parentPublisher(raw); }
      catch {
        // Cross-origin or detached parent — fall back to local bus so
        // we don't drop the cue silently. CuesPanel won't be visible
        // here, but `useCues()` from the iframe still works for debug.
        return publishCue(raw);
      }
    }
  : publishCue;

window.CuesPanel = CuesPanel;
window.useCues   = useCues;

// Expose the bus mutators on a private namespace so the panel can
// reach them without re-importing — and so test harnesses can clear
// the bus between scenarios. NOT a public API.
window.__probeCuesBus = {
  _cues, _seenIds, _subscribers,
  _setCueFlag, _subscribe, _notify,
  _clear: () => {
    _cues.length = 0;
    _seenIds.clear();
    _notify();
  },
};
