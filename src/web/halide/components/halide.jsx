// Probe · "Halide" visual system
// Inspired by Linear's posture (dense, quiet, fast, considered) but with
// Probe's own identity: research-journal residues (serif prose, provenance
// tags, single amber accent for "your turn" moments). Original system —
// oklch palette, 8px grid, Inter for chrome + Newsreader for prose.

const halideCSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;450;500;550;600&family=Newsreader:ital,wght@0,400;0,500;1,400&family=JetBrains+Mono:wght@400;500&display=swap');

.hld {
  --bg:      oklch(15.5% 0.010 255);
  --bg-1:    oklch(18% 0.010 255);
  --bg-2:    oklch(21% 0.010 255);
  --bg-3:    oklch(24% 0.012 255);
  --bg-hv:   oklch(26% 0.014 255);
  --line:    oklch(28% 0.012 255);
  --line-2:  oklch(34% 0.015 255);
  --ink:     oklch(94% 0.005 255);
  --ink-2:   oklch(78% 0.008 255);
  --ink-3:   oklch(58% 0.010 255);
  --ink-4:   oklch(44% 0.010 255);
  --amber:   oklch(78% 0.14 72);
  --amber-s: oklch(32% 0.08 72);
  --moss:    oklch(72% 0.13 155);
  --moss-s:  oklch(30% 0.07 155);
  --rose:    oklch(70% 0.16 20);
  --rose-s:  oklch(30% 0.09 20);
  --blue:    oklch(76% 0.11 235);
  --blue-s:  oklch(30% 0.06 235);
  --purple:  oklch(74% 0.13 295);
  --teal:    oklch(76% 0.09 200);

  --r-1: 4px;
  --r-2: 6px;
  --r-3: 8px;

  color: var(--ink);
  background: var(--bg);
  font-family: 'Inter', system-ui, sans-serif;
  font-feature-settings: 'cv11', 'ss01', 'ss03';
  font-size: 13px;
  line-height: 1.45;
}
.hld * { box-sizing: border-box; }
.hld ::selection { background: oklch(30% 0.12 72); color: var(--ink); }

.hld-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; font-feature-settings: normal; letter-spacing: -0.005em; }
.hld-serif { font-family: 'Newsreader', Georgia, serif; }

.hld-row:hover { background: var(--bg-1); }
.hld-row-sel  { background: var(--bg-2); }

.hld-btn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 26px; padding: 0 10px; border-radius: var(--r-2);
  background: var(--bg-2); border: 1px solid var(--line);
  color: var(--ink-2); font-size: 12px; font-weight: 450;
  cursor: pointer; transition: background 120ms, border-color 120ms, color 120ms;
  font-family: inherit; white-space: nowrap; flex-shrink: 0;
}
.hld-btn:hover { background: var(--bg-3); color: var(--ink); border-color: var(--line-2); }
.hld-btn:active { background: var(--bg-1); }
.hld-btn-primary {
  background: oklch(88% 0.02 255); color: var(--bg); border-color: oklch(88% 0.02 255);
  font-weight: 500;
}
.hld-btn-primary:hover { background: oklch(94% 0.02 255); color: var(--bg); border-color: oklch(94% 0.02 255); }
.hld-btn-amber {
  background: transparent; color: var(--amber); border-color: var(--amber-s);
}
.hld-btn-amber:hover { background: oklch(22% 0.05 72); color: var(--amber); border-color: var(--amber); }
.hld-btn-ghost {
  background: transparent; border-color: transparent; color: var(--ink-3);
}
.hld-btn-ghost:hover { background: var(--bg-2); color: var(--ink); border-color: transparent; }
.hld-btn-danger:hover { background: oklch(22% 0.06 20); color: var(--rose); border-color: var(--rose-s); }

.hld-chip {
  display: inline-flex; align-items: center; gap: 4px; height: 20px;
  padding: 0 7px; border-radius: 999px; font-size: 11px; font-weight: 500;
  background: var(--bg-2); color: var(--ink-3); border: 1px solid var(--line);
  white-space: nowrap;
}
.hld-chip-solid {
  height: 18px; padding: 0 6px; border-radius: 3px; font-size: 10.5px; font-weight: 500;
  font-family: 'JetBrains Mono', monospace;
}
.hld-kbd {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 18px; height: 18px; padding: 0 5px; border-radius: 3px;
  background: var(--bg-1); border: 1px solid var(--line);
  color: var(--ink-3); font-size: 10.5px; font-family: 'JetBrains Mono', monospace;
}
.hld-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; display: inline-block; }
.hld-uc  { text-transform: uppercase; letter-spacing: 0.1em; font-size: 10.5px; font-weight: 500; color: var(--ink-4); }

