import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import ora, { type Ora } from 'ora';
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
import { branchColor, branchGlyph, verdictColor, brand, palette, emojis } from '../ui/theme.js';
import { describe } from '../ui/stage.js';
import { renderBanner, type StageState } from '../ui/pipeline_banner.js';
import type { PipelineResult, RunOptions } from './types.js';

interface BranchState {
  branchId: string;
  status: 'in_progress' | 'completed' | 'blocked' | 'failed';
  stage?: string;
  reason?: string;
  blockingFinding?: string;
}

type StageStatesMap = Partial<Record<string, StageState>>;

export async function runPipeline(options: RunOptions): Promise<PipelineResult> {
  const { runId, premise, skipStages } = options;
  await ensureRunDir(runId);
  await writePremiseInput(runId, premise);

  const skip = new Set(skipStages);
  const stageStates: StageStatesMap = {};

  showBanner(stageStates);

  if (!skip.has('1')) {
    const s = stageSpinner('1_premise');
    try {
      markStage(stageStates, '1_premise', 'active');
      await runStagePremise({ runId, premise });
      markStage(stageStates, '1_premise', 'done');
      s.succeed(stageDone('1_premise', `runs/${runId}/premise_card.json`));
    } catch (e) {
      markStage(stageStates, '1_premise', 'failed');
      s.fail(chalk.hex(palette.blocked)(`stage 1 failed: ${String((e as Error).message).slice(0, 200)}`));
      throw e;
    }
  }

  let branchIds: string[] = [];
  if (!skip.has('2')) {
    const s = stageSpinner('2_ideator');
    try {
      markStage(stageStates, '2_ideator', 'active');
      branchIds = await runStageIdeator({ runId });
      markStage(stageStates, '2_ideator', 'done');
      s.succeed(stageDone('2_ideator', `${branchIds.length} divergent branches spawned`));
      for (const b of branchIds) {
        console.log(`   ${branchGlyph(b)}  ${chalk.hex(palette.dim)(`runs/${runId}/branches/${b}/branch_card.json`)}`);
      }
    } catch (e) {
      markStage(stageStates, '2_ideator', 'failed');
      s.fail(chalk.hex(palette.blocked)(`stage 2 failed: ${String((e as Error).message).slice(0, 200)}`));
      throw e;
    }
  } else {
    branchIds = await listBranches(runDir(runId));
  }

  const states = new Map<string, BranchState>(
    branchIds.map((id) => [id, { branchId: id, status: 'in_progress' }]),
  );

  await perBranchStage(states, '3', skip, '3_literature', stageStates, async (id) =>
    runStageLiterature({ runId, branchId: id }),
  );
  await perBranchStage(states, '4', skip, '4_prototype', stageStates, async (id) =>
    runStagePrototype({ runId, branchId: id }),
  );
  await perBranchStage(states, '5', skip, '5_simulator', stageStates, async (id) =>
    runStageSimulator({ runId, branchId: id }),
  );

  if (!skip.has('6')) {
    const s = stageSpinner('6_audit');
    markStage(stageStates, '6_audit', 'active');
    const active = liveBranches(states);
    const branchVerdicts: Array<{ id: string; verdict: string }> = [];
    await Promise.all(
      active.map(async (id) => {
        try {
          const verdict = await runStageAudit({ runId, branchId: id });
          branchVerdicts.push({ id, verdict });
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
          }
        } catch (e) {
          markFailed(states, id, '6_audit', e);
          branchVerdicts.push({ id, verdict: 'FAILED' });
        }
      }),
    );
    markStage(stageStates, '6_audit', 'done');
    s.succeed(stageDone('6_audit', `${active.length} branches audited`));
    for (const { id, verdict } of branchVerdicts.sort((a, b) => a.id.localeCompare(b.id))) {
      const glyph = branchGlyph(id);
      const vcolor = verdictColor(verdict);
      const tag = verdict === 'BLOCKED' ? ` ${emojis.blocked} WORKSHOP_NOT_RECOMMENDED.md` : '';
      console.log(`   ${glyph}  ${vcolor(verdict)}${chalk.hex(palette.dim)(tag)}`);
    }
  }

  if (!skip.has('7')) {
    const s = stageSpinner('7d_meta');
    markStage(stageStates, '7d_meta', 'active');
    const active = liveBranches(states);
    const branchVerdicts: Array<{ id: string; verdict: string }> = [];
    await Promise.all(
      active.map(async (id) => {
        try {
          const verdict = await runStageReviewers({ runId, branchId: id, includeNovelty: options.includeNovelty ?? true });
          branchVerdicts.push({ id, verdict });
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
          }
        } catch (e) {
          markFailed(states, id, '7_review', e);
          branchVerdicts.push({ id, verdict: 'FAILED' });
        }
      }),
    );
    markStage(stageStates, '7d_meta', 'done');
    s.succeed(stageDone('7_review', `${active.length} branches reviewed`));
    for (const { id, verdict } of branchVerdicts.sort((a, b) => a.id.localeCompare(b.id))) {
      const glyph = branchGlyph(id);
      const vcolor = verdictColor(verdict);
      const tag = verdict === 'reject' ? ` ${emojis.blocked} WORKSHOP_NOT_RECOMMENDED.md` : '';
      console.log(`   ${glyph}  meta-verdict ${vcolor(verdict)}${chalk.hex(palette.dim)(tag)}`);
    }
  }

  const survivors = liveBranches(states);
  const blocked = Array.from(states.values()).filter((s) => s.status === 'blocked');
  const failed = Array.from(states.values()).filter((s) => s.status === 'failed');

  if (survivors.length === 0) {
    if (blocked.length > 0) {
      console.log(
        '\n' +
          chalk.hex(palette.revision)(
            `${emojis.blocked} all branches blocked — no guidebook assembled (${blocked.map((s) => s.branchId).join(', ')})`,
          ),
      );
      await writeRunSummary(runId, states);
      showSummary(stageStates);
      return {
        runId,
        status: 'all_branches_blocked',
        survivingBranches: [],
        blockedBranches: blocked.map((s) => s.branchId),
      };
    } else {
      console.log(
        '\n' +
          chalk.hex(palette.blocked)(
            `all branches failed — not blocked, infrastructure error. See run_summary.json for details.`,
          ),
      );
      await writeRunSummary(runId, states);
      showSummary(stageStates);
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
    const s = stageSpinner('8_guidebook');
    markStage(stageStates, '8_guidebook', 'active');
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
      markStage(stageStates, '8_guidebook', 'done');
      s.succeed(
        stageDone(
          '8_guidebook',
          `${emojis.survived} branch ${branchColor(chosen)(chosen)} survived → runs/${runId}/PROBE_GUIDEBOOK.md`,
        ),
      );
    } catch (e) {
      markStage(stageStates, '8_guidebook', 'failed');
      s.fail(
        chalk.hex(palette.blocked)(
          `guidebook assembly failed: ${String((e as Error).message).slice(0, 200)}`,
        ),
      );
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

  await writeRunSummary(runId, states);
  showSummary(stageStates);
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
  stageId: string,
  stageStates: StageStatesMap,
  fn: (branchId: string) => Promise<void>,
): Promise<void> {
  if (skip.has(stageNum)) return;
  const s = stageSpinner(stageId);
  markStage(stageStates, stageId, 'active');
  const active = liveBranches(states);
  const outcomes: Array<{ id: string; ok: boolean; err?: string }> = [];
  await Promise.all(
    active.map(async (id) => {
      try {
        await fn(id);
        outcomes.push({ id, ok: true });
      } catch (e) {
        markFailed(states, id, `${stageNum}_stage`, e);
        outcomes.push({ id, ok: false, err: String((e as Error).message).slice(0, 120) });
      }
    }),
  );
  markStage(stageStates, stageId, 'done');
  s.succeed(stageDone(stageId, `${active.length} branch${active.length === 1 ? '' : 'es'}`));
  for (const out of outcomes.sort((a, b) => a.id.localeCompare(b.id))) {
    const glyph = branchGlyph(out.id);
    if (out.ok) {
      console.log(`   ${glyph}  ${chalk.hex(palette.passed)('ok')}`);
    } else {
      console.log(`   ${glyph}  ${chalk.hex(palette.blocked)('failed')}  ${chalk.hex(palette.dim)(out.err ?? '')}`);
    }
  }
}

function stageSpinner(stageId: string): Ora {
  const desc = describe(stageId);
  return ora({
    text: chalk.hex(palette.probe)(`${desc.emoji}  ${desc.verb}…`),
    color: 'cyan',
    spinner: 'dots',
  }).start();
}

function stageDone(stageId: string, detail: string): string {
  const desc = describe(stageId);
  return (
    brand.stage(`${desc.emoji}  stage ${stageId}`) +
    chalk.hex(palette.dim)(' · ') +
    chalk.hex(palette.subtle)(detail)
  );
}

function markStage(states: StageStatesMap, id: string, state: StageState): void {
  states[id] = state;
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
