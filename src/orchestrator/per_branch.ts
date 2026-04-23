/**
 * Per-branch stage execution helpers. Extracted from pipeline.ts to keep the
 * top-level pipeline readable. Stages 3-7 all follow the pattern:
 *
 *   1. Get list of live (not blocked / not failed) branches
 *   2. Run a per-branch function in parallel via Promise.all
 *   3. Report outcomes with a per-branch colored glyph
 *   4. Optionally: if the outcome is BLOCKED/REJECT, transition the branch
 *      state and emit WORKSHOP_NOT_RECOMMENDED.md
 *
 * This module centralizes that logic so a new stage is ~15 lines of wiring,
 * not ~40.
 */

import chalk from 'chalk';
import type { Ora } from 'ora';
import ora from 'ora';
import { branchGlyph, verdictColor, palette, emojis } from '../ui/theme.js';
import { describe } from '../ui/stage.js';
import type { StageState } from '../ui/pipeline_banner.js';
import { writeWorkshopNotRecommended } from './workshop_not_recommended.js';

export interface BranchState {
  branchId: string;
  /**
   * - `in_progress`: still moving through stages.
   * - `surviving`: reached Stage 8 successfully; this is the branch the
   *   guidebook was assembled for (or one that passed the audit/review gates
   *   but wasn't chosen as the guidebook's subject).
   * - `completed`: reserved for explicit completion with no remaining work;
   *   currently only emitted when guidebook assembly is skipped.
   * - `blocked`: audit or meta-reviewer fired a blocking verdict.
   * - `failed`: infrastructure error (stage threw), not a design failure.
   */
  status: 'in_progress' | 'surviving' | 'completed' | 'blocked' | 'failed';
  stage?: string;
  reason?: string;
  blockingFinding?: string;
}

export type StageStatesMap = Partial<Record<string, StageState>>;

export function stageSpinner(stageId: string): Ora {
  const desc = describe(stageId);
  return ora({
    text: chalk.hex(palette.probe)(`${desc.emoji}  ${desc.verb}…`),
    color: 'cyan',
    spinner: 'dots',
  }).start();
}

export function stageDoneLabel(stageId: string, detail: string): string {
  const desc = describe(stageId);
  return (
    chalk.hex(palette.stage).bold(`${desc.emoji}  stage ${stageId}`) +
    chalk.hex(palette.dim)(' · ') +
    chalk.hex(palette.subtle)(detail)
  );
}

export function liveBranches(states: Map<string, BranchState>): string[] {
  return Array.from(states.values())
    .filter((s) => s.status === 'in_progress')
    .map((s) => s.branchId);
}

export function markStage(states: StageStatesMap, id: string, state: StageState): void {
  states[id] = state;
}

export function markFailed(states: Map<string, BranchState>, id: string, stage: string, e: unknown): void {
  const s = states.get(id);
  if (s) {
    s.status = 'failed';
    s.stage = stage;
    s.reason = String((e as Error).message);
  }
}

export interface PerBranchNoVerdictArgs {
  states: Map<string, BranchState>;
  stageId: string;
  stageStates: StageStatesMap;
  fn: (branchId: string) => Promise<void>;
}

/**
 * Per-branch stage with no verdict (stages 3, 4, 5). Outcome is ok / failed.
 * Prints live per-branch completion lines as promises resolve so the user
 * can see which branches are still running while Promise.all awaits the
 * slowest one — more informative than a single global spinner for these
 * stages, which can take 1-4 minutes per branch in parallel.
 */
export async function perBranchNoVerdict(args: PerBranchNoVerdictArgs): Promise<void> {
  const { states, stageId, stageStates, fn } = args;
  const active = liveBranches(states);
  if (active.length === 0) {
    markStage(stageStates, stageId, 'pending');
    return;
  }
  const spinner = stageSpinner(stageId);
  markStage(stageStates, stageId, 'active');

  // In-flight count ticks down as branches finish. Updates the spinner
  // text so the user sees "2/3 branches done…" while the last one runs.
  let remaining = active.length;
  const startAt = Date.now();
  const outcomes: Array<{ id: string; ok: boolean; err?: string; elapsed: number }> = [];
  await Promise.all(
    active.map(async (id) => {
      const branchStart = Date.now();
      try {
        await fn(id);
        const elapsed = Date.now() - branchStart;
        outcomes.push({ id, ok: true, elapsed });
        remaining--;
        // Pause spinner, print the done line above it, resume.
        const glyph = branchGlyph(id);
        spinner.text = chalk.hex(palette.stage)(`${stageId} · ${active.length - remaining}/${active.length} branches done`);
        console.log(`   ${glyph}  ${chalk.hex(palette.passed)('✓')} ${chalk.hex(palette.dim)(`(${(elapsed / 1000).toFixed(0)}s)`)}`);
      } catch (e) {
        const elapsed = Date.now() - branchStart;
        markFailed(states, id, stageId, e);
        outcomes.push({ id, ok: false, err: String((e as Error).message).slice(0, 120), elapsed });
        remaining--;
        const glyph = branchGlyph(id);
        spinner.text = chalk.hex(palette.stage)(`${stageId} · ${active.length - remaining}/${active.length} branches done (1 failed)`);
        console.log(`   ${glyph}  ${chalk.hex(palette.blocked)('✗')} ${chalk.hex(palette.dim)(`(${(elapsed / 1000).toFixed(0)}s) ${outcomes.at(-1)?.err ?? ''}`)}`);
      }
    }),
  );
  markStage(stageStates, stageId, 'done');
  const totalSec = ((Date.now() - startAt) / 1000).toFixed(0);
  spinner.succeed(stageDoneLabel(stageId, `${active.length} branch${active.length === 1 ? '' : 'es'} · ${totalSec}s wall`));
}

