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
  status: 'in_progress' | 'completed' | 'blocked' | 'failed';
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
  const outcomes: Array<{ id: string; ok: boolean; err?: string }> = [];
  await Promise.all(
    active.map(async (id) => {
      try {
        await fn(id);
        outcomes.push({ id, ok: true });
      } catch (e) {
        markFailed(states, id, stageId, e);
        outcomes.push({ id, ok: false, err: String((e as Error).message).slice(0, 120) });
      }
    }),
  );
  markStage(stageStates, stageId, 'done');
  spinner.succeed(stageDoneLabel(stageId, `${active.length} branch${active.length === 1 ? '' : 'es'}`));
  for (const out of outcomes.sort((a, b) => a.id.localeCompare(b.id))) {
    const glyph = branchGlyph(out.id);
    if (out.ok) {
      console.log(`   ${glyph}  ${chalk.hex(palette.passed)('ok')}`);
    } else {
      console.log(`   ${glyph}  ${chalk.hex(palette.blocked)('failed')}  ${chalk.hex(palette.dim)(out.err ?? '')}`);
    }
  }
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
  const outcomes: Array<{ id: string; verdict: string }> = [];
  await Promise.all(
    active.map(async (id) => {
      try {
        const verdict = await fn(id);
        outcomes.push({ id, verdict });
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
      } catch (e) {
        markFailed(states, id, stageId, e);
        outcomes.push({ id, verdict: 'FAILED' });
      }
    }),
  );
  markStage(stageStates, stageId, 'done');
  spinner.succeed(stageDoneLabel(stageId, `${active.length} branches ${doneLabel}`));
  for (const out of outcomes.sort((a, b) => a.id.localeCompare(b.id))) {
    const glyph = branchGlyph(out.id);
    const vcolor = verdictColor(out.verdict);
    const tag = blockingVerdicts.includes(out.verdict) ? ` ${emojis.blocked} WORKSHOP_NOT_RECOMMENDED.md` : '';
    console.log(`   ${glyph}  ${vcolor(out.verdict)}${chalk.hex(palette.dim)(tag)}`);
  }
}

