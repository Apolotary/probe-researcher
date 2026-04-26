#!/usr/bin/env tsx
/**
 * Regenerate the bundled focus-rituals demo with v2 payloads.
 *
 * Adds three things the original cache (saved before v2) doesn't have:
 *   - disagreementAudit:  Opus-only forced-contrast meta-review of the panel
 *   - rqBoolean:          Opus-only composition of RQ A ∪ B (one example)
 *   - modelMode:          'mixed' annotation so judges can see the cache
 *                          was generated with Opus on orchestration stages
 *
 * Run with:
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/regen_demo_v2.ts
 *
 * Cost: ~$0.10 — two Opus calls (review-stage routing).
 */

import fs from 'node:fs';
import path from 'node:path';
import { disagreementAudit, rqBoolean } from '../src/llm/probe_calls.js';
import { projectRoot } from '../src/util/paths.js';

async function main() {
  const demoPath = path.join(projectRoot(), 'assets', 'demos', 'focus-rituals.json');
  const raw = fs.readFileSync(demoPath, 'utf8');
  const demo = JSON.parse(raw);
  const s = demo.state;

  console.log('Loaded:', demoPath);
  console.log('  premise:', s.premise);
  console.log('  reviewers:', s.reviewSession?.reviewers?.map((r: { id: string; rec: string }) => `${r.id}:${r.rec}`).join(' | '));
  console.log('  AC verdict:', s.reviewSession?.meta?.verdict);

  // ─── Disagreement Auditor ───
  console.log('\nRunning disagreement audit (Opus 4.7)…');
  const audit = await disagreementAudit({
    paperTitle: s.paperTitle ?? 'Untitled',
    premise: s.premise ?? '',
    reviewers: (s.reviewSession?.reviewers ?? []) as Array<{
      id: string; rec: string; field?: string;
      affiliation?: string; topicConfidence?: string;
      oneLine?: string; strengths?: string[]; weaknesses?: string[];
    }>,
    meta: s.reviewSession?.meta ?? {},
    discussion: s.discussion,
  });
  console.log('  realDisagreements:', audit.realDisagreements.length);
  console.log('  falseDisagreements:', audit.falseDisagreements.length);
  console.log('  AC recommendation:', audit.acDecision.recommendation);

  // ─── Boolean RQ composition (A ∪ B) ───
  console.log('\nRunning rqBoolean union A∪B (Opus 4.7)…');
  const rqs = (s.rqs ?? []) as Array<{ letter: string; rq: string; angle: string; method: string; n: string }>;
  const a = rqs.find((r) => r.letter === 'A');
  const b = rqs.find((r) => r.letter === 'B');
  if (!a || !b) {
    console.error('Cannot find RQ A or B in demo. Aborting boolean op.');
    process.exit(1);
  }
  const composedAB = await rqBoolean({
    premise: s.premise ?? '',
    op: 'union',
    a, b,
  });
  console.log('  composed RQ:', composedAB.rq.slice(0, 80) + '…');
  console.log('  rationale:', composedAB.rationale.slice(0, 80) + '…');

  // ─── Bake into the demo state ───
  s.disagreementAudit = audit;
  s.rqBoolean = {
    'A+B-union': composedAB,
  };
  demo.modelMode = 'mixed';
  demo.regeneratedAt = new Date().toISOString();
  demo.state = s;

  // Pretty-write
  fs.writeFileSync(demoPath, JSON.stringify(demo, null, 2));
  console.log('\n✓ Wrote enriched demo to', demoPath);
  console.log('  size:', (fs.statSync(demoPath).size / 1024).toFixed(1), 'KB');
}

main().catch((e) => {
  console.error('FAILED:', e);
  process.exit(1);
});
