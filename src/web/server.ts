/**
 * `probe web` — local web UI for exploring and editing Probe runs.
 *
 * Express server on localhost:<port> that serves:
 *   - / — single-page app (plain HTML + vanilla JS, no build step)
 *   - /api/runs — list of runs in runs/
 *   - /api/runs/:id — run metadata, branches, stages, artifacts
 *   - /api/runs/:id/file?p=<relpath> — read an artifact
 *   - PATCH /api/runs/:id/file?p=<relpath> — overwrite an artifact
 *   - /api/events/:id — SSE channel for live pipeline updates (stub)
 *
 * The frontend is intentionally framework-free. A single HTML file
 * with vanilla JS renders a two-pane layout (content + sidebar),
 * fetches artifacts on demand, and posts edits back. Keeps shipping
 * simple and the dependency graph light.
 *
 * Security: binds to 127.0.0.1 only. Edits are scoped via a
 * path-traversal guard that rejects any `p` leaving runs/<id>/.
 */

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';
import express from 'express';
import chalk from 'chalk';
import { projectRoot, runDir, branchDir } from '../util/paths.js';
import { palette } from '../ui/theme.js';
import { buildIndexHtml } from './index_html.js';
import { mountProbeApi } from './probe_api.js';

const HALIDE_ROOT = path.join(projectRoot(), 'src', 'web', 'halide');
const PROBE_UI_ROOT = path.join(projectRoot(), 'src', 'web', 'probe_design');

export interface WebServerOptions {
  port?: number;
  host?: string;
  /** Open the URL in the default browser on startup. */
  open?: boolean;
}

