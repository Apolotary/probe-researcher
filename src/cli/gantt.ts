/**
 * `probe gantt <run_id>` — per-run Gantt-style terminal view.
 *
 * Reads cost.json's per-stage duration data and renders a horizontal
 * timeline showing per-stage, per-branch execution. Useful for seeing
 * where time went, where parallelism was effective, where bottlenecks
 * sat.
 *
 * Draws from Linear's timeline view but compressed to a single terminal.
 * Extends in the v2 roadmap direction (see docs/V2_ROADMAP.md §6).
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import { runDir } from '../util/paths.js';
import { palette, brand, branchColor } from '../ui/theme.js';
import { describe } from '../ui/stage.js';

interface StageEntry {
  stage: string;
  branch_id?: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  usd: number;
  duration_ms: number;
}

interface CostLog {
  run_id: string;
  stages: StageEntry[];
  totals: { input_tokens: number; output_tokens: number; usd: number };
}

export async function ganttCommand(runId: string): Promise<void> {
  const costPath = path.join(runDir(runId), 'cost.json');
  let cost: CostLog;
  try {
    cost = JSON.parse(await fs.readFile(costPath, 'utf8')) as CostLog;
  } catch (e) {
    console.error(chalk.hex(palette.blocked)(`no cost.json for run ${runId} at ${costPath}`));
    console.error(chalk.hex(palette.dim)(String((e as Error).message)));
    process.exitCode = 1;
    return;
  }

  const totalMs = cost.stages.reduce((a, s) => a + s.duration_ms, 0);
  const totalUsd = cost.totals.usd;

  console.log('');
  console.log(brand.header('📊 probe gantt') + chalk.hex(palette.dim)(` · ${runId}`));
  console.log(chalk.hex(palette.dim)(`${cost.stages.length} stage calls  ·  $${totalUsd.toFixed(4)} total  ·  ${formatMs(totalMs)} aggregate wall-clock (sum of per-call durations)`));
  console.log('');

  // Render per-stage bars sorted by stage name
  const termCols = process.stdout.columns ?? 100;
  const labelW = 26;
  const barW = Math.max(20, termCols - labelW - 20);

  const maxDuration = Math.max(...cost.stages.map((s) => s.duration_ms), 1);

  // Aggregate stages by (stage_id, branch_id) — the data model records
  // one entry per Anthropic call, so repeat calls (repair passes) accumulate.
  const grouped = new Map<string, { stage: string; branch_id?: string; count: number; totalMs: number; totalUsd: number; model: string }>();
  for (const s of cost.stages) {
    const key = `${s.stage}::${s.branch_id ?? '-'}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.count++;
      existing.totalMs += s.duration_ms;
      existing.totalUsd += s.usd;
    } else {
      grouped.set(key, {
        stage: s.stage,
        branch_id: s.branch_id,
        count: 1,
        totalMs: s.duration_ms,
        totalUsd: s.usd,
        model: s.model,
      });
    }
  }

  const sortedGroups = Array.from(grouped.values()).sort((a, b) => {
    const stageCompare = a.stage.localeCompare(b.stage);
    if (stageCompare !== 0) return stageCompare;
    return (a.branch_id ?? '').localeCompare(b.branch_id ?? '');
  });

  for (const g of sortedGroups) {
    const desc = describe(g.stage);
    const branch = g.branch_id ? branchColor(g.branch_id)(`│ ${g.branch_id.toUpperCase()} `) : '   ';
    const label = `${branch}${chalk.hex(palette.stage)(desc.emoji + ' ' + g.stage.padEnd(18))}`;
    const barLen = Math.max(1, Math.round((g.totalMs / maxDuration) * barW));
    const bar = chalk.hex(modelColor(g.model))('█'.repeat(barLen));
    const repairIndicator = g.count > 1 ? chalk.hex(palette.revision)(` ↺${g.count}`) : '';
    const meta = chalk.hex(palette.dim)(`  ${formatMs(g.totalMs)}  $${g.totalUsd.toFixed(3)}`);

    console.log(`${label}  ${bar}${repairIndicator}${meta}`);
  }

  console.log('');
  console.log(
    chalk.hex(palette.dim)(`legend: `) +
      chalk.hex(modelColor('claude-opus-4-7'))('█ opus') +
      chalk.hex(palette.dim)('  ') +
      chalk.hex(modelColor('claude-sonnet-4-6'))('█ sonnet') +
      chalk.hex(palette.dim)('   ↺N = N calls at this stage (includes repair passes)'),
  );
  console.log('');
}

function modelColor(model: string): string {
  if (model.includes('opus')) return palette.branchA;
  if (model.includes('sonnet')) return palette.branchB;
  return palette.dim;
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60_000);
  const s = Math.round((ms % 60_000) / 1000);
  return `${m}m${s > 0 ? `${s}s` : ''}`;
}
