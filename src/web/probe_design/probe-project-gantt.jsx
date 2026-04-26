/* global React */
const { useState, useMemo, useRef } = React;

// Timeline tab — Gantt chart anchored to a single submission deadline.
// Stages are laid out backward from the deadline; user can drag the deadline
// to slide everything, or drag bar edges to resize/move individual stages.

const ganttPalette = window.__probePalette;

// Default stage durations (in days) and the order they should sit on the timeline.
// Earlier stages chain into later ones; slack at the right tail is "writing buffer".
const DEFAULT_DURATIONS = [
  { id: 'framing',     days: 5,  leadDays: 0  },
  { id: 'literature',  days: 14, leadDays: 0  },
  { id: 'methodology', days: 10, leadDays: 0  },
  { id: 'artifacts',   days: 7,  leadDays: 0  },
  { id: 'evaluation',  days: 21, leadDays: 0  },
  { id: 'report',      days: 14, leadDays: 0  },
  { id: 'review',      days: 7,  leadDays: 5  }, // 5d buffer before deadline
];

const STAGE_COLORS = {
  framing:     '#d9a548',
  literature:  '#7dcfff',
  methodology: '#d9a548',
  artifacts:   '#7fb069',
  evaluation:  '#c8a8e6',
  report:      '#e26e6e',
  review:      '#c87838',
};

// Helper: normalize a Date to start-of-day
const sod = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const diffDays = (a, b) => Math.round((sod(a) - sod(b)) / 86400000);
const fmt = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const fmtLong = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

