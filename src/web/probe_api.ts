/**
 * Probe UI backend API. Express endpoints that wrap src/llm/probe_calls.ts
 * so the browser-side Dossier prototype can drive a real LLM rather
 * than read stock data.
 *
 * All endpoints return JSON. Errors return { error: string } with
 * appropriate HTTP status. The frontend should fall back to canned
 * content when an endpoint returns 5xx so the demo still functions
 * without an API key.
 *
 * Mounted at /api/probe in src/web/server.ts.
 */

import express from 'express';
import {
  brainstorm, literature, methodology, plan,
  artifacts, personas, findings, report, review,
  disagreementAudit, rqBoolean, teaser,
  hasApiKey,
  type RqOp,
} from '../llm/probe_calls.js';
import { canRunLiveWeb } from '../llm/provider.js';
import {
  resolveKey, readConfig, writeConfig, modelForStage,
  PROVIDERS, type Provider, type ProbeConfig, type UiStage,
} from '../config/probe_toml.js';
import { FORBIDDEN_PHRASES } from '../lint/forbidden.js';
import * as demo from './probe_demo.js';

// Per-IP rate limiter for the live-LLM stage endpoints. Cost-runaway
// protection: a public probe-researcher.com would otherwise let a
// single hostile client spend hundreds of dollars in seconds. The
// /demo/* and /status endpoints are deliberately NOT limited because
// they're cheap and judge-facing.
function makeStageLimiter(maxPerWindow: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = (req.ip || req.socket.remoteAddress || 'unknown') as string;
    const now = Date.now();
    const cutoff = now - windowMs;
    const bucket = (hits.get(ip) || []).filter((t) => t > cutoff);
    if (bucket.length >= maxPerWindow) {
      res.status(429).json({
        error: 'rate limit exceeded',
        detail: `live LLM endpoints capped at ${maxPerWindow} requests per ${windowMs / 1000}s per IP`,
        retryAfterSec: Math.ceil((bucket[0] + windowMs - now) / 1000),
      });
      return;
    }
    bucket.push(now);
    hits.set(ip, bucket);
    next();
  };
}

