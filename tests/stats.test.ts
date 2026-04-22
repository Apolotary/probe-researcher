import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { computeRunStats } from '../src/cli/stats.js';
import { runDir } from '../src/util/paths.js';

/**
 * Integration-style tests for `probe stats`. The tests build a tiny fake run
 * directory under runs/_test_stats_* (underscore prefix so it does not show
 * up in `probe runs` or `probe stats --all`), exercise computeRunStats, and
 * check the structured summary. Cleans up after itself.
 */
describe('computeRunStats', () => {
  const runId = '_test_stats_fixture';
  const dir = runDir(runId);
  const branches = ['a', 'b', 'c'] as const;

  beforeAll(async () => {
    await fs.mkdir(path.join(dir, 'branches'), { recursive: true });
    for (const b of branches) {
      await fs.mkdir(path.join(dir, 'branches', b), { recursive: true });
    }

    // premise
    await fs.writeFile(path.join(dir, 'premise.md'), '# Research premise\n\nA small fake premise for testing probe stats.\n');

    // cost — including a duplicate (stage, branch) to exercise repair-pass detection
    const stages = [
      { stage: '1_premise', model: 'claude-opus-4-7', input_tokens: 1000, output_tokens: 1000, usd: 0.03, duration_ms: 10000 },
      { stage: '2_ideator', model: 'claude-opus-4-7', input_tokens: 2000, output_tokens: 1000, usd: 0.04, duration_ms: 20000 },
      // Two entries for 4_prototype branch a → one repair pass
      { stage: '4_prototype', branch_id: 'a', model: 'claude-sonnet-4-6', input_tokens: 5000, output_tokens: 1000, usd: 0.03, duration_ms: 30000 },
      { stage: '4_prototype', branch_id: 'a', model: 'claude-sonnet-4-6', input_tokens: 5000, output_tokens: 1000, usd: 0.03, duration_ms: 30000 },
      { stage: '4_prototype', branch_id: 'b', model: 'claude-sonnet-4-6', input_tokens: 5000, output_tokens: 1000, usd: 0.03, duration_ms: 30000 },
      { stage: '4_prototype', branch_id: 'c', model: 'claude-sonnet-4-6', input_tokens: 5000, output_tokens: 1000, usd: 0.03, duration_ms: 30000 },
    ];
    await fs.writeFile(
      path.join(dir, 'cost.json'),
      JSON.stringify(
        {
          run_id: runId,
          stages,
          totals: {
            input_tokens: stages.reduce((a, s) => a + s.input_tokens, 0),
            output_tokens: stages.reduce((a, s) => a + s.output_tokens, 0),
            usd: stages.reduce((a, s) => a + s.usd, 0),
          },
        },
        null,
        2,
      ),
    );

    // run_summary — a: blocked, b: surviving, c: failed
    await fs.writeFile(
      path.join(dir, 'run_summary.json'),
      JSON.stringify(
        {
          run_id: runId,
          branches: [
            { branchId: 'a', status: 'blocked', stage: '6_audit', reason: 'fake', blockingFinding: 'audit:legibility.no_failure_signal:-2' },
            { branchId: 'b', status: 'surviving', stage: '8_guidebook', reason: 'passed all gates', blockingFinding: null },
            { branchId: 'c', status: 'failed', stage: '4_prototype', reason: 'schema validation failed twice', blockingFinding: null },
          ],
        },
        null,
        2,
      ),
    );

    // audit.json per branch
    await fs.writeFile(
      path.join(dir, 'branches', 'a', 'audit.json'),
      JSON.stringify({
        stage: '6_audit',
        verdict: 'BLOCKED',
        findings: [
          { pattern_id: 'legibility.no_failure_signal', axis: 'legibility', fired: true, score: -2, evidence_span: { source: 'x', quote: 'y' }, rationale: 'z' },
          { pattern_id: 'agency.weak_override', axis: 'agency', fired: true, score: -1, evidence_span: { source: 'x', quote: 'y' }, rationale: 'z' },
          { pattern_id: 'capacity.substitutes_for_practice', axis: 'capacity', fired: false, score: 0, evidence_span: { source: 'x', quote: 'y' }, rationale: 'z' },
        ],
      }),
    );
    await fs.writeFile(
      path.join(dir, 'branches', 'b', 'audit.json'),
      JSON.stringify({
        stage: '6_audit',
        verdict: 'REVISION_REQUIRED',
        findings: [
          { pattern_id: 'agency.weak_override', axis: 'agency', fired: true, score: -1, evidence_span: { source: 'x', quote: 'y' }, rationale: 'z' },
        ],
      }),
    );

    // meta_review.json for surviving branch b
    await fs.writeFile(
      path.join(dir, 'branches', 'b', 'meta_review.json'),
      JSON.stringify({
        stage: '7d_meta',
        verdict: 'human_judgment_required',
        disagreement_classification: 'legitimate_methodological_split',
        disagreement_matrix: [],
      }),
    );

    // prototype_spec.json required for anomaly detection on each branch
    for (const b of branches) {
      await fs.writeFile(path.join(dir, 'branches', b, 'branch_card.json'), '{}');
      await fs.writeFile(path.join(dir, 'branches', b, 'prototype_spec.json'), '{}');
      await fs.writeFile(path.join(dir, 'branches', b, 'simulated_walkthrough.md'), '# stub');
    }
  });

  afterAll(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('summarizes branch verdicts correctly', async () => {
    const s = await computeRunStats(runId);
    const a = s.branches.find((b) => b.branchId === 'a');
    const b = s.branches.find((b) => b.branchId === 'b');
    const c = s.branches.find((b) => b.branchId === 'c');
    expect(a?.verdictLabel).toBe('BLOCKED:legibility.no_failure_signal');
    expect(b?.verdictLabel).toContain('SURVIVED');
    expect(b?.verdictLabel).toContain('human_judgment_required');
    expect(c?.verdictLabel).toBe('FAILED:4_prototype');
  });

  it('counts fired patterns per axis', async () => {
    const s = await computeRunStats(runId);
    const a = s.branches.find((b) => b.branchId === 'a');
    expect(a?.firedCounts.legibility).toBe(1);
    expect(a?.firedCounts.agency).toBe(1);
    expect(a?.firedCounts.capacity).toBe(0);
    expect(a?.firedCounts.exit).toBe(0);
  });

  it('surfaces meta-reviewer disagreement classification', async () => {
    const s = await computeRunStats(runId);
    const b = s.branches.find((b) => b.branchId === 'b');
    expect(b?.disagreementClass).toBe('legitimate_methodological_split');
  });

  it('detects repair passes via duplicate (stage, branch) entries', async () => {
    const s = await computeRunStats(runId);
    // We planted exactly one repair pass: 4_prototype on branch a, 2 entries.
    const rp = s.repairPasses.find((r) => r.stage === '4_prototype' && r.branchId === 'a');
    expect(rp).toBeDefined();
    expect(rp?.count).toBe(2);
  });

  it('reports total cost and duration from cost.json', async () => {
    const s = await computeRunStats(runId);
    // Sum of the fixture: 0.03 + 0.04 + 0.03*4 = 0.19
    expect(s.totalUsd).toBeCloseTo(0.19, 6);
    // Total duration: 10000 + 20000 + 30000*4 = 150000ms
    expect(s.durationMs).toBe(150000);
  });

  it('flags missing-artifact anomalies when surviving branch lacks meta_review', async () => {
    // Temporarily delete b's meta_review — should appear as anomaly (already present in fixture, so
    // instead delete prototype_spec.json on branch a which is required for any non-failed branch).
    const protoPath = path.join(dir, 'branches', 'a', 'prototype_spec.json');
    await fs.rm(protoPath);
    try {
      const s = await computeRunStats(runId);
      expect(s.anomalies.some((a) => a.includes('prototype_spec.json') && a.includes('branch a'))).toBe(true);
    } finally {
      await fs.writeFile(protoPath, '{}');
    }
  });
});
