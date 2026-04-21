import chalk from 'chalk';
import { runPipeline } from '../orchestrator/pipeline.js';
import type { RunOptions } from '../orchestrator/types.js';

interface RunCommandOptions {
  runId?: string;
  skip?: string;
  branches?: string;
  /**
   * commander.js convention: declaring `.option('--no-novelty', ...)` produces
   * `novelty: false` in the parsed options (not `noNovelty: true`). Default is
   * `undefined` (meaning the flag was not passed), which we treat as true.
   */
  novelty?: boolean;
}

export async function runCommand(
  premise: string,
  opts: RunCommandOptions,
): Promise<void> {
  const runId = opts.runId ?? generateRunId(premise);
  const skip = (opts.skip ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const branches = Number.parseInt(opts.branches ?? '3', 10);

  const options: RunOptions = {
    runId,
    premise,
    skipStages: skip,
    branchCount: branches,
    // opts.novelty === false only when --no-novelty was passed.
    includeNovelty: opts.novelty !== false,
  };

  console.log(chalk.bold(`probe run ${runId}`));
  console.log(chalk.dim(`  premise: ${premise}`));
  console.log(chalk.dim(`  branches: ${branches}`));
  if (skip.length > 0) console.log(chalk.dim(`  skipping stages: ${skip.join(', ')}`));
  console.log('');

  const result = await runPipeline(options);

  const guidebookSkipped = skip.includes('8');
  if (result.status === 'completed') {
    if (guidebookSkipped) {
      console.log(chalk.green(`\n✓ pipeline complete (stage 8 skipped) — runs/${runId}/`));
    } else {
      console.log(chalk.green(`\n✓ pipeline complete — runs/${runId}/PROBE_GUIDEBOOK.md`));
    }
  } else if (result.status === 'all_branches_blocked') {
    console.log(
      chalk.yellow(
        `\n⚠ all branches blocked — see runs/${runId}/branches/*/WORKSHOP_NOT_RECOMMENDED.md`,
      ),
    );
  } else {
    console.log(chalk.red(`\n✗ pipeline failed at stage ${result.failedStage ?? 'unknown'}`));
    process.exitCode = 2;
  }
}

function generateRunId(premise: string): string {
  const slug = premise
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `${stamp}_${slug}`;
}
