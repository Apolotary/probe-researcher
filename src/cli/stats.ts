/**
 * `probe stats <run_id>` — per-run triage summary for quick morning review.
 * `probe stats --all` — one-row-per-run table across runs/, plus RUNS_SUMMARY.md.
 *
 * Built for the overnight workflow where the user wakes up to ~15 runs and
 * needs to see at a glance: which branches survived, which pattern caught the
 * ones that blocked, how much it cost, and whether anything anomalous
 * happened during the pipeline (repair passes, failed branches, missing
 * artifacts). The table is stdout; the same content writes to stats.json
 * under each run directory so later tooling can parse it without re-walking
 * the artifacts.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import { projectRoot, runDir, branchDir } from '../util/paths.js';
import { palette, verdictColor, branchColor } from '../ui/theme.js';
import { checkProvenance } from '../lint/provenance.js';
import { checkForbiddenPhrases } from '../lint/forbidden.js';
import { loadKnownSourceCardIds } from '../lint/source_cards.js';

const AXES = ['capacity', 'agency', 'exit', 'legibility'] as const;
type Axis = (typeof AXES)[number];

interface BranchSummary {
  branchId: string;
  status: string; // surviving | blocked | failed | completed | in_progress
  stage?: string;
  reason?: string;
  blockingFinding?: string | null;
  /** Parsed audit verdict (BLOCKED / REVISION_REQUIRED / PASSED) if audit.json exists. */
  auditVerdict?: string;
  /** Pattern ids that fired, grouped by axis. */
  firedPatterns: Record<Axis, string[]>;
  /** Count of fired patterns per axis. */
  firedCounts: Record<Axis, number>;
  /** Meta-review verdict + disagreement classification if available. */
  metaReviewVerdict?: string;
  disagreementClass?: string;
  /** Human-readable one-liner: SURVIVED | BLOCKED:<pattern> | etc. */
  verdictLabel: string;
}

interface RunStats {
  runId: string;
  premise: string;
  premiseTruncated: string;
  branches: BranchSummary[];
  totalUsd: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  durationMs: number;
  costEntryCount: number;
  /** Stages where more than one cost entry exists for the same (stage, branch) — i.e. a repair pass fired. */
  repairPasses: Array<{ stage: string; branchId: string | null; count: number }>;
  linter: {
    guidebookExists: boolean;
    provenancePassed: boolean | null;
    voicePassed: boolean | null;
    provenanceViolationCount: number | null;
    voiceViolationCount: number | null;
  };
  anomalies: string[];
  generatedAt: string;
}

interface StatsOptions {
  all?: boolean;
  json?: boolean;
  /** Skip writing stats.json (used by --all to keep the single-run file fresh without always persisting). */
  noWrite?: boolean;
}

export async function statsCommand(runIdOrUndefined: string | undefined, opts: StatsOptions): Promise<void> {
  if (opts.all) {
    await statsAll(opts);
    return;
  }
  if (!runIdOrUndefined) {
    console.error(chalk.hex(palette.blocked)('usage: probe stats <run_id>    or    probe stats --all'));
    process.exitCode = 2;
    return;
  }
  const stats = await computeRunStats(runIdOrUndefined);
  if (opts.json) {
    console.log(JSON.stringify(stats, null, 2));
  } else {
    renderRunStats(stats);
  }
  if (!opts.noWrite) {
    const p = path.join(runDir(runIdOrUndefined), 'stats.json');
    await fs.writeFile(p, JSON.stringify(stats, null, 2));
    if (!opts.json) {
      console.log(chalk.hex(palette.dim)(`\n  → ${p}`));
    }
  }
}

async function statsAll(_opts: StatsOptions): Promise<void> {
  const runsRoot = path.join(projectRoot(), 'runs');
  const entries = await fs.readdir(runsRoot).catch(() => [] as string[]);
  const runIds = entries
    .filter((e) => !e.startsWith('.') && !e.startsWith('_') && !e.startsWith('ablation_') && !e.startsWith('hallucination_'))
    .sort();

  const allStats: RunStats[] = [];
  for (const runId of runIds) {
    const dir = path.join(runsRoot, runId);
    const stat = await fs.stat(dir).catch(() => null);
    if (!stat?.isDirectory()) continue;
    try {
      const s = await computeRunStats(runId);
      allStats.push(s);
      // Refresh each run's stats.json in-place.
      await fs.writeFile(path.join(runDir(runId), 'stats.json'), JSON.stringify(s, null, 2));
    } catch (e) {
      console.error(chalk.hex(palette.blocked)(`! could not compute stats for ${runId}: ${String((e as Error).message).slice(0, 140)}`));
    }
  }

  // Print the cross-run table to stdout.
  renderAllStatsTable(allStats);

  // Write RUNS_SUMMARY.md to repo root.
  const mdPath = path.join(projectRoot(), 'RUNS_SUMMARY.md');
  await fs.writeFile(mdPath, buildRunsSummaryMarkdown(allStats));
  console.log('\n' + chalk.hex(palette.passed)(`✓ wrote ${mdPath}`));
}

