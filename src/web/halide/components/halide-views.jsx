// Probe Halide · views
// Simplified pass: six views instead of nine. Removed the fixture-only
// Walkthrough (streaming typing) and Reviewers (hand-written reviewer
// cards) since neither can render real data yet. The remaining views
// —  Home, Premise, Branch, Audit, Guidebook, SourcePanel, CmdK —
// accept a loadedRun and use its content when present.

const { useState: hUseState, useEffect: hUseEffect, useRef: hUseRef, useMemo: hUseMemo } = React;

// ─── Home ───
function HalideHomeView({ loadRun }) {
  const [premise, setPremise] = hUseState('');
  const [stepMode, setStepMode] = hUseState(true);
  const [replay, setReplay] = hUseState(false);

  // The "Begin run" button can't actually start a run from the browser
  // today — runs are CLI-initiated (probe run "…"). We show the user a
  // ready-to-copy command instead of pretending the browser can launch.
  const [copiedCmd, setCopiedCmd] = hUseState(false);
  const cmd = (() => {
    const p = (premise || 'evaluate an ARIA-live AI-disclosure banner for BLV screen-reader users').replace(/"/g, '\\"');
    const flags = [stepMode ? '--step' : '', replay ? '--replay' : ''].filter(Boolean).join(' ');
    return `probe run "${p}"${flags ? ' ' + flags : ''}`;
  })();
  const copyCmd = async () => {
    try { await navigator.clipboard.writeText(cmd); setCopiedCmd(true); setTimeout(() => setCopiedCmd(false), 1400); } catch { /* noop */ }
  };

  return (
    <div className="hld-scroll" style={{ flex: 1, overflow: 'auto', display: 'grid', gridTemplateColumns: '1fr 360px' }}>
      <div style={{ padding: '60px 64px', maxWidth: 880 }}>
        <div className="hld-uc" style={{ color: 'var(--amber)' }}>A new premise</div>
        <h1 style={{ fontFamily: 'Newsreader, serif', fontSize: 40, fontWeight: 400, lineHeight: 1.1, margin: '10px 0 0', letterSpacing: '-0.015em', color: 'var(--ink)' }}>
          State the study you're considering, in one sentence.
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.6, marginTop: 12, maxWidth: 560 }}>
          Probe interrogates it, diverges into three programs, rehearses each,
          and assembles a provenance-tagged guidebook for anything that survives.
          Kicked off from the CLI; browsed here.
        </p>
        <div style={{
          marginTop: 26, border: '1px solid var(--line-2)', borderRadius: 8,
          background: 'var(--bg-1)', maxWidth: 760,
          boxShadow: '0 1px 0 oklch(25% 0.01 255), 0 8px 24px -12px rgba(0,0,0,0.4)',
        }}>
          <textarea
            value={premise} onChange={(e) => setPremise(e.target.value)}
            placeholder="e.g. evaluate an ARIA-live AI-disclosure banner for BLV screen-reader users"
            style={{
              width: '100%', minHeight: 96, padding: '16px 18px',
              background: 'transparent', border: 'none', outline: 'none', resize: 'none',
              fontFamily: 'Newsreader, serif', fontSize: 18, lineHeight: 1.5,
              color: 'var(--ink)', fontStyle: 'italic',
            }}
          />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '8px 10px 8px 16px', borderTop: '1px solid var(--line)',
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-3)', cursor: 'pointer' }}>
              <input type="checkbox" checked={stepMode} onChange={(e) => setStepMode(e.target.checked)} style={{ accentColor: 'oklch(78% 0.14 72)' }} />
              Pause at every stage
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-3)', cursor: 'pointer' }}>
              <input type="checkbox" checked={replay} onChange={(e) => setReplay(e.target.checked)} style={{ accentColor: 'oklch(78% 0.14 72)' }} />
              Replay cache · $0
            </label>
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
              <span className="hld-mono" style={{ fontSize: 10.5, color: 'var(--ink-4)', whiteSpace: 'nowrap' }}>est · 25m · ~$5</span>
              <button className="hld-btn hld-btn-primary" onClick={copyCmd} disabled={!premise.trim()} style={{ opacity: premise.trim() ? 1 : 0.5 }}>
                {copiedCmd ? 'Copied ✓' : 'Copy command'} <span className="hld-kbd" style={{ background: 'oklch(80% 0.02 255)', border: '1px solid oklch(70% 0.02 255)', color: 'var(--bg)' }}>⌘C</span>
              </button>
            </span>
          </div>
          {premise.trim() && (
            <div style={{ padding: '10px 16px 12px', borderTop: '1px solid var(--line)', fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5, color: 'var(--ink-3)', background: 'var(--bg-2)', borderRadius: '0 0 8px 8px' }}>
              $ {cmd}
            </div>
          )}
        </div>
      </div>

      <div style={{ borderLeft: '1px solid var(--line)', background: 'var(--bg-1)', padding: '20px 20px', overflow: 'auto' }} className="hld-scroll">
        <div className="hld-uc">Recent runs</div>
        <div style={{ marginTop: 10 }}>
          {window.PROBE_RUNS.map((r, i) => (
            <div key={r.id}
              onClick={() => loadRun(r.id)}
              style={{
                padding: '12px 12px', margin: '0 -12px',
                borderBottom: i === window.PROBE_RUNS.length - 1 ? 'none' : '1px solid var(--line)',
                borderRadius: 6, cursor: 'pointer',
              }} className="hld-row">
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                <span className="hld-mono" style={{ fontSize: 11, color: 'var(--blue)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.id}</span>
                <span className="hld-mono" style={{ fontSize: 10, color: 'var(--ink-4)', whiteSpace: 'nowrap' }}>{r.stamp}</span>
              </div>
              <div style={{ fontFamily: 'Newsreader, serif', fontSize: 13.5, lineHeight: 1.4, marginTop: 6, color: 'var(--ink-2)', fontStyle: 'italic' }}>
                "{r.premise || '(no premise recorded)'}"
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="hld-mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>${(r.cost || 0).toFixed(2)}</span>
                <span className="hld-mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>{r.duration || '—'}</span>
                <span className="hld-chip-solid" style={{
                  background: r.verdict === 'all blocked' ? 'oklch(25% 0.06 20)' : r.verdict === '—' ? 'var(--bg-3)' : 'oklch(25% 0.06 155)',
                  color: r.verdict === 'all blocked' ? 'var(--rose)' : r.verdict === '—' ? 'var(--ink-4)' : 'var(--moss)',
                  whiteSpace: 'nowrap',
                }}>{r.verdict}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Premise card (checkpoint / detail) ───
function HalidePremise({ loadedRun, onAccept, chosen, setChosen }) {
  const pc = loadedRun?.premise_card;
  const sharpest = pc?.sharpest_question || window.PROBE_SHARPEST_QUESTION;
  const options = (pc?.sharpened_options && Array.isArray(pc.sharpened_options) && pc.sharpened_options.length)
    ? pc.sharpened_options.map((t, i) => ({ id: i + 1, label: `Option ${i + 1}`, text: typeof t === 'string' ? t : String(t), axis: '—' }))
    : window.PROBE_SHARPENED_OPTIONS;
  const isLive = !loadedRun; // "checkpoint" bar only on first-run demo flow; real loaded runs are historical

  return (
    <div className="hld-scroll" style={{ flex: 1, overflow: 'auto', padding: '28px 40px 120px', maxWidth: 960 }}>
      <div className="hld-uc" style={{ color: 'var(--amber)' }}>
        {isLive ? 'Stage 1 · Premise card · paused' : 'Premise card · historical'}
      </div>
      <h2 style={{ fontFamily: 'Newsreader, serif', fontSize: 26, fontWeight: 400, lineHeight: 1.25, margin: '8px 0 0', letterSpacing: '-0.01em' }}>
        {sharpest}
      </h2>
      {pc?.claim && (
        <div style={{ marginTop: 14, padding: 14, background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 8 }}>
          <div className="hld-uc">Claim</div>
          <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55, marginTop: 6 }}>{pc.claim}</div>
        </div>
      )}
      {pc?.missing_evidence && pc.missing_evidence.length > 0 && (
        <div style={{ marginTop: 14, padding: 14, background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 8 }}>
          <div className="hld-uc">Missing evidence</div>
          <ul style={{ margin: '8px 0 0', padding: '0 0 0 18px', fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55 }}>
            {pc.missing_evidence.map((m, i) => <li key={i} style={{ marginBottom: 4 }}>{m}</li>)}
          </ul>
        </div>
      )}

      <div className="hld-uc" style={{ marginTop: 24 }}>Sharpened options</div>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {options.map((opt) => {
          const picked = chosen === opt.id;
          return (
            <div key={opt.id} onClick={() => setChosen(opt.id)} style={{
              padding: 14, borderRadius: 8,
              background: picked ? 'oklch(22% 0.05 72)' : 'var(--bg-1)',
              border: `1px solid ${picked ? 'var(--amber)' : 'var(--line)'}`,
              cursor: 'pointer', transition: 'background 140ms, border-color 140ms',
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span className="hld-mono" style={{ color: picked ? 'var(--amber)' : 'var(--ink-4)', fontSize: 11 }}>0{opt.id}</span>
                  <span style={{ fontWeight: 500, fontSize: 13.5 }}>{opt.label}</span>
                </div>
                {opt.axis && opt.axis !== '—' && <span className="hld-chip">axis · {opt.axis}</span>}
              </div>
              <div style={{ fontFamily: 'Newsreader, serif', fontSize: 14, lineHeight: 1.55, color: 'var(--ink-2)', marginTop: 6, fontStyle: 'italic' }}>
                {opt.text}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Branch detail ───
function HalideBranch({ id, branches, killBranch, loadedRun }) {
  const realBranch = loadedRun?.branches?.[id];
  const bCard = realBranch?.branch_card || {};
  const audit = realBranch?.audit || {};
  const meta = realBranch?.meta_review || {};

  // Fallback to fixture if no real data
  const fixture = window.PROBE_BRANCHES.find((x) => x.id === id) || window.PROBE_BRANCHES[1];
  const letter = (id || '').toUpperCase() || fixture.letter;
  const title = bCard.title || fixture.title;
  const question = bCard.research_question || fixture.question;
  const method = bCard.method_family || fixture.method;
  const relationship = bCard.human_system_relationship || fixture.relationship;
  const verdict = meta.verdict || audit.verdict || fixture.verdict;
  const verdictReason = meta.verdict_rationale || fixture.verdictReason;

  const state = branches[id];
  const killed = state === 'killed';
  const verdictColor = (v) => {
    const s = String(v || '').toUpperCase();
    if (s.includes('BLOCK') || s.includes('REJECT')) return ['var(--rose-s)', 'var(--rose)'];
    if (s.includes('REVIS') || s.includes('HUMAN')) return ['var(--amber-s)', 'var(--amber)'];
    if (s === 'PASSED' || s.includes('ACCEPT')) return ['var(--moss-s)', 'var(--moss)'];
    return ['var(--bg-3)', 'var(--ink-3)'];
  };
  const [vbg, vfg] = verdictColor(verdict);

  return (
    <div className="hld-scroll" style={{ flex: 1, overflow: 'auto', padding: '24px 40px 60px', maxWidth: 960, opacity: killed ? 0.55 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="hld-dot" style={{ background: vfg, width: 8, height: 8 }} />
        <span className="hld-uc">Branch {letter} · {method}</span>
        <span className="hld-chip-solid" style={{ background: vbg, color: vfg }}>{verdict}</span>
        {killed && <span className="hld-chip-solid" style={{ background: 'var(--bg-3)', color: 'var(--ink-4)' }}>STOPPED</span>}
      </div>
      <h2 style={{ fontFamily: 'Newsreader, serif', fontSize: 30, fontWeight: 400, margin: '10px 0 0', letterSpacing: '-0.01em', lineHeight: 1.2 }}>{title}</h2>
      <div style={{ fontFamily: 'Newsreader, serif', fontSize: 16, lineHeight: 1.55, color: 'var(--ink-2)', marginTop: 14, fontStyle: 'italic', maxWidth: 700 }}>
        {question}
      </div>

      <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {method && <span className="hld-chip">method · {method}</span>}
        {relationship && <span className="hld-chip">relationship · {relationship}</span>}
      </div>

      {verdictReason && (
        <div style={{ marginTop: 20, padding: 16, background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 8 }}>
          <div className="hld-uc">Verdict rationale</div>
          <div style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-2)', marginTop: 8 }}>{verdictReason}</div>
        </div>
      )}

      {audit.findings && audit.findings.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="hld-uc" style={{ padding: '4px 2px' }}>Audit preview · {audit.findings.filter((f) => f.fired).length} fired</div>
        </div>
      )}
    </div>
  );
}

// ─── Audit ───
function HalideAudit({ branchId, loadedRun }) {
  const [groupBy, setGroupBy] = hUseState('severity');
  const [selected, setSelected] = hUseState(null);
  const color = (s) => s <= -2 ? ['var(--rose-s)', 'var(--rose)'] : s === -1 ? ['var(--amber-s)', 'var(--amber)'] : s === 0 ? ['var(--bg-3)', 'var(--ink-3)'] : ['var(--moss-s)', 'var(--moss)'];

  // Prefer real audit findings if the loaded run has them for this branch
  const realAudit = loadedRun?.branches?.[branchId]?.audit;
  const findingsRaw = (realAudit && Array.isArray(realAudit.findings) && realAudit.findings.length)
    ? realAudit.findings.map((f, i) => ({
        id: f.id || `f${i}`,
        pattern_id: f.pattern_id || `pattern_${i}`,
        axis: (f.axis || '—').toString(),
        score: typeof f.score === 'number' ? f.score : 0,
        severity: f.severity || (f.score <= -1 ? 'major' : 'minor'),
        fired: !!f.fired,
        evidence: (f.evidence_span && f.evidence_span.quote) || f.evidence || '—',
        evidence_source: f.evidence_span?.source || '',
        rationale: f.rationale || '',
        suggested_revision: f.suggested_revision || '',
      }))
    : window.PROBE_AUDIT_FINDINGS;

  const findings = [...findingsRaw].sort((a, b) => groupBy === 'severity' ? a.score - b.score : (a.axis || '').localeCompare(b.axis || ''));

  const axisGroups = findings.reduce((acc, f) => {
    const a = (f.axis || 'Other');
    acc[a] = acc[a] || { name: a, score: 0, fired: 0 };
    if (f.fired) {
      acc[a].fired += 1;
      acc[a].score = Math.min(acc[a].score || 0, f.score);
    }
    return acc;
  }, {});
  const axes = Object.values(axisGroups);

  const title = realAudit
    ? `${axes.reduce((n, ax) => n + ax.fired, 0)} patterns fired · verdict ${realAudit.verdict || '—'}`
    : 'Four patterns fired. No −2 blocker — fixable before fielding.';

  return (
    <div className="hld-scroll" style={{ flex: 1, overflow: 'auto', padding: '24px 40px 60px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div className="hld-uc" style={{ color: 'var(--amber)' }}>Stage 6 · Pattern audit · Branch {(branchId || '').toUpperCase()}</div>
          <h2 style={{ fontFamily: 'Newsreader, serif', fontSize: 26, fontWeight: 400, margin: '8px 0 0', letterSpacing: '-0.01em' }}>
            {title}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-2)', padding: 3, borderRadius: 6 }}>
          {['severity', 'axis'].map((g) => (
            <button key={g} onClick={() => setGroupBy(g)} style={{
              height: 24, padding: '0 10px', borderRadius: 4, border: 'none', cursor: 'pointer',
              background: groupBy === g ? 'var(--bg-hv)' : 'transparent',
              color: groupBy === g ? 'var(--ink)' : 'var(--ink-3)',
              fontSize: 11.5, fontWeight: 500, textTransform: 'capitalize', fontFamily: 'inherit',
            }}>{g}</button>
          ))}
        </div>
      </div>

      {axes.length > 0 && (
        <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: `repeat(${Math.min(axes.length, 4)}, 1fr)`, gap: 8 }}>
          {axes.map((ax) => {
            const [bg, fg] = color(ax.score);
            return (
              <div key={ax.name} style={{ padding: '10px 12px', background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="hld-uc">{ax.name}</span>
                  <span className="hld-chip-solid" style={{ background: bg, color: fg }}>{ax.score > 0 ? `+${ax.score}` : ax.score}</span>
                </div>
                <div style={{ display: 'flex', gap: 2, marginTop: 8 }}>
                  {[-2, -1, 0, 1, 2].map((s) => (
                    <div key={s} style={{ flex: 1, height: 4, borderRadius: 1, background: s === ax.score ? color(s)[1] : 'var(--bg-3)' }} />
                  ))}
                </div>
                <div className="hld-mono" style={{ fontSize: 10.5, color: 'var(--ink-4)', marginTop: 8 }}>{ax.fired} fired</div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {findings.map((f, i) => {
            const [bg, fg] = color(f.score);
            const open = selected === f.id;
            return (
              <div key={f.id} onClick={() => setSelected(open ? null : f.id)} style={{
                padding: '14px 16px', background: 'var(--bg-1)',
                border: `1px solid ${open ? 'var(--line-2)' : 'var(--line)'}`,
                borderLeft: `3px solid ${fg}`, borderRadius: 6,
                cursor: 'pointer', opacity: f.fired ? 1 : 0.6,
              }} className="hld-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className="hld-chip-solid" style={{ background: bg, color: fg }}>{f.score > 0 ? `+${f.score}` : f.score}</span>
                  <span className="hld-mono" style={{ fontSize: 12, color: 'var(--ink)' }}>{f.pattern_id}</span>
                  <span className="hld-chip">{f.axis}</span>
                  {!f.fired && <span className="hld-chip" style={{ color: 'var(--moss)' }}>did not fire</span>}
                  <span className="hld-mono" style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--ink-4)' }}>#{String(i + 1).padStart(2, '0')}</span>
                </div>
                {f.evidence && (
                  <div style={{ fontFamily: 'Newsreader, serif', fontSize: 14, lineHeight: 1.5, color: 'var(--ink-2)', marginTop: 10, fontStyle: 'italic', paddingLeft: 10, borderLeft: '2px solid var(--line)' }}>
                    {f.evidence}
                  </div>
                )}
                {f.rationale && <div style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--ink-2)', marginTop: 10 }}>{f.rationale}</div>}
              </div>
            );
          })}
        </div>
        {selected && (() => {
          const f = findings.find((x) => x.id === selected);
          if (!f) return null;
          return (
            <div className="hld-fade-in" style={{ padding: 16, background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 8, height: 'fit-content', position: 'sticky', top: 10 }}>
              <div className="hld-uc">Suggested revision</div>
              <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-2)', marginTop: 8 }}>
                {f.suggested_revision || '—'}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ─── Guidebook ───
// Renders the real PROBE_GUIDEBOOK.md when available. Parses lines that
// end with a [TAG] or [TAG:id] marker and renders the tag as a trailing
// monospace pill. Falls back to the fixture paragraphs if no text has
// been loaded yet.
function HalideGuidebook({ setSourceOpen, guidebookText }) {
  const paragraphs = hUseMemo(() => {
    if (!guidebookText) {
      return window.PROBE_GUIDEBOOK_PARAGRAPHS.map((p) => ({
        section: p.section, text: p.text, tag: p.tag, id: p.id,
      }));
    }
    const out = [];
    const lines = guidebookText.split('\n');
    let currentSection = '';
    let counter = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      if (line.startsWith('## ')) { currentSection = line.slice(3).trim(); continue; }
      if (line.startsWith('# ')) { continue; }
      if (line.startsWith('### ')) { currentSection = line.slice(4).trim(); continue; }
      // Content line with trailing [TAG] or [TAG:id]
      const m = line.match(/^(.*?)\s+\[([A-Z_]+(?::[A-Za-z0-9_\-]+)?)\]\s*$/);
      if (m) {
        out.push({ id: `p${counter++}`, section: currentSection, text: m[1].trim(), tag: m[2] });
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        // Bulleted tagged content
        const mb = line.match(/^[-*]\s+(.*?)\s+\[([A-Z_]+(?::[A-Za-z0-9_\-]+)?)\]\s*$/);
        if (mb) out.push({ id: `p${counter++}`, section: currentSection, text: mb[1].trim(), tag: mb[2] });
      }
    }
    return out;
  }, [guidebookText]);

  // Group by section
  const sections = [];
  let lastSection = null;
  paragraphs.forEach((p) => {
    if (p.section !== lastSection) { sections.push({ name: p.section, paras: [] }); lastSection = p.section; }
    sections[sections.length - 1].paras.push(p);
  });

  const tagStyles = (rawTag) => {
    const [key] = rawTag.split(':');
    const t = window.PROBE_PROVENANCE_TAGS[key];
    const darkenBg = { SOURCE_CARD: 'oklch(28% 0.06 250)', RESEARCHER_INPUT: 'oklch(28% 0.05 255)', SIMULATION_REHEARSAL: 'oklch(30% 0.06 72)', AGENT_INFERENCE: 'oklch(28% 0.06 295)', UNCITED_ADJACENT: 'oklch(28% 0.06 20)', HUMAN_REQUIRED: 'oklch(28% 0.06 20)', DO_NOT_CLAIM: 'oklch(26% 0.08 20)', TOOL_VERIFIED: 'oklch(28% 0.06 155)', IMPORTED_DRAFT: 'oklch(28% 0.01 85)' };
    const darkenFg = { SOURCE_CARD: 'var(--blue)', RESEARCHER_INPUT: 'var(--blue)', SIMULATION_REHEARSAL: 'var(--amber)', AGENT_INFERENCE: 'var(--purple)', UNCITED_ADJACENT: 'var(--rose)', HUMAN_REQUIRED: 'var(--rose)', DO_NOT_CLAIM: 'var(--rose)', TOOL_VERIFIED: 'var(--moss)', IMPORTED_DRAFT: 'var(--ink-2)' };
    return { bg: darkenBg[key] || 'var(--bg-2)', fg: darkenFg[key] || 'var(--ink-2)', label: (t?.label || key).toLowerCase() };
  };

  return (
    <div className="hld-scroll" style={{ flex: 1, overflow: 'auto', padding: '36px 56px 60px', maxWidth: 820 }}>
      {sections.length === 0 ? (
        <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>
          (no guidebook content)
        </div>
      ) : (
        sections.map((sec, si) => (
          <div key={si} style={{ marginBottom: 36 }}>
            {sec.name && (
              <>
                <div className="hld-uc" style={{ color: 'var(--amber)' }}>{sec.name}</div>
                <h2 style={{ fontFamily: 'Newsreader, serif', fontSize: 28, fontWeight: 400, margin: '8px 0 20px', letterSpacing: '-0.015em', lineHeight: 1.2 }}>
                  {sec.name}
                </h2>
              </>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {sec.paras.map((p) => {
                const [key, value] = p.tag.includes(':') ? p.tag.split(':') : [p.tag, null];
                const { bg, fg } = tagStyles(p.tag);
                return (
                  <p key={p.id} style={{
                    fontFamily: 'Newsreader, serif', fontSize: 17, lineHeight: 1.65, margin: 0, color: 'var(--ink)',
                  }}>
                    {p.text}{' '}
                    <span
                      className="hld-chip-solid"
                      style={{
                        background: bg, color: fg,
                        cursor: value ? 'pointer' : 'default', verticalAlign: '2px', border: '1px solid oklch(40% 0.03 255 / 0.4)',
                      }}
                      onClick={() => value && setSourceOpen(value)}
                    >
                      {key.toLowerCase()}{value ? `:${value}` : ''}
                    </span>
                  </p>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Source panel (unchanged) ───
function HalideSourcePanel({ id, onClose }) {
  const cards = {
    kafer_2013: { title: 'Feminist, Queer, Crip', author: 'Alison Kafer', year: 2013, pub: 'Indiana University Press', claim: 'political/relational model of disability', quote: '"Disability is not a flaw in the individual but a feature of the arrangement."', pages: '3–27' },
    jakesch_2023: { title: 'Co-Writing with Opinionated Language Models', author: 'Jakesch et al.', year: 2023, pub: 'CHI 2023', claim: 'AI-authorship disclosure reduces credibility 8–14%', quote: '"Disclosure reliably dampens perceived trustworthiness but is moderated by domain expertise."', pages: '112:1–112:17' },
  };
  const c = cards[id] || { title: id, author: '(source card)', year: '', pub: '', claim: 'see corpus/source_cards/' + id + '.yaml', quote: '', pages: '' };
  return (
    <div className="hld-fade-in" style={{
      position: 'absolute', top: 0, right: 0, bottom: 0, width: 400, zIndex: 50,
      background: 'var(--bg-1)', borderLeft: '1px solid var(--line-2)',
      padding: 20, overflow: 'auto', boxShadow: '-20px 0 40px -20px rgba(0,0,0,0.5)',
    }} className="hld-scroll">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="hld-chip-solid" style={{ background: 'oklch(28% 0.06 250)', color: 'var(--blue)' }}>SOURCE_CARD</span>
          <span className="hld-mono" style={{ fontSize: 11.5, color: 'var(--ink-2)' }}>{id}</span>
        </div>
        <button className="hld-btn hld-btn-ghost" onClick={onClose} style={{ width: 24, padding: 0, justifyContent: 'center' }}>
          <HIcon k="close" size={11} />
        </button>
      </div>
      <div style={{ marginTop: 14, padding: 16, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8 }}>
        <div style={{ fontFamily: 'Newsreader, serif', fontSize: 20, fontWeight: 500, lineHeight: 1.25 }}>{c.title}</div>
        <div style={{ fontFamily: 'Newsreader, serif', fontSize: 13, color: 'var(--ink-3)', marginTop: 4, fontStyle: 'italic' }}>
          {c.author}{c.year ? ` · ${c.year}` : ''}{c.pub ? ` · ${c.pub}` : ''}
        </div>
        <div style={{ height: 1, background: 'var(--line)', margin: '14px 0' }} />
        <div className="hld-mono" style={{ fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.8 }}>
          <div><span style={{ color: 'var(--ink-4)' }}>claim:</span> {c.claim}</div>
          {c.pages && <div><span style={{ color: 'var(--ink-4)' }}>pages:</span> {c.pages}</div>}
        </div>
        {c.quote && (
          <>
            <div style={{ height: 1, background: 'var(--line)', margin: '14px 0' }} />
            <div style={{ fontFamily: 'Newsreader, serif', fontSize: 14, lineHeight: 1.55, color: 'var(--ink-2)', fontStyle: 'italic' }}>{c.quote}</div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Command palette ───
function HalideCmdK({ open, onClose, setRoute, loadedRun }) {
  const [q, setQ] = hUseState('');
  hUseEffect(() => { if (open) setQ(''); }, [open]);
  if (!open) return null;
  const items = [
    { label: 'Go to home', kind: 'nav', route: { kind: 'home' }, icon: 'home' },
    ...(loadedRun ? [
      { label: 'Premise card', kind: 'nav', route: { kind: 'premise' }, icon: 'file' },
      ...Object.keys(loadedRun.branches || {}).map((bid) => ({
        label: `Branch ${bid.toUpperCase()}`,
        kind: 'nav', route: { kind: 'branch', id: bid }, icon: 'branch',
      })),
      ...Object.keys(loadedRun.branches || {}).map((bid) => ({
        label: `Audit · Branch ${bid.toUpperCase()}`,
        kind: 'nav', route: { kind: 'audit', branch: bid }, icon: 'file',
      })),
      ...(loadedRun.guidebook_exists ? [{ label: 'Guidebook', kind: 'nav', route: { kind: 'guidebook' }, icon: 'book' }] : []),
    ] : []),
  ].filter((it) => it.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'oklch(10% 0.01 255 / 0.55)', backdropFilter: 'blur(4px)',
      zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 120,
    }}>
      <div className="hld hld-fade-in" onClick={(e) => e.stopPropagation()} style={{
        width: 560, background: 'var(--bg-1)', border: '1px solid var(--line-2)', borderRadius: 10,
        boxShadow: '0 20px 60px -10px rgba(0,0,0,0.6)', overflow: 'hidden',
      }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <HIcon k="search" size={14} color="var(--ink-3)" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search artifacts, branches, commands…"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--ink)', fontSize: 14, fontFamily: 'inherit' }} />
          <span className="hld-kbd">esc</span>
        </div>
        <div style={{ maxHeight: 320, overflow: 'auto', padding: 6 }}>
          {items.map((it, i) => (
            <div key={i} className="hld-row" onClick={() => {
              if (it.route) setRoute(it.route);
              onClose();
            }} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 5,
              fontSize: 13, color: 'var(--ink-2)', cursor: 'pointer',
            }}>
              <HIcon k={it.icon} size={13} color={it.kind === 'act' ? 'var(--amber)' : 'var(--ink-3)'} />
              <span>{it.label}</span>
              <span className="hld-chip-solid" style={{ marginLeft: 'auto', background: 'var(--bg-3)', color: 'var(--ink-4)' }}>
                {it.kind}
              </span>
            </div>
          ))}
          {items.length === 0 && (
            <div style={{ padding: 16, color: 'var(--ink-4)', fontSize: 13 }}>No matches.</div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  HalideHomeView, HalidePremise, HalideBranch,
  HalideAudit, HalideGuidebook,
  HalideSourcePanel, HalideCmdK,
});
