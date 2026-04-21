import fs from 'node:fs/promises';
import path from 'node:path';
import { runDir } from '../util/paths.js';
import type { CostLog } from './types.js';

export async function ensureRunDir(runId: string): Promise<void> {
  const dir = runDir(runId);
  await fs.mkdir(path.join(dir, 'branches'), { recursive: true });
  const costPath = path.join(dir, 'cost.json');
  try {
    await fs.access(costPath);
  } catch {
    const initial: CostLog = {
      run_id: runId,
      stages: [],
      totals: { input_tokens: 0, output_tokens: 0, usd: 0 },
    };
    await fs.writeFile(costPath, JSON.stringify(initial, null, 2));
  }
}

export async function writePremiseInput(runId: string, premise: string): Promise<void> {
  const p = path.join(runDir(runId), 'premise.md');
  const body = `# Research premise\n\n${premise}\n`;
  await fs.writeFile(p, body);
}

export async function appendCost(
  runId: string,
  entry: CostLog['stages'][number],
): Promise<void> {
  const p = path.join(runDir(runId), 'cost.json');
  const raw = await fs.readFile(p, 'utf8');
  const log = JSON.parse(raw) as CostLog;
  log.stages.push(entry);
  log.totals.input_tokens += entry.input_tokens;
  log.totals.output_tokens += entry.output_tokens;
  log.totals.usd += entry.usd;
  await fs.writeFile(p, JSON.stringify(log, null, 2));
}