export function mountProbeApi(app: express.Express): void {
  const router = express.Router();
  router.use(express.json({ limit: '2mb' }));

  // GET /api/probe/models — per-stage resolved model IDs for the active
  // config. The frontend ModelStatusLine reads this on mount so each
  // stage's spinner shows the actual model that will run, not a
  // hardcoded label. Without this endpoint, switching probe.toml to
  // mode='opus' would still show "claude-sonnet-4-6" everywhere.
  router.get('/models', (_req, res) => {
    try {
      const stages: UiStage[] = [
        'brainstorm', 'literature', 'methodology', 'plan',
        'artifacts', 'personas', 'findings', 'report', 'review',
      ];
      const models: Record<string, string> = {};
      for (const s of stages) models[s] = modelForStage(s);
      res.json({ models, mode: readConfig().models.mode });
    } catch (e) {
      res.status(500).json({ error: String((e as Error).message) });
    }
  });

  // GET /api/probe/status — what keys are usable, and where do they come
  // from? Resolves through the same `resolveKey()` path the live-web call
  // dispatcher uses, so the surface this exposes never lies relative to
  // what `/api/probe/<stage>` will actually accept. `canRunLiveUi` is the
  // boolean the frontend should treat as authoritative — `hasApiKey` is
  // the looser provider-layer signal and stays for backward compat.
  router.get('/status', (_req, res) => {
    const a = resolveKey('anthropic');
    const o = resolveKey('openai');
    res.json({
      hasApiKey: hasApiKey(),
      canRunLiveUi: canRunLiveWeb(),
      anthropic: a.source !== 'unset',
      anthropicSource: a.source,
      openai: o.source !== 'unset',
      openaiSource: o.source,
      demo: demo.status(),
    });
  });

  // ─── Config endpoints (read/patch ~/.config/probe/probe.toml) ────
  // The web Config screen used to be a local mock — edits disappeared
  // on reload. These endpoints make it real:
  //   GET /api/probe/config  → redacted view (keys masked, never raw)
  //   PATCH /api/probe/config → accepts partial settings, deep-merges,
  //                              persists via writeConfig() (atomic, 0600)
  // Key writes accept raw values (write-only) and the response always
  // returns the redacted shape — raw key material never round-trips
  // back to the browser.

  function redactConfig(cfg: ProbeConfig) {
    const keys: Record<Provider, { source: string; preview: string; sourceLabel: string }> = {} as never;
    for (const p of PROVIDERS) {
      const r = resolveKey(p, cfg);
      keys[p] = { source: r.source, preview: r.preview, sourceLabel: r.sourceLabel };
    }
    return {
      keys,
      models: cfg.models,
      budget: cfg.budget,
      appearance: cfg.appearance,
      behavior: cfg.behavior,
    };
  }

  router.get('/config', (_req, res) => {
    try {
      res.json(redactConfig(readConfig()));
    } catch (e) {
      res.status(500).json({ error: String((e as Error).message) });
    }
  });

  router.patch('/config', (req, res) => {
    try {
      const patch = (req.body ?? {}) as Partial<ProbeConfig>;
      const current = readConfig();
      // Shallow merge per top-level group — keeps unknown fields safe.
      const merged: ProbeConfig = {
        keys:       { ...current.keys,       ...(patch.keys       ?? {}) },
        models:     { ...current.models,     ...(patch.models     ?? {}) },
        budget:     { ...current.budget,     ...(patch.budget     ?? {}) },
        appearance: { ...current.appearance, ...(patch.appearance ?? {}) },
        behavior:   { ...current.behavior,   ...(patch.behavior   ?? {}) },
      };
      writeConfig(merged);
      res.json(redactConfig(merged));
    } catch (e) {
      res.status(500).json({ error: String((e as Error).message) });
    }
  });

  // ─── Demo save / replay endpoints ─────────────────────────────────
  // Save the current workflow state to disk so it can be replayed
  // instantly later. Replay short-circuits the LLM for every stage —
  // see the `served` helper below that wraps each endpoint.

  router.post('/demo/save', (req, res) => {
    try {
      const { name, state } = (req.body ?? {}) as { name?: string; state?: { premise?: string } };
      if (!name || !state) {
        res.status(400).json({ error: 'name and state required' });
        return;
      }
      const saved = demo.saveDemo(name, state);
      res.json({ saved });
    } catch (e) {
      res.status(500).json({ error: String((e as Error).message) });
    }
  });

  router.get('/demo/list', (_req, res) => {
    res.json({ demos: demo.listDemos() });
  });

  router.get('/demo/load', (req, res) => {
    const name = String(req.query.name ?? '');
    const d = demo.loadDemo(name);
    if (!d) { res.status(404).json({ error: 'not found' }); return; }
    res.json(d);
  });

  router.post('/demo/start', (req, res) => {
    const { name, delayMs } = (req.body ?? {}) as { name?: string; delayMs?: number };
    if (!name) { res.status(400).json({ error: 'name required' }); return; }
    const d = demo.startReplay(name, delayMs ?? 1500);
    if (!d) { res.status(404).json({ error: 'demo not found' }); return; }
    res.json({ active: true, name: d.name });
  });

  router.post('/demo/stop', (_req, res) => {
    demo.stopReplay();
    res.json({ active: false });
  });

  // ─── Provenance guard for web JSON output ────────────────────────
  // The offline pipeline's lint runs against shipped guidebook
  // markdown. The web UI generates report/findings text directly into
  // JSON and renders it inside the iframe — this never touches the
  // markdown linter. To close the gap honestly, we run the same
  // forbidden-phrase regex set against the web output before it's
  // returned. Hits get tagged inline with `[⚠ SIMULATED · do not cite]`
  // rather than rejected outright (would defeat the demo flow), but
  // the tag is visible to the user and the response includes a
  // structured `provenance.violations` array the frontend can surface.

  function scanForForbidden(text: string): string[] {
    const hits: string[] = [];
    if (typeof text !== 'string' || text.length === 0) return hits;
    for (const re of FORBIDDEN_PHRASES) {
      const m = text.match(re);
      if (m && !hits.includes(m[0])) hits.push(m[0]);
    }
    return hits;
  }

  // Walk a payload; for every string field that LOOKS like simulated
  // output (>40 chars and not a key/id/url), scan for forbidden
  // phrases and rewrite hits with the safe-cite tag.
  function guardSimulatedText<T extends object>(payload: T, allViolations: string[]): T {
    const out = JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;
    const visit = (node: unknown, path: string): unknown => {
      if (typeof node === 'string') {
        if (node.length < 40) return node;
        if (/^https?:\/\//.test(node)) return node;
        const hits = scanForForbidden(node);
        if (hits.length === 0) return node;
        for (const h of hits) {
          allViolations.push(`${path}: "${h}"`);
        }
        let safe = node;
        for (const re of FORBIDDEN_PHRASES) {
          safe = safe.replace(re, (m) => `${m} [⚠ SIMULATED · do not cite]`);
        }
        return safe;
      }
      if (Array.isArray(node)) {
        return node.map((item, i) => visit(item, `${path}[${i}]`));
      }
      if (node && typeof node === 'object') {
        const o = node as Record<string, unknown>;
        const next: Record<string, unknown> = {};
        for (const k of Object.keys(o)) next[k] = visit(o[k], `${path}.${k}`);
        return next;
      }
      return node;
    };
    return visit(out, '$') as T;
  }

  // ─── Stage helper ───────────────────────────────────────────────
  // If a demo is active, serve the cached slice with a synthetic
  // delay; otherwise fall through to the live LLM call.
  //
  // Cache-miss policy: when a demo is replaying but doesn't include
  // this stage's slice, we still try the live LLM so a partial demo
  // doesn't hang — but if that fails (e.g. judge has no API key) we
  // return an empty placeholder rather than 500. The frontend has
  // stock fallbacks for every stage and treats empty payloads as
  // "use stock", which keeps the demo flow from showing console
  // errors during replay.
  // Stages that produce simulated-finding-style language. The
  // provenance guard scans these payloads for forbidden phrases on
  // their way out to the browser; report and findings are the
  // highest-risk because they're the ones a researcher might cite.
  const STAGES_TO_GUARD = new Set(['report', 'findings', 'review']);

  async function served<T>(
    res: express.Response,
    stage: string,
    args: Record<string, unknown>,
    live: () => Promise<T>,
  ): Promise<void> {
    const replayingNow = demo.isReplaying();
    const finalize = (payload: T) => {
      if (STAGES_TO_GUARD.has(stage) && payload && typeof payload === 'object') {
        const violations: string[] = [];
        const guarded = guardSimulatedText(payload as object, violations) as T;
        if (violations.length > 0) {
          (guarded as Record<string, unknown>).provenance = {
            guard: 'forbidden-phrase scan',
            violations,
            policy: 'evidence-language phrases tagged with [⚠ SIMULATED · do not cite]',
          };
        }
        res.json(guarded);
        return;
      }
      res.json(payload);
    };
    try {
      if (replayingNow) {
        const cached = demo.slice(stage, args);
        if (cached !== null) {
          await demo.delay();
          finalize(cached as T);
          return;
        }
      }
      const out = await live();
      finalize(out);
    } catch (e) {
      if (replayingNow) {
        // Demo missing slice + live failed (likely no API key) → soft
        // fallback so the frontend's stock content kicks in cleanly.
        res.json(emptyPayloadFor(stage));
        return;
      }
      res.status(500).json({ error: String((e as Error).message) });
    }
  }

  // Per-stage empty-but-shaped payload returned when a replay falls
  // through to a failing live call. Each shape mirrors what the
  // frontend expects to extract; an empty array/string lets the
  // stock-content path on the frontend take over.
  function emptyPayloadFor(stage: string): Record<string, unknown> {
    switch (stage) {
      case 'brainstorm':   return { rqs: [] };
      case 'literature':   return { block: null };
      case 'methodology':  return { candidates: [] };
      case 'plan':         return { plan: null };
      case 'artifacts':    return { artifacts: [] };
      case 'personas':     return { personas: [] };
      case 'findings':     return { findings: [] };
      case 'report':       return { titleOptions: [], discussion: '', conclusion: '' };
      case 'review':       return { reviewers: [], meta: null };
      case 'disagreement-audit': return {
        summary: '', realDisagreements: [], falseDisagreements: [],
        strongestReviewer: { reviewer: '', reason: '' },
        acDecision: { recommendation: '', rationale: '', requiredRevisions: [] },
      };
      case 'rq-boolean': return {
        letter: 'X', angle: '—', rq: '', method: '', n: '', rationale: '',
      };
      case 'teaser':       return { svg: null, caption: null };
      default:             return {};
    }
  }

  // Each handler short-circuits to the cached demo slice when a demo
  // is active (see `served` above). Otherwise it calls the live LLM.

  // Apply the rate limiter to every stage endpoint below. ~$0.01/call
  // bottom end → 30/min/IP keeps a single IP under ~$18/hour worst case.
  const stageLimiter = makeStageLimiter(30, 60_000);
  router.use(['/brainstorm', '/literature', '/methodology', '/plan',
              '/artifacts', '/personas', '/findings', '/report',
              '/review', '/disagreement-audit', '/rq-boolean',
              '/teaser'], stageLimiter);

  router.post('/brainstorm', async (req, res) => {
    const { premise } = (req.body ?? {}) as { premise?: string };
    if (!premise || typeof premise !== 'string') {
      res.status(400).json({ error: 'premise (string) required' });
      return;
    }
    await served(res, 'brainstorm', { premise }, async () => {
      const rqs = await brainstorm(premise);
      return { rqs };
    });
  });

  router.post('/literature', async (req, res) => {
    const { rq } = (req.body ?? {}) as { rq?: { letter: string; rq: string; angle: string; method: string; n: string } };
    if (!rq || !rq.rq) {
      res.status(400).json({ error: 'rq (object) required' });
      return;
    }
    await served(res, 'literature', { rq }, async () => {
      const block = await literature({
        letter: rq.letter ?? 'A',
        rq: rq.rq,
        angle: rq.angle ?? 'mechanism',
        method: rq.method ?? '',
        n: rq.n ?? '',
      });
      return { block };
    });
  });

  router.post('/methodology', async (req, res) => {
    const { premise, rqs } = (req.body ?? {}) as { premise?: string; rqs?: Array<{ letter: string; rq: string; angle: string; method: string; n: string }> };
    if (!premise || !Array.isArray(rqs)) {
      res.status(400).json({ error: 'premise (string) and rqs (array) required' });
      return;
    }
    await served(res, 'methodology', { premise, rqs }, async () => {
      const candidates = await methodology(premise, rqs);
      return { candidates };
    });
  });

  router.post('/plan', async (req, res) => {
    const { design, premise } = (req.body ?? {}) as { design?: { id: string; name: string; weeks: number; arc: string; summary: string; coverage: Record<string, 'core' | 'partial' | 'none'>; strengths: string[]; tensions: string[] }; premise?: string };
    if (!design || !premise) {
      res.status(400).json({ error: 'design and premise required' });
      return;
    }
    await served(res, 'plan', { design, premise }, async () => {
      const out = await plan(design, premise);
      return { plan: out };
    });
  });

  router.post('/artifacts', async (req, res) => {
    const { design, plan: studyPlan } = (req.body ?? {}) as {
      design?: { id: string; name: string; weeks: number; arc: string; summary: string; coverage: Record<string, 'core' | 'partial' | 'none'>; strengths: string[]; tensions: string[] };
      plan?: { phases: Array<{ weeks: number; name: string; detail: string }>; deliverables: string[]; recruitment: string; totalWeeks: number; risks: string[] };
    };
    if (!design || !studyPlan) {
      res.status(400).json({ error: 'design and plan required' });
      return;
    }
    await served(res, 'artifacts', { design, plan: studyPlan }, async () => {
      const out = await artifacts(design, studyPlan);
      return { artifacts: out };
    });
  });

  router.post('/personas', async (req, res) => {
    const { n, premise } = (req.body ?? {}) as { n?: number; premise?: string };
    if (!n || !premise) {
      res.status(400).json({ error: 'n (number) and premise (string) required' });
      return;
    }
    await served(res, 'personas', { n, premise }, async () => {
      const out = await personas(Math.min(30, Math.max(6, n)), premise);
      return { personas: out };
    });
  });

  router.post('/findings', async (req, res) => {
    const { plan: studyPlan, premise } = (req.body ?? {}) as {
      plan?: { phases: Array<{ weeks: number; name: string; detail: string }>; deliverables: string[]; recruitment: string; totalWeeks: number; risks: string[] };
      premise?: string;
    };
    if (!studyPlan || !premise) {
      res.status(400).json({ error: 'plan and premise required' });
      return;
    }
    await served(res, 'findings', { plan: studyPlan, premise }, async () => {
      const out = await findings(studyPlan, premise);
      return { findings: out };
    });
  });

  router.post('/report', async (req, res) => {
    const body = (req.body ?? {}) as {
      premise?: string;
      rqs?: Array<{ letter: string; rq: string; angle: string; method: string; n: string }>;
      designName?: string;
      findings?: Array<{ id: string; severity: 'critical' | 'medium' | 'low'; title: string; trigger: string; evidence: string; fix: string }>;
    };
    if (!body.premise || !Array.isArray(body.rqs) || !body.designName || !Array.isArray(body.findings)) {
      res.status(400).json({ error: 'premise, rqs, designName, findings required' });
      return;
    }
    await served(res, 'report', body, async () => {
      return await report({
        premise: body.premise!,
        rqs: body.rqs!,
        designName: body.designName!,
        findings: body.findings!,
      });
    });
  });

  router.post('/review', async (req, res) => {
    const body = (req.body ?? {}) as {
      premise?: string;
      rqs?: Array<{ letter: string; rq: string; angle: string; method: string; n: string }>;
      designName?: string;
      findings?: Array<{ id: string; severity: 'critical' | 'medium' | 'low'; title: string; trigger: string; evidence: string; fix: string }>;
      paperTitle?: string;
      discussion?: string;
    };
    if (!body.premise || !Array.isArray(body.rqs) || !body.designName) {
      res.status(400).json({ error: 'premise, rqs, designName required' });
      return;
    }
    await served(res, 'review', body, async () => {
      return await review({
        premise: body.premise!,
        rqs: body.rqs!,
        designName: body.designName!,
        findings: body.findings ?? [],
        paperTitle: body.paperTitle ?? 'Untitled paper',
        discussion: body.discussion ?? '',
      });
    });
  });

  // RQ boolean composition — adapted from Textoshop's drawing-software-as-
  // text-tool idea (arxiv 2409.17088). Lets a researcher compose two of
  // the three brainstormed sub-RQs with set-style operations:
  //   union     (A ∪ B): hybrid covering both angles
  //   intersect (A ∩ B): the shared assumption
  //   subtract  (A − B): A's framing with B's confound removed
  // Routed to Opus via the 'review' stage path so the long-context
  // synthesis is visibly model-load-bearing in mixed mode.
  router.post('/rq-boolean', async (req, res) => {
    const body = (req.body ?? {}) as {
      premise?: string;
      op?: RqOp;
      a?: { letter: string; rq: string; angle: string; method: string; n: string };
      b?: { letter: string; rq: string; angle: string; method: string; n: string };
    };
    if (!body.premise || !body.op || !body.a || !body.b) {
      res.status(400).json({ error: 'premise, op, a, b required' });
      return;
    }
    if (!['union', 'intersect', 'subtract'].includes(body.op)) {
      res.status(400).json({ error: 'op must be one of union | intersect | subtract' });
      return;
    }
    await served(res, 'rq-boolean', body, async () => {
      return await rqBoolean({
        premise: body.premise!,
        op: body.op as RqOp,
        a: body.a!,
        b: body.b!,
      });
    });
  });

  // Disagreement Auditor — Opus-only meta-meta-review of the panel.
  // Takes the three reviewer blocks plus the AC's meta-review and
  // returns a structured audit highlighting which disagreements the
  // AC must NOT collapse into a bland average. This is the demo's
  // strongest "Opus 4.7 doing something other models would struggle
  // with" anchor — long-context judgment over role-separated outputs
  // with a forced-contrast schema.
  router.post('/disagreement-audit', async (req, res) => {
    const body = (req.body ?? {}) as {
      paperTitle?: string;
      premise?: string;
      reviewers?: Array<{
        id: string; rec: string; field?: string;
        affiliation?: string; topicConfidence?: string;
        oneLine?: string; strengths?: string[]; weaknesses?: string[];
      }>;
      meta?: { ac?: string; verdict?: string; summary?: string; proposed?: string };
      discussion?: string;
    };
    if (!body.paperTitle || !Array.isArray(body.reviewers) || !body.meta) {
      res.status(400).json({ error: 'paperTitle, reviewers, meta required' });
      return;
    }
    await served(res, 'disagreement-audit', body, async () => {
      return await disagreementAudit({
        paperTitle: body.paperTitle!,
        premise: body.premise ?? '',
        reviewers: body.reviewers!,
        meta: body.meta!,
        discussion: body.discussion,
      });
    });
  });

  // Teaser SVG generator — used by the report stage's "project page"
  // export. Asks the LLM to produce a Nerfies-style hero figure.
  // Returns { svg, caption }.
  router.post('/teaser', async (req, res) => {
    const body = (req.body ?? {}) as {
      premise?: string;
      paperTitle?: string;
      designName?: string;
      rqs?: Array<{ letter: string; rq: string; angle: string; method: string; n: string }>;
    };
    if (!body.premise || !body.paperTitle) {
      res.status(400).json({ error: 'premise and paperTitle required' });
      return;
    }
    await served(res, 'teaser', body, async () => {
      return await teaser({
        premise: body.premise!,
        paperTitle: body.paperTitle!,
        designName: body.designName ?? 'integrated study',
        rqs: body.rqs ?? [],
      });
    });
  });

  app.use('/api/probe', router);
}
