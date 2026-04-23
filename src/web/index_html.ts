/**
 * Single-page HTML + vanilla JS for `probe web`. No bundler, no React.
 * The goal is a two-pane viewer/editor:
 *   - Left sidebar: run list + stage/branch navigator
 *   - Main area: rendered artifact (markdown / JSON / audit cards)
 *
 * Uses the palette from src/ui/theme.ts inline — warm off-white bg,
 * Newsreader body, Inter headings, JetBrains Mono for code. Same
 * palette as the PROBE_REPORT_PAGE.html so the brand stays consistent.
 */

export function buildIndexHtml(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Probe web · interactive run explorer</title>
<style>${CSS}</style>
</head>
<body>
<div class="app">
  <aside class="sidebar">
    <div class="brand">
      <div class="brand-mark">Probe</div>
      <div class="brand-sub">research-design triage</div>
    </div>
    <div class="section-header">Runs</div>
    <div id="run-list" class="run-list">Loading…</div>
    <div class="section-header" id="stage-nav-header" style="display:none">Stages</div>
    <div id="stage-nav" class="stage-nav"></div>
    <div class="section-header" id="branch-nav-header" style="display:none">Branches</div>
    <div id="branch-nav" class="branch-nav"></div>
  </aside>
  <main class="main">
    <header class="main-header" id="main-header">
      <div class="main-title" id="main-title">Pick a run from the left</div>
      <div class="main-subtitle" id="main-subtitle"></div>
    </header>
    <div class="toolbar" id="toolbar" style="display:none">
      <button class="btn" id="btn-edit">Edit</button>
      <button class="btn primary" id="btn-save" style="display:none">Save</button>
      <button class="btn" id="btn-cancel" style="display:none">Cancel</button>
      <span class="toolbar-status" id="toolbar-status"></span>
    </div>
    <div class="content" id="content">
      <div class="hint">A Probe web session. Pick a run from the sidebar to begin.</div>
    </div>
  </main>
</div>
<script>${JS}</script>
</body>
</html>`;
}

const CSS = `
:root {
  --bg: #f7f5ef;
  --bg-card: #ffffff;
  --bg-sidebar: #ede9dc;
  --bg-code: #1a1d2c;
  --fg-code: #e8e3d4;
  --fg: #1a1a1a;
  --fg-dim: #555;
  --fg-faint: #888;
  --border: #d0cbb8;
  --border-soft: #e8e3d4;
  --accent: #1B365D;
  --accent-warm: #9e2e22;
  --accent-amber: #b47b2a;
  --accent-green: #1f6b1e;
  --accent-plum: #7a2d5a;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; height: 100%; }
body {
  background: var(--bg);
  color: var(--fg);
  font-family: 'Newsreader', 'Source Serif 4', Georgia, serif;
  font-size: 17px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
.app { display: flex; height: 100vh; }
.sidebar {
  width: 280px;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border);
  overflow-y: auto;
  padding: 16px;
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 13px;
}
.brand { margin-bottom: 20px; }
.brand-mark { font-size: 18px; font-weight: 700; color: var(--accent); letter-spacing: 0.02em; }
.brand-sub { font-size: 11px; color: var(--fg-dim); margin-top: 2px; }

.section-header {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--fg-dim);
  margin: 20px 0 8px;
}

.run-list .run-entry,
.stage-nav .nav-entry,
.branch-nav .nav-entry {
  display: block;
  padding: 6px 10px;
  border-radius: 3px;
  cursor: pointer;
  color: var(--fg);
  font-size: 13px;
  line-height: 1.3;
  margin-bottom: 2px;
}
.run-list .run-entry:hover,
.stage-nav .nav-entry:hover,
.branch-nav .nav-entry:hover {
  background: rgba(27, 54, 93, 0.08);
}
.run-list .run-entry.active,
.stage-nav .nav-entry.active,
.branch-nav .nav-entry.active {
  background: var(--accent);
  color: white;
}
.run-entry .run-id {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  display: block;
}
.run-entry .run-premise {
  font-family: 'Newsreader', serif;
  font-style: italic;
  color: var(--fg-dim);
  font-size: 12px;
  display: block;
  margin-top: 2px;
}
.run-entry.active .run-premise { color: rgba(255, 255, 255, 0.8); }

.stage-nav .nav-entry .nav-label {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.stage-nav .nav-entry .nav-status {
  font-size: 10px;
  font-family: 'JetBrains Mono', monospace;
  color: var(--fg-faint);
}
.stage-nav .nav-entry.active .nav-status { color: rgba(255, 255, 255, 0.8); }

.main {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.main-header {
  padding: 24px 32px 12px;
  border-bottom: 1px solid var(--border-soft);
  background: var(--bg);
  position: sticky;
  top: 0;
  z-index: 10;
}
.main-title {
  font-family: 'Newsreader', serif;
  font-size: 24px;
  font-weight: 600;
  color: #10121e;
  letter-spacing: -0.01em;
}
.main-subtitle {
  font-size: 13px;
  color: var(--fg-dim);
  margin-top: 4px;
  font-family: 'Inter', sans-serif;
}
.toolbar {
  padding: 8px 32px;
  border-bottom: 1px solid var(--border-soft);
  background: rgba(237, 233, 220, 0.5);
  display: flex;
  gap: 8px;
  align-items: center;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
}
.btn {
  padding: 4px 12px;
  border: 1px solid var(--border);
  background: white;
  border-radius: 3px;
  cursor: pointer;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: var(--fg);
}
.btn:hover { background: var(--bg-sidebar); }
.btn.primary { background: var(--accent); color: white; border-color: var(--accent); }
.btn.primary:hover { background: #0f233f; }
.toolbar-status { margin-left: auto; color: var(--fg-dim); font-size: 12px; }

.content {
  padding: 24px 32px 48px;
  max-width: 880px;
}
.hint {
  color: var(--fg-faint);
  font-style: italic;
  padding: 40px 0;
  text-align: center;
}

.content h1, .content h2, .content h3 {
  font-family: 'Newsreader', serif;
  color: #10121e;
}
.content h1 { font-size: 26px; margin: 0 0 14px; }
.content h2 { font-size: 20px; margin: 28px 0 12px; border-bottom: 1px solid var(--border-soft); padding-bottom: 6px; }
.content h3 { font-size: 16px; margin: 20px 0 8px; }

.content p { margin: 0 0 14px; }
.content ul { padding-left: 22px; }

.content pre {
  background: var(--bg-code);
  color: var(--fg-code);
  padding: 14px 18px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12.5px;
  line-height: 1.55;
  font-family: 'JetBrains Mono', 'SF Mono', Menlo, monospace;
}
.content code {
  font-family: 'JetBrains Mono', monospace;
  background: #ede9dc;
  padding: 1px 6px;
  border-radius: 2px;
  font-size: 0.9em;
}

.content textarea.editor {
  width: 100%;
  min-height: 60vh;
  padding: 14px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: white;
  resize: vertical;
  color: var(--fg);
  line-height: 1.55;
  tab-size: 2;
}

.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 14px 18px;
  margin-bottom: 12px;
}
.card .card-label {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  color: var(--fg-dim);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}
.card .card-value { font-size: 15px; color: var(--fg); }
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
  margin-bottom: 20px;
}

.audit-finding {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-left: 4px solid var(--accent-warm);
  padding: 14px 18px;
  margin-bottom: 12px;
  border-radius: 3px;
}
.audit-finding.drift { border-left-color: var(--accent-amber); }
.audit-finding.info { border-left-color: var(--fg-faint); }
.audit-finding .ph {
  display: flex;
  gap: 14px;
  align-items: baseline;
  font-size: 12px;
  margin-bottom: 8px;
}
.audit-finding .pattern {
  font-family: 'JetBrains Mono', monospace;
  background: #ede9dc;
  padding: 2px 7px;
  border-radius: 3px;
  font-weight: 600;
}
.audit-finding .score {
  font-family: 'JetBrains Mono', monospace;
  color: var(--accent-warm);
  font-weight: 700;
}
.audit-finding .evidence {
  background: #ede9dc;
  padding: 10px 14px;
  border-radius: 3px;
  margin: 8px 0;
  font-size: 14px;
  font-style: italic;
}
.audit-finding .rationale {
  font-size: 13px;
  color: var(--fg-dim);
  margin: 8px 0 0;
  line-height: 1.55;
}
`;

const JS = `
const state = {
  runs: [],
  currentRunId: null,
  currentRun: null,
  currentArtifactPath: null,
  editing: false,
};

// Event delegation — one listener per sidebar section, using data-action
// attributes so clicks fire regardless of which inner child was hit.
document.addEventListener('DOMContentLoaded', () => {
  const bind = (id, handler) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', (ev) => {
      let t = ev.target;
      while (t && t !== el && !t.dataset?.action) t = t.parentElement;
      if (t && t.dataset?.action) handler(t.dataset);
    });
  };
  bind('run-list', (d) => loadRun(d.id));
  bind('stage-nav', (d) => {
    if (d.rel) loadArtifact(d.rel);
    else renderOverview();
  });
  bind('branch-nav', (d) => {
    if (d.branch) renderBranchDetail(d.branch);
  });
});

