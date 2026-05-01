// Probe home view — quiet landing with three suggested directions.
// Mirrors the old "or try an example" feel: each suggestion is a single row,
// not a card. Three categories sit side-by-side as columns.
//
// Exposes window.ProbeHome.
//   props: { onLaunchPrompt(prompt), onOpenProject(id) }

const { useState, useRef, useEffect } = React;
const palette = window.__probePalette;

// ─── StepStrip (numbered onboarding strip, borrow #2 from MultiColleagues Fig 1) ───
//
// A first-time visitor doesn't know the *shape* of what's about to happen.
// The 5 chips below collapse Probe's 8-stage pipeline into a digestible
// arc that fits one row above the textbox. The strip is informational
// only — chips don't navigate, they just open a tooltip with one extra
// detail.
//
// Voice rules from CLAUDE.md apply: the strip describes what Probe DOES,
// active voice ("Probe sharpens", "three branches diverge", "Probe
// rehearses three reviewers"). No "users preferred", no "validated", no
// "evidence suggests".
const STEP_DEFS = [
  {
    n: 1,
    label: 'Premise',
    glyph: '◆',
    desc: 'Probe sharpens your one-line premise.',
    detail: 'Probe asks back the questions a skeptical research advisor would: who is this for, what do you mean by "focus", what would falsify the claim. The output is a tightened premise plus a working title.',
  },
  {
    n: 2,
    label: 'Branch',
    glyph: '⚡',
    desc: 'Three RQs diverge into three programs.',
    detail: 'Probe runs three branches in parallel — A, B, C — that diverge on research question, intervention primitive, and method family. Each branch is a separate research program, not a variant of one program.',
  },
  {
    n: 3,
    label: 'Design',
    glyph: '◇',
    desc: 'Each branch drafts protocol, artifacts, and a simulated pilot.',
    detail: 'For each branch Probe drafts methodology, the handoff documents (PROTOCOL.md, SURVEY.md, IRB_MEMO.md, IMPLEMENTATION.md, DIARY_KIT.md), and rehearses a simulated pilot to surface friction. The pilot is rehearsal, not evidence.',
  },
  {
    n: 4,
    label: 'Review',
    glyph: '⊘',
    desc: 'Probe rehearses an adversarial peer-review panel per branch.',
    detail: 'A simulated 1AC + 3-reviewer panel attacks each branch on novelty, methodology, ethics, and accessibility. Branches that get blocked produce a WORKSHOP_NOT_RECOMMENDED memo instead of a guidebook.',
  },
  {
    n: 5,
    label: 'Synthesis',
    glyph: '◉',
    desc: 'Probe converges into one labeled study guidebook.',
    detail: 'Probe assembles the surviving branches into one provenance-tagged guidebook. Every paragraph carries a label: [RESEARCHER_INPUT], [SOURCE_CARD:id], [SIMULATION_REHEARSAL], [HUMAN_REQUIRED], etc. A linter blocks shipping if any tag is missing.',
  },
];

