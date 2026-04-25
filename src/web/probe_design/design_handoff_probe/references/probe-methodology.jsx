/* global React */
const { useState, useEffect, useRef } = React;

// Stage 3 — Integrated Study Design
// One study. Layered methods. Each method-component maps to one or more RQs.
// User: edits RQs inline, picks one integrated design (or proposes custom),
// then edits the drafted plan freely.

const palette = window.__probePalette;
const kbdStyle = window.__probeKbd;
const chipStyle = window.__probeChip;
const ghostBtnStyle = window.__probeGhostBtn;

// Coverage glyphs — strong / partial / none
const COV = { 0: { glyph: '·', label: 'not addressed', color: '#3d4555' },
              1: { glyph: '◐', label: 'partial',        color: '#8b93a7' },
              2: { glyph: '●', label: 'core',           color: '#d9a548' } };

// Five candidate integrated designs.
// Each `components` entry is a method-block within the study; `coverage` indexes
// match the order of selectedBranches at runtime.
const stockDesigns = (selectedBranches) => {
  const n = selectedBranches.length;
  const ones = (vals) => vals.slice(0, n).concat(Array(Math.max(0, n - vals.length)).fill(1));
  return [
    {
      id: 'mixed-field',
      name: 'Mixed-methods longitudinal field study',
      summary: '12-week field deployment with a single cohort. Diary + calendar logs run throughout; an embedded within-subjects ritual trial occupies weeks 6–10; exit interviews at week 12 close the loop on lived experience.',
      arc: 'one cohort · three lenses · one paper',
      duration: '12 weeks',
      components: [
        { name: 'two-week ESM diary + calendar log mining', addresses: ones([2, 1, 1]) },
        { name: 'embedded within-subjects ritual trial (wks 6–10)', addresses: ones([1, 2, 0]) },
        { name: 'exit interviews + body-mapping (wk 12)', addresses: ones([0, 1, 2]) },
      ],
      strengths: [
        'one IRB, one consent, one cohort — narrative is naturally unified.',
        'quantitative effect for RQ A/B; thick description for RQ C.',
      ],
      tensions: [
        'long fielding window; attrition risk past week 8.',
        'ritual-trial period biases late-study fatigue measurements.',
      ],
    },
    {
      id: 'probe-deploy',
      name: 'Tech-probe deployment with structured reflection',
      summary: 'Build a calendar-aware Slack probe that surfaces a 90-second ritual after configurable meeting types. Deploy to 18 participants for 4 weeks; usage logs answer mechanism + intervention, weekly check-ins answer lived experience.',
      arc: 'one artifact · usage data + reflection',
      duration: '8 weeks (3 build, 4 field, 1 wrap)',
      components: [
        { name: 'probe build + pilot', addresses: ones([1, 1, 0]) },
        { name: 'instrumented field deployment', addresses: ones([2, 2, 1]) },
        { name: 'weekly 30-min check-in interviews', addresses: ones([1, 1, 2]) },
      ],
      strengths: [
        'design contribution — concrete artifact reviewers can evaluate.',
        'instrumented data sidesteps self-report ceiling.',
      ],
      tensions: [
        'novelty effect can dominate the first 1–2 weeks of usage data.',
        'requires a developer; 3-week build is the critical path.',
      ],
    },
    {
      id: 'two-phase',
      name: 'Two-phase: descriptive survey → focused intervention',
      summary: 'Phase 1: cross-org survey (N≈400) maps prevalence and texture. Phase 2: recruit 20 high-fatigue respondents into a 4-week within-subjects ritual trial with bracketing interviews.',
      arc: 'breadth then depth · two studies, one paper',
      duration: '10 weeks',
      components: [
        { name: 'cross-org survey · N≈400', addresses: ones([2, 0, 1]) },
        { name: 'within-subjects ritual trial', addresses: ones([0, 2, 1]) },
        { name: 'bracketing interviews · pre + post', addresses: ones([1, 1, 2]) },
      ],
      strengths: [
        'survey gives external-validity claims rare in HCI.',
        'reviewers love a breadth→depth structure.',
      ],
      tensions: [
        'two recruitment funnels = double the logistics.',
        'survey + RCT in one paper is dense; focus discipline needed.',
      ],
    },
    {
      id: 'qual-core',
      name: 'Qualitative core with quantitative scaffolding',
      summary: '14 semi-structured interviews + body-mapping form the qualitative core; a brief 2-week diary precedes interviews to give participants concrete material and the researchers light quantitative anchoring.',
      arc: 'thick description · light quant anchor',
      duration: '6 weeks',
      components: [
        { name: 'pre-study 2-week diary (anchor)', addresses: ones([1, 0, 1]) },
        { name: 'semi-structured interviews · n=14', addresses: ones([1, 1, 2]) },
        { name: 'body-mapping + felt-sense protocol', addresses: ones([0, 0, 2]) },
      ],
      strengths: [
        'shortest timeline; lowest infrastructure burden.',
        'strongest match for RQ C if lived experience is the centre of gravity.',
      ],
      tensions: [
        'no causal claims for RQ B (intervention).',
        'mechanism (RQ A) is recovered only through participant accounts.',
      ],
    },
    {
      id: 'rapid',
      name: 'Rapid mixed pilot · 4 weeks',
      summary: 'A scoped pilot to de-risk before committing to a larger design: 8 participants, 1-week diary, 1-session ritual try-out, 30-min interview. Output is a sharpened protocol, not a publishable paper.',
      arc: 'pilot first · publish second',
      duration: '4 weeks',
      components: [
        { name: 'one-week ESM diary', addresses: ones([2, 0, 1]) },
        { name: 'single-session ritual try-out', addresses: ones([0, 2, 0]) },
        { name: '30-min wrap interview', addresses: ones([0, 0, 2]) },
      ],
      strengths: [
        'cheap insurance — surfaces protocol issues fast.',
        'good first move if the question is still loosening.',
      ],
      tensions: [
        'will not stand alone as a paper.',
        'small N — directional signal only.',
      ],
    },
  ];
};