export async function startWebServer(opts: WebServerOptions = {}): Promise<void> {
  const port = opts.port ?? 4470; // arbitrary, above common dev-server ports
  const host = opts.host ?? '127.0.0.1';

  const app = express();
  app.use(express.json({ limit: '2mb' }));
  app.use(express.text({ limit: '2mb', type: 'text/*' }));

  // Probe UI backend — LLM-driven endpoints for the new flow.
  // Mounted before any other /api routes.
  mountProbeApi(app);

  // ── HTML index ────────────────────────────────────────────────────────
  // New default: the Halide (Dossier Prototype) dark UI — React + Babel
  // in-browser. Served from src/web/halide/. The old single-page app
  // remains available at /legacy for fallback.
  app.get('/', async (_req, res) => {
    try {
      const html = await fs.readFile(path.join(HALIDE_ROOT, 'index.html'), 'utf8');
      res.set('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch {
      res.set('Content-Type', 'text/html; charset=utf-8');
      res.send(buildIndexHtml());
    }
  });

  app.get('/legacy', (_req, res) => {
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(buildIndexHtml());
  });

  // ── New Probe UI — the live, interactive flow designed in Claude
  // Design. Multi-stage workflow: premise input → brainstorm RQs →
  // literature → methodology → artifacts → evaluation → report. The
  // HTML and JSX live in src/web/probe_design/ verbatim from the
  // handoff bundle so the prototype keeps its full interactivity.
  //
  // Named routes for the user's primary entry points:
  //   /ui            — new project flow (the main thing)
  //   /ui/startup    — LazyVim-style launcher
  //   /ui/welcome    — first-run / settings + key state
  //   /ui/project    — project page (steady state, stages + timeline)
  //   /ui/config     — config / probe.toml settings
  //   /ui/dossier    — full Dossier prototype (alternative app shell)
  //   /ui/canvas     — design canvas showing all three directions
  //
  // Anything else under /ui/ falls through to static — that's how
  // probe-literature.jsx, components/dossier.jsx, etc. resolve their
  // relative imports (they're served from PROBE_UI_ROOT).
  const uiRoute = (file: string) => async (_req: express.Request, res: express.Response) => {
    try {
      const html = await fs.readFile(path.join(PROBE_UI_ROOT, file), 'utf8');
      res.set('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (e) {
      res.status(500).send(`failed to load ${file}: ${String((e as Error).message)}`);
    }
  };
  // Both surfaces start at the launcher (Variant A LazyVim-style).
  // Menu picks navigate to the actual flows below.
  app.get('/ui',         uiRoute('Probe Launcher.html'));
  app.get('/ui/',        uiRoute('Probe Launcher.html'));
  app.get('/ui/new',     uiRoute('Probe New Project.html')); // the workflow
  app.get('/ui/startup', uiRoute('Probe Launcher.html'));    // alias for the launcher
  app.get('/ui/welcome', uiRoute('Probe Welcome.html'));
  app.get('/ui/project', uiRoute('Probe Project.html'));
  app.get('/ui/config',  uiRoute('Probe Config.html'));
  app.get('/ui/dossier', uiRoute('Dossier Prototype.html'));
  app.get('/ui/canvas',  uiRoute('Probe Web UI.html'));
  app.get('/ui/replay',  uiRoute('Probe Replay.html'));

  // Static mount for the design's JSX modules + assets. Must come
  // AFTER the explicit named routes above so /ui/project picks the
  // route handler instead of a 404 from the static fallback.
  app.use(
    '/ui',
    express.static(PROBE_UI_ROOT, {
      // Babel standalone reads <script type="text/babel" src="…"> via
      // fetch and won't accept text/html or application/octet-stream
      // for .jsx. Force text/plain so the in-browser transpiler picks
      // it up.
      setHeaders: (res, file) => {
        if (file.endsWith('.jsx')) {
          res.set('Content-Type', 'text/plain; charset=utf-8');
        }
      },
    }),
  );

  // Static assets for the legacy Halide UI (kept for backward compat
  // — the old `probe web` default still serves the halide index from
  // /). Must be registered before the catch-all API error handler.
  app.use(
    '/components',
    express.static(path.join(HALIDE_ROOT, 'components'), {
      setHeaders: (res, file) => {
        if (file.endsWith('.jsx')) {
          res.set('Content-Type', 'text/plain; charset=utf-8');
        }
      },
    }),
  );

  // ── Run listing ──────────────────────────────────────────────────────
  app.get('/api/runs', async (_req, res) => {
    const runsRoot = path.join(projectRoot(), 'runs');
    try {
      const entries = await fs.readdir(runsRoot);
      const dirs = entries.filter(
        (e) => !e.startsWith('.') && !e.startsWith('_') && !e.startsWith('ablation_') && !e.startsWith('hallucination_'),
      );
      const runs: Array<{ id: string; premise: string; stats: unknown | null }> = [];
      for (const d of dirs) {
        const stat = await fs.stat(path.join(runsRoot, d)).catch(() => null);
        if (!stat?.isDirectory()) continue;
        const premise = await safeRead(path.join(runsRoot, d, 'premise.md'));
        const stats = await safeReadJson(path.join(runsRoot, d, 'stats.json'));
        runs.push({ id: d, premise: premise.replace(/^#\s+Research premise\s*\n\n?/i, '').trim().slice(0, 200), stats });
      }
      res.json({ runs });
    } catch (e) {
      res.status(500).json({ error: String((e as Error).message) });
    }
  });

  // ── Single run detail ────────────────────────────────────────────────
  app.get('/api/runs/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const rd = runDir(id);
      if (!existsSync(rd)) {
        res.status(404).json({ error: `run ${id} not found` });
        return;
      }
      const out: Record<string, unknown> = {
        run_id: id,
        premise: (await safeRead(path.join(rd, 'premise.md')))
          .replace(/^#\s+Research premise\s*\n\n?/i, '')
          .trim(),
        summary: await safeReadJson(path.join(rd, 'run_summary.json')),
        stats: await safeReadJson(path.join(rd, 'stats.json')),
        cost: await safeReadJson(path.join(rd, 'cost.json')),
        premise_card: await safeReadJson(path.join(rd, 'premise_card.json')),
        guidebook_exists: existsSync(path.join(rd, 'PROBE_GUIDEBOOK.md')),
        report_page_exists: existsSync(path.join(rd, 'PROBE_REPORT_PAGE.html')),
      };
      // Per-branch artifact inventory
      const branchesDir = path.join(rd, 'branches');
      const branchIds: string[] = existsSync(branchesDir)
        ? (await fs.readdir(branchesDir)).filter((e) => /^[a-z]$/.test(e))
        : [];
      const branches: Record<string, unknown> = {};
      for (const b of branchIds) {
        const bd = branchDir(id, b);
        branches[b] = {
          branch_id: b,
          branch_card: await safeReadJson(path.join(bd, 'branch_card.json')),
          prototype_spec: await safeReadJson(path.join(bd, 'prototype_spec.json')),
          audit: await safeReadJson(path.join(bd, 'audit.json')),
          meta_review: await safeReadJson(path.join(bd, 'meta_review.json')),
          has_walkthrough: existsSync(path.join(bd, 'simulated_walkthrough.md')),
          has_wnr: existsSync(path.join(bd, 'WORKSHOP_NOT_RECOMMENDED.md')),
        };
      }
      out.branches = branches;
      res.json(out);
    } catch (e) {
      res.status(500).json({ error: String((e as Error).message) });
    }
  });

  // ── File read / write within a run ───────────────────────────────────
  app.get('/api/runs/:id/file', async (req, res) => {
    const id = req.params.id;
    const rel = req.query.p;
    if (typeof rel !== 'string') {
      res.status(400).json({ error: 'query param p is required' });
      return;
    }
    const abs = pathGuard(id, rel);
    if (!abs) {
      res.status(400).json({ error: 'invalid path' });
      return;
    }
    try {
      const body = await fs.readFile(abs, 'utf8');
      res.set('Content-Type', guessMime(abs));
      res.send(body);
    } catch (e) {
      res.status(404).json({ error: String((e as Error).message) });
    }
  });

  app.patch('/api/runs/:id/file', async (req, res) => {
    const id = req.params.id;
    const rel = req.query.p;
    if (typeof rel !== 'string') {
      res.status(400).json({ error: 'query param p is required' });
      return;
    }
    const abs = pathGuard(id, rel);
    if (!abs) {
      res.status(400).json({ error: 'invalid path' });
      return;
    }
    const body =
      typeof req.body === 'string'
        ? req.body
        : typeof req.body === 'object' && req.body !== null && 'content' in (req.body as Record<string, unknown>)
          ? String((req.body as { content: unknown }).content ?? '')
          : '';
    try {
      await fs.writeFile(abs, body);
      res.json({ ok: true, bytes: body.length });
    } catch (e) {
      res.status(500).json({ error: String((e as Error).message) });
    }
  });

  // ── Health check ─────────────────────────────────────────────────────
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', project_root: projectRoot(), cwd: process.cwd() });
  });

  // ── Start ────────────────────────────────────────────────────────────
  await new Promise<void>((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(port, host, () => resolve());
    server.on('error', reject);
  });

  const url = `http://${host}:${port}/`;
  console.log('');
  console.log(chalk.hex(palette.probe).bold(`  🌐  probe web`));
  console.log(chalk.hex(palette.dim)(`      listening on ${chalk.hex(palette.stage)(url)}`));
  console.log(chalk.hex(palette.dim)(`      Ctrl+C to stop`));
  console.log('');

  if (opts.open) {
    await openInBrowser(url).catch(() => {
      /* no-op; user can click the printed URL */
    });
  }

  // Keep the process alive
  await new Promise(() => {
    /* never resolves; SIGINT terminates */
  });
}

// ─── helpers ─────────────────────────────────────────────────────────────

async function safeRead(p: string): Promise<string> {
  try {
    return await fs.readFile(p, 'utf8');
  } catch {
    return '';
  }
}

async function safeReadJson(p: string): Promise<unknown | null> {
  try {
    return JSON.parse(await fs.readFile(p, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Resolve a run-relative path to absolute, rejecting traversal outside
 * runs/<id>/. Returns null on violation.
 */
function pathGuard(runId: string, rel: string): string | null {
  if (runId.includes('..') || runId.includes('/')) return null;
  const base = runDir(runId);
  const abs = path.resolve(base, rel);
  if (!abs.startsWith(base + path.sep) && abs !== base) return null;
  return abs;
}

function guessMime(p: string): string {
  if (p.endsWith('.json')) return 'application/json; charset=utf-8';
  if (p.endsWith('.md')) return 'text/markdown; charset=utf-8';
  if (p.endsWith('.html')) return 'text/html; charset=utf-8';
  return 'text/plain; charset=utf-8';
}

async function openInBrowser(url: string): Promise<void> {
  const { spawn } = await import('node:child_process');
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  spawn(cmd, [url], { detached: true, stdio: 'ignore' }).unref();
}
