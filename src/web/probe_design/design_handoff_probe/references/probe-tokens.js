// Shared style tokens for Probe.
// Loaded BEFORE any babel scripts so external .jsx files can safely read window.__probePalette
// at module top-level.

window.__probePalette = {
  bg:        '#0f1419',
  bg2:       '#161b22',
  ink:       '#c5c8d4',
  ink2:      '#8b93a7',
  ink3:      '#5c6678',
  ink4:      '#3d4555',
  amber:     '#d9a548',
  amberSoft: 'rgba(217, 165, 72, 0.14)',
  rose:      '#e26e6e',
  moss:      '#7fb069',
  cyan:      '#7dcfff',
  rule:      '#1f2530',
};

window.__probeKbd = {
  display: 'inline-block', padding: '0 6px', margin: '0 2px',
  border: `1px solid ${window.__probePalette.rule}`, borderRadius: 3, fontSize: 11,
  color: window.__probePalette.ink2, background: window.__probePalette.bg2,
  fontFamily: 'inherit', lineHeight: '16px',
};

window.__probeChip = {
  padding: '2px 8px', borderRadius: 2,
  background: window.__probePalette.bg,
  border: `1px solid ${window.__probePalette.rule}`,
  color: window.__probePalette.ink2, fontSize: 11,
};

window.__probeGhostBtn = {
  background: 'transparent', border: 'none',
  color: window.__probePalette.ink3, fontFamily: 'inherit',
  fontSize: 12, cursor: 'pointer',
};