async function loadRuns() {
  try {
    const res = await fetch('/api/runs');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const { runs } = await res.json();
    state.runs = runs;
    renderRunList();
  } catch (e) {
    document.getElementById('run-list').innerHTML = '<div style="color:var(--accent-warm)">Failed to load runs: ' + esc(String(e)) + '</div>';
  }
}

function renderRunList() {
  const el = document.getElementById('run-list');
  if (state.runs.length === 0) {
    el.innerHTML = '<div style="color:var(--fg-faint);font-style:italic;padding:8px 0">No runs in runs/. Start one with <code>probe run "your premise"</code>.</div>';
    return;
  }
  el.innerHTML = state.runs.map(r => \`
    <div class="run-entry \${r.id === state.currentRunId ? 'active' : ''}" data-action="pick-run" data-id="\${esc(r.id)}" role="button" tabindex="0">
      <span class="run-id">\${esc(r.id.length > 36 ? r.id.slice(0, 36) + '…' : r.id)}</span>
      <span class="run-premise">\${esc((r.premise || '').slice(0, 80))}</span>
    </div>
  \`).join('');
}

async function loadRun(id) {
  state.currentRunId = id;
  state.currentArtifactPath = null;
  state.editing = false;
  document.getElementById('main-title').textContent = 'Loading ' + id + '…';
  try {
    const res = await fetch('/api/runs/' + encodeURIComponent(id));
    if (!res.ok) throw new Error('HTTP ' + res.status);
    state.currentRun = await res.json();
    renderRunList();
    renderMainHeader();
    renderStageNav();
    renderBranchNav();
    renderOverview();
    document.getElementById('toolbar').style.display = 'none';
  } catch (e) {
    document.getElementById('main-title').textContent = 'Failed to load ' + id;
    document.getElementById('content').innerHTML = '<div class="hint" style="color:var(--accent-warm)">' + esc(String(e)) + '</div>';
  }
}

function renderMainHeader() {
  document.getElementById('main-title').textContent = state.currentRun.run_id;
  document.getElementById('main-subtitle').textContent = (state.currentRun.premise || '').slice(0, 200);
}

function renderStageNav() {
  const el = document.getElementById('stage-nav');
  const header = document.getElementById('stage-nav-header');
  header.style.display = 'block';
  const stages = [
    { label: '· Overview', rel: '' },
    { label: '1. Premise', rel: 'premise_card.json' },
    { label: '8. Guidebook', rel: state.currentRun.guidebook_exists ? 'PROBE_GUIDEBOOK.md' : '' },
  ];
  el.innerHTML = stages.map(s => {
    const active = state.currentArtifactPath === s.rel ? 'active' : '';
    const exists = s.rel === '' || (s.rel && (s.rel === 'PROBE_GUIDEBOOK.md' ? state.currentRun.guidebook_exists : !!state.currentRun.premise_card));
    return \`<div class="nav-entry \${active}" data-action="pick-stage" data-rel="\${esc(s.rel)}" role="button" tabindex="0">
      <div class="nav-label">
        <span>\${esc(s.label)}</span>
        <span class="nav-status">\${exists ? '✓' : '—'}</span>
      </div>
    </div>\`;
  }).join('');
}

function renderBranchNav() {
  const el = document.getElementById('branch-nav');
  const header = document.getElementById('branch-nav-header');
  const branches = state.currentRun.branches || {};
  const ids = Object.keys(branches).sort();
  if (ids.length === 0) { header.style.display = 'none'; el.innerHTML = ''; return; }
  header.style.display = 'block';
  el.innerHTML = ids.map(b => {
    const br = branches[b];
    const verdict = br.audit?.verdict || (br.meta_review?.verdict || '—');
    return \`<div class="nav-entry" data-action="pick-branch" data-branch="\${esc(b)}" role="button" tabindex="0">
      <div class="nav-label">
        <span>Branch \${esc(b.toUpperCase())}</span>
        <span class="nav-status">\${esc(verdict)}</span>
      </div>
    </div>\`;
  }).join('');
}

function renderOverview() {
  state.currentArtifactPath = null;
  state.editing = false;
  document.getElementById('toolbar').style.display = 'none';
  const r = state.currentRun;
  const c = r.cost?.totals || {};
  const h = [];
  h.push('<div class="card-grid">');
  h.push(card('run id', r.run_id));
  h.push(card('total spend', '$' + (c.usd ?? 0).toFixed(2)));
  h.push(card('tokens', ((c.input_tokens ?? 0) / 1000).toFixed(0) + 'K in / ' + ((c.output_tokens ?? 0) / 1000).toFixed(0) + 'K out'));
  h.push(card('guidebook', r.guidebook_exists ? 'yes' : 'not assembled'));
  h.push(card('report page', r.report_page_exists ? 'yes' : 'not generated'));
  h.push('</div>');
  const s = r.summary?.branches || [];
  if (s.length) {
    h.push('<h2>Branches</h2>');
    for (const b of s) {
      const stat = b.status || '—';
      h.push('<div class="card"><div class="card-label">branch ' + b.branchId + '</div><div class="card-value">' + esc(stat) + (b.reason ? ' <span style="color:var(--fg-dim);font-size:13px">· ' + esc(b.reason) + '</span>' : '') + '</div></div>');
    }
  }
  if (r.premise_card?.sharpest_question) {
    h.push('<h2>Sharpest question</h2>');
    h.push('<p>' + esc(r.premise_card.sharpest_question) + '</p>');
  }
  document.getElementById('content').innerHTML = h.join('');
}

function card(label, value) {
  return '<div class="card"><div class="card-label">' + esc(label) + '</div><div class="card-value">' + esc(String(value)) + '</div></div>';
}

async function loadArtifact(rel) {
  state.currentArtifactPath = rel;
  state.editing = false;
  const res = await fetch('/api/runs/' + encodeURIComponent(state.currentRunId) + '/file?p=' + encodeURIComponent(rel));
  const body = await res.text();
  renderArtifact(rel, body);
  const tb = document.getElementById('toolbar');
  tb.style.display = 'flex';
  tb.querySelector('#btn-edit').style.display = 'inline-block';
  tb.querySelector('#btn-save').style.display = 'none';
  tb.querySelector('#btn-cancel').style.display = 'none';
  document.getElementById('toolbar-status').textContent = rel;
}

function renderArtifact(rel, body) {
  const content = document.getElementById('content');
  if (rel.endsWith('.md')) {
    content.innerHTML = '<pre>' + esc(body) + '</pre>'; // simple — render as pre, keep structure visible
  } else if (rel.endsWith('.json')) {
    try {
      const parsed = JSON.parse(body);
      content.innerHTML = '<pre>' + esc(JSON.stringify(parsed, null, 2)) + '</pre>';
    } catch {
      content.innerHTML = '<pre>' + esc(body) + '</pre>';
    }
  } else {
    content.innerHTML = '<pre>' + esc(body) + '</pre>';
  }
}

function renderBranchDetail(b) {
  const br = state.currentRun.branches[b];
  const h = [];
  h.push('<h2>Branch ' + b.toUpperCase() + '</h2>');
  if (br.branch_card) {
    h.push('<div class="card"><div class="card-label">research question</div><div class="card-value">' + esc(br.branch_card.research_question || '—') + '</div></div>');
    if (br.branch_card.intervention_primitive) h.push('<div class="card"><div class="card-label">intervention</div><div class="card-value">' + esc(br.branch_card.intervention_primitive) + '</div></div>');
    h.push('<p><button class="btn" data-open="branches/' + b + '/branch_card.json">Open branch_card.json</button></p>');
  }
  if (br.audit) {
    h.push('<h3>Capture-risk audit · ' + esc(br.audit.verdict || '—') + '</h3>');
    const fired = (br.audit.findings || []).filter(f => f.fired);
    for (const f of fired) {
      const sevClass = f.score <= -2 ? '' : f.score === -1 ? 'drift' : 'info';
      h.push('<div class="audit-finding ' + sevClass + '">');
      h.push('<div class="ph"><span class="pattern">' + esc(f.pattern_id) + '</span><span>' + esc(f.axis) + '</span><span class="score">score ' + f.score + '</span></div>');
      if (f.evidence_span?.quote) h.push('<div class="evidence">' + esc(f.evidence_span.quote) + '</div>');
      if (f.rationale) h.push('<div class="rationale">' + esc(f.rationale) + '</div>');
      h.push('</div>');
    }
    h.push('<p><button class="btn" data-open="branches/' + b + '/audit.json">Open audit.json</button> <button class="btn" data-open="branches/' + b + '/audit.md">Open audit.md</button></p>');
  }
  if (br.meta_review) {
    h.push('<h3>Meta-review · ' + esc(br.meta_review.verdict || '—') + '</h3>');
    if (br.meta_review.disagreement_classification) h.push('<p><code>' + esc(br.meta_review.disagreement_classification) + '</code></p>');
    if (br.meta_review.verdict_rationale) h.push('<p>' + esc(br.meta_review.verdict_rationale) + '</p>');
    h.push('<p><button class="btn" data-open="branches/' + b + '/meta_review.json">Open meta_review.json</button></p>');
  }
  if (br.has_walkthrough) {
    h.push('<p><button class="btn" data-open="branches/' + b + '/simulated_walkthrough.md">Open simulated_walkthrough.md</button></p>');
  }
  if (br.has_wnr) {
    h.push('<p><button class="btn" data-open="branches/' + b + '/WORKSHOP_NOT_RECOMMENDED.md">Open WORKSHOP_NOT_RECOMMENDED.md</button></p>');
  }
  const content = document.getElementById('content');
  content.innerHTML = h.join('');
  content.querySelectorAll('[data-open]').forEach(btn => btn.addEventListener('click', () => loadArtifact(btn.dataset.open)));
  document.getElementById('toolbar').style.display = 'none';
}

// ── edit mode ─────────────────────────────────────────────────────────
document.getElementById('btn-edit').addEventListener('click', async () => {
  if (!state.currentArtifactPath) return;
  const res = await fetch('/api/runs/' + encodeURIComponent(state.currentRunId) + '/file?p=' + encodeURIComponent(state.currentArtifactPath));
  const body = await res.text();
  const content = document.getElementById('content');
  content.innerHTML = '<textarea class="editor" id="editor">' + esc(body) + '</textarea>';
  state.editing = true;
  document.getElementById('btn-edit').style.display = 'none';
  document.getElementById('btn-save').style.display = 'inline-block';
  document.getElementById('btn-cancel').style.display = 'inline-block';
});
document.getElementById('btn-save').addEventListener('click', async () => {
  const content = document.getElementById('editor').value;
  const url = '/api/runs/' + encodeURIComponent(state.currentRunId) + '/file?p=' + encodeURIComponent(state.currentArtifactPath);
  const res = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'text/plain' }, body: content });
  if (res.ok) {
    document.getElementById('toolbar-status').textContent = state.currentArtifactPath + ' · saved';
    setTimeout(() => { document.getElementById('toolbar-status').textContent = state.currentArtifactPath; }, 2000);
    await loadArtifact(state.currentArtifactPath);
  } else {
    document.getElementById('toolbar-status').textContent = 'save failed';
  }
});
document.getElementById('btn-cancel').addEventListener('click', () => {
  loadArtifact(state.currentArtifactPath);
});

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

loadRuns();
`;