// Plan template — built once a design is selected.
function buildPlan(design, selectedBranches, customNotes) {
  const phases = [
    { id: 'p0', name: 'sharpen + IRB',     weeks: 1, detail: 'Lock operationalizations, draft consent and analysis plan, route through IRB-light. Pre-register if RQ B is in scope.' },
    ...design.components.map((c, i) => ({
      id: `p${i + 1}`,
      name: c.name,
      weeks: parseWeeks(design.duration, design.components.length, i),
      detail: detailFor(c, selectedBranches),
    })),
    { id: 'pN', name: 'integrate + write',  weeks: 2, detail: 'Triangulate across components; write findings as one narrative with sub-sections per RQ; draft figures.' },
  ];
  return {
    phases,
    deliverables: [
      'pre-registered protocol + analysis plan',
      ...design.components.map((c) => `${c.name} — raw + coded data`),
      'short paper draft, structured: intro · related work · method · findings (per RQ) · discussion',
    ],
    recruitment: 'remote knowledge workers · 3+ video calls/day · stratified across role (eng/PM/design); single cohort wherever possible to keep the narrative integrated.',
    timeline: design.duration,
    risks: [
      ...design.tensions,
      'integration risk — three RQs in one paper requires disciplined scoping during write-up.',
    ],
    notes: customNotes || '',
  };
}

function parseWeeks(duration, nComponents, idx) {
  const m = duration.match(/(\d+)/);
  const total = m ? parseInt(m[1], 10) : 8;
  const remaining = Math.max(2, total - 3); // minus IRB + write
  const each = Math.max(1, Math.round(remaining / nComponents));
  return each;
}

function detailFor(component, selectedBranches) {
  const targets = component.addresses
    .map((v, i) => v === 2 ? `core for RQ ${selectedBranches[i].letter}` : v === 1 ? `partial for RQ ${selectedBranches[i].letter}` : null)
    .filter(Boolean).join(' · ');
  return `${component.name}. Coverage: ${targets || 'support'}.`;
}

