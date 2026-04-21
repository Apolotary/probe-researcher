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
import { writeWorkshopNotRecommended } from './workshop_not_recommended.js';
import type { PipelineResult, RunOptions } from './types.js';

interface BranchState {
  branchId: string;
  status: 'in_progress' | 'completed' | 'blocked' | 'failed';
  stage?: string;
  reason?: string;
  blockingFinding?: string;
}

export async function runPipeline(options: RunOptions): Promise<PipelineResult> {
  const { runId, premise, skipStages } = options;
  await ensureRunDir(runId);
  await writePremiseInput(runId, premise);

  const skip = new Set(skipStages);

  if (!skip.has('1')) {
    console.log(chalk.cyan('stage 1 — premise interrogation'));
    await runStagePremise({ runId, premise });
    console.log(chalk.green(`  ✓ runs/${runId}/premise_card.json`));
  }

  let branchIds: string[] = [];
  if (!skip.has('2')) {
    console.log(chalk.cyan('stage 2 — solution ideation'));
    branchIds = await runStageIdeator({ runId });
    console.log(chalk.green(`  ✓ ${branchIds.length} divergent branches spawned`));
    for (const b of branchIds) console.log(chalk.dim(`    branches/${b}/branch_card.json`));
  } else {
    branchIds = await listBranches(runDir(runId));
  }

  const states = new Map<string, BranchState>(
    branchIds.map((id) => [id, { branchId: id, status: 'in_progress' }]),
  );

  await perBranchStage(states, '3', skip, 'stage 3 — literature grounding', async (id) =>
    runStageLiterature({ runId, branchId: id }),
  );
  await perBranchStage(states, '4', skip, 'stage 4 — prototype specification', async (id) =>
    runStagePrototype({ runId, branchId: id }),
  );
  await perBranchStage(states, '5', skip, 'stage 5 — simulated walkthrough', async (id) =>
    runStageSimulator({ runId, branchId: id }),
  );

  if (!skip.has('6')) {
    console.log(chalk.cyan('stage 6 — capture-risk audit'));
    const active = liveBranches(states);
    await Promise.all(
      active.map(async (id) => {
        try {
          const verdict = await runStageAudit({ runId, branchId: id });
          console.log(chalk.dim(`    branch ${id}: ${verdict}`));
          if (verdict === 'BLOCKED') {
            const state = states.get(id);
            if (state) {
              state.status = 'blocked';
              state.stage = '6_audit';
              state.reason = 'Capture-risk audit blocked this branch on a -2 finding.';
              state.blockingFinding = 'audit:capture_risk:-2';
            }
            await writeWorkshopNotRecommended({
              runId,
              branchId: id,
              reason: 'Capture-risk audit fired a -2 finding.',
              blockingFinding: 'audit:-2',
            });
            console.log(chalk.yellow(`      → WORKSHOP_NOT_RECOMMENDED.md`));
          }
        } catch (e) {
          markFailed(states, id, '6_audit', e);
          console.log(chalk.red(`    branch ${id}: failed — ${String((e as Error).message).slice(0, 120)}`));
        }
      }),
    );
  }

  if (!skip.has('7')) {
    console.log(chalk.cyan('stage 7 — adversarial review'));
    const active = liveBranches(states);
    await Promise.all(
      active.map(async (id) => {
        try {
          const verdict = await runStageReviewers({ runId, branchId: id, includeNovelty: options.includeNovelty ?? true });
          console.log(chalk.dim(`    branch ${id}: meta-verdict ${verdict}`));
          if (verdict === 'reject') {
            const state = states.get(id);
            if (state) {
              state.status = 'blocked';
              state.stage = '7d_meta';
              state.reason = 'Meta-reviewer rejected after reading the reviewer panel.';
              state.blockingFinding = 'meta_review:reject';
            }
            await writeWorkshopNotRecommended({
              runId,
              branchId: id,
              reason: 'Meta-reviewer rejected after reading the reviewer panel.',
              blockingFinding: 'meta_review:reject',
            });
            console.log(chalk.yellow(`      → WORKSHOP_NOT_RECOMMENDED.md`));
          }
        } catch (e) {
          markFailed(states, id, '7_review', e);
          console.log(chalk.red(`    branch ${id}: failed — ${String((e as Error).message).slice(0, 120)}`));
        }
      }),
    );
  }

  // Pick the surviving branch for guidebook assembly.
  const survivors = liveBranches(states);
  const blocked = Array.from(states.values()).filter((s) => s.status === 'blocked');
  const failed = Array.from(states.values()).filter((s) => s.status === 'failed');

  if (survivors.length === 0) {
    if (blocked.length > 0) {
      console.log(
        chalk.yellow(
          `all branches blocked — no guidebook assembled (${blocked.map((s) => s.branchId).join(', ')})`,
        ),
      );
      await writeRunSummary(runId, states);
      return {
        runId,
        status: 'all_branches_blocked',
        survivingBranches: [],
        blockedBranches: blocked.map((s) => s.branchId),
      };
    } else {
      console.log(
        chalk.red(
          `all branches failed — not blocked, infrastructure error. See run_summary.json for details.`,
        ),
      );
      await writeRunSummary(runId, states);
      return {
        runId,
        status: 'failed',
        failedStage: (failed[0]?.stage as never) ?? undefined,
        survivingBranches: [],
        blockedBranches: [],
      };
    }
  }

  if (!skip.has('8')) {
    console.log(chalk.cyan('stage 8 — guidebook assembly'));
    const chosen = survivors[0];
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
      console.log(chalk.green(`  ✓ runs/${runId}/PROBE_GUIDEBOOK.md (branch ${chosen})`));
    } catch (e) {
      console.log(chalk.red(`  ✗ guidebook assembly failed: ${String((e as Error).message).slice(0, 200)}`));
      await writeRunSummary(runId, states);
      return {
        runId,
        status: 'failed',
        failedStage: '8_guidebook',
        survivingBranches: survivors,
        blockedBranches: blocked.map((s) => s.branchId),
      };
    }
  }

  await writeRunSummary(runId, states);
  return {
    runId,
    status: 'completed',
    survivingBranches: survivors,
    blockedBranches: blocked.map((s) => s.branchId),
  };
}

async function perBranchStage(
  states: Map<string, BranchState>,
  stageNum: string,
  skip: Set<string>,
  label: string,
  fn: (branchId: string) => Promise<void>,
): Promise<void> {
  if (skip.has(stageNum)) return;
  console.log(chalk.cyan(label));
  const active = liveBranches(states);
  await Promise.all(
    active.map(async (id) => {
      try {
        await fn(id);
        console.log(chalk.dim(`    branch ${id}: ok`));
      } catch (e) {
        markFailed(states, id, `${stageNum}_stage`, e);
        console.log(chalk.red(`    branch ${id}: failed — ${String((e as Error).message).slice(0, 120)}`));
      }
    }),
  );
}

function liveBranches(states: Map<string, BranchState>): string[] {
  return Array.from(states.values())
    .filter((s) => s.status === 'in_progress')
    .map((s) => s.branchId);
}

function markFailed(states: Map<string, BranchState>, id: string, stage: string, e: unknown): void {
  const s = states.get(id);
  if (s) {
    s.status = 'failed';
    s.stage = stage;
    s.reason = String((e as Error).message);
  }
  // Also drop a FAILED.marker in the branch directory for the replay tool.
  fs.writeFile(
    path.join('runs', s ? id : 'unknown', 'FAILED.marker'),
    `${stage}\n${String((e as Error).message)}\n`,
  ).catch(() => {});
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
