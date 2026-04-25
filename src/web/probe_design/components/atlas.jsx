// Direction C — "Atlas"
// Cartographic. Inter Tight + Spectral display. Warm off-white paper, single vermilion accent.
// The pipeline as a map; artifacts as pages; runs as territory.

const atlasCSS = `
.atls-root {
  --paper: oklch(97.5% 0.008 60);
  --paper-2: oklch(95% 0.01 60);
  --ink: oklch(18% 0.02 240);
  --ink-dim: oklch(38% 0.02 240);
  --ink-muted: oklch(58% 0.015 240);
  --rule: oklch(86% 0.01 60);
  --rule-dim: oklch(92% 0.008 60);
  --accent: oklch(55% 0.17 28);
  --accent-soft: oklch(94% 0.05 28);
  --green: oklch(52% 0.11 145);
  --amber: oklch(62% 0.13 70);
  font-family: 'Inter Tight', 'Inter', system-ui, -apple-system, sans-serif;
  background: var(--paper);
  color: var(--ink);
}
.atls-root * { box-sizing: border-box; }
.atls-display { font-family: 'Spectral', 'Newsreader', Georgia, serif; font-weight: 400; letter-spacing: -0.015em; }
.atls-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
.atls-idx { font-variant-numeric: tabular-nums; font-feature-settings: 'tnum'; }
.atls-uc { text-transform: uppercase; letter-spacing: 0.16em; font-size: 10.5px; font-weight: 500; color: var(--ink-muted); }
`;

function AtlasStyles() {
  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600&family=Spectral:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap" />
      <style>{atlasCSS}</style>
    </>
  );
}

// 08 — COMPARE two runs
function AtlasCompare() {
  return (
    <div className="atls-root" style={{ width: 1200, height: 780, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 28px', borderBottom: '1px solid var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
          <span className="atls-mono" style={{ fontSize: 11.5, color: 'var(--accent)' }}>◈ probe / compare</span>
          <span className="atls-uc">demo_run ↔ adversarial_trivial_darkmode</span>
        </div>
        <span className="atls-mono" style={{ fontSize: 10.5, color: 'var(--ink-muted)' }}>disagreement-preserving</span>
      </div>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '140px 1fr 1fr', overflow: 'hidden' }}>
        <div style={{ borderRight: '1px solid var(--rule)', background: 'var(--paper-2)', padding: '24px 18px', overflow: 'auto' }}>
          <div className="atls-uc">Index</div>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              { n: '01', label: 'Premise', active: false },
              { n: '02', label: 'Branches', active: false },
              { n: '03', label: 'Pattern fires', active: true },
              { n: '04', label: 'Verdict', active: false },
              { n: '05', label: 'Cost & duration', active: false },
              { n: '06', label: 'Blind spots', active: false },
            ].map((s) => (
              <div key={s.n} style={{
                padding: '6px 10px', marginLeft: -10, borderRadius: 2, cursor: 'pointer',
                background: s.active ? 'var(--paper)' : 'transparent',
                borderLeft: s.active ? '2px solid var(--accent)' : '2px solid transparent',
                display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 13,
                color: s.active ? 'var(--ink)' : 'var(--ink-dim)',
              }}>
                <span className="atls-mono atls-idx" style={{ fontSize: 10, color: 'var(--ink-muted)' }}>{s.n}</span>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderRight: '1px solid var(--rule)', padding: '24px 32px', overflow: 'auto' }}>
          <div className="atls-uc" style={{ color: 'var(--accent)' }}>Left · demo_run</div>
          <div className="atls-display" style={{ fontSize: 22, lineHeight: 1.3, marginTop: 8 }}>
            ARIA-live AI-disclosure banner
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-muted)' }} className="atls-mono">$5.93 · 25m 12s · 1 surviving</div>
          <div className="atls-uc" style={{ marginTop: 24 }}>Pattern fires</div>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { p: 'legibility.announcement_duration_confound', s: -1 },
              { p: 'legibility.navigation_speed_floor',          s: -1 },
              { p: 'legibility.single_exposure_insufficient',    s:  0 },
              { p: 'capture.reviewer_subject_role_ambiguity',    s: -1 },
              { p: 'legibility.no_failure_signal',               s: +1 },
            ].map((r) => (
              <div key={r.p} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--paper-2)', borderRadius: 2 }}>
                <span className="atls-mono" style={{ fontSize: 11.5, flex: 1 }}>{r.p}</span>
                <span className="atls-mono atls-idx" style={{
                  fontSize: 11, fontWeight: 500,
                  color: r.s < 0 ? 'var(--accent)' : r.s > 0 ? 'var(--green)' : 'var(--ink-muted)',
                }}>
                  {r.s > 0 ? `+${r.s}` : r.s}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '24px 32px', overflow: 'auto' }}>
          <div className="atls-uc" style={{ color: 'var(--accent)' }}>Right · adversarial_trivial_darkmode</div>
          <div className="atls-display" style={{ fontSize: 22, lineHeight: 1.3, marginTop: 8 }}>
            Dark-mode preference stability
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-muted)' }} className="atls-mono">$3.28 · 18m 30s · all blocked</div>
          <div className="atls-uc" style={{ marginTop: 24 }}>Pattern fires</div>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { p: 'legibility.no_failure_signal',              s: -2 },
              { p: 'legibility.single_exposure_insufficient',   s: -1 },
              { p: 'capture.finding_predetermined_by_method',   s: -2 },
              { p: 'novelty.incremental_variation_only',        s: -1 },
              { p: 'capture.reviewer_subject_role_ambiguity',   s:  0 },
            ].map((r) => (
              <div key={r.p} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--accent-soft)', borderRadius: 2 }}>
                <span className="atls-mono" style={{ fontSize: 11.5, flex: 1 }}>{r.p}</span>
                <span className="atls-mono atls-idx" style={{ fontSize: 11, fontWeight: 500, color: r.s <= -2 ? 'var(--accent)' : 'var(--ink-dim)' }}>
                  {r.s > 0 ? `+${r.s}` : r.s}
                </span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24, padding: 14, border: '1px solid var(--accent)', borderRadius: 2, background: 'var(--accent-soft)' }}>
            <div className="atls-uc" style={{ color: 'var(--accent)' }}>Shared blind spot</div>
            <div style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>
              Neither run consulted longitudinal literature. Both treat within-session exposure as sufficient — a pattern worth surfacing in the convener report.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AtlasStyles, AtlasCompare });
