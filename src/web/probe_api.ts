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

export function mountProbeApi(app: express.Express): void {
  const router = express.Router();
  router.use(express.json({ limit: '2mb' }));

  // GET /api/probe/status — does the server have a usable API key?
  router.get('/status', (_req, res) => {
    res.json({
      hasApiKey: hasApiKey(),
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
    });
  });

  // Each handler is a thin shim that catches errors and returns 500.
  router.post('/brainstorm', async (req, res) => {
    try {
      const { premise } = (req.body ?? {}) as { premise?: string };
      if (!premise || typeof premise !== 'string') {
        res.status(400).json({ error: 'premise (string) required' });
        return;
      }
      const rqs = await brainstorm(premise);
      res.json({ rqs });
    } catch (e) {
      res.status(500).json({ error: String((e as Error).message) });
    }
  });

  router.post('/literature', async (req, res) => {
    try {
      const { rq } = (req.body ?? {}) as { rq?: { letter: string; rq: string; angle: string; method: string; n: string } };
      if (!rq || !rq.rq) {
        res.status(400).json({ error: 'rq (object) required' });
        return;
      }
      const block = await literature({
        letter: rq.letter ?? 'A',
        rq: rq.rq,
        angle: rq.angle ?? 'mechanism',
        method: rq.method ?? '',
        n: rq.n ?? '',
      });
      res.json({ block });
    } catch (e) {
      res.status(500).json({ error: String((e as Error).message) });
    }
  });

  router.post('/methodology', async (req, res) => {
    try {
      const { premise, rqs } = (req.body ?? {}) as { premise?: string; rqs?: Array<{ letter: string; rq: string; angle: string; method: string; n: string }> };
      if (!premise || !Array.isArray(rqs)) {
        res.status(400).json({ error: 'premise (string) and rqs (array) required' });
        return;
      }
      const candidates = await methodology(premise, rqs);
      res.json({ candidates });
    } catch (e) {
      res.status(500).json({ error: String((e as Error).message) });
    }
  });

  router.post('/plan', async (req, res) => {
    try {
      const { design, premise } = (req.body ?? {}) as { design?: { id: string; name: string; weeks: number; arc: string; summary: string; coverage: Record<string, 'core' | 'partial' | 'none'>; strengths: string[]; tensions: string[] }; premise?: string };
      if (!design || !premise) {
        res.status(400).json({ error: 'design and premise required' });
        return;
      }
      const out = await plan(design, premise);
      res.json({ plan: out });
    } catch (e) {
      res.status(500).json({ error: String((e as Error).message) });
    }
  });

  router.post('/artifacts', async (req, res) => {
    try {
      const { design, plan: studyPlan } = (req.body ?? {}) as {
        design?: { id: string; name: string; weeks: number; arc: string; summary: string; coverage: Record<string, 'core' | 'partial' | 'none'>; strengths: string[]; tensions: string[] };
        plan?: { phases: Array<{ weeks: number; name: string; detail: string }>; deliverables: string[]; recruitment: string; totalWeeks: number; risks: string[] };
      };
      if (!design || !studyPlan) {
        res.status(400).json({ error: 'design and plan required' });
        return;
      }
      const out = await artifacts(design, studyPlan);
      res.json({ artifacts: out });
    } catch (e) {
      res.status(500).json({ error: String((e as Error).message) });
    }
  });

  router.post('/personas', async (req, res) => {
    try {
      const { n, premise } = (req.body ?? {}) as { n?: number; premise?: string };
      if (!n || !premise) {
        res.status(400).json({ error: 'n (number) and premise (string) required' });
        return;
      }
      const out = await personas(Math.min(30, Math.max(6, n)), premise);
      res.json({ personas: out });
    } catch (e) {
      res.status(500).json({ error: String((e as Error).message) });
    }
  });

  router.post('/findings', async (req, res) => {
    try {
      const { plan: studyPlan, premise } = (req.body ?? {}) as {
        plan?: { phases: Array<{ weeks: number; name: string; detail: string }>; deliverables: string[]; recruitment: string; totalWeeks: number; risks: string[] };
        premise?: string;
      };
      if (!studyPlan || !premise) {
        res.status(400).json({ error: 'plan and premise required' });
        return;
      }
      const out = await findings(studyPlan, premise);
      res.json({ findings: out });
    } catch (e) {
      res.status(500).json({ error: String((e as Error).message) });
    }
  });

  router.post('/report', async (req, res) => {
    try {
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
      const out = await report({
        premise: body.premise,
        rqs: body.rqs,
        designName: body.designName,
        findings: body.findings,
      });
      res.json(out);
    } catch (e) {
      res.status(500).json({ error: String((e as Error).message) });
    }
  });

  router.post('/review', async (req, res) => {
    try {
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
      const out = await review({
        premise: body.premise,
        rqs: body.rqs,
        designName: body.designName,
        findings: body.findings ?? [],
        paperTitle: body.paperTitle ?? 'Untitled paper',
        discussion: body.discussion ?? '',
      });
      res.json(out);
    } catch (e) {
      res.status(500).json({ error: String((e as Error).message) });
    }
  });

  app.use('/api/probe', router);
}
