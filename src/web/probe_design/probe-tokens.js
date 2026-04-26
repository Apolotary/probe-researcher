// Shared style tokens for Probe.
// Loaded BEFORE any babel scripts so external .jsx files can safely read window.__probePalette
// at module top-level.
//
// Token system was rebuilt 2026-04-26 after a Claude Design readability
// audit (`docs/screenshots/all-screens/` + recommendations.html).
// Headline change: prose body lifted from ~#9a9d9f → #d8d4c9 against
// the dark surface, and a five-step gray ramp replaces the previous
// three-stop ink/ink2/ink3/ink4 scale. Five legacy aliases (ink,
// ink2, ink3, ink4, bg2, rule) are kept so existing JSX that reads
// them keeps working — they map onto the new ramp at the closest
// luminance step.

const NEW = {
  // surface
  bgPage:       '#0e1014',
  bgPanel:      '#181c23',   // lifted from #131720 (4% → 12% above page)
  bgPanelHover: '#1d222b',
  bgInput:      '#10141a',

  // border
  border:       '#252a33',
  borderStrong: '#2f3540',

  // text — five-step ramp, see Claude Design rec §04
  fgStrong:    '#f0ecdf',  // headings, picked title, primary value
  fgBody:      '#d8d4c9',  // default paragraph, list items
  fgSecondary: '#9a978c',  // subhead copy ("saved demo · Apr 26")
  fgMute:      '#6e7280',  // eyebrow labels, hotkeys, captions
  fgFaint:     '#4a4d54',  // rule decoration, separators

  // accents (semantic — see rec §08)
  accentAmber: '#d9a548',  // primary action / focused / picked / brand mark only
  accentLink:  '#7eaad2',  // inline links ("edit", citations)
  accentGood:  '#7ab686',  // "live · model output", success
  accentWarn:  '#c97560',  // "SIMULATED" banner, warning
  accentInfo:  '#a8c2dd',  // bordered info pills

  // type
  fontSans:  '"Inter Tight", "Inter", system-ui, -apple-system, sans-serif',
  fontMono:  '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
  fontSerif: '"Charter", "Iowan Old Style", Georgia, serif',

  // size scale (px) — xs / sm / base / lg / xl / 2xl
  textXs: 11, textSm: 13, textBase: 15, textLg: 17, textXl: 22, text2xl: 28,
  // leading
  lhTight: 1.25, lhNormal: 1.55, lhLoose: 1.7,
  // 8-pt spacing
  s1: 4, s2: 8, s3: 12, s4: 16, s5: 24, s6: 40, s7: 64,
  // radius
  rSm: 3, rMd: 6,
  // prose measure cap
  proseMeasure: '68ch',
};

window.__probePalette = {
  // ─── new tokens (preferred) ────────────────────────────────
  ...NEW,

  // ─── legacy aliases mapped onto the new ramp ───────────────
  // bg / bg2 stay near the old values but bg2 (panel) is lifted by
  // ~6 luminance steps so card edges find the eye.
  bg:        NEW.bgPage,        // was #0f1419 → 0e1014
  bg2:       NEW.bgPanel,       // was #161b22 → 181c23 (real elevation)
  ink:       NEW.fgBody,        // was #c5c8d4 → #d8d4c9 (lifted)
  ink2:      NEW.fgSecondary,   // was #8b93a7 → #9a978c (warmer, distinct from mute)
  ink3:      NEW.fgMute,        // was #5c6678 → #6e7280
  ink4:      NEW.fgFaint,       // was #3d4555 → #4a4d54
  amber:     NEW.accentAmber,
  amberSoft: 'rgba(217, 165, 72, 0.14)',
  rose:      NEW.accentWarn,
  moss:      NEW.accentGood,
  cyan:      NEW.accentLink,    // demoted edit-link tint (cooler, less saturated)
  rule:      NEW.border,        // was #1f2530 → #252a33 (real edge)
};

window.__probeKbd = {
  display: 'inline-block', padding: '0 6px', margin: '0 2px',
  border: `1px solid ${window.__probePalette.border}`, borderRadius: 3, fontSize: 11,
  color: window.__probePalette.fgSecondary, background: window.__probePalette.bgPanel,
  fontFamily: window.__probePalette.fontMono, lineHeight: '16px',
};

window.__probeChip = {
  padding: '2px 8px', borderRadius: 2,
  background: window.__probePalette.bgPage,
  border: `1px solid ${window.__probePalette.border}`,
  color: window.__probePalette.fgSecondary, fontSize: 11,
  fontFamily: window.__probePalette.fontMono,
};

window.__probeGhostBtn = {
  background: 'transparent', border: 'none',
  color: window.__probePalette.fgMute, fontFamily: 'inherit',
  fontSize: 12, cursor: 'pointer',
};

// Prose container helper — drop into long-form text blocks (literature
// SOA, report discussion / conclusion, review meta-review). Pairs the
// Inter Tight body with the 68ch measure cap from rec §03.
window.__probeProse = {
  fontFamily: window.__probePalette.fontSans,
  fontSize: 15,
  lineHeight: 1.62,
  letterSpacing: '0.005em',
  color: window.__probePalette.fgBody,
  maxWidth: window.__probePalette.proseMeasure,
};
