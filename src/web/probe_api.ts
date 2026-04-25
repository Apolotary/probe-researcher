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
  hasApiKey,
} from '../llm/probe_calls.js';
import * as demo from './probe_demo.js';

export function mountProbeApi(app: express.Express): void {
  const router = express.Router();
  router.use(express.json({ limit: '2mb' }));

  // GET /api/probe/status — does the server have a usable API key?
  router.get('/status', (_req, res) => {
    res.json({
      hasApiKey: hasApiKey(),
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
      demo: demo.status(),
    });
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

  // ─── Stage helper ───────────────────────────────────────────────
  // If a demo is active, serve the cached slice with a synthetic
  // delay; otherwise fall through to the live LLM call.
  async function served<T>(
    res: express.Response,
    stage: string,
    args: Record<string, unknown>,
    live: () => Promise<T>,
  ): Promise<void> {
    try {
      if (demo.isReplaying()) {
        const cached = demo.slice(stage, args);
        if (cached !== null) {
          await demo.delay();
          res.json(cached);
          return;
        }
        // Demo missing this stage's slice — fall through to live so
        // the user sees real content rather than a hang.
      }
      const out = await live();
      res.json(out);
    } catch (e) {
      res.status(500).json({ error: String((e as Error).message) });
    }
  }

  // Each handler short-circuits to the cached demo slice when a demo
  // is active (see `served` above). Otherwise it calls the live LLM.

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

  app.use('/api/probe', router);
}