function Methodology({ mainRq, selectedBranches, onBack, onContinue }) {
  // Editable RQs — make a local copy so user can sharpen them in place.
  const [rqs, setRqs] = useState(() => selectedBranches.map((b) => ({ ...b })));
  const [mainRqLocal, setMainRqLocal] = useState(mainRq);
  const [editingMain, setEditingMain] = useState(false);
  const [editingRq, setEditingRq] = useState(null); // letter

  const [chosen, setChosen] = useState(null); // design id
  const [revealed, setRevealed] = useState(0); // streamed cards
  const [planNotes, setPlanNotes] = useState('');
  const [plan, setPlan] = useState(null);
  const [editingPhase, setEditingPhase] = useState(null);

  const [customOpen, setCustomOpen] = useState(false);
  const [customDraft, setCustomDraft] = useState({ name: '', summary: '' });
  const [customDesign, setCustomDesign] = useState(null);

  const designs = stockDesigns(rqs);
  const allDesigns = customDesign ? [...designs, customDesign] : designs;

  // Stream design cards
  useEffect(() => {
    setRevealed(0);
    const ivs = [];
    for (let i = 1; i <= designs.length; i++) {
      ivs.push(setTimeout(() => setRevealed(i), 250 + i * 220));
    }
    return () => ivs.forEach(clearTimeout);
  }, []); // intentionally only on mount

  // Hotkeys
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Escape') { e.preventDefault(); onBack(); }
      const digit = parseInt(e.key, 10);
      if (!Number.isNaN(digit) && digit >= 1 && digit <= allDesigns.length) {
        e.preventDefault();
        setChosen(allDesigns[digit - 1].id);
      }
      if (e.key.toLowerCase() === 'a') { e.preventDefault(); setCustomOpen(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [allDesigns.length]);

  const draftPlan = () => {
    const d = allDesigns.find((x) => x.id === chosen);
    if (!d) return;
    setPlan(buildPlan(d, rqs, planNotes));
  };

  const saveCustom = () => {
    const d = customDraft.name.trim();
    if (!d) return;
    const newDesign = {
      id: 'custom',
      name: customDraft.name.trim(),
      summary: customDraft.summary.trim() || 'User-proposed integrated design.',
      arc: 'custom',
      duration: '— weeks',
      components: rqs.map((r) => ({
        name: `component covering RQ ${r.letter}`,
        addresses: rqs.map((_, i) => i === rqs.findIndex((x) => x.letter === r.letter) ? 2 : 0),
      })),
      strengths: ['user-defined — specify before drafting plan.'],
      tensions: ['scope and feasibility unverified.'],
      custom: true,
    };
    setCustomDesign(newDesign);
    setChosen(newDesign.id);
    setCustomOpen(false);
    setCustomDraft({ name: '', summary: '' });
  };

  const updateRq = (letter, newRq) => {
    setRqs((arr) => arr.map((r) => r.letter === letter ? { ...r, rq: newRq } : r));
  };
  const updatePhase = (id, newDetail) => {
    setPlan((p) => p ? { ...p, phases: p.phases.map((ph) => ph.id === id ? { ...ph, detail: newDetail } : ph) } : p);
  };
  const updatePhaseName = (id, newName) => {
    setPlan((p) => p ? { ...p, phases: p.phases.map((ph) => ph.id === id ? { ...ph, name: newName } : ph) } : p);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Crumb steps={[
        ['probe', palette.amber],
        ['new project', palette.ink2],
        ['brainstorm', palette.ink2],
        ['literature', palette.ink2],
        ['methodology', palette.ink],
      ]} right={
        <span style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <span style={{ color: palette.ink3 }}>stage 3 · methodology</span>
          <button onClick={onBack} style={ghostBtnStyle}><kbd style={kbdStyle}>esc</kbd> back</button>
        </span>
      } />

      <div style={{ flex: 1, padding: '28px 32px 80px', maxWidth: 1240, margin: '0 auto', width: '100%' }}>
        <div style={{ color: palette.ink3, fontSize: 11, letterSpacing: '0.14em',
          textTransform: 'uppercase', marginBottom: 8 }}>
          ─── methodology · one study, layered to answer all your RQs ───
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 500, margin: 0, color: palette.ink2 }}>
          The 3 sub-questions sharpen the main one. Probe drafts integrated designs that answer them as one paper.
        </h2>

        {/* RQ recap, editable */}
        <RqRecap
          mainRq={mainRqLocal}
          editingMain={editingMain}
          onEditMain={() => setEditingMain(true)}
          onSaveMain={(v) => { setMainRqLocal(v); setEditingMain(false); }}
          onCancelMain={() => setEditingMain(false)}
          rqs={rqs}
          editingRq={editingRq}
          onEditRq={setEditingRq}
          onSaveRq={(letter, v) => { updateRq(letter, v); setEditingRq(null); }}
          onCancelRq={() => setEditingRq(null)}
        />

        {/* Candidate integrated designs */}
        <SectionHeader title="candidate integrated designs"
          hint={`${designs.length} drafted · pick one or propose your own`} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {allDesigns.map((d, i) => {
            const visible = d.custom || i < revealed;
            if (!visible) return <div key={d.id} style={{ height: 140 }} />;
            const isSel = chosen === d.id;
            return (
              <DesignCard key={d.id} d={d} index={i} isSel={isSel} rqs={rqs}
                onPick={() => setChosen(d.id)} />
            );
          })}

          {/* propose your own */}
          {!customOpen ? (
            <button onClick={() => setCustomOpen(true)} style={{
              padding: '12px 14px',
              background: 'transparent', border: `1px dashed ${palette.ink4}`,
              borderRadius: 4, color: palette.ink2, fontFamily: 'inherit', fontSize: 13,
              textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = palette.cyan; e.currentTarget.style.color = palette.ink; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = palette.ink4; e.currentTarget.style.color = palette.ink2; }}>
              <span style={{ color: palette.cyan, fontSize: 16 }}>+</span>
              <span>propose your own integrated study design</span>
              <span style={{ marginLeft: 'auto' }}><kbd style={kbdStyle}>a</kbd></span>
            </button>
          ) : (
            <CustomDesignForm draft={customDraft} setDraft={setCustomDraft}
              onSave={saveCustom} onCancel={() => { setCustomOpen(false); setCustomDraft({ name: '', summary: '' }); }} />
          )}
        </div>

        {/* Plan section appears once a design is chosen */}
        {chosen && (
          <div className="fade-in" style={{ marginTop: 32 }}>
            <SectionHeader title="study plan"
              hint={plan ? 'editable · click any phase to edit' : 'click "draft plan" to assemble'} />

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 22, alignItems: 'start' }}>
              <div>
                {!plan ? (
                  <div style={{
                    padding: '18px 16px', border: `1px dashed ${palette.rule}`, borderRadius: 4,
                    color: palette.ink3, fontSize: 13, lineHeight: 1.5,
                  }}>
                    <div style={{ color: palette.ink2, fontWeight: 600, fontSize: 12, letterSpacing: '0.12em',
                      textTransform: 'uppercase', marginBottom: 8 }}>plan · not yet drafted</div>
                    Probe will generate phases, deliverables, recruitment, timeline, and risks based on the design you picked. You can edit anything afterwards.
                  </div>
                ) : (
                  <PlanCard plan={plan} setPlan={setPlan}
                    editingPhase={editingPhase} setEditingPhase={setEditingPhase}
                    onUpdatePhase={updatePhase} onUpdatePhaseName={updatePhaseName} />
                )}
              </div>

              {/* Notes + actions */}
              <aside style={{ position: 'sticky', top: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{
                  padding: '14px 16px', border: `1px solid ${palette.cyan}`,
                  borderLeft: `3px solid ${palette.cyan}`,
                  background: 'rgba(125, 207, 255, 0.05)', borderRadius: 4,
                }}>
                  <div style={{ color: palette.cyan, fontSize: 11, letterSpacing: '0.14em',
                    textTransform: 'uppercase', fontWeight: 600 }}>plan constraints · your notes</div>
                  <div style={{ color: palette.ink3, fontSize: 11.5, marginTop: 6, lineHeight: 1.5 }}>
                    Anything Probe should treat as a hard requirement — budget, sensors, timing, populations to include or avoid.
                  </div>
                  <textarea value={planNotes} onChange={(e) => setPlanNotes(e.target.value)}
                    placeholder='e.g. "no physiological sensors", "must finish before October", "budget cap $300"'
                    rows={6}
                    style={{
                      marginTop: 10, width: '100%', boxSizing: 'border-box',
                      background: palette.bg, border: `1px solid ${palette.rule}`,
                      color: palette.ink, padding: '10px 12px', fontSize: 13, lineHeight: 1.5,
                      borderRadius: 3, resize: 'vertical', outline: 'none',
                      caretColor: palette.cyan, fontFamily: 'inherit',
                    }} />
                  <button onClick={draftPlan} disabled={!chosen} style={{
                    marginTop: 10, width: '100%',
                    background: chosen ? palette.amber : 'transparent',
                    color: chosen ? palette.bg : palette.ink4,
                    border: `1px solid ${chosen ? palette.amber : palette.rule}`,
                    padding: '7px 12px', borderRadius: 3, fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
                    cursor: chosen ? 'pointer' : 'not-allowed',
                  }}>
                    {plan ? 'redraft plan with these notes' : 'draft plan'}
                  </button>
                </div>

                <div style={{
                  padding: '12px 14px', border: `1px solid ${palette.rule}`,
                  background: palette.bg2, borderRadius: 4, fontSize: 11.5, color: palette.ink3,
                }}>
                  <div style={{ color: palette.ink2, fontWeight: 600, marginBottom: 6 }}>study summary</div>
                  <div>main RQ · 1</div>
                  <div>sub-RQs · {rqs.length}</div>
                  <div>design · {chosen ? allDesigns.find((x) => x.id === chosen).name : '—'}</div>
                  <div>phases · {plan ? plan.phases.length : '—'}</div>
                </div>
              </aside>
            </div>
          </div>
        )}
      </div>

      {/* footer */}
      <div style={{
        position: 'sticky', bottom: 0, background: palette.bg,
        borderTop: `1px solid ${palette.rule}`,
        padding: '10px 22px', display: 'flex', alignItems: 'center', gap: 14,
        color: palette.ink3, fontSize: 12.5,
      }}>
        <span><kbd style={kbdStyle}>1</kbd>..<kbd style={kbdStyle}>{allDesigns.length}</kbd> pick design</span>
        <span><kbd style={kbdStyle}>a</kbd> propose your own</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
          <span>{chosen ? '1 design picked' : 'no design picked'} · {plan ? 'plan drafted' : 'no plan'}</span>
          <button disabled={!plan} onClick={() => {
            if (!plan) return;
            const chosenDesign = allDesigns.find((x) => x.id === chosen);
            onContinue && onContinue({ chosenDesign, plan });
          }} style={{
            background: !plan ? 'transparent' : palette.amber,
            color: !plan ? palette.ink4 : palette.bg,
            border: `1px solid ${!plan ? palette.rule : palette.amber}`,
            padding: '5px 14px', borderRadius: 3, fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
            cursor: !plan ? 'not-allowed' : 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            continue · draft artifacts
            <kbd style={{ ...kbdStyle, background: !plan ? palette.bg2 : 'rgba(0,0,0,0.2)',
              color: !plan ? palette.ink4 : 'rgba(0,0,0,0.7)',
              borderColor: !plan ? palette.rule : 'rgba(0,0,0,0.15)' }}>↵</kbd>
          </button>
        </span>
      </div>
    </div>
  );
}

