import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import { runDir } from '../util/paths.js';
import { ensureRunDir, writePremiseInput } from './run_dir.js';
import { runStagePremise } from './stages/stage1_premise.js';
import { runStageIdeator } from './stages/stage2_ideator.js';
import type { PipelineResult, RunOptions } from './types.js';

/**
 * Main pipeline driver. Sequential stages; branch-scoped stages run in
 * parallel via Promise.all. Each stage is skippable via --skip N.
 *
 * Current implementation covers stages 1 and 2 end-to-end. Stages 3-8 are
 * stubs to be filled on Day 1-4; each throws NotImplementedError until ready.
 */
export async function runPipeline(options: RunOptions): Promise<PipelineResult> {
  const { runId, premise, skipStages } = options;
  const dir = runDir(runId);
  await ensureRunDir(runId);
  await writePremiseInput(runId, premise);

  const skip = new Set(skipStages);

  // Stage 1
  if (!skip.has('1')) {
    console.log(chalk.cyan('stage 1 — premise interrogation'));
    await runStagePremise({ runId, premise });
    console.log(chalk.green(`  ✓ runs/${runId}/premise_card.json`));
  }

  // Stage 2
  if (!skip.has('2')) {
    console.log(chalk.cyan('stage 2 — solution ideation'));
    const branches = await runStageIdeator({ runId });
    console.log(chalk.green(`  ✓ ${branches.length} branches spawned`));
    for (const b of branches) {
      console.log(chalk.dim(`    branches/${b}/branch_card.json`));
    }
  }

  // Placeholder for stages 3-8; each should run per-branch in parallel, with
  // failure isolation (a failed branch writes FAILED.marker, orchestrator
  // continues with survivors).

  console.log(chalk.yellow('  ⚠ stages 3-8 not yet implemented — Day 2-4 work'));

  return {
    runId,
    status: 'completed',
    survivingBranches: await listBranches(dir),
    blockedBranches: [],
  };
}

async function listBranches(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(path.join(dir, 'branches'));
    return entries.filter((e) => /^[a-z]$/.test(e));
  } catch {
    return [];
  }
}
