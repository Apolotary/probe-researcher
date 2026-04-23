import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import { runDir } from '../util/paths.js';
import { ensureRunDir, writePremiseInput } from './run_dir.js';
import { runStagePremise } from './stages/stage1_premise.js';
import { runStageIdeator } from './stages/stage2_ideator.js';
import { runStageLiterature } from './stages/stage3_literature.js';
import { runStagePrototype } from './stages/stage4_prototype.js';
import { runStageSimulator } from './stages/stage5_simulator.js';
import { runStageAudit } from './stages/stage6_audit.js';
import { runStageReviewers } from './stages/stage7_reviewers.js';
import { runStageGuidebook } from './stages/stage8_guidebook.js';
import { branchColor, palette, emojis } from '../ui/theme.js';
import { renderBanner, type StageState } from '../ui/pipeline_banner.js';
import * as stageSummary from '../ui/stage_summary.js';
import { pauseBetweenStages, type StepChoice } from './step_pause.js';
import {
  type BranchState,
  type StageStatesMap,
  liveBranches,
  markStage,
  perBranchNoVerdict,
  perBranchWithVerdict,
  stageDoneLabel,
  stageSpinner,
} from './per_branch.js';
import type { PipelineResult, RunOptions, StageId } from './types.js';

/**
 * Main pipeline driver.
 *
 * Shape:
 *   stage 1 (once) → stage 2 (once, produces 3 branches) → stages 3-7
 *   (per-branch parallel via Promise.all) → stage 8 (once, synthesizes
 *   from surviving branch). Blocked branches get WORKSHOP_NOT_RECOMMENDED.
 *
 * File-based state: each stage reads from disk and writes to disk. The
 * orchestrator holds branch-status-only state in memory.
 *
 * Failure isolation: a failed branch sets its status to `failed` and all
 * subsequent stages skip it. The pipeline continues with surviving branches.
 */
