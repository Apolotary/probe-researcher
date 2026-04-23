/**
 * Between-stage pause for `probe run --step`.
 *
 * After each stage completes and its preview has printed, call
 * pauseBetweenStages() to hand control back to the user. They get:
 *
 *   [c] continue          — run the next stage
 *   [e] edit <artifact>   — open the artifact in $EDITOR; the next stage
 *                           reads the edited file as if the agent had
 *                           produced it. User can reshape the premise
 *                           card before stage 2 runs, tweak branch
 *                           cards before stage 3, etc.
 *   [s] skip to stage N   — jump past one or more stages (useful after
 *                           editing a later artifact)
 *   [q] quit              — stop the pipeline cleanly. All artifacts
 *                           produced so far are preserved.
 *
 * Returns a StepChoice the caller consumes. This is the keystone of the
 * "work together with the agents instead of having them do the work for
 * me" design: every stage is a checkpoint the user can shape.
 */

import path from 'node:path';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import chalk from 'chalk';
import { runDir, branchDir } from '../util/paths.js';
import { palette } from '../ui/theme.js';

export type StepChoice =
  | { kind: 'continue' }
  | { kind: 'quit' }
  | { kind: 'skip-to'; stageNumber: number };

export interface PauseArgs {
  runId: string;
  /** The stage that just completed, e.g. '1_premise', '4_prototype'. */
  stageId: string;
  /** Branch ids active at this point, for per-branch artifact selection. */
  branchIds?: string[];
}

export async function pauseBetweenStages(args: PauseArgs): Promise<StepChoice> {
  const readline = await import('node:readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const question = (q: string): Promise<string> =>
    new Promise((resolve) => rl.question(q, (a) => resolve(a)));

  try {
    while (true) {
      console.log('');
      console.log(
        chalk.hex(palette.stage)(`╭── stage ${args.stageId} complete · you have the wheel ──`),
      );
      const artifacts = await enumerateArtifacts(args);
      for (let i = 0; i < artifacts.length; i++) {
        console.log(
          `│ ${chalk.hex(palette.probe)(`[${i + 1}]`)} edit ${chalk.hex(palette.dim)(artifacts[i].rel)}`,
        );
      }
      console.log(`│ ${chalk.hex(palette.passed)('[c]')} continue to next stage`);
      console.log(`│ ${chalk.hex(palette.revision)('[s]')} skip to stage N  (e.g. "s 6")`);
      console.log(`│ ${chalk.hex(palette.blocked)('[q]')} quit (keep all artifacts produced so far)`);
      console.log(chalk.hex(palette.stage)(`╰──`));

      const answer = (await question(chalk.hex(palette.stage)('▸ '))).trim().toLowerCase();

      if (answer === '' || answer === 'c') {
        rl.close();
        return { kind: 'continue' };
      }
      if (answer === 'q') {
        rl.close();
        return { kind: 'quit' };
      }
      const skipMatch = answer.match(/^s\s*(\d+)$/);
      if (skipMatch) {
        const n = parseInt(skipMatch[1], 10);
        if (n >= 1 && n <= 8) {
          rl.close();
          return { kind: 'skip-to', stageNumber: n };
        }
        console.log(chalk.hex(palette.blocked)(`  stage number must be 1-8, got "${n}"`));
        continue;
      }
      const editMatch = answer.match(/^(\d+)$/);
      if (editMatch) {
        const idx = parseInt(editMatch[1], 10) - 1;
        if (idx < 0 || idx >= artifacts.length) {
          console.log(chalk.hex(palette.blocked)(`  no artifact [${idx + 1}]; pick 1-${artifacts.length}`));
          continue;
        }
        // Spawn $EDITOR on the chosen artifact. readline is paused while
        // the editor owns the terminal; control returns here when the
        // editor exits. The subsequent stage reads the edited file.
        rl.pause();
        console.log(chalk.hex(palette.dim)(`  opening ${artifacts[idx].abs} …`));
        await spawnEditor(artifacts[idx].abs);
        rl.resume();
        console.log(chalk.hex(palette.passed)(`  ✓ saved. Returning to step menu…`));
        continue; // redraw the prompt
      }
      console.log(
        chalk.hex(palette.blocked)(
          `  unrecognized: "${answer}". Press Enter to continue, or type a number to edit, or q to quit.`,
        ),
      );
    }
  } finally {
    try {
      rl.close();
    } catch {
      /* already closed */
    }
  }
}

interface Artifact {
  abs: string;
  rel: string;
}

/**
 * Which artifacts are editable at this pause-point? Depends on the stage
 * that just finished — after Stage 1 the user can edit premise_card.json,
 * after Stage 2 they can edit each branch_card, etc. We include the
 * freshly-written artifact only, not all historical ones, to keep the
 * menu tight.
 */
async function enumerateArtifacts(args: PauseArgs): Promise<Artifact[]> {
  const out: Artifact[] = [];
  const rd = runDir(args.runId);
  const stageNum = parseInt(args.stageId.match(/^(\d+)/)?.[1] ?? '0', 10);

  const addIfExists = async (abs: string, rel: string): Promise<void> => {
    try {
      await fs.access(abs);
      out.push({ abs, rel });
    } catch {
      /* skip missing */
    }
  };

  if (stageNum === 1) {
    await addIfExists(path.join(rd, 'premise_card.json'), 'premise_card.json');
  } else if (stageNum === 2) {
    for (const b of args.branchIds ?? []) {
      await addIfExists(path.join(branchDir(args.runId, b), 'branch_card.json'), `branches/${b}/branch_card.json`);
    }
  } else if (stageNum === 3) {
    // Stage 3 enriches branch_card with `grounding` — same file.
    for (const b of args.branchIds ?? []) {
      await addIfExists(path.join(branchDir(args.runId, b), 'branch_card.json'), `branches/${b}/branch_card.json`);
    }
  } else if (stageNum === 4) {
    for (const b of args.branchIds ?? []) {
      await addIfExists(path.join(branchDir(args.runId, b), 'prototype_spec.json'), `branches/${b}/prototype_spec.json`);
      await addIfExists(path.join(branchDir(args.runId, b), 'prototype_spec.md'), `branches/${b}/prototype_spec.md`);
    }
  } else if (stageNum === 5) {
    for (const b of args.branchIds ?? []) {
      await addIfExists(path.join(branchDir(args.runId, b), 'simulated_walkthrough.md'), `branches/${b}/simulated_walkthrough.md`);
    }
  } else if (stageNum === 6) {
    for (const b of args.branchIds ?? []) {
      await addIfExists(path.join(branchDir(args.runId, b), 'audit.json'), `branches/${b}/audit.json`);
      await addIfExists(path.join(branchDir(args.runId, b), 'audit.md'), `branches/${b}/audit.md`);
    }
  } else if (stageNum === 7) {
    for (const b of args.branchIds ?? []) {
      await addIfExists(path.join(branchDir(args.runId, b), 'meta_review.json'), `branches/${b}/meta_review.json`);
    }
  } else if (stageNum === 8) {
    await addIfExists(path.join(rd, 'PROBE_GUIDEBOOK.md'), 'PROBE_GUIDEBOOK.md');
  }
  return out;
}

function spawnEditor(filePath: string): Promise<void> {
  const editor = process.env.VISUAL ?? process.env.EDITOR ?? 'vi';
  return new Promise((resolve, reject) => {
    const child = spawn(editor, [filePath], { stdio: 'inherit' });
    child.on('exit', () => resolve());
    child.on('error', (err) => reject(err));
  });
}
