// Probe home view — quiet landing with three suggested directions.
// Mirrors the old "or try an example" feel: each suggestion is a single row,
// not a card. Three categories sit side-by-side as columns.
//
// Exposes window.ProbeHome.
//   props: { onLaunchPrompt(prompt), onOpenProject(id) }

const { useState, useRef, useEffect } = React;
const palette = window.__probePalette;

function HomeCaret() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const iv = setInterval(() => setOn((v) => !v), 530);
    return () => clearInterval(iv);
  }, []);
  return (
    <span style={{
      display: 'inline-block', width: 7, height: 14, marginLeft: 1,
      background: on ? palette.amber : 'transparent',
      verticalAlign: '-2px',
    }} />
  );
}

function SuggestionRow({ item, idx, onLaunch }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={() => onLaunch(item.prompt)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '20px 1fr 16px',
        alignItems: 'baseline', gap: 10,
        width: '100%', textAlign: 'left',
        padding: '8px 10px',
        background: hover ? palette.bg2 : 'transparent',
        border: 'none',
        borderLeft: `2px solid ${hover ? palette.amber : 'transparent'}`,
        color: 'inherit', fontFamily: 'inherit', cursor: 'pointer',
      }}
    >
      <span style={{ color: palette.ink3, fontSize: 12 }}>{idx + 1}</span>
      <span style={{
        color: hover ? palette.ink : palette.ink2,
        fontSize: 13, lineHeight: 1.45,
      }}>
        {item.prompt}
      </span>
      <span style={{ color: palette.ink3, fontSize: 11, textAlign: 'right' }}>↵</span>
    </button>
  );
}

window.ProbeHome = function ProbeHome({ onLaunchPrompt }) {
  const [text, setText] = useState('');
  const taRef = useRef(null);

  useEffect(() => { if (taRef.current) taRef.current.focus(); }, []);

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onLaunchPrompt(t);
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
    if (e.key === 'Escape') setText('');
  };

  const wc = text.trim() ? text.trim().split(/\s+/).length : 0;
  const suggestions = window.PROBE_SUGGESTIONS;

  return (
    <div style={{
      height: '100%', overflowY: 'auto',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* TOP CRUMB */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 28px', borderBottom: `1px solid ${palette.rule}`,
        color: palette.ink3, fontSize: 11.5,
      }}>
        <span style={{ color: palette.amber }}>›</span>
        <span>probe</span>
        <span style={{ color: palette.ink4 }}>/</span>
        <span style={{ color: palette.ink2 }}>new project</span>
      </div>

      {/* HERO INPUT */}
      <div style={{
        padding: '56px 28px 28px',
        maxWidth: 880, margin: '0 auto', width: '100%', boxSizing: 'border-box',
        flex: '0 0 auto',
      }}>
        <div style={{
          color: palette.ink3, fontSize: 11, letterSpacing: '0.16em',
          textTransform: 'uppercase', marginBottom: 22, textAlign: 'center',
        }}>
          ─────  new project  ─────
        </div>
        <h1 style={{
          margin: 0, fontWeight: 500, fontSize: 28, letterSpacing: '-0.005em',
          color: palette.ink, textAlign: 'center',
        }}>
          What do you want to research?
        </h1>
        <div style={{
          color: palette.ink3, fontSize: 12.5, marginTop: 12, textAlign: 'center',
        }}>
          One sentence. Probe will sharpen it, branch it into three angles, and pause for your input at every step.
        </div>

        {/* First-time-visitor hint. The replay path is the recommended
            entry point for anyone who doesn't have an Anthropic key
            yet — judges, advisors, peers — but a fresh visitor on /ui
            won't know to look at the sidebar. One amber-tinted line
            below the subtitle points them at the no-cost path. */}
        <div style={{
          color: palette.ink3, fontSize: 12, marginTop: 14, textAlign: 'center',
        }}>
          <span style={{ color: palette.ink2 }}>First time? </span>
          Click <span style={{ color: palette.amber, fontWeight: 600 }}>▶ replay sample run</span>
          <span style={{ color: palette.ink2 }}> in the left sidebar — a 14-second walkthrough, no API key needed.</span>
        </div>

        <div style={{
          marginTop: 36, display: 'flex', alignItems: 'flex-start', gap: 10,
          borderTop: `1px solid ${palette.rule}`, borderBottom: `1px solid ${palette.rule}`,
          padding: '18px 4px',
        }}>
          <span style={{ color: palette.amber, fontWeight: 600, fontSize: 16, lineHeight: '24px', userSelect: 'none' }}>›</span>
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              ref={taRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKey}
              rows={2}
              style={{
                width: '100%', padding: 0, minHeight: 24,
                background: 'transparent', border: 'none', outline: 'none', resize: 'none',
                color: palette.ink, fontSize: 16, lineHeight: '24px',
                caretColor: palette.amber,
              }}
            />
            {!text && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, pointerEvents: 'none',
                color: palette.ink4, fontSize: 16, lineHeight: '24px',
              }}>
                <HomeCaret />
                <span style={{ marginLeft: 4 }}>How do remote workers stay focused during long video-call days?</span>
              </div>
            )}
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          marginTop: 10, color: palette.ink3, fontSize: 11.5,
        }}>
          <span>{wc} {wc === 1 ? 'word' : 'words'}</span>
          <span style={{ color: palette.ink4 }}>·</span>
          <span>{text.length} chars</span>
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 14 }}>
            <span><span style={{
              display: 'inline-block', padding: '0 6px', margin: '0 2px',
              border: `1px solid ${palette.rule}`, borderRadius: 3, fontSize: 11,
              color: palette.ink2, background: palette.bg2,
            }}>↵</span> brainstorm</span>
            <span><span style={{
              display: 'inline-block', padding: '0 6px', margin: '0 2px',
              border: `1px solid ${palette.rule}`, borderRadius: 3, fontSize: 11,
              color: palette.ink2, background: palette.bg2,
            }}>esc</span> clear</span>
          </span>
        </div>
      </div>

      {/* SUGGESTED DIRECTIONS — three quiet columns */}
      <div style={{
        padding: '16px 28px 56px',
        maxWidth: 1080, margin: '0 auto', width: '100%', boxSizing: 'border-box',
      }}>
        <div style={{
          color: palette.ink3, fontSize: 11, letterSpacing: '0.12em',
          textTransform: 'uppercase', marginBottom: 14,
          display: 'flex', alignItems: 'baseline', gap: 12,
        }}>
          <span>or try a suggested direction</span>
          <span style={{ flex: 1, height: 1, background: palette.rule }} />
        </div>

        {/* Auto-collapse the suggestions grid on narrower viewports.
            At 1280px-wide laptops the third column was getting clipped;
            auto-fit with a 280px minimum collapses to 2 cols around
            1100px and 1 col around 800px without a media query. */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 28,
        }}>
          {suggestions.groups.map((group) => (
            <div key={group.key}>
              <div style={{
                color: palette.amber, fontSize: 11, letterSpacing: '0.08em',
                textTransform: 'uppercase', marginBottom: 4,
              }}>
                {group.label}
              </div>
              <div style={{
                color: palette.ink4, fontSize: 11, marginBottom: 10,
                lineHeight: 1.45,
              }}>
                {group.hint}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {group.items.map((item, i) => (
                  <SuggestionRow
                    key={item.title}
                    item={item}
                    idx={i}
                    onLaunch={onLaunchPrompt}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