function ProjectTimeline({
  deadline, setDeadline,
  durations, setDurations,
  today, setToday,
  variant, // 'blocks' | 'ascii' | 'swim'
  density,
  project,
}) {
  const order = useMemo(() => durations, [durations]);

  // Compute each stage's start/end working backward from the deadline
  const layout = useMemo(() => {
    // chain in reverse: report ends at deadline - leadDays, then back up
    const out = {};
    let cursorEnd = addDays(deadline, -order[order.length - 1].leadDays);
    for (let i = order.length - 1; i >= 0; i--) {
      const s = order[i];
      const end = cursorEnd;
      const start = addDays(end, -s.days);
      out[s.id] = { start, end };
      cursorEnd = start; // chain
    }
    return out;
  }, [order, deadline]);

  // Earliest start across stages — the chart's left edge has 3 days of pad.
  // Critical: when the user drags the deadline far into the future, the
  // earliest stage start moves with it. Without explicit clamping, today
  // drops off the left edge and the user loses their "where am I?"
  // anchor. Clamp chartStart so today is always inside the chart with at
  // least 3 days of pad.
  const earliest = order.reduce(
    (acc, s) => layout[s.id].start < acc ? layout[s.id].start : acc,
    layout[order[0].id].start
  );
  const naiveStart = addDays(earliest, -3);
  const chartStart = today < naiveStart ? addDays(today, -3) : naiveStart;
  const chartEnd = addDays(deadline, 4);
  const totalDays = diffDays(chartEnd, chartStart);

  const containerRef = useRef(null);

  // Pixel mapping
  const pxPerDay = 14; // base; scale later if needed
  const chartWidthPx = totalDays * pxPerDay;

  // Drag handlers (deadline + per-stage)
  const dragStateRef = useRef(null);
  const onMouseDown = (kind, payload) => (e) => {
    dragStateRef.current = { kind, payload, startX: e.clientX };
    document.body.style.cursor = 'ew-resize';
    const onMove = (ev) => {
      const dx = ev.clientX - dragStateRef.current.startX;
      const dDays = Math.round(dx / pxPerDay);
      const ds = dragStateRef.current;
      if (!dDays && !ds.lastDDays) return;
      if (dDays === ds.lastDDays) return;
      ds.lastDDays = dDays;
      if (kind === 'deadline') {
        setDeadline(addDays(ds.payload.original, dDays));
      } else if (kind === 'today') {
        setToday(addDays(ds.payload.original, dDays));
      } else if (kind === 'stage-move') {
        // bump leadDays so this stage shifts later (positive dDays = later)
        // Easier: change leadDays for the report? For other stages we just shift their
        // duration by adjusting the next stage's start indirectly — to keep things simple,
        // we modify this stage's days when dragging the right edge, or the report's
        // leadDays when dragging report bar body.
        // For non-report bar moves, we treat as resize-from-left (changes own days).
        // (kept here as a no-op to avoid surprises; users resize via edge handles)
      } else if (kind === 'stage-resize-right') {
        const idx = order.findIndex((s) => s.id === ds.payload.stageId);
        const newDur = Math.max(2, ds.payload.originalDays + dDays);
        setDurations((prev) => prev.map((p, i) => i === idx ? { ...p, days: newDur } : p));
      } else if (kind === 'stage-resize-left') {
        const idx = order.findIndex((s) => s.id === ds.payload.stageId);
        const newDur = Math.max(2, ds.payload.originalDays - dDays);
        setDurations((prev) => prev.map((p, i) => i === idx ? { ...p, days: newDur } : p));
      }
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      dragStateRef.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // x position (px) for a date relative to chartStart
  const xFor = (d) => diffDays(d, chartStart) * pxPerDay;

  // Today marker
  const todayX = xFor(today);
  const deadlineX = xFor(deadline);

  // Week ticks
  const ticks = [];
  for (let i = 0; i <= totalDays; i++) {
    const d = addDays(chartStart, i);
    if (d.getDay() === 1) ticks.push({ d, x: i * pxPerDay });
  }

  // Stage rows
  const ROW_H = density === 'compact' ? 30 : 40;
  const TOP_PAD = 56;
  const chartHeightPx = TOP_PAD + order.length * ROW_H + 18;

  return (
    <div style={{
      padding: density === 'compact' ? '14px 24px 28px' : '22px 32px 40px',
      maxWidth: 1180,
    }}>
      <TimelineHeader deadline={deadline} setDeadline={setDeadline}
        today={today} layout={layout} order={order} />

      {/* SCROLLABLE GANTT BOARD */}
      <div style={{
        marginTop: 18, border: `1px solid ${ganttPalette.rule}`, borderRadius: 4,
        background: ganttPalette.bg2, overflow: 'hidden',
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '160px 1fr',
        }}>
          {/* labels column */}
          <div style={{
            borderRight: `1px solid ${ganttPalette.rule}`,
            paddingTop: TOP_PAD,
          }}>
            {order.map((s) => (
              <div key={s.id} style={{
                height: ROW_H, display: 'flex', alignItems: 'center', gap: 8,
                padding: '0 12px',
                borderTop: `1px dashed ${ganttPalette.rule}`,
                color: ganttPalette.ink2, fontSize: 12.5,
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: 2,
                  background: STAGE_COLORS[s.id],
                }} />
                <span>{s.id}</span>
                <span style={{ marginLeft: 'auto', color: ganttPalette.ink3, fontSize: 11 }}>
                  {s.days}d
                </span>
              </div>
            ))}
          </div>

          {/* chart area */}
          <div ref={containerRef}
            style={{ position: 'relative', overflowX: 'auto' }}>
            <div style={{
              position: 'relative', height: chartHeightPx, width: chartWidthPx, minWidth: '100%',
            }}>
              {/* week ticks */}
              {ticks.map((t, i) => (
                <div key={i} style={{
                  position: 'absolute', left: t.x, top: 0, bottom: 0,
                  borderLeft: `1px dashed ${ganttPalette.rule}`,
                }}>
                  <div style={{
                    position: 'absolute', top: 8, left: 4,
                    color: ganttPalette.ink4, fontSize: 10.5,
                  }}>{fmt(t.d)}</div>
                </div>
              ))}

              {/* today line (draggable, animated) */}
              <div
                onMouseDown={onMouseDown('today', { original: today })}
                style={{
                  position: 'absolute', left: todayX, top: 26, bottom: 0,
                  borderLeft: `2px solid #7dcfff`,
                  cursor: 'ew-resize',
                }}>
                <div style={{
                  position: 'absolute', top: -16, left: -22,
                  background: '#7dcfff', color: ganttPalette.bg,
                  padding: '1px 6px', borderRadius: 2, fontSize: 10, fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}>TODAY · {fmt(today)}</div>
              </div>

              {/* deadline line (draggable) */}
              <div
                onMouseDown={onMouseDown('deadline', { original: deadline })}
                style={{
                  position: 'absolute', left: deadlineX, top: 26, bottom: 0,
                  borderLeft: `2px solid ${ganttPalette.amber}`,
                  cursor: 'ew-resize',
                }}>
                <div style={{
                  position: 'absolute', top: -16, left: -36,
                  background: ganttPalette.amber, color: ganttPalette.bg,
                  padding: '1px 6px', borderRadius: 2, fontSize: 10, fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}>SUBMIT · {fmt(deadline)}</div>
              </div>

              {/* stage bars */}
              {order.map((s, i) => {
                const lay = layout[s.id];
                const x = xFor(lay.start);
                const w = diffDays(lay.end, lay.start) * pxPerDay;
                const y = TOP_PAD + i * ROW_H + (ROW_H - 22) / 2;
                const atRisk = lay.end < today; // already in the past = behind
                const inProgress = today >= lay.start && today <= lay.end;
                return (
                  <div key={s.id} style={{ position: 'absolute', left: 0, top: 0 }}>
                    <div
                      onMouseDown={onMouseDown('stage-move', { stageId: s.id })}
                      style={{
                        position: 'absolute', left: x, top: y,
                        width: w, height: 22, borderRadius: 4,
                        background: STAGE_COLORS[s.id],
                        opacity: atRisk ? 0.5 : 1,
                        boxShadow: inProgress ? `0 0 0 2px rgba(125,207,255,0.4)` : 'none',
                        display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px',
                        color: ganttPalette.bg, fontSize: 11, fontWeight: 600,
                        cursor: 'grab',
                      }}>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.id} · {fmt(lay.start)} → {fmt(lay.end)}
                      </span>
                      {/* edges */}
                      <div onMouseDown={(e) => { e.stopPropagation(); onMouseDown('stage-resize-left', { stageId: s.id, originalDays: s.days })(e); }}
                        style={{
                          position: 'absolute', left: 0, top: 0, bottom: 0, width: 6,
                          cursor: 'ew-resize', background: 'rgba(0,0,0,0.15)',
                          borderTopLeftRadius: 4, borderBottomLeftRadius: 4,
                        }} />
                      <div onMouseDown={(e) => { e.stopPropagation(); onMouseDown('stage-resize-right', { stageId: s.id, originalDays: s.days })(e); }}
                        style={{
                          position: 'absolute', right: 0, top: 0, bottom: 0, width: 6,
                          cursor: 'ew-resize', background: 'rgba(0,0,0,0.15)',
                          borderTopRightRadius: 4, borderBottomRightRadius: 4,
                        }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* small reference legend.
          The "slack" line surfaces the gap between today and the
          earliest stage start. Positive slack = comfortable buffer;
          negative = the user has already started but the schedule
          says they shouldn't have; zero = right on. Without this,
          pushing the deadline far out makes the chart "grow" without
          giving any signal of how much breathing room that bought. */}
      <div style={{
        marginTop: 12, display: 'flex', gap: 18, flexWrap: 'wrap',
        color: ganttPalette.ink3, fontSize: 11.5,
      }}>
        <span><kbd style={window.__probeKbd}>drag</kbd> a bar edge to resize · drag SUBMIT or TODAY to move them</span>
        <span style={{ marginLeft: 'auto' }}>
          {(() => {
            const slack = diffDays(earliest, today);
            const tag =
              slack > 7  ? `${slack}d slack before stage 1 starts`
            : slack >= 0 ? `${slack}d before stage 1 starts`
            :              `${Math.abs(slack)}d into stage 1 already`;
            return tag + ' · ';
          })()}
          {diffDays(deadline, today)} days to submit · {order.reduce((a, s) => a + s.days, 0)}d total work
        </span>
      </div>
    </div>
  );
}

function TimelineHeader({ deadline, setDeadline, today, layout, order }) {
  const daysLeft = diffDays(deadline, today);
  const onChange = (e) => {
    const v = e.target.value;
    if (v) setDeadline(sod(new Date(v)));
  };
  const iso = (d) => {
    const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0');
    const dd = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${dd}`;
  };
  return (
    <div>
      <div style={{ color: ganttPalette.ink3, fontSize: 11, letterSpacing: '0.14em',
        textTransform: 'uppercase' }}>
        ─── timeline · backward from submission
      </div>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 8, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ color: ganttPalette.ink3, fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase' }}>submission deadline</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <input type="date" value={iso(deadline)} onChange={onChange} style={{
              background: ganttPalette.bg2, border: `1px solid ${ganttPalette.rule}`,
              color: ganttPalette.ink, fontFamily: 'inherit', fontSize: 13,
              padding: '4px 8px', borderRadius: 3, outline: 'none',
              colorScheme: 'dark',
            }} />
            <span style={{ color: ganttPalette.amber, fontSize: 13, fontWeight: 600 }}>{fmtLong(deadline)}</span>
          </div>
        </div>
        <div>
          <div style={{ color: ganttPalette.ink3, fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase' }}>days remaining</div>
          <div style={{ color: daysLeft < 0 ? '#e26e6e' : ganttPalette.ink, fontSize: 18, fontWeight: 600, marginTop: 4 }}>
            {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d`}
          </div>
        </div>
        <div>
          <div style={{ color: ganttPalette.ink3, fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase' }}>next milestone</div>
          <NextMilestone today={today} layout={layout} order={order} />
        </div>
      </div>
    </div>
  );
}

function NextMilestone({ today, layout, order }) {
  // The next stage that ends after today
  const upcoming = order.find((s) => layout[s.id].end >= today);
  if (!upcoming) {
    return <div style={{ color: ganttPalette.ink, fontSize: 13, marginTop: 4 }}>all stages booked</div>;
  }
  const lay = layout[upcoming.id];
  const dleft = diffDays(lay.end, today);
  return (
    <div style={{ color: ganttPalette.ink, fontSize: 13, marginTop: 4 }}>
      {upcoming.id} ends <span style={{ color: ganttPalette.ink3 }}>· {dleft}d · {fmt(lay.end)}</span>
    </div>
  );
}

window.ProjectTimeline = ProjectTimeline;
window.PROBE_DEFAULT_DURATIONS = DEFAULT_DURATIONS;
window.PROBE_GANTT_HELPERS = { sod, addDays, diffDays, fmt, fmtLong };