function StepStripChip({ step, idx, last, openTooltip, setOpenTooltip }) {
  const [hover, setHover] = useState(false);
  const open = openTooltip === idx;
  // Toggle on click; close on second click or escape.
  return (
    <div style={{
      position: 'relative', flex: '1 1 140px', minWidth: 130,
      display: 'flex', alignItems: 'stretch',
    }}>
      <button
        onClick={() => setOpenTooltip(open ? null : idx)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        aria-expanded={open}
        style={{
          flex: 1,
          display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '10px 12px',
          background: hover || open ? (palette.bgPanelHover || palette.bgPanel || palette.bg2) : (palette.bgPanel || palette.bg2),
          border: `1px solid ${open ? (palette.borderStrong || palette.rule) : (palette.border || palette.rule)}`,
          borderRadius: 4,
          color: 'inherit', fontFamily: 'inherit',
          textAlign: 'left', cursor: 'pointer',
          transition: 'background 120ms, border-color 120ms',
        }}>
        {/* Numeric badge */}
        <span style={{
          flex: 'none',
          width: 18, height: 18, borderRadius: '50%',
          background: palette.accentAmber || palette.amber,
          color: palette.bgPage || palette.bg,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: palette.fontMono || 'monospace',
          fontSize: 10.5, fontWeight: 700,
          marginTop: 1,
        }}>{step.n}</span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 6,
          }}>
            <span style={{
              color: palette.fgMute || palette.ink3, fontSize: 11,
              fontFamily: palette.fontMono || 'monospace',
            }}>{step.glyph}</span>
            <span style={{
              color: palette.fgStrong || palette.ink,
              fontFamily: palette.fontSans || '"Inter Tight", sans-serif',
              fontWeight: 600, fontSize: 13.5,
            }}>{step.label}</span>
          </div>
          <div style={{
            color: palette.fgSecondary || palette.ink2,
            fontFamily: palette.fontSans || '"Inter Tight", sans-serif',
            fontSize: 11, lineHeight: 1.4, marginTop: 3,
          }}>
            {step.desc}
          </div>
        </div>
      </button>

      {/* Arrow glyph between chips */}
      {!last && (
        <span style={{
          flex: 'none', display: 'inline-flex', alignItems: 'center',
          padding: '0 6px',
          color: palette.fgMute || palette.ink3,
          fontSize: 14, userSelect: 'none',
        }}>›</span>
      )}

      {/* Tooltip — opens below the chip on click. Pure informational
          content; closing on click-away is handled by the parent. */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          width: 280, padding: '10px 12px',
          background: palette.bgPage || palette.bg,
          border: `1px solid ${palette.borderStrong || palette.rule}`,
          borderRadius: 3,
          boxShadow: '0 12px 32px -10px rgba(0,0,0,0.55)',
          color: palette.fgBody || palette.ink,
          fontFamily: palette.fontSans || '"Inter Tight", sans-serif',
          fontSize: 12, lineHeight: 1.55,
          zIndex: 20,
        }}>
          <div style={{
            color: palette.accentAmber || palette.amber,
            fontFamily: palette.fontMono || 'monospace',
            fontSize: 10.5, letterSpacing: '0.14em',
            textTransform: 'uppercase', marginBottom: 4,
          }}>step {step.n} · {step.label}</div>
          <div>{step.detail}</div>
        </div>
      )}
    </div>
  );
}

function StepStrip({ collapsedHint, defaultExpanded }) {
  const [expanded, setExpanded] = useState(defaultExpanded !== false);
  const [openTooltip, setOpenTooltip] = useState(null);

  // Close any open tooltip when the user clicks elsewhere or hits Esc.
  useEffect(() => {
    if (openTooltip == null) return;
    const onDoc = (e) => {
      if (e.target && e.target.closest && e.target.closest('[data-step-strip]')) return;
      setOpenTooltip(null);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpenTooltip(null); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [openTooltip]);

  if (!expanded) {
    return (
      <div data-step-strip style={{ marginBottom: palette.s4 || 16, textAlign: 'center' }}>
        <button onClick={() => setExpanded(true)} style={{
          background: 'transparent', border: 'none',
          color: palette.fgMute || palette.ink3,
          fontFamily: 'inherit', fontSize: 11.5, cursor: 'pointer',
          textDecoration: 'underline', textUnderlineOffset: 3,
        }}>show what to expect ›</button>
      </div>
    );
  }

  return (
    <div data-step-strip style={{ marginBottom: palette.s4 || 16 }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 10,
        marginBottom: 8,
      }}>
        <span style={{
          color: palette.fgMute || palette.ink3,
          fontFamily: palette.fontMono || 'monospace',
          fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
        }}>─── what Probe does</span>
        <span style={{
          color: palette.fgSecondary || palette.ink2,
          fontFamily: palette.fontSans || '"Inter Tight", sans-serif',
          fontSize: 11.5,
        }}>five steps · click any chip for detail</span>
        {collapsedHint && (
          <button onClick={() => setExpanded(false)} style={{
            marginLeft: 'auto', background: 'transparent', border: 'none',
            color: palette.fgMute || palette.ink3,
            fontFamily: 'inherit', fontSize: 11, cursor: 'pointer',
          }}>hide ↑</button>
        )}
      </div>
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'stretch',
        gap: 0, rowGap: 8,
      }}>
        {STEP_DEFS.map((s, i) => (
          <StepStripChip
            key={s.n}
            step={s}
            idx={i}
            last={i === STEP_DEFS.length - 1}
            openTooltip={openTooltip}
            setOpenTooltip={setOpenTooltip}
          />
        ))}
      </div>
    </div>
  );
}
window.StepStrip = StepStrip;

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