// ─── RQ recap with inline edit ───
function RqRecap({ mainRq, editingMain, onEditMain, onSaveMain, onCancelMain,
                  rqs, editingRq, onEditRq, onSaveRq, onCancelRq }) {
  const [mainDraft, setMainDraft] = useState(mainRq);
  const [rqDrafts, setRqDrafts] = useState({});

  useEffect(() => { setMainDraft(mainRq); }, [mainRq, editingMain]);

  return (
    <div style={{
      marginTop: 22, padding: '16px 18px',
      border: `1px solid ${palette.rule}`, borderLeft: `3px solid ${palette.amber}`,
      background: palette.bg2, borderRadius: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span style={{ color: palette.amber, fontSize: 11, letterSpacing: '0.14em',
          textTransform: 'uppercase', fontWeight: 600 }}>main RQ</span>
        {!editingMain && (
          <button onClick={onEditMain} style={{ ...ghostBtnStyle, fontSize: 11 }}>edit</button>
        )}
      </div>

      {editingMain ? (
        <div style={{ marginTop: 8 }}>
          <textarea value={mainDraft} onChange={(e) => setMainDraft(e.target.value)}
            rows={2} autoFocus
            style={{
              width: '100%', boxSizing: 'border-box', background: palette.bg,
              border: `1px solid ${palette.amber}`, color: palette.ink, padding: '8px 10px',
              fontSize: 15, lineHeight: 1.5, borderRadius: 3, outline: 'none',
              caretColor: palette.amber, fontFamily: 'inherit', resize: 'vertical',
            }} />
          <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={onCancelMain} style={ghostBtnStyle}>cancel</button>
            <button onClick={() => onSaveMain(mainDraft)} style={{
              background: palette.amber, color: palette.bg, border: 'none', padding: '4px 10px',
              borderRadius: 3, fontFamily: 'inherit', fontSize: 11, fontWeight: 600, cursor: 'pointer',
            }}>save</button>
          </div>
        </div>
      ) : (
        <div style={{ color: palette.ink, fontSize: 16, lineHeight: 1.5, marginTop: 6 }}>
          <span style={{ color: palette.amber, marginRight: 8 }}>›</span>{mainRq}
        </div>
      )}

      {/* sub-RQs */}
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rqs.map((r) => {
          const editing = editingRq === r.letter;
          const draft = rqDrafts[r.letter] !== undefined ? rqDrafts[r.letter] : r.rq;
          return (
            <div key={r.letter} style={{
              padding: '8px 10px',
              border: `1px solid ${editing ? palette.amber : 'transparent'}`,
              borderLeft: `2px solid ${r.custom ? palette.cyan : palette.ink4}`,
              borderRadius: 3,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: palette.ink2, fontWeight: 600, fontSize: 12 }}>RQ {r.letter}</span>
                <span style={chipStyle}>{r.angle}</span>
                {!editing && (
                  <button onClick={() => { setRqDrafts((d) => ({ ...d, [r.letter]: r.rq })); onEditRq(r.letter); }}
                    style={{ ...ghostBtnStyle, marginLeft: 'auto', fontSize: 11 }}>edit</button>
                )}
              </div>
              {editing ? (
                <div style={{ marginTop: 6 }}>
                  <textarea value={draft}
                    onChange={(e) => setRqDrafts((d) => ({ ...d, [r.letter]: e.target.value }))}
                    rows={2} autoFocus
                    style={{
                      width: '100%', boxSizing: 'border-box', background: palette.bg,
                      border: `1px solid ${palette.amber}`, color: palette.ink, padding: '6px 8px',
                      fontSize: 13, lineHeight: 1.5, borderRadius: 3, outline: 'none',
                      caretColor: palette.amber, fontFamily: 'inherit', resize: 'vertical',
                    }} />
                  <div style={{ marginTop: 6, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={onCancelRq} style={ghostBtnStyle}>cancel</button>
                    <button onClick={() => onSaveRq(r.letter, draft)} style={{
                      background: palette.amber, color: palette.bg, border: 'none', padding: '3px 8px',
                      borderRadius: 3, fontFamily: 'inherit', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    }}>save</button>
                  </div>
                </div>
              ) : (
                <div style={{ color: palette.ink2, fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>{r.rq}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Design card with coverage matrix ───
function DesignCard({ d, index, isSel, rqs, onPick }) {
  return (
    <button onClick={onPick} className="fade-in"
      style={{
        textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
        padding: '14px 16px',
        background: isSel ? palette.amberSoft : palette.bg2,
        border: `1px solid ${isSel ? palette.amber : palette.rule}`,
        borderLeft: `3px solid ${isSel ? palette.amber : (d.custom ? palette.cyan : palette.ink4)}`,
        borderRadius: 4, color: palette.ink,
        transition: 'background 100ms, border-color 100ms',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ ...kbdStyle, fontSize: 10,
          borderColor: isSel ? palette.amber : palette.rule,
          color: isSel ? palette.amber : palette.ink3 }}>{index + 1}</span>
        <span style={{
          color: isSel ? palette.amber : palette.ink, fontWeight: 600, fontSize: 14,
        }}>{d.name}</span>
        <span style={chipStyle}>{d.duration}</span>
        <span style={{ ...chipStyle, color: palette.ink3 }}>{d.arc}</span>
        <span style={{
          marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 16, height: 16, borderRadius: '50%', fontSize: 10, fontWeight: 700,
          border: `1px solid ${isSel ? palette.amber : palette.ink4}`,
          background: isSel ? palette.amber : 'transparent',
          color: isSel ? palette.bg : 'transparent',
        }}>●</span>
      </div>

      <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.6, color: palette.ink2 }}>
        {d.summary}
      </div>

      {/* coverage matrix */}
      <div style={{
        marginTop: 12, padding: '10px 12px', borderRadius: 3,
        background: palette.bg, border: `1px solid ${palette.rule}`,
      }}>
        <div style={{ color: palette.ink3, fontSize: 10.5, letterSpacing: '0.14em',
          textTransform: 'uppercase', marginBottom: 8 }}>RQ coverage</div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `minmax(180px, 1.3fr) repeat(${rqs.length}, 36px)`,
          rowGap: 4, columnGap: 8, alignItems: 'center', fontSize: 12,
        }}>
          <div></div>
          {rqs.map((r) => (
            <div key={r.letter} style={{ textAlign: 'center', color: palette.ink3, fontSize: 11 }}>
              RQ {r.letter}
            </div>
          ))}
          {d.components.map((c, i) => (
            <React.Fragment key={i}>
              <div style={{ color: palette.ink, paddingRight: 8,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.name}
              </div>
              {c.addresses.map((v, j) => {
                const cov = COV[v] || COV[0];
                return (
                  <div key={j} title={cov.label}
                    style={{ textAlign: 'center', color: cov.color, fontSize: 14, lineHeight: 1 }}>
                    {cov.glyph}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 14, fontSize: 10.5, color: palette.ink3 }}>
          <span><span style={{ color: COV[2].color }}>●</span> core</span>
          <span><span style={{ color: COV[1].color }}>◐</span> partial</span>
          <span><span style={{ color: COV[0].color }}>·</span> not addressed</span>
        </div>
      </div>

      {/* strengths + tensions */}
      <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ color: palette.moss, fontSize: 10.5, letterSpacing: '0.14em',
            textTransform: 'uppercase', marginBottom: 4 }}>strengths</div>
          <ul style={{ margin: 0, paddingLeft: 16, color: palette.ink2, fontSize: 12.5, lineHeight: 1.55 }}>
            {d.strengths.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
        <div>
          <div style={{ color: palette.rose, fontSize: 10.5, letterSpacing: '0.14em',
            textTransform: 'uppercase', marginBottom: 4 }}>tensions</div>
          <ul style={{ margin: 0, paddingLeft: 16, color: palette.ink2, fontSize: 12.5, lineHeight: 1.55 }}>
            {d.tensions.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      </div>
    </button>
  );
}

function CustomDesignForm({ draft, setDraft, onSave, onCancel }) {
  return (
    <div className="fade-in" style={{
      padding: '12px 14px', background: palette.bg2,
      border: `1px solid ${palette.cyan}`, borderLeft: `3px solid ${palette.cyan}`,
      borderRadius: 4,
    }}>
      <div style={{ color: palette.cyan, fontSize: 11, letterSpacing: '0.12em',
        textTransform: 'uppercase', marginBottom: 10 }}>your design proposal</div>
      <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        placeholder="study design name (e.g. Wizard-of-Oz field deployment)"
        style={inputStyle} autoFocus />
      <textarea value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
        placeholder="how the study is structured · which components address which RQs · duration"
        rows={3} style={{ ...inputStyle, marginTop: 8, resize: 'vertical' }} />
      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end', gap: 8, fontSize: 11 }}>
        <button onClick={onCancel} style={ghostBtnStyle}><kbd style={kbdStyle}>esc</kbd> cancel</button>
        <button onClick={onSave} style={{
          background: palette.cyan, color: palette.bg, border: 'none', padding: '4px 10px',
          borderRadius: 3, fontFamily: 'inherit', fontSize: 11, fontWeight: 600, cursor: 'pointer',
        }}>add design</button>
      </div>
    </div>
  );
}

// ─── Plan card with editable phases ───
function PlanCard({ plan, setPlan, editingPhase, setEditingPhase, onUpdatePhase, onUpdatePhaseName }) {
  return (
    <div className="fade-in" style={{
      padding: '14px 16px', border: `1px solid ${palette.amber}`, borderLeft: `3px solid ${palette.amber}`,
      background: palette.amberSoft, borderRadius: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: palette.amber, fontSize: 11, letterSpacing: '0.14em',
          textTransform: 'uppercase', fontWeight: 600 }}>study plan · draft</span>
        <span style={{ marginLeft: 'auto', color: palette.ink3, fontSize: 11 }}>{plan.timeline}</span>
      </div>

      <PlanGroup label="phases">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {plan.phases.map((p, i) => (
            <PhaseRow key={p.id} p={p} index={i}
              editing={editingPhase === p.id}
              onEdit={() => setEditingPhase(p.id)}
              onCancel={() => setEditingPhase(null)}
              onSave={(name, detail) => {
                onUpdatePhaseName(p.id, name);
                onUpdatePhase(p.id, detail);
                setEditingPhase(null);
              }} />
          ))}
        </div>
      </PlanGroup>

      <PlanGroup label="deliverables">
        <ul style={{ margin: 0, paddingLeft: 18, color: palette.ink, fontSize: 13, lineHeight: 1.55 }}>
          {plan.deliverables.map((d, i) => <li key={i} style={{ marginBottom: 4 }}>{d}</li>)}
        </ul>
      </PlanGroup>

      <PlanGroup label="recruitment">
        <div style={{ color: palette.ink, fontSize: 13, lineHeight: 1.55 }}>{plan.recruitment}</div>
      </PlanGroup>

      <PlanGroup label="risks · before you commit">
        <ul style={{ margin: 0, paddingLeft: 18, color: palette.ink, fontSize: 13, lineHeight: 1.55 }}>
          {plan.risks.map((r, i) => (
            <li key={i} style={{ marginBottom: 4, color: palette.ink2 }}>
              <span style={{ color: palette.rose, marginRight: 6 }}>!</span>{r}
            </li>
          ))}
        </ul>
      </PlanGroup>

      {plan.notes && (
        <PlanGroup label="your notes">
          <div style={{ color: palette.ink2, fontSize: 13, lineHeight: 1.55, fontStyle: 'italic' }}>
            "{plan.notes}"
          </div>
        </PlanGroup>
      )}
    </div>
  );
}

function PhaseRow({ p, index, editing, onEdit, onCancel, onSave }) {
  const [name, setName] = useState(p.name);
  const [detail, setDetail] = useState(p.detail);
  useEffect(() => { setName(p.name); setDetail(p.detail); }, [p, editing]);

  if (editing) {
    return (
      <div style={{
        padding: '10px 12px', background: palette.bg, border: `1px solid ${palette.amber}`,
        borderRadius: 3,
      }}>
        <input value={name} onChange={(e) => setName(e.target.value)}
          style={{ ...inputStyle, fontSize: 13 }} autoFocus />
        <textarea value={detail} onChange={(e) => setDetail(e.target.value)}
          rows={2} style={{ ...inputStyle, marginTop: 6, fontSize: 12.5, resize: 'vertical' }} />
        <div style={{ marginTop: 8, display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={ghostBtnStyle}>cancel</button>
          <button onClick={() => onSave(name, detail)} style={{
            background: palette.amber, color: palette.bg, border: 'none', padding: '3px 8px',
            borderRadius: 3, fontFamily: 'inherit', fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}>save</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '20px 1fr auto', gap: 10, alignItems: 'flex-start' }}>
      <span style={{ color: palette.amber, fontSize: 12, paddingTop: 1 }}>{index + 1}.</span>
      <div>
        <div style={{ color: palette.ink, fontSize: 13.5, fontWeight: 500 }}>
          {p.name}
          <span style={{ color: palette.ink3, marginLeft: 8, fontSize: 11.5, fontWeight: 400 }}>· {p.weeks}w</span>
        </div>
        <div style={{ color: palette.ink2, fontSize: 12.5, marginTop: 3, lineHeight: 1.55 }}>{p.detail}</div>
      </div>
      <button onClick={onEdit} style={{ ...ghostBtnStyle, fontSize: 11 }}>edit</button>
    </div>
  );
}

function PlanGroup({ label, children }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ color: palette.ink3, fontSize: 10.5, letterSpacing: '0.14em',
        textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

function SectionHeader({ title, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, margin: '24px 0 12px' }}>
      <span style={{ color: palette.amber, fontSize: 11, letterSpacing: '0.14em',
        textTransform: 'uppercase', fontWeight: 600 }}>{title}</span>
      {hint && <span style={{ color: palette.ink3, fontSize: 11 }}>· {hint}</span>}
      <span style={{ flex: 1, borderBottom: `1px solid ${palette.rule}`, transform: 'translateY(-4px)' }} />
    </div>
  );
}

function Crumb({ steps, right }) {
  return (
    <div style={{
      padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 12,
      borderBottom: `1px solid ${palette.rule}`, color: palette.ink3, fontSize: 12,
    }}>
      {steps.map(([s, c], i) => (
        <React.Fragment key={i}>
          <span style={{ color: c }}>{s}</span>
          {i < steps.length - 1 && <span>›</span>}
        </React.Fragment>
      ))}
      <span style={{ marginLeft: 'auto' }}>{right}</span>
    </div>
  );
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box', background: palette.bg,
  border: `1px solid ${palette.rule}`, color: palette.ink, padding: '6px 10px',
  fontSize: 13, lineHeight: 1.5, borderRadius: 3, outline: 'none',
  caretColor: palette.amber, fontFamily: 'inherit',
};

window.Methodology = Methodology;
