// Persistent left sidebar for the Probe shell.
// - Probe wordmark + "new project" CTA at top
// - Recents grouped by today / yesterday / last 7 / older
// - Settings + key-status row at bottom
//
// Exposes window.ProbeSidebar.
//
// Receives:
//   active   : 'home' | 'project' | 'config'
//   activeProjectId  : string | null
//   onNavigate(route, projectId?)
//   collapsed, onToggleCollapsed
//   keyState : { source: 'env' | 'config' | 'none', label: string }

const palette = window.__probePalette;
const SIDEBAR_W = 268;
const COLLAPSED_W = 56;

function StageDot({ stage }) {
  const colorMap = {
    framing:     palette.amber,
    literature:  palette.cyan,
    methodology: palette.cyan,
    artifacts:   palette.moss,
    evaluation:  palette.moss,
    report:      palette.moss,
    done:        palette.ink3,
  };
  const c = colorMap[stage] || palette.ink3;
  return (
    <span style={{
      display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
      background: c, flexShrink: 0,
    }} />
  );
}

function GroupHeader({ children }) {
  return (
    <div style={{
      padding: '14px 14px 6px', color: palette.ink4, fontSize: 10,
      letterSpacing: '0.14em', textTransform: 'uppercase',
    }}>
      {children}
    </div>
  );
}

function RecentRow({ item, active, onClick }) {
  const [hover, setHover] = React.useState(false);
  const bg = active ? palette.bg2 : (hover ? '#13181f' : 'transparent');
  const border = active ? palette.amber : 'transparent';
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'block', width: '100%', textAlign: 'left',
        padding: '7px 14px 7px 12px',
        background: bg,
        border: 'none', borderLeft: `2px solid ${border}`,
        color: 'inherit', fontFamily: 'inherit', cursor: 'pointer',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        color: active ? palette.ink : palette.ink2,
        fontSize: 12.5,
        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
      }}>
        <StageDot stage={item.stage} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</span>
      </div>
      <div style={{
        marginLeft: 14, marginTop: 2,
        color: palette.ink4, fontSize: 11,
        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
      }}>
        {item.stageLabel} · {item.when}
      </div>
    </button>
  );
}

function CollapsedSidebar({ active, onNavigate, onToggle }) {
  const Btn = ({ glyph, label, onClick, isActive }) => (
    <button
      onClick={onClick}
      title={label}
      style={{
        width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isActive ? palette.bg2 : 'transparent',
        border: `1px solid ${isActive ? palette.rule : 'transparent'}`,
        borderRadius: 3,
        color: isActive ? palette.amber : palette.ink2,
        fontFamily: 'inherit', fontSize: 14, cursor: 'pointer',
      }}
    >{glyph}</button>
  );
  return (
    <div style={{
      width: COLLAPSED_W, flexShrink: 0,
      borderRight: `1px solid ${palette.rule}`, background: palette.bg,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '14px 0',
    }}>
      <div style={{
        width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: palette.amber, fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em',
      }}>›</div>
      <div style={{ height: 16 }} />
      <Btn glyph="+" label="new project" onClick={() => onNavigate('home')} />
      <div style={{ height: 6 }} />
      <Btn glyph="◇" label="projects"   onClick={() => onNavigate('home')} isActive={active === 'project'} />
      <div style={{ flex: 1 }} />
      <Btn glyph="≡" label="config"     onClick={() => onNavigate('config')} isActive={active === 'config'} />
      <div style={{ height: 6 }} />
      <Btn glyph="»" label="expand sidebar" onClick={onToggle} />
    </div>
  );
}

