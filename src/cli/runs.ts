/**
 * `probe runs` — Linear-style list view across all completed / in-flight runs.
 *
 * Shows one row per run with: id, status, cost, duration, verdict summary,
 * surviving-branch count. Sorted by start time descending by default.
 * Keyboard-friendly and terminal-rendered; no TUI.
 *
 * This is the first step toward a broader Linear-inspired workflow UI for
 * Probe. Future work (see docs/V2_ROADMAP.md) extends this with per-run
 * Gantt charts, cycle views, and a backlog of premises to triage.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import { projectRoot } from '../util/paths.js';
import { palette, brand, branchColor } from '../ui/theme.js';

interface RunRow {
  runId: string;
  premise: string;
  startedAt: string;
  durationMs: number;
  totalUsd: number;
  stages: number;
  branches: Array<{ branchId: string; status: string }>;
  guidebookExists: boolean;
  survivingCount: number;
  blockedCount: number;
  failedCount: number;
}

export async function runsCommand(): Promise<void> {
  const runsDir = path.join(projectRoot(), 'runs');
  let entries: string[] = [];
  try {
    entries = await fs.readdir(runsDir);
  } catch {
    console.log(chalk.hex(palette.dim)('no runs directory found.'));
    return;
  }

  const rows: RunRow[] = [];
  for (const e of entries) {
    // Skip hidden entries, ablation/hallucination subtrees, and
    // underscore-prefixed scratch directories (test fixtures, tmp runs).
    if (e.startsWith('.') || e.startsWith('_')) continue;
    const runPath = path.join(runsDir, e);
    const stat = await fs.stat(runPath).catch(() => null);
    if (!stat?.isDirectory()) continue;

    const row = await readRunMetadata(runPath, e);
    if (row) rows.push(row);
  }

  // Sort by startedAt descending
  rows.sort((a, b) => (b.startedAt || '').localeCompare(a.startedAt || ''));

  if (rows.length === 0) {
    console.log(chalk.hex(palette.dim)('no runs in runs/ directory.'));
    return;
  }

  // Header
  console.log('');
  console.log(brand.header('🗂  probe runs'));
  console.log(chalk.hex(palette.dim)(`${rows.length} run${rows.length === 1 ? '' : 's'} under runs/`));
  console.log('');

  // Column layout
  const idW = Math.min(Math.max(...rows.map((r) => r.runId.length), 3), 30);
  const premiseW = Math.min(
    Math.max(...rows.map((r) => r.premise.length)),
    50,
  );

  const header =
    chalk.hex(palette.stage)('run id'.padEnd(idW)) +
    '  ' +
    chalk.hex(palette.stage)('status'.padEnd(20)) +
    '  ' +
    chalk.hex(palette.stage)('cost'.padStart(9)) +
    '  ' +
    chalk.hex(palette.stage)('dur'.padStart(6)) +
    '  ' +
    chalk.hex(palette.stage)('premise');
  console.log(header);
  console.log(chalk.hex(palette.dim)('─'.repeat(idW + 20 + 9 + 6 + premiseW + 10)));

  for (const row of rows) {
    const id = row.runId.length > idW ? row.runId.slice(0, idW - 1) + '…' : row.runId.padEnd(idW);
    const statusBadge = renderStatus(row);
    const cost = `$${row.totalUsd.toFixed(2)}`.padStart(9);
    const dur = formatDuration(row.durationMs).padStart(6);
    const premise =
      row.premise.length > premiseW
        ? row.premise.slice(0, premiseW - 1) + '…'
        : row.premise;

    console.log(
      chalk.hex(palette.stage)(id) +
        '  ' +
        statusBadge.padEnd(30) +
        '  ' +
        chalk.hex(palette.dim)(cost) +
        '  ' +
        chalk.hex(palette.dim)(dur) +
        '  ' +
        chalk.hex(palette.subtle).italic(premise),
    );
  }
  console.log('');

  // Footer aggregate
  const totalUsd = rows.reduce((a, r) => a + r.totalUsd, 0);
  const totalStages = rows.reduce((a, r) => a + r.stages, 0);
  const withGuidebook = rows.filter((r) => r.guidebookExists).length;

  console.log(
    chalk.hex(palette.dim)(
      `${rows.length} runs  ·  $${totalUsd.toFixed(2)} total  ·  ${totalStages} stage calls  ·  ${withGuidebook} guidebook${withGuidebook === 1 ? '' : 's'}`,
    ),
  );
  console.log('');
}

function renderStatus(row: RunRow): string {
  if (row.survivingCount > 0 && row.guidebookExists) {
    const parts = [chalk.hex(palette.passed)(`✓ ${row.survivingCount} surviving`)];
    if (row.blockedCount > 0) parts.push(chalk.hex(palette.blocked)(`${row.blockedCount} blocked`));
    return parts.join(chalk.hex(palette.dim)(' · '));
  }
  if (row.blockedCount > 0 && row.survivingCount === 0) {
    return chalk.hex(palette.revision)(`⊘ all ${row.blockedCount} blocked`);
  }
  if (row.failedCount > 0 && row.survivingCount === 0 && row.blockedCount === 0) {
    return chalk.hex(palette.blocked)(`✗ ${row.failedCount} failed (infra)`);
  }
  if (row.branches.length > 0) {
    const surviving = branchesInProgress(row);
    if (surviving.length > 0) return chalk.hex(palette.stage)(`◐ in flight (${surviving.join('/')})`);
  }
  return chalk.hex(palette.dim)('— no artifacts');
}

function branchesInProgress(row: RunRow): string[] {
  return row.branches.filter((b) => b.status === 'in_progress').map((b) => branchColor(b.branchId)(b.branchId.toUpperCase()));
}

async function readRunMetadata(runPath: string, runId: string): Promise<RunRow | null> {
  const premisePath = path.join(runPath, 'premise.md');
  let premise = '';
  try {
    const raw = await fs.readFile(premisePath, 'utf8');
    premise = raw.replace(/^#\s+Research premise\s*\n\n?/i, '').trim();
  } catch {
    /* no premise */
  }

  const costPath = path.join(runPath, 'cost.json');
  let totalUsd = 0;
  let stages = 0;
  let durationMs = 0;
  let startedAt = '';
  try {
    const raw = await fs.readFile(costPath, 'utf8');
    const cost = JSON.parse(raw) as {
      totals: { usd: number; input_tokens: number; output_tokens: number };
      stages: Array<{ duration_ms?: number; timestamp?: string }>;
    };
    totalUsd = cost.totals.usd;
    stages = cost.stages.length;
    durationMs = cost.stages.reduce((a, s) => a + (s.duration_ms ?? 0), 0);
    // Use file modification time as a proxy for start time
    const stat = await fs.stat(costPath);
    startedAt = stat.mtime.toISOString();
  } catch {
    /* no cost data */
  }

  const summaryPath = path.join(runPath, 'run_summary.json');
  const branches: RunRow['branches'] = [];
  try {
    const raw = await fs.readFile(summaryPath, 'utf8');
    const summary = JSON.parse(raw) as { branches: Array<{ branchId: string; status: string }> };
    branches.push(...summary.branches);
  } catch {
    /* no summary */
  }

  const guidebookExists = await pathExists(path.join(runPath, 'PROBE_GUIDEBOOK.md'));

  const survivingCount = branches.filter(
    (b) => b.status === 'surviving' || b.status === 'completed' || b.status === 'in_progress',
  ).length;
  const blockedCount = branches.filter((b) => b.status === 'blocked').length;
  const failedCount = branches.filter((b) => b.status === 'failed').length;

  return {
    runId,
    premise: premise || '(no premise recorded)',
    startedAt,
    durationMs,
    totalUsd,
    stages,
    branches,
    guidebookExists,
    survivingCount,
    blockedCount,
    failedCount,
  };
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return '0s';
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes - hours * 60;
  return `${hours}h${rem > 0 ? `${rem}m` : ''}`;
}