function SuggestionRow({ item, idx, onPick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={() => onPick(item.prompt)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        // Per audit §10.01: bump suggestion item from 12px → 14px,
        // body text in fg-body so the densest text on the page is
        // actually readable. "edit" link demoted to fg-mute at rest,
        // accent-link on hover (cooler blue), never amber.
        display: 'grid',
        gridTemplateColumns: '24px 1fr 32px',
        alignItems: 'baseline', gap: 10,
        width: '100%', textAlign: 'left',
        padding: '10px 10px',
        background: hover ? (palette.bgPanel || palette.bg2) : 'transparent',
        border: 'none',
        borderLeft: `2px solid ${hover ? palette.amber : 'transparent'}`,
        color: 'inherit', fontFamily: 'inherit', cursor: 'pointer',
      }}
    >
      <span style={{
        color: palette.fgMute || palette.ink3, fontSize: 12,
        fontFamily: palette.fontMono || 'monospace',
      }}>{idx + 1}</span>
      <span style={{
        color: hover ? (palette.fgStrong || palette.ink) : (palette.fgBody || palette.ink),
        fontFamily: palette.fontSans || '"Inter Tight", sans-serif',
        fontSize: 14, lineHeight: 1.5,
      }}>
        {item.prompt}
      </span>
      <span style={{
        color: hover ? (palette.accentLink || palette.cyan) : (palette.fgMute || palette.ink3),
        fontSize: 11, textAlign: 'right',
        fontFamily: palette.fontMono || 'monospace',
      }}>edit</span>
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
    // Default 'go' mode → iframe opens with auto-advance to brainstorm.
    // The user has explicitly committed (typed + Enter or picked +
    // Enter), so skip the intermediate premise step.
    onLaunchPrompt(t);
  };

  const pickSuggestion = (prompt) => {
    setText(prompt);
    // Refocus the textarea + put the cursor at the end so the user
    // can immediately edit. Sometimes the focus moves to the clicked
    // suggestion button; this restores it explicitly.
    if (taRef.current) {
      taRef.current.focus();
      // setTimeout so React's setText commit happens first, otherwise
      // selectionStart points at the old (empty) value and ends up at
      // position 0 instead of the end of the new text.
      setTimeout(() => {
        try {
          const len = (prompt || '').length;
          taRef.current.setSelectionRange(len, len);
        } catch { /* not all environments support it */ }
      }, 0);
    }
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
            entry point for anyone who doesn't have an API key yet —
            judges, advisors, peers — but a fresh visitor on /ui won't
            know to look at the sidebar. One amber-tinted line below
            the subtitle points them at the no-cost path. */}
        <div style={{
          color: palette.ink3, fontSize: 12, marginTop: 14, textAlign: 'center',
        }}>
          <span style={{ color: palette.ink2 }}>First time? </span>
          Click <span style={{ color: palette.amber, fontWeight: 600 }}>▶ replay sample run</span>
          <span style={{ color: palette.ink2 }}> in the left sidebar — a 14-second walkthrough, no API key needed.</span>
        </div>

        {/* Numbered step strip — sets expectations BEFORE the user
            commits to a premise. Default = expanded; auto-collapses
            with a hide affordance once the user starts typing so the
            chrome de-clutters once intent is committed. */}
        <div style={{ marginTop: 28 }}>
          <StepStrip
            defaultExpanded
            collapsedHint={text.trim().length > 0}
          />
        </div>

        <div style={{
          marginTop: 16, display: 'flex', alignItems: 'flex-start', gap: 10,
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
              {/* Per audit §10.01: column heading is UPPER-mono
                  eyebrow at 11px (semantic anchor), and the hint
                  underneath shifts to sans body so it doesn't compete
                  for the eye. Heading color demotes from amber to
                  fg-mute — amber's job is "primary action," not
                  "every column header." */}
              <div style={{
                color: palette.fgMute || palette.ink3,
                fontFamily: palette.fontMono || 'monospace',
                fontSize: 11, letterSpacing: '0.16em',
                textTransform: 'uppercase', marginBottom: 6,
              }}>
                {group.label}
              </div>
              <div style={{
                color: palette.fgSecondary || palette.ink2,
                fontFamily: palette.fontSans || '"Inter Tight", sans-serif',
                fontSize: 13, marginBottom: 12,
                lineHeight: 1.5, maxWidth: '36ch',
              }}>
                {group.hint}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {group.items.map((item, i) => (
                  <SuggestionRow
                    key={item.title}
                    item={item}
                    idx={i}
                    onPick={pickSuggestion}
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