export async function runPipeline(options: RunOptions): Promise<PipelineResult> {
  const { runId, premise, skipStages } = options;
  await ensureRunDir(runId);
  await writePremiseInput(runId, premise);

  const skip = new Set(skipStages);
  const stageStates: StageStatesMap = {};

  showBanner(stageStates);

  const stepMode = options.stepMode === true;
  let branchIdsForPause: string[] = [];
  // Per-branch state map — survives stages 3-7. Declared up here (not
  // after Stage 2) so the step() helper's userQuit path always has a
  // value to pass to finishRun, even if the user quits before Stage 2.
  let states = new Map<string, BranchState>();

  /**
   * Called after each stage's preview + footer. In step mode, asks the
   * user what to do next. Returns true if the pipeline should continue,
   * false if the user chose to quit. May also mutate skip to jump past
   * intermediate stages.
   */
  const step = async (stageId: string): Promise<boolean> => {
    if (!stepMode) return true;
    const choice: StepChoice = await pauseBetweenStages({
      runId,
      stageId,
      branchIds: branchIdsForPause,
    });
    if (choice.kind === 'quit') return false;
    if (choice.kind === 'skip-to') {
      const currentNum = parseInt(stageId.match(/^(\d+)/)?.[1] ?? '0', 10);
      for (let s = currentNum + 1; s < choice.stageNumber; s++) {
        skip.add(String(s));
      }
    }
    return true;
  };

  // Stage 1 — single call, not per-branch.
  if (!skip.has('1')) {
    await runSingleStage({
      stageId: '1_premise',
      stageStates,
      detail: () => `runs/${runId}/premise_card.json`,
      fn: () => runStagePremise({ runId, premise }),
      onSuccess: async () => {
        await stageSummary.previewPremise(runId);
        await stageSummary.stageFooter(runId, '1_');
        await stageSummary.runningTotals(runId);
      },
    });
    if (!(await step('1_premise'))) return userQuit(runId, states, stageStates);
  }

  // Stage 2 — single call, but spawns N branches.
  let branchIds: string[] = [];
  if (!skip.has('2')) {
    await runSingleStage({
      stageId: '2_ideator',
      stageStates,
      detail: (result: string[]) => `${result.length} divergent branches spawned`,
      fn: async () => {
        branchIds = await runStageIdeator({ runId });
        return branchIds;
      },
      onSuccess: async () => {
        for (const b of branchIds) {
          console.log(`   ${branchGlyphInline(b)}  ${chalk.hex(palette.dim)(`runs/${runId}/branches/${b}/branch_card.json`)}`);
        }
        await stageSummary.previewIdeator(runId, branchIds);
        await stageSummary.stageFooter(runId, '2_');
        await stageSummary.runningTotals(runId);
      },
    });
    branchIdsForPause = branchIds;
    if (!(await step('2_ideator'))) return userQuit(runId, states, stageStates);
  } else {
    branchIds = await listBranches(runDir(runId));
    branchIdsForPause = branchIds;
  }

  // Populate the per-branch state map now that branchIds are known.
  states = new Map<string, BranchState>(
    branchIds.map((id) => [id, { branchId: id, status: 'in_progress' }]),
  );

  // Stages 3-5 — per-branch, no verdict (outcome is ok / failed).
  if (!skip.has('3')) {
    await perBranchNoVerdict({ states: states, stageId: '3_literature', stageStates, fn: (id) => runStageLiterature({ runId, branchId: id }) });
    await stageSummary.previewLiterature(runId, branchIds);
    await stageSummary.stageFooter(runId, '3_');
    await stageSummary.runningTotals(runId);
    if (!(await step('3_literature'))) return userQuit(runId, states, stageStates);
  }
  if (!skip.has('4')) {
    await perBranchNoVerdict({ states: states, stageId: '4_prototype', stageStates, fn: (id) => runStagePrototype({ runId, branchId: id }) });
    await stageSummary.previewPrototype(runId, branchIds);
    await stageSummary.stageFooter(runId, '4_');
    await stageSummary.runningTotals(runId);
    if (!(await step('4_prototype'))) return userQuit(runId, states, stageStates);
  }
  if (!skip.has('5')) {
    await perBranchNoVerdict({ states: states, stageId: '5_simulator', stageStates, fn: (id) => runStageSimulator({ runId, branchId: id }) });
    await stageSummary.previewSimulator(runId, branchIds);
    await stageSummary.stageFooter(runId, '5_');
    await stageSummary.runningTotals(runId);
    if (!(await step('5_simulator'))) return userQuit(runId, states, stageStates);
  }

  // Stage 6 — per-branch with verdict. -2 finding → BLOCKED → WORKSHOP_NOT_RECOMMENDED.
  if (!skip.has('6')) {
    await perBranchWithVerdict({
      runId,
      states: states,
      stageId: '6_audit',
      stageStates,
      fn: (id) => runStageAudit({ runId, branchId: id }),
      blockingVerdicts: ['BLOCKED'],
      blockedReason: 'Capture-risk audit fired a -2 finding.',
      blockingFinding: 'audit:capture_risk:-2',
      doneLabel: 'audited',
    });
    await stageSummary.previewAudit(runId, branchIds);
    await stageSummary.stageFooter(runId, '6_');
    await stageSummary.runningTotals(runId);
    if (!(await step('6_audit'))) return userQuit(runId, states, stageStates);
  }

  // Stage 7 — per-branch with verdict. meta-reviewer reject → BLOCKED.
  if (!skip.has('7')) {
    await perBranchWithVerdict({
      runId,
      states: states,
      stageId: '7d_meta',
      stageStates,
      fn: (id) => runStageReviewers({ runId, branchId: id, includeNovelty: options.includeNovelty ?? true }),
      blockingVerdicts: ['reject'],
      blockedReason: 'Meta-reviewer rejected after reading the reviewer panel.',
      blockingFinding: 'meta_review:reject',
      doneLabel: 'reviewed',
    });
    await stageSummary.previewReviewers(runId, branchIds);
    await stageSummary.stageFooter(runId, '7');
    await stageSummary.runningTotals(runId);
    if (!(await step('7d_meta'))) return userQuit(runId, states, stageStates);
  }

  // Stage 8 — guidebook assembly runs on the first surviving branch.
  const survivors = liveBranches(states);
  const blocked = Array.from(states.values()).filter((s) => s.status === 'blocked');
  const failed = Array.from(states.values()).filter((s) => s.status === 'failed');

  if (survivors.length === 0) {
    return finishRun({ runId, states, stageStates, survivors: [], blocked, failed });
  }

  if (!skip.has('8')) {
    const chosen = survivors[0];
    const spinner = stageSpinner('8_guidebook');
    markStage(stageStates, '8_guidebook', 'active');
    try {
      await runStageGuidebook({
        runId,
        survivingBranchId: chosen,
        blockedBranches: blocked.map((s) => ({
          branch_id: s.branchId,
          reason: s.reason ?? 'unspecified',
          blocking_finding: s.blockingFinding ?? 'unknown',
        })),
      });
      // Transition any branch that reached Stage 8 from in_progress to
      // 'surviving' so run_summary.json accurately reflects which branches
      // passed all gates. Previously these stayed 'in_progress', which was
      // both type-inaccurate and misleading to downstream consumers.
      for (const id of survivors) {
        const s = states.get(id);
        if (s && s.status === 'in_progress') {
          s.status = 'surviving';
          s.stage = '8_guidebook';
        }
      }
      markStage(stageStates, '8_guidebook', 'done');
      spinner.succeed(
        stageDoneLabel(
          '8_guidebook',
          `${emojis.survived} branch ${branchColor(chosen)(chosen)} survived → runs/${runId}/PROBE_GUIDEBOOK.md`,
        ),
      );
      await stageSummary.previewGuidebook(runId);
      await stageSummary.stageFooter(runId, '8_');
      await stageSummary.runningTotals(runId);
    } catch (e) {
      markStage(stageStates, '8_guidebook', 'failed');
      spinner.fail(chalk.hex(palette.blocked)(`guidebook assembly failed: ${String((e as Error).message).slice(0, 200)}`));
      await writeRunSummary(runId, states);
      showSummary(stageStates);
      return {
        runId,
        status: 'failed',
        failedStage: '8_guidebook',
        survivingBranches: survivors,
        blockedBranches: blocked.map((s) => s.branchId),
      };
    }
  }

  return finishRun({ runId, states, stageStates, survivors, blocked, failed });
}

