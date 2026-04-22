import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import { appendCost } from '../src/orchestrator/run_dir.js';
import { runDir } from '../src/util/paths.js';
import type { CostLog, StageCost } from '../src/orchestrator/types.js';
import path from 'node:path';

/**
 * Regression test for a race condition in appendCost.
 *
 * Stages 3-7 run three branches in parallel via Promise.all, each calling
 * appendCost against the same runs/<id>/cost.json. Before the per-run
 * promise-chain mutex, two concurrent appends could both read the same
 * pre-update file, mutate in-memory, and the slower writer would silently
 * overwrite the faster one — we'd lose cost rows and under-count spend.
 *
 * runDir() resolves against the project root (not cwd), so the test uses a
 * clearly-namespaced run id under runs/ and cleans up afterward. The name is
 * also excluded from run listings by `probe runs` (prefix filter).
 */
describe('appendCost under concurrent writes', () => {
  const runId = '_test_append_cost_race';
  const dir = runDir(runId);

  beforeEach(async () => {
    await fs.mkdir(dir, { recursive: true });
    const initial: CostLog = {
      run_id: runId,
      stages: [],
      totals: { input_tokens: 0, output_tokens: 0, usd: 0 },
    };
    await fs.writeFile(path.join(dir, 'cost.json'), JSON.stringify(initial, null, 2));
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('preserves every entry under Promise.all concurrency', async () => {
    const entries: StageCost[] = Array.from({ length: 30 }, (_, i) => ({
      stage: (i % 2 === 0 ? '3_literature' : '4_prototype') as StageCost['stage'],
      branch_id: ['a', 'b', 'c'][i % 3],
      model: 'test-model',
      input_tokens: 100 + i,
      output_tokens: 10 + i,
      usd: 0.01 * (i + 1),
      duration_ms: 1000 + i,
    }));

    await Promise.all(entries.map((e) => appendCost(runId, e)));

    const raw = await fs.readFile(path.join(dir, 'cost.json'), 'utf8');
    const log = JSON.parse(raw) as CostLog;

    expect(log.stages.length).toBe(entries.length);
    const expectedInput = entries.reduce((s, e) => s + e.input_tokens, 0);
    const expectedOutput = entries.reduce((s, e) => s + e.output_tokens, 0);
    const expectedUsd = entries.reduce((s, e) => s + e.usd, 0);
    expect(log.totals.input_tokens).toBe(expectedInput);
    expect(log.totals.output_tokens).toBe(expectedOutput);
    expect(log.totals.usd).toBeCloseTo(expectedUsd, 6);
  });
});
