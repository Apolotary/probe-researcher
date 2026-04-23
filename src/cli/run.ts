import chalk from 'chalk';
import { runPipeline } from '../orchestrator/pipeline.js';
import type { RunOptions } from '../orchestrator/types.js';
import { banner, tagline, strapline } from '../ui/logo.js';
import { palette, emojis } from '../ui/theme.js';

interface RunCommandOptions {
  runId?: string;
  skip?: string;
  /**
   * commander.js convention: declaring `.option('--no-novelty', ...)` produces
   * `novelty: false` in the parsed options (not `noNovelty: true`). Default is
   * `undefined` (meaning the flag was not passed), which we treat as true.
   */
  novelty?: boolean;
  /** `--step` mode: pause after each stage for user approval/edit. */
  step?: boolean;
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

  const options: RunOptions = {
    runId,
    premise,
    skipStages: skip,
    branchCount: 3, // schema enforces a/b/c enum; not configurable for now
    // opts.novelty === false only when --no-novelty was passed.
    includeNovelty: opts.novelty !== false,
    stepMode: opts.step === true,
  };

  // Logo banner — suppress on narrow terminals.
  if ((process.stdout.columns ?? 80) >= 52 && !process.env.PROBE_NO_BANNER) {
    console.log(banner());
    console.log(tagline());
    console.log('');
  }
  console.log(strapline(runId, premise));
  if (skip.length > 0) {
    console.log(chalk.hex(palette.dim)(`  skipping stages: ${skip.join(', ')}`));
  }
  console.log('');

  const result = await runPipeline(options);

  const guidebookSkipped = skip.includes('8');
  if (result.status === 'completed') {
    if (guidebookSkipped) {
      console.log(
        '\n' + chalk.hex(palette.passed)(`${emojis.passed}  pipeline complete (stage 8 skipped) — runs/${runId}/`),
      );
    } else {
      console.log(
        '\n' +
          chalk.hex(palette.passed)(
            `${emojis.passed}  pipeline complete — runs/${runId}/PROBE_GUIDEBOOK.md`,
          ),
      );
    }
  } else if (result.status === 'all_branches_blocked') {
    console.log(
      '\n' +
        chalk.hex(palette.revision)(
          `${emojis.blocked}  all branches blocked — see runs/${runId}/branches/*/WORKSHOP_NOT_RECOMMENDED.md`,
        ),
    );
  } else {
    console.log(
      '\n' + chalk.hex(palette.blocked)(`✗ pipeline failed at stage ${result.failedStage ?? 'unknown'}`),
    );
    process.exitCode = 2;
  }
}

export function generateRunId(premise: string): string {
  const slug = premise
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40);
  // Build a timestamp that satisfies the run_id schema (^[a-z0-9_-]{3,64}$).
  // ISO-8601's uppercase 'T' separator and trailing 'Z' both violate the
  // lowercase-only rule, so format the parts explicitly.
  const d = new Date();
  const pad = (n: number): string => n.toString().padStart(2, '0');
  const stamp =
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` +
    `_${pad(d.getUTCHours())}-${pad(d.getUTCMinutes())}-${pad(d.getUTCSeconds())}`;
  const id = slug ? `${stamp}_${slug}` : stamp;
  return id.slice(0, 64);
}