async function runSingleStage<T>(args: {
  stageId: string;
  stageStates: StageStatesMap;
  detail: (result: T) => string;
  fn: () => Promise<T>;
  onSuccess?: (result: T) => void;
}): Promise<T> {
  const spinner = stageSpinner(args.stageId);
  markStage(args.stageStates, args.stageId, 'active');
  try {
    const result = await args.fn();
    markStage(args.stageStates, args.stageId, 'done');
    spinner.succeed(stageDoneLabel(args.stageId, args.detail(result)));
    args.onSuccess?.(result);
    return result;
  } catch (e) {
    markStage(args.stageStates, args.stageId, 'failed');
    spinner.fail(chalk.hex(palette.blocked)(`${args.stageId} failed: ${String((e as Error).message).slice(0, 200)}`));
    throw e;
  }
}

async function finishRun(args: {
  runId: string;
  states: Map<string, BranchState>;
  stageStates: StageStatesMap;
  survivors: string[];
  blocked: BranchState[];
  failed: BranchState[];
}): Promise<PipelineResult> {
  const { runId, states, stageStates, survivors, blocked, failed } = args;
  await writeRunSummary(runId, states);
  showSummary(stageStates);

  if (survivors.length === 0) {
    if (blocked.length > 0) {
      console.log(
        '\n' +
          chalk.hex(palette.revision)(
            `${emojis.blocked} all branches blocked — no guidebook assembled (${blocked.map((s) => s.branchId).join(', ')})`,
          ),
      );
      return {
        runId,
        status: 'all_branches_blocked',
        survivingBranches: [],
        blockedBranches: blocked.map((s) => s.branchId),
      };
    }
    console.log(
      '\n' +
        chalk.hex(palette.blocked)(
          `all branches failed — not blocked, infrastructure error. See run_summary.json.`,
        ),
    );
    return {
      runId,
      status: 'failed',
      failedStage: failed[0]?.stage as StageId | undefined,
      survivingBranches: [],
      blockedBranches: [],
    };
  }

  return {
    runId,
    status: 'completed',
    survivingBranches: survivors,
    blockedBranches: blocked.map((s) => s.branchId),
  };
}

/**
 * Called when the user chose 'q' at a step-mode pause. Writes the run
 * summary with whatever state has been built so far, shows the banner
 * with the partial completion, and returns a 'failed' PipelineResult
 * so the CLI's caller knows the run didn't complete normally. All
 * artifacts produced before the quit are preserved.
 */
async function userQuit(
  runId: string,
  states: Map<string, BranchState>,
  stageStates: StageStatesMap,
): Promise<PipelineResult> {
  console.log('');
  console.log(chalk.hex(palette.revision)(`▸ user requested quit — saving partial state`));
  await writeRunSummary(runId, states);
  showSummary(stageStates);
  console.log('');
  console.log(chalk.hex(palette.dim)(`  artifacts preserved under runs/${runId}/`));
  return {
    runId,
    status: 'failed',
    survivingBranches: Array.from(states.values())
      .filter((s) => s.status === 'in_progress' || s.status === 'surviving')
      .map((s) => s.branchId),
    blockedBranches: Array.from(states.values())
      .filter((s) => s.status === 'blocked')
      .map((s) => s.branchId),
  };
}

// ─── small helpers ──────────────────────────────────────────────────────────

function branchGlyphInline(id: string): string {
  const uid = id.toUpperCase() as 'A' | 'B' | 'C';
  const glyph = uid === 'A' ? '│ A' : uid === 'B' ? '│ B' : uid === 'C' ? '│ C' : `│ ${id}`;
  return branchColor(id)(glyph);
}

function showBanner(states: StageStatesMap): void {
  console.log('');
  console.log('  ' + renderBanner(states));
  console.log('');
}

function showSummary(states: StageStatesMap): void {
  console.log('');
  console.log('  ' + renderBanner(states));
}

async function writeRunSummary(runId: string, states: Map<string, BranchState>): Promise<void> {
  const out = {
    run_id: runId,
    branches: Array.from(states.values()),
  };
  await fs.writeFile(path.join(runDir(runId), 'run_summary.json'), JSON.stringify(out, null, 2));
}

async function listBranches(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(path.join(dir, 'branches'));
    return entries.filter((e) => /^[a-z]$/.test(e));
  } catch {
    return [];
  }
}

// Re-export for external callers that used to import from here
export type { StageState };
