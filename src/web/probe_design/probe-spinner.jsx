// Probe TUI-style loading indicators.
//
// Three primitives, all share a Braille spinner glyph for visual consistency:
//
//   <Spinner color/>                       — bare animated glyph
//   <ModelStatusLine model phase tokens/>  — full row: glyph · model · phase · tokens · elapsed
//   <PhaseDots phases activeIdx/>          — multi-phase progress (planning › searching › drafting)
//
// Plus useElapsed() hook for ticking timers and useBraille() for the bare glyph.

(function () {
  const { useState, useEffect, useRef } = React;
  const palette = window.__probePalette;

  // 10-frame Braille spinner — terminal canon (npm `cli-spinners` "dots" preset)
  const BRAILLE = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];

  function useBraille(intervalMs = 90) {
    const [i, setI] = useState(0);
    useEffect(() => {
      const id = setInterval(() => setI((x) => (x + 1) % BRAILLE.length), intervalMs);
      return () => clearInterval(id);
    }, [intervalMs]);
    return BRAILLE[i];
  }

  function useElapsed(running, resetKey) {
    const [ms, setMs] = useState(0);
    const start = useRef(null);
    useEffect(() => {
      if (!running) { setMs(0); start.current = null; return; }
      start.current = performance.now();
      setMs(0);
      const id = setInterval(() => setMs(performance.now() - start.current), 50);
      return () => clearInterval(id);
    }, [running, resetKey]);
    return ms;
  }

  function Spinner({ color, size = 12 }) {
    const glyph = useBraille();
    return (
      <span style={{
        display: 'inline-block', width: size, fontSize: size,
        color: color || palette.cyan, fontFamily: 'inherit',
        textAlign: 'center', lineHeight: 1,
      }}>{glyph}</span>
    );
  }

  // Mixed-mode default mapping (Opus on orchestration, Sonnet on
  // execution). Used as a synchronous fallback so the model badge
  // never has to flash 'claude-sonnet-4-6' before the /api/probe/models
  // fetch resolves — it can render the right label on first paint
  // and only update if the user's actual config differs.
  const MIXED_MODE_DEFAULTS = {
    brainstorm:  'claude-opus-4-7',
    literature:  'claude-sonnet-4-6',
    methodology: 'claude-opus-4-7',
    plan:        'claude-sonnet-4-6',
    artifacts:   'claude-sonnet-4-6',
    personas:    'claude-sonnet-4-6',
    findings:    'claude-sonnet-4-6',
    report:      'claude-sonnet-4-6',
    review:      'claude-opus-4-7',
  };

  // Per-stage model cache. Populated once on first ModelStatusLine
  // mount via /api/probe/models and reused by every subsequent stage.
  // Pre-seed with mixed-mode defaults so first paint is correct.
  let stageModelCache = { ...MIXED_MODE_DEFAULTS };
  let stageModelInflight = null;
  function fetchStageModels(then) {
    if (stageModelInflight) return stageModelInflight.then(then);
    stageModelInflight = fetch('/api/probe/models')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.models) stageModelCache = d.models;
        return stageModelCache;
      })
      .catch(() => stageModelCache);
    return stageModelInflight.then(then);
  }

  // A horizontal "model is thinking" row.
  //   stage:    optional ('brainstorm' | 'literature' | 'methodology' | …)
  //             — when set, the model is resolved live from /api/probe/models
  //             so the badge always reflects the current config mode.
  //   model:    explicit override; only used when stage is not provided.
  //   phase:    short status string ('planning · 142 tokens')
  //   accent:   override color (defaults to cyan)
  //   elapsed:  ms elapsed (or pass `running` to auto-tick)
  //   running:  if true and elapsed not provided, will tick its own timer
  function ModelStatusLine({
    model = 'claude-sonnet-4-6',
    stage,
    phase = 'thinking',
    accent,
    elapsed,
    running = true,
    resetKey,
    compact = false,
  }) {
    const tickMs = useElapsed(elapsed === undefined && running, resetKey);
    const [resolvedModel, setResolvedModel] = React.useState(
      stage && stageModelCache?.[stage] ? stageModelCache[stage] : model,
    );
    React.useEffect(() => {
      if (!stage) return;
      let mounted = true;
      fetchStageModels((cache) => {
        if (mounted && cache[stage]) setResolvedModel(cache[stage]);
      });
      return () => { mounted = false; };
    }, [stage]);
    const ms = elapsed !== undefined ? elapsed : tickMs;
    const sec = (ms / 1000);
    const elapsedStr = sec < 1 ? `${Math.round(ms)}ms`
                     : sec < 10 ? `${sec.toFixed(1)}s`
                     : `${Math.round(sec)}s`;
    const c = accent || palette.cyan;
    // Highlight Opus tier so judges see the orchestration model at a
    // glance — matches the hackathon framing ("built with Opus 4.7").
    const isOpus = /opus/i.test(resolvedModel);
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: compact ? 11 : 11.5, color: palette.ink2,
        fontFamily: 'inherit', lineHeight: 1.4,
      }}>
        <Spinner color={c} size={compact ? 11 : 12} />
        <span style={{
          color: isOpus ? palette.amber : palette.ink,
          fontWeight: isOpus ? 600 : 400,
        }}>{resolvedModel}</span>
        <span style={{ color: palette.ink4 }}>·</span>
        <span style={{ color: palette.ink2 }}>{phase}</span>
        <span style={{ color: palette.ink4, marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>
          {elapsedStr}
        </span>
      </div>
    );
  }

  // A pipelined phase indicator. Shows ›-separated phases with the active one
  // highlighted by accent and trailing ones dimmed.
  //   phases:   ['planning', 'searching', 'drafting', 'verifying']
  //   activeIdx: integer (0-based)
  function PhaseDots({ phases = [], activeIdx = 0, accent, compact = false }) {
    const c = accent || palette.cyan;
    return (
      <span style={{
        fontSize: compact ? 10.5 : 11, color: palette.ink4,
        fontFamily: 'inherit', display: 'inline-flex', gap: 6, alignItems: 'center',
      }}>
        {phases.map((p, i) => {
          const done = i < activeIdx;
          const active = i === activeIdx;
          return (
            <React.Fragment key={p}>
              {i > 0 && <span style={{ color: palette.ink4 }}>›</span>}
              <span style={{
                color: active ? c : done ? palette.ink2 : palette.ink4,
                textDecoration: done ? 'line-through' : 'none',
                textDecorationColor: palette.ink4,
              }}>{p}</span>
            </React.Fragment>
          );
        })}
      </span>
    );
  }

  // expose
  Object.assign(window, {
    Spinner, ModelStatusLine, PhaseDots,
    useBraille, useElapsed,
    PROBE_BRAILLE: BRAILLE,
  });
})();