window.ProbeSidebar = function ProbeSidebar(props) {
  const { active, activeProjectId, onNavigate, collapsed, onToggleCollapsed, keyState } = props;
  const recents = window.PROBE_RECENTS;
  const labels  = window.PROBE_GROUP_LABELS;

  if (collapsed) {
    return <CollapsedSidebar active={active} onNavigate={onNavigate} onToggle={onToggleCollapsed} />;
  }

  // group recents by their .group field, preserving order
  const groups = ['today', 'yesterday', 'last7', 'older']
    .map((g) => ({ key: g, label: labels[g], items: recents.filter((r) => r.group === g) }))
    .filter((g) => g.items.length > 0);

  const newProjectActive = active === 'home';

  return (
    <div style={{
      width: SIDEBAR_W, flexShrink: 0,
      borderRight: `1px solid ${palette.rule}`, background: palette.bg,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* HEAD */}
      <div style={{ padding: '14px 14px 10px', borderBottom: `1px solid ${palette.rule}` }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          color: palette.ink, fontSize: 13, fontWeight: 600,
        }}>
          <span style={{ color: palette.amber }}>›</span>
          <span>probe</span>
          <span style={{ marginLeft: 'auto', color: palette.ink4, fontSize: 11 }}>v0.4</span>
          <button
            onClick={onToggleCollapsed}
            title="collapse sidebar"
            style={{
              background: 'transparent', border: 'none', color: palette.ink3,
              cursor: 'pointer', fontSize: 13, padding: '0 2px',
            }}
          >«</button>
        </div>

        <button
          onClick={() => onNavigate('home')}
          style={{
            marginTop: 10, width: '100%', padding: '8px 10px',
            display: 'flex', alignItems: 'center', gap: 8,
            background: newProjectActive ? palette.amberSoft : 'transparent',
            border: `1px solid ${newProjectActive ? palette.amber : palette.rule}`,
            borderRadius: 3,
            color: newProjectActive ? palette.amber : palette.ink2,
            fontFamily: 'inherit', fontSize: 12.5, cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span style={{ fontSize: 14 }}>+</span>
          <span>new project</span>
          <span style={{
            marginLeft: 'auto', color: palette.ink4, fontSize: 10,
            border: `1px solid ${palette.rule}`, padding: '0 5px', borderRadius: 2,
          }}>⌘N</span>
        </button>

        {/* Replay button right under "new project" — surfaces the
            bundled demo so a judge with no API key has an obvious
            try-it-now affordance. Standalone <a> instead of going
            through the shell router because /ui/replay is its own
            page (not an iframe content). */}
        <a
          href="/ui/replay"
          style={{
            marginTop: 6, display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 10px', background: 'transparent',
            border: `1px solid ${palette.rule}`, borderRadius: 3,
            color: palette.cyan, fontFamily: 'inherit', fontSize: 12.5,
            textDecoration: 'none', textAlign: 'left',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = palette.bg2; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          title="Replay a saved demo run — no API key required"
        >
          <span style={{ fontSize: 12 }}>▶</span>
          <span>replay sample run</span>
          <span style={{
            marginLeft: 'auto', color: palette.ink4, fontSize: 10,
          }}>$0</span>
        </a>
      </div>

      {/* RECENTS */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        <div style={{
          padding: '12px 14px 4px', display: 'flex', alignItems: 'center', gap: 8,
          color: palette.ink3, fontSize: 11, letterSpacing: '0.10em', textTransform: 'uppercase',
        }}>
          <span>recent</span>
          <span style={{ flex: 1, height: 1, background: palette.rule }} />
          <span style={{ color: palette.ink4, fontSize: 10 }}>{recents.length}</span>
        </div>

        {groups.map((g) => (
          <div key={g.key}>
            <GroupHeader>{g.label}</GroupHeader>
            {g.items.map((it) => (
              <RecentRow
                key={it.id}
                item={it}
                active={active === 'project' && activeProjectId === it.id}
                onClick={() => onNavigate('project', it.id)}
              />
            ))}
          </div>
        ))}

        <div style={{ height: 12 }} />
      </div>

      {/* FOOT */}
      <div style={{
        borderTop: `1px solid ${palette.rule}`,
        padding: '10px 14px',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <button
          onClick={() => onNavigate('config')}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '6px 8px',
            background: active === 'config' ? palette.bg2 : 'transparent',
            border: 'none',
            borderLeft: `2px solid ${active === 'config' ? palette.amber : 'transparent'}`,
            color: active === 'config' ? palette.ink : palette.ink2,
            fontFamily: 'inherit', fontSize: 12.5, cursor: 'pointer',
            textAlign: 'left', width: '100%',
          }}
        >
          <span style={{ color: palette.ink3 }}>≡</span>
          <span>config</span>
          <span style={{ marginLeft: 'auto', color: palette.ink4, fontSize: 11 }}>{keyState.label}</span>
        </button>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          color: palette.ink4, fontSize: 10.5, padding: '0 8px',
        }}>
          <span style={{
            display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
            background: keyState.source === 'none' ? palette.rose : palette.moss,
          }} />
          <span>{keyState.source === 'none' ? 'no api key' : 'key resolved · ' + keyState.source}</span>
        </div>
      </div>
    </div>
  );
};