export async function computeRunStats(runId: string): Promise<RunStats> {
  const rd = runDir(runId);

  const premise = await readFileOrEmpty(path.join(rd, 'premise.md'));
  const premiseText = premise.replace(/^#\s+Research premise\s*\n\n?/i, '').trim();
  const premiseTruncated = premiseText.length > 100 ? `${premiseText.slice(0, 97)}...` : premiseText;

  const runSummary = (await readJsonOrNull(path.join(rd, 'run_summary.json'))) as
    | { branches?: Array<{ branchId: string; status: string; stage?: string; reason?: string; blockingFinding?: string | null }> }
    | null;

  const cost = (await readJsonOrNull(path.join(rd, 'cost.json'))) as
    | {
        stages?: Array<{ stage: string; branch_id?: string | null; model: string; input_tokens: number; output_tokens: number; usd: number; duration_ms: number }>;
        totals?: { input_tokens: number; output_tokens: number; usd: number };
      }
    | null;

  type BranchRow = { branchId: string; status: string; stage?: string; reason?: string; blockingFinding?: string | null };
  const branchList: BranchRow[] =
    runSummary?.branches ?? (await listBranchDirs(rd)).map((id) => ({ branchId: id, status: 'unknown' as string }));

  const branches: BranchSummary[] = [];
  const anomalies: string[] = [];

  for (const b of branchList) {
    const bd = branchDir(runId, b.branchId);
    const audit = (await readJsonOrNull(path.join(bd, 'audit.json'))) as
      | { verdict?: string; findings?: Array<{ pattern_id: string; axis: string; fired: boolean; score: number }> }
      | null;
    const metaReview = (await readJsonOrNull(path.join(bd, 'meta_review.json'))) as
      | { verdict?: string; disagreement_classification?: string; classification?: string }
      | null;

    const firedPatterns: Record<Axis, string[]> = { capacity: [], agency: [], exit: [], legibility: [] };
    const firedCounts: Record<Axis, number> = { capacity: 0, agency: 0, exit: 0, legibility: 0 };
    for (const f of audit?.findings ?? []) {
      if (!f.fired) continue;
      const axis = f.axis as Axis;
      if (!AXES.includes(axis)) {
        anomalies.push(`branch ${b.branchId}: audit finding has unknown axis "${f.axis}"`);
        continue;
      }
      firedPatterns[axis].push(f.pattern_id);
      firedCounts[axis]++;
    }

    const disagreementClass =
      metaReview?.disagreement_classification ?? metaReview?.classification ?? undefined;

    let verdictLabel = '';
    if (b.status === 'blocked') {
      const pid = findDefiningBlockedPattern(audit?.findings);
      verdictLabel = pid ? `BLOCKED:${pid}` : 'BLOCKED';
    } else if (b.status === 'surviving' || b.status === 'completed') {
      verdictLabel = 'SURVIVED';
      if (audit?.verdict === 'REVISION_REQUIRED') verdictLabel = 'SURVIVED (REVISION_REQUIRED)';
    } else if (b.status === 'failed') {
      verdictLabel = `FAILED:${b.stage ?? 'unknown'}`;
    } else if (b.status === 'in_progress') {
      verdictLabel = 'IN_PROGRESS';
    } else {
      verdictLabel = b.status.toUpperCase();
    }
    if (metaReview?.verdict === 'human_judgment_required') {
      verdictLabel += ' [human_judgment_required]';
    }

    branches.push({
      branchId: b.branchId,
      status: b.status,
      stage: b.stage,
      reason: b.reason,
      blockingFinding: b.blockingFinding ?? null,
      auditVerdict: audit?.verdict,
      firedPatterns,
      firedCounts,
      metaReviewVerdict: metaReview?.verdict,
      disagreementClass,
      verdictLabel,
    });
  }

  // Repair passes: detect duplicate (stage, branch_id) entries in cost.json.
  const seen = new Map<string, number>();
  for (const s of cost?.stages ?? []) {
    const key = `${s.stage}::${s.branch_id ?? '_'}`;
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  const repairPasses: RunStats['repairPasses'] = [];
  for (const [key, count] of seen.entries()) {
    if (count > 1) {
      const [stage, branchId] = key.split('::');
      repairPasses.push({ stage, branchId: branchId === '_' ? null : branchId, count });
      anomalies.push(`repair pass${count > 2 ? `es (${count - 1})` : ''} on ${stage}${branchId === '_' ? '' : ' [branch ' + branchId + ']'}`);
    }
  }

  // Missing-artifact checks per branch.
  for (const b of branchList) {
    const bd = branchDir(runId, b.branchId);
    const expected = ['branch_card.json', 'prototype_spec.json', 'simulated_walkthrough.md', 'audit.json'];
    if (b.status === 'surviving' || b.status === 'completed') {
      expected.push('meta_review.json');
    }
    for (const f of expected) {
      try {
        await fs.access(path.join(bd, f));
      } catch {
        anomalies.push(`branch ${b.branchId}: missing ${f} (status=${b.status})`);
      }
    }
  }

  const gbPath = path.join(rd, 'PROBE_GUIDEBOOK.md');
  const gbExists = await fileExists(gbPath);
  let provenancePassed: boolean | null = null;
  let voicePassed: boolean | null = null;
  let provenanceViolationCount: number | null = null;
  let voiceViolationCount: number | null = null;
  if (gbExists) {
    try {
      const md = await fs.readFile(gbPath, 'utf8');
      // Stats lints repo-internal guidebooks, so SOURCE_CARD ids must be
      // validated against the corpus — same rule as `probe lint` and
      // `probe doctor`.
      const knownSourceCards = await loadKnownSourceCardIds().catch(() => undefined);
      const prov = checkProvenance(md, { knownSourceCards });
      provenancePassed = prov.passed;
      provenanceViolationCount = prov.violations.length;
      const voice = checkForbiddenPhrases(md);
      voicePassed = voice.passed;
      voiceViolationCount = voice.violations.length;
    } catch (e) {
      anomalies.push(`guidebook lint failed to run: ${String((e as Error).message).slice(0, 120)}`);
    }
  } else {
    const anySurvived = branches.some((b) => b.status === 'surviving' || b.status === 'completed');
    if (anySurvived) anomalies.push('PROBE_GUIDEBOOK.md missing despite a surviving branch');
  }

  const totalUsd = cost?.totals?.usd ?? 0;
  const totalInputTokens = cost?.totals?.input_tokens ?? 0;
  const totalOutputTokens = cost?.totals?.output_tokens ?? 0;
  const durationMs = (cost?.stages ?? []).reduce((a, s) => a + (s.duration_ms ?? 0), 0);

  return {
    runId,
    premise: premiseText,
    premiseTruncated,
    branches,
    totalUsd,
    totalInputTokens,
    totalOutputTokens,
    durationMs,
    costEntryCount: (cost?.stages ?? []).length,
    repairPasses,
    linter: {
      guidebookExists: gbExists,
      provenancePassed,
      voicePassed,
      provenanceViolationCount,
      voiceViolationCount,
    },
    anomalies,
    generatedAt: new Date().toISOString(),
  };
}

function findDefiningBlockedPattern(findings: Array<{ pattern_id: string; fired: boolean; score: number }> | undefined): string | undefined {
  if (!findings) return undefined;
  // Prefer a -2 finding (the canonical blocker); fall back to -1 if none.
  const blockers = findings.filter((f) => f.fired && f.score <= -2);
  if (blockers.length > 0) return blockers[0].pattern_id;
  const drift = findings.filter((f) => f.fired && f.score === -1);
  if (drift.length > 0) return drift[0].pattern_id;
  return undefined;
}

// ─── rendering ──────────────────────────────────────────────────────────────

function renderRunStats(s: RunStats): void {
  console.log('');
  console.log(chalk.hex(palette.probe).bold(`${s.runId}`));
  console.log(chalk.hex(palette.dim)(`  ${s.premiseTruncated}`));
  console.log('');

  // Branch table — pad BEFORE applying color so the ANSI escapes don't
  // break the column alignment.
  const header =
    chalk.hex(palette.stage)('branch'.padEnd(8)) +
    chalk.hex(palette.stage)('verdict'.padEnd(52)) +
    chalk.hex(palette.stage)('Cap'.padEnd(5)) +
    chalk.hex(palette.stage)('Agc'.padEnd(5)) +
    chalk.hex(palette.stage)('Exit'.padEnd(5)) +
    chalk.hex(palette.stage)('Leg'.padEnd(5)) +
    chalk.hex(palette.stage)('disagreement');
  console.log('  ' + header);
  for (const b of s.branches) {
    const color = branchColor(b.branchId);
    const vcolor = verdictColor(b.verdictLabel.split(':')[0].split(' ')[0]);
    const verdictPlain = b.verdictLabel.length > 50 ? b.verdictLabel.slice(0, 47) + '...' : b.verdictLabel;
    const row =
      color(b.branchId.toUpperCase().padEnd(8)) +
      vcolor(verdictPlain.padEnd(52)) +
      plainCount(b.firedCounts.capacity).padEnd(5) +
      plainCount(b.firedCounts.agency).padEnd(5) +
      plainCount(b.firedCounts.exit).padEnd(5) +
      plainCount(b.firedCounts.legibility).padEnd(5) +
      chalk.hex(palette.dim)(b.disagreementClass ?? '—');
    console.log('  ' + row);
  }

  // Cost + duration
  console.log('');
  console.log(
    chalk.hex(palette.stage)('  cost ') +
      chalk.hex(palette.passed)(`$${s.totalUsd.toFixed(2)}`) +
      chalk.hex(palette.dim)(`  (${(s.totalInputTokens / 1000).toFixed(0)}K in, ${(s.totalOutputTokens / 1000).toFixed(0)}K out)`),
  );
  console.log(chalk.hex(palette.stage)('  duration ') + chalk.hex(palette.passed)(fmtDuration(s.durationMs)));

  // Linter
  const linterLine =
    s.linter.guidebookExists
      ? `${s.linter.provenancePassed ? chalk.hex(palette.passed)('provenance ✓') : chalk.hex(palette.blocked)('provenance ✗ (' + s.linter.provenanceViolationCount + ')')}   ${s.linter.voicePassed ? chalk.hex(palette.passed)('voice ✓') : chalk.hex(palette.blocked)('voice ✗ (' + s.linter.voiceViolationCount + ')')}`
      : chalk.hex(palette.dim)('no guidebook');
  console.log(chalk.hex(palette.stage)('  linter ') + linterLine);

  // Repair passes
  if (s.repairPasses.length > 0) {
    const total = s.repairPasses.reduce((a, r) => a + (r.count - 1), 0);
    console.log(chalk.hex(palette.stage)('  repairs ') + chalk.hex(palette.revision)(`${total} pass${total === 1 ? '' : 'es'} across ${s.repairPasses.length} stage/branch pair${s.repairPasses.length === 1 ? '' : 's'}`));
  } else {
    console.log(chalk.hex(palette.stage)('  repairs ') + chalk.hex(palette.dim)('none'));
  }

  // Anomalies
  if (s.anomalies.length > 0) {
    console.log(chalk.hex(palette.stage)('  anomalies'));
    for (const a of s.anomalies.slice(0, 20)) {
      console.log('    ' + chalk.hex(palette.revision)('• ' + a));
    }
    if (s.anomalies.length > 20) console.log(chalk.hex(palette.dim)(`    ... (${s.anomalies.length - 20} more)`));
  }
}

function renderAllStatsTable(all: RunStats[]): void {
  if (all.length === 0) {
    console.log(chalk.hex(palette.dim)('no runs found under runs/'));
    return;
  }
  console.log('');
  console.log(chalk.hex(palette.probe).bold(`probe stats — ${all.length} runs under runs/`));
  console.log('');
  const header =
    chalk.hex(palette.stage)('run'.padEnd(36)) +
    chalk.hex(palette.stage)('verdicts'.padEnd(32)) +
    chalk.hex(palette.stage)('$'.padEnd(9)) +
    chalk.hex(palette.stage)('wall'.padEnd(9)) +
    chalk.hex(palette.stage)('repairs'.padEnd(9)) +
    chalk.hex(palette.stage)('lint');
  console.log('  ' + header);
  for (const s of all) {
    const verdictsColored = s.branches.map((b) => `${b.branchId}=${branchVerdictGlyph(b.verdictLabel)}`).join(' ');
    const repairs = s.repairPasses.reduce((a, r) => a + (r.count - 1), 0);
    const lint = s.linter.guidebookExists
      ? (s.linter.provenancePassed ? '✓' : '✗') + (s.linter.voicePassed ? '✓' : '✗')
      : '-';
    const runCell = s.runId.length > 34 ? s.runId.slice(0, 31) + '...' : s.runId;
    const row =
      chalk.hex(palette.dim)(runCell.padEnd(36)) +
      padAnsi(verdictsColored, 18) +
      `$${s.totalUsd.toFixed(2)}`.padEnd(9) +
      fmtDuration(s.durationMs).padEnd(9) +
      String(repairs).padEnd(9) +
      lint;
    console.log('  ' + row);
  }
}

function branchVerdictGlyph(label: string): string {
  if (label.startsWith('SURVIVED')) return chalk.hex(palette.passed)('✓');
  if (label.startsWith('BLOCKED')) return chalk.hex(palette.blocked)('✗');
  if (label.startsWith('FAILED')) return chalk.hex(palette.blocked)('!');
  if (label === 'IN_PROGRESS') return chalk.hex(palette.revision)('?');
  return '-';
}

/** 1-char plain string, ANSI-free so .padEnd works correctly. */
function plainCount(n: number): string {
  return n === 0 ? '.' : String(n);
}

/** Pad a string that may contain ANSI escapes so the visible width reaches `target`. */
// eslint-disable-next-line no-control-regex
const ANSI_RE = /\[[0-9;]*m/g;
function padAnsi(s: string, target: number): string {
  const visibleLen = s.replace(ANSI_RE, '').length;
  if (visibleLen >= target) return s;
  return s + ' '.repeat(target - visibleLen);
}

function fmtDuration(ms: number): string {
  if (ms === 0) return '—';
  const sec = ms / 1000;
  if (sec < 60) return `${sec.toFixed(0)}s`;
  const min = Math.floor(sec / 60);
  const s = Math.round(sec - min * 60);
  return `${min}m${s.toString().padStart(2, '0')}s`;
}

// ─── markdown summary ────────────────────────────────────────────────────────

function buildRunsSummaryMarkdown(all: RunStats[]): string {
  const lines: string[] = [];
  lines.push('# Runs summary');
  lines.push('');
  lines.push(`Generated ${new Date().toISOString()} via \`probe stats --all\`.`);
  lines.push('');

  // Cross-run table
  lines.push('| run_id | verdicts (a / b / c) | cost | wall | repairs | lint |');
  lines.push('| --- | --- | --- | --- | --- | --- |');
  for (const s of all) {
    const vs = s.branches.map((b) => `${b.branchId}=${b.verdictLabel}`).join('<br>');
    const repairs = s.repairPasses.reduce((a, r) => a + (r.count - 1), 0);
    const lint = s.linter.guidebookExists
      ? `prov=${s.linter.provenancePassed ? '✓' : `✗ (${s.linter.provenanceViolationCount})`} voice=${s.linter.voicePassed ? '✓' : `✗ (${s.linter.voiceViolationCount})`}`
      : 'no guidebook';
    lines.push(`| \`${s.runId}\` | ${vs} | $${s.totalUsd.toFixed(2)} | ${fmtDuration(s.durationMs)} | ${repairs} | ${lint} |`);
  }
  lines.push('');

  // Per-run detail
  lines.push('## Per-run detail');
  lines.push('');
  for (const s of all) {
    lines.push(`### \`${s.runId}\``);
    lines.push('');
    lines.push(`**Premise:** ${s.premiseTruncated}`);
    lines.push('');
    lines.push('| branch | verdict | Cap | Agc | Exit | Leg | disagreement |');
    lines.push('| --- | --- | --- | --- | --- | --- | --- |');
    for (const b of s.branches) {
      lines.push(
        `| ${b.branchId} | ${b.verdictLabel} | ${b.firedCounts.capacity} | ${b.firedCounts.agency} | ${b.firedCounts.exit} | ${b.firedCounts.legibility} | ${b.disagreementClass ?? '—'} |`,
      );
    }
    lines.push('');
    const repairs = s.repairPasses.reduce((a, r) => a + (r.count - 1), 0);
    lines.push(`**Cost:** \$${s.totalUsd.toFixed(2)} · **Wall:** ${fmtDuration(s.durationMs)} · **Tokens:** ${(s.totalInputTokens / 1000).toFixed(0)}K in / ${(s.totalOutputTokens / 1000).toFixed(0)}K out · **Repair passes:** ${repairs}`);
    lines.push('');
    if (s.anomalies.length > 0) {
      lines.push('**Anomalies:**');
      for (const a of s.anomalies) lines.push(`- ${a}`);
      lines.push('');
    }
  }

  return lines.join('\n') + '\n';
}

// ─── tiny helpers ────────────────────────────────────────────────────────────

async function readFileOrEmpty(p: string): Promise<string> {
  try {
    return await fs.readFile(p, 'utf8');
  } catch {
    return '';
  }
}

async function readJsonOrNull(p: string): Promise<unknown> {
  try {
    const raw = await fs.readFile(p, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function listBranchDirs(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(path.join(dir, 'branches'));
    return entries.filter((e) => /^[a-z]$/.test(e));
  } catch {
    return [];
  }
}
