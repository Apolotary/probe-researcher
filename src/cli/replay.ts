import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import { runDir } from '../util/paths.js';

/**
 * Replays a recorded run. No Anthropic calls — reads pre-generated artifacts
 * and re-emits them to stdout with demo-appropriate pacing. Used for the live
 * demo bookends so judges see the pipeline unfold deterministically.
 */
export async function replayCommand(runIdArg: string): Promise<void> {
  const dir = runDir(runIdArg);
  try {
    await fs.access(dir);
  } catch {
    console.error(chalk.red(`no run found at ${dir}`));
    process.exitCode = 1;
    return;
  }

  const premise = await readIfExists(path.join(dir, 'premise.md'));
  if (premise) {
    console.log(chalk.bold('premise:'));
    console.log(premise);
    console.log('');
  }

  // List of artifacts to replay, in pipeline order.
  const artifacts: Array<{ label: string; rel: string }> = [
    { label: 'stage 1 — premise card', rel: 'premise_card.json' },
    { label: 'stage 2 — branch cards', rel: 'branches/*/branch_card.json' },
    { label: 'stage 4 — prototype specs', rel: 'branches/*/prototype_spec.md' },
    { label: 'stage 5 — simulated walkthroughs', rel: 'branches/*/simulated_walkthrough.md' },
    { label: 'stage 6 — capture-risk audits', rel: 'branches/*/audit.json' },
    { label: 'stage 7 — reviewer findings', rel: 'branches/*/reviews/*.json' },
    { label: 'stage 8 — guidebook', rel: 'PROBE_GUIDEBOOK.md' },
  ];

  for (const { label, rel } of artifacts) {
    console.log(chalk.cyan(`\n▸ ${label}`));
    if (rel.includes('*')) {
      console.log(chalk.dim(`  glob: ${rel} (replay glob expansion pending)`));
    } else {
      const p = path.join(dir, rel);
      const exists = await readIfExists(p);
      if (exists) {
        console.log(chalk.dim(`  ${rel}`));
      } else {
        console.log(chalk.dim(`  (not present in this run)`));
      }
    }
  }

  console.log(chalk.green(`\n✓ replay complete — open runs/${runIdArg}/ to browse`));
}

async function readIfExists(p: string): Promise<string | null> {
  try {
    return await fs.readFile(p, 'utf8');
  } catch {
    return null;
  }
}
