// Walks every screen in the Probe web app via headless Chrome
// DevTools and saves a PNG of each into docs/screenshots/all-screens/.
//
// Outputs:
//   01-home.png                 home / launcher
//   02-replay-picker.png        replay picker
//   03-new-project-premise.png  premise screen with suggestions grid
//   04-new-project-filled.png   textarea filled, suggestion grid hidden
//   05-brainstorm.png           three RQs reveal
//   06-literature.png           per-RQ SOA + your-notes
//   07-methodology.png          three integrated designs
//   08-methodology-design-picked.png  one design expanded + plan drafted
//   09-artifacts-list.png       five artifact cards collapsed
//   10-artifacts-open.png       impl plan card expanded with markdown body
//   11-evaluation-config.png    pre-mortem N-slider config
//   12-evaluation-done.png      pre-mortem risks + persona pool
//   13-report.png               title + discussion-shaped + conclusion + exports
//   14-review.png               peer review panel + disagreement audit
//   15-config.png               settings page
//   16-project-page.png         project page (gantt + stages)
//
// Each step: navigate or click, wait for state, capture PNG.

import http from 'node:http';
import WebSocket from 'ws';
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve('docs/screenshots/all-screens');
const PROBE = 'http://127.0.0.1:4470';

function getJSON(p) {
  return new Promise((res, rej) => {
    http.get('http://127.0.0.1:9223' + p, (r) => {
      let b = ''; r.on('data', (c) => b += c);
      r.on('end', () => res(JSON.parse(b)));
    }).on('error', rej);
  });
}

const tabs = await getJSON('/json');
const target = tabs.find((t) => t.type === 'page');
if (!target) throw new Error('no chrome tab — start headless chrome on :9223');