export interface PerBranchWithVerdictArgs {
  runId: string;
  states: Map<string, BranchState>;
  stageId: string;
  stageStates: StageStatesMap;
  /** Run the stage on one branch; return the verdict string. */
  fn: (branchId: string) => Promise<string>;
  /** Verdict values that cause the branch to be marked BLOCKED. */
  blockingVerdicts: string[];
  /** Reason text template for WORKSHOP_NOT_RECOMMENDED when blocked. */
  blockedReason: string;
  /** Blocking finding identifier saved to run_summary. */
  blockingFinding: string;
  /** Label used in the completion line (`{active} branches {label}`). */
  doneLabel: string;
}

/**
 * Per-branch stage with a string verdict (stages 6 and 7). Blocking verdicts
 * transition the branch to blocked status and emit WORKSHOP_NOT_RECOMMENDED.
 * Same live-progress treatment as perBranchNoVerdict — per-branch verdict
 * lines print as they resolve, spinner text updates with the count.
 */
export async function perBranchWithVerdict(args: PerBranchWithVerdictArgs): Promise<void> {
  const { runId, states, stageId, stageStates, fn, blockingVerdicts, blockedReason, blockingFinding, doneLabel } = args;
  const active = liveBranches(states);
  if (active.length === 0) {
    markStage(stageStates, stageId, 'pending');
    return;
  }
  const spinner = stageSpinner(stageId);
  markStage(stageStates, stageId, 'active');

  let remaining = active.length;
  const startAt = Date.now();
  await Promise.all(
    active.map(async (id) => {
      const branchStart = Date.now();
      try {
        const verdict = await fn(id);
        if (blockingVerdicts.includes(verdict)) {
          const state = states.get(id);
          if (state) {
            state.status = 'blocked';
            state.stage = stageId;
            state.reason = blockedReason;
            state.blockingFinding = blockingFinding;
          }
          await writeWorkshopNotRecommended({
            runId,
            branchId: id,
            reason: blockedReason,
            blockingFinding,
          });
        }
        remaining--;
        const elapsed = Date.now() - branchStart;
        const glyph = branchGlyph(id);
        const vcolor = verdictColor(verdict);
        const tag = blockingVerdicts.includes(verdict) ? ` ${emojis.blocked} WORKSHOP_NOT_RECOMMENDED.md` : '';
        spinner.text = chalk.hex(palette.stage)(
          `${stageId} · ${active.length - remaining}/${active.length} branches ${doneLabel}`,
        );
        console.log(
          `   ${glyph}  ${vcolor(verdict)}${chalk.hex(palette.dim)(tag)} ${chalk.hex(palette.dim)(`(${(elapsed / 1000).toFixed(0)}s)`)}`,
        );
      } catch (e) {
        markFailed(states, id, stageId, e);
        remaining--;
        const elapsed = Date.now() - branchStart;
        const glyph = branchGlyph(id);
        spinner.text = chalk.hex(palette.stage)(
          `${stageId} · ${active.length - remaining}/${active.length} branches ${doneLabel} (1 failed)`,
        );
        console.log(
          `   ${glyph}  ${chalk.hex(palette.blocked)('FAILED')} ${chalk.hex(palette.dim)(`(${(elapsed / 1000).toFixed(0)}s) ${String((e as Error).message).slice(0, 100)}`)}`,
        );
      }
    }),
  );
  markStage(stageStates, stageId, 'done');
  const totalSec = ((Date.now() - startAt) / 1000).toFixed(0);
  spinner.succeed(stageDoneLabel(stageId, `${active.length} branches ${doneLabel} · ${totalSec}s wall`));
}

