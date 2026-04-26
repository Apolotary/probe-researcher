// Tiny "placeholder · waiting for model" / "live · model output" pill,
// shared by every scene that has a stock-then-replace pattern.
//
// Why this exists: scenes like Report, Findings, Methodology populate
// stock text immediately so the page is never empty, then replace it
// when the LLM call returns. From the user's seat, the difference is
// invisible — there's no signal of "this is a draft, the real one is
// coming." Persona feedback flagged this directly.
//
// Usage:
//   <window.PlaceholderTag live={live.discussion} />
//   <window.PlaceholderTag live={loaded} label="model output" stockLabel="canned starter" />

const __probePalette = window.__probePalette;

function PlaceholderTag({
  live,
  label = 'live · model output',
  stockLabel = 'placeholder · waiting for model',
  compact = false,
}) {
  const moss = __probePalette.moss;
  const amber = __probePalette.amber;
  const ink3 = __probePalette.ink3;
  const c = live ? moss : amber;
  const text = live ? label : stockLabel;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: compact ? '1px 7px' : '2px 9px',
      border: `1px solid ${c}`, borderRadius: 999,
      color: c, fontSize: compact ? 10 : 10.5, fontWeight: 600,
      letterSpacing: '0.06em', textTransform: 'uppercase',
      background: `${c}10`,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: c,
        animation: live ? 'none' : 'probe-placeholder-pulse 1.4s ease-in-out infinite',
      }} />
      {text}
    </span>
  );
}

window.PlaceholderTag = PlaceholderTag;

// Inject the keyframes once. Babel-standalone doesn't run @keyframes
// from inline style, so the animation has to live in a real CSS rule.
if (!document.getElementById('probe-placeholder-css')) {
  const s = document.createElement('style');
  s.id = 'probe-placeholder-css';
  s.textContent = `
    @keyframes probe-placeholder-pulse {
      0%, 100% { opacity: 0.4; transform: scale(1); }
      50%      { opacity: 1.0; transform: scale(1.4); }
    }
  `;
  document.head.appendChild(s);
}