const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
ws.on('message', (data) => {
  const m = JSON.parse(data.toString());
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
function send(method, params = {}) {
  return new Promise((r) => {
    const i = ++id; pending.set(i, r);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
}
await new Promise((r) => ws.once('open', r));
await send('Page.enable');
await send('Runtime.enable');
// 1440x900 — standard MacBook screenshot dim
await send('Emulation.setDeviceMetricsOverride', {
  width: 1440, height: 900, deviceScaleFactor: 2, mobile: false,
});

const pause = (ms) => new Promise((r) => setTimeout(r, ms));
async function ev(expr) {
  const r = await send('Runtime.evaluate', {
    expression: expr, returnByValue: true, awaitPromise: true,
  });
  return r.result?.result?.value;
}
async function navigate(url) {
  await send('Page.navigate', { url });
  await pause(2500);
  // Babel-standalone takes a tick to compile after navigation
  await pause(1500);
}
async function shot(filename) {
  const ss = await send('Page.captureScreenshot', { format: 'png' });
  const out = path.join(OUT_DIR, filename);
  fs.writeFileSync(out, Buffer.from(ss.result?.data || '', 'base64'));
  console.log('  →', filename);
}
// Returns the document context to query — the embedded iframe's
// contentDocument when one is present (i.e. we landed on /ui in the
// shell), or the top-level document when we navigated directly to a
// stage URL like /ui/new which is served as the page itself, no
// shell wrap.
function docExpr() {
  return `(document.querySelector('iframe')?.contentDocument || document)`;
}
async function click(needle) {
  return await ev(`(() => {
    const doc = ${docExpr()};
    const all = [...doc.querySelectorAll('button, [role="button"], a')];
    const t = all.find((b) => b.textContent.toLowerCase().includes(${JSON.stringify(needle.toLowerCase())}) && !b.disabled);
    if (!t) return 'NOT_FOUND: ' + ${JSON.stringify(needle)};
    t.click();
    return 'OK: ' + t.textContent.replace(/\\s+/g,' ').slice(0,60);
  })()`);
}
async function fillTextarea(value) {
  return await ev(`(() => {
    const doc = ${docExpr()};
    const ta = doc.querySelector('textarea');
    if (!ta) return 'NO_TEXTAREA';
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(ta, ${JSON.stringify(value)});
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    return 'typed';
  })()`);
}
async function pressEnterInTextarea() {
  return await ev(`(() => {
    const doc = ${docExpr()};
    const ta = doc.querySelector('textarea');
    if (!ta) return 'NO_TEXTAREA';
    ta.focus();
    const win = doc.defaultView || window;
    ta.dispatchEvent(new win.KeyboardEvent('keydown', { key:'Enter', code:'Enter', keyCode:13, which:13, bubbles:true }));
    return 'enter';
  })()`);
}

console.log('walk-all → ' + OUT_DIR);

// ── 1. Home ───────────────────────────────────────────────
console.log('1. home');
await navigate(`${PROBE}/ui`);
await shot('01-home.png');

// ── 2. Replay picker ──────────────────────────────────────
console.log('2. replay picker');
await navigate(`${PROBE}/ui/replay`);
await shot('02-replay-picker.png');

// Seed replay so subsequent stages can use cached payloads
await ev(`fetch('/api/probe/demo/start', {
  method:'POST', headers:{'content-type':'application/json'},
  body: JSON.stringify({name:'focus-rituals', delayMs: 0})
})`);
await pause(800);

// ── 3. New project — premise (suggestions visible) ─────────
console.log('3. new-project premise');
await navigate(`${PROBE}/ui/new`);
await shot('03-new-project-premise.png');

// ── 4. New project — premise filled ────────────────────────
console.log('4. new-project filled');
await fillTextarea('How do remote workers stay focused during long video-call days?');
await pause(500);
await shot('04-new-project-filled.png');

// ── 5. Brainstorm ──────────────────────────────────────────
// We seed the demo first (so cached payloads are served) and use
// the ?prompt=...&go=brainstorm URL the home page uses internally
// to auto-advance past the premise screen. This is more reliable
// than synthesizing a keypress, because React's synthetic event
// system sometimes doesn't pick up dispatchEvent('keydown').
console.log('5. brainstorm (auto-advance URL)');
const premise = encodeURIComponent('How do remote workers stay focused during long video-call days?');
await navigate(`${PROBE}/ui/new?demo=focus-rituals&prompt=${premise}&go=brainstorm`);
await pause(4000);
await shot('05-brainstorm.png');

// ── 6. Literature ─────────────────────────────────────────
// Brainstorm requires picking at least one RQ card before the
// continue button appears. We pick RQ A, then advance.
console.log('6. literature');
const pickedA = await ev(`(() => {
  const doc = ${docExpr()};
  const all = [...doc.querySelectorAll('button, [role="button"]')];
  const rq = all.find(b => /^rq a/i.test(b.textContent));
  if (!rq) return 'NO_RQ_A';
  rq.click();
  return 'picked rqA';
})()`);
console.log('  pick RQ A →', pickedA);
await pause(700);
console.log('  continue →', await click('continue with selected'));
// Literature page hydrates SOA + your-notes asynchronously; give
// it more headroom before screenshotting.
await pause(4500);
await shot('06-literature.png');

// Helper that retries a click for up to N seconds — many of the
// stage continue-buttons appear asynchronously after a fetch returns
// from /api/probe. A single click attempt right after navigation
// fails because the button hasn't rendered yet.
async function clickWithRetry(needle, timeoutMs = 8000) {
  const start = Date.now();
  let last = 'NEVER_TRIED';
  while (Date.now() - start < timeoutMs) {
    const r = await click(needle);
    if (r.startsWith('OK')) return r;
    last = r;
    await pause(800);
  }
  return last;
}

// ── 7. Methodology ────────────────────────────────────────
console.log('7. methodology');
// On the literature page the continue button appears once the
// SOA + your-notes panel has hydrated (~2-3s after stage entry).
console.log('  click →', await clickWithRetry('design study'));
await pause(3000);
await shot('07-methodology.png');

// ── 8. Methodology — design picked + plan drafted ─────────
console.log('8. methodology design picked');
console.log('  pick design →', await clickWithRetry('Mixed-methods longitudinal'));
await pause(800);
console.log('  draft plan →', await clickWithRetry('draft plan'));
await pause(3500);
await shot('08-methodology-design-picked.png');

// ── 9. Artifacts list ─────────────────────────────────────
console.log('9. artifacts list');
console.log('  draft artifacts →', await clickWithRetry('draft artifacts'));
await pause(4000);
await shot('09-artifacts-list.png');

// ── 10. Artifacts — open first card ───────────────────────
console.log('10. artifacts open');
const opened = await ev(`(() => {
  const doc = ${docExpr()};
  const cards = [...doc.querySelectorAll('[role="button"]')];
  if (!cards.length) return 'NO_CARDS';
  cards[0].click();
  return 'opened: ' + cards[0].textContent.replace(/\\s+/g,' ').slice(0,40);
})()`);
console.log('  open →', opened);
await pause(800);
await shot('10-artifacts-open.png');

// ── 11. Evaluation / pre-mortem config ────────────────────
console.log('11. evaluation config');
console.log('  click →', await clickWithRetry('simulate evaluation'));
await pause(2500);
await shot('11-evaluation-config.png');

// ── 12. Evaluation done ───────────────────────────────────
console.log('12. evaluation done');
console.log('  run simulation →', await clickWithRetry('run simulation'));
await pause(10000); // animated phase progress (5 phases * ~2s each)
await shot('12-evaluation-done.png');

// ── 13. Report ────────────────────────────────────────────
console.log('13. report');
console.log('  click →', await clickWithRetry('discussion + report'));
await pause(4500);
await shot('13-report.png');

// ── 14. Review ────────────────────────────────────────────
// Skip the save-and-open modal (showSaveFilePicker hangs in
// headless). Use the debug-only window.__probeDevGoto hook to
// teleport directly to the review stage. The disagreement audit
// fetches its own state from /api/probe/disagreement-audit, so the
// page populates fully without us having to walk the save flow.
console.log('14. review');
const advanced = await ev(`(() => {
  const win = (document.querySelector('iframe')?.contentWindow || window);
  if (typeof win.__probeDevGoto !== 'function') return 'NO_HOOK';
  win.__probeDevGoto('review');
  return 'OK';
})()`);
console.log('  goto review →', advanced);
await pause(6000);
await shot('14-review.png');

// ── 15. Config ────────────────────────────────────────────
console.log('15. config');
await navigate(`${PROBE}/ui/config`);
await shot('15-config.png');

// ── 16. Project page (Gantt + stages) ─────────────────────
console.log('16. project page');
await navigate(`${PROBE}/ui/project`);
await pause(2500);
await shot('16-project-page.png');

// Switch to timeline tab for the gantt chart screenshot
console.log('17. project timeline');
console.log('  click →', await click('timeline'));
await pause(1200);
await shot('17-project-timeline.png');

console.log(`\ndone — ${fs.readdirSync(OUT_DIR).filter((f)=>f.endsWith('.png')).length} screenshots`);
ws.close();
process.exit(0);