.hld-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
.hld-scroll::-webkit-scrollbar-thumb { background: var(--line); border-radius: 4px; }
.hld-scroll::-webkit-scrollbar-thumb:hover { background: var(--line-2); }
.hld-scroll::-webkit-scrollbar-track { background: transparent; }

.hld-caret { display: inline-block; width: 7px; height: 14px; background: var(--amber); margin-left: 2px; vertical-align: -3px; animation: hld-blink 1.1s steps(1) infinite; }
@keyframes hld-blink { 50% { opacity: 0; } }

.hld-pulse { animation: hld-pulse 1.6s ease-in-out infinite; }
@keyframes hld-pulse { 0%,100% { opacity: 1; } 50% { opacity: .45; } }

.hld-fade-in { animation: hld-fade-in 220ms ease-out; }
@keyframes hld-fade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }

.hld-icon { width: 14px; height: 14px; flex-shrink: 0; stroke-width: 1.5; }
`;

function HalideStyles() { return <style dangerouslySetInnerHTML={{ __html: halideCSS }} />; }

// Tiny icon set drawn inline (nothing elaborate, just glyphs).
function HIcon({ k, size = 14, color = 'currentColor' }) {
  const common = { width: size, height: size, viewBox: '0 0 16 16', fill: 'none', stroke: color, strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    home:       <path d="M2.5 7.5 8 3l5.5 4.5M4 7v6h8V7" />,
    play:       <path d="M4.5 3.5v9l7-4.5-7-4.5z" fill={color} />,
    pause:      <><path d="M5 3.5v9M11 3.5v9"/></>,
    stop:       <rect x="4" y="4" width="8" height="8" fill={color}/>,
    caret:      <path d="m5 6 3 3 3-3"/>,
    caretRight: <path d="m6 5 3 3-3 3"/>,
    check:      <path d="m3.5 8 3 3 6-6"/>,
    dot:        <circle cx="8" cy="8" r="2" fill={color}/>,
    circle:     <circle cx="8" cy="8" r="5"/>,
    square:     <rect x="3.5" y="3.5" width="9" height="9" rx="1.5"/>,
    file:       <path d="M3.5 2h5l3.5 3.5v8.5h-8.5v-12z M8.5 2v4h4"/>,
    folder:     <path d="M2 4.5h4l1.5 1.5h6.5v7.5h-12v-9z"/>,
    flask:      <path d="M6 2h4M7 2v4l-3 7h8l-3-7V2"/>,
    branch:     <><circle cx="4" cy="3.5" r="1.3"/><circle cx="4" cy="12.5" r="1.3"/><circle cx="12" cy="8" r="1.3"/><path d="M4 5v6M5.3 8h5.4"/></>,
    search:     <><circle cx="7" cy="7" r="4"/><path d="m10 10 3 3"/></>,
    cog:        <><circle cx="8" cy="8" r="2"/><path d="M8 2v2M8 12v2M2 8h2M12 8h2M4 4l1.4 1.4M10.6 10.6 12 12M4 12l1.4-1.4M10.6 5.4 12 4"/></>,
    close:      <path d="m4 4 8 8M12 4l-8 8"/>,
    chat:       <path d="M3 4h10v7h-5l-3 2v-2H3z"/>,
    book:       <path d="M3 3h5v10H3zM8 3h5v10H8zM3 3c2 0 3 1 5 1M13 3c-2 0-3 1-5 1"/>,
    flash:      <path d="m9 2-5 7h3l-1 5 5-7H8l1-5z" fill={color}/>,
    ext:        <path d="M6 4H3v9h9v-3M9 3h4v4M13 3 8 8"/>,
    lint:       <><path d="m3 8 3 3 7-7"/></>,
    cost:       <><circle cx="8" cy="8" r="5.5"/><path d="M8 5.5v5M6 7h3.5a1.5 1.5 0 0 1 0 3H6"/></>,
  };
  return <svg {...common} className="hld-icon">{paths[k] || paths.dot}</svg>;
}

Object.assign(window, { HalideStyles, HIcon });
