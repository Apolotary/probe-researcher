/**
 * Per-stage content preview for the CLI output. After each stage
 * completes, read the artifact it just wrote and print a small
 * indented block summarizing what came back. This is the "what is
 * Probe actually thinking" view the old spinner-only output was
 * hiding — the pipeline now narrates instead of going quiet for
 * three minutes at a stretch.
 *
 * Reads are best-effort; parse failures and missing files degrade to
 * silence rather than breaking the pipeline.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import { runDir, branchDir } from '../util/paths.js';
import { palette, branchColor } from './theme.js';

const INDENT = '   ';
const BULLET = chalk.hex(palette.dim)('·');

async function readJson<T = unknown>(p: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(p, 'utf8')) as T;
  } catch {
    return null;
  }
}

async function readFirstLines(p: string, maxLines = 1): Promise<string[]> {
  try {
    const text = await fs.readFile(p, 'utf8');
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'));
    return lines.slice(0, maxLines);
  } catch {
    return [];
  }
}

function trunc(s: string, n = 100): string {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
}

function line(color: string, label: string, value: string): void {
  console.log(`${INDENT}${BULLET} ${chalk.hex(color)(label)} ${chalk.hex(palette.subtle)(value)}`);
}

export async function previewPremise(runId: string): Promise<void> {
  const d = await readJson<{ sharpest_question?: string; sharpened_options?: unknown[]; missing_evidence?: unknown[] }>(
    path.join(runDir(runId), 'premise_card.json'),
  );
  if (!d) return;
  if (d.sharpest_question) line(palette.probe, 'sharpest question', trunc(d.sharpest_question, 140));
  if (Array.isArray(d.sharpened_options)) {
    line(palette.dim, 'sharpened options', `${d.sharpened_options.length} produced`);
  }
  if (Array.isArray(d.missing_evidence) && d.missing_evidence.length > 0) {
    line(palette.dim, 'missing evidence', `${d.missing_evidence.length} gaps flagged`);
  }
}

export async function previewIdeator(runId: string, branchIds: string[]): Promise<void> {
  for (const id of branchIds) {
    const d = await readJson<{ research_question?: string; method_family?: string; intervention_primitive?: string }>(
      path.join(branchDir(runId, id), 'branch_card.json'),
    );
    if (!d) continue;
    const color = branchColor(id);
    const head = color(`branch ${id.toUpperCase()}`);
    const rq = trunc(d.research_question ?? '(no research_question)', 110);
    console.log(`${INDENT}${BULLET} ${head} ${chalk.hex(palette.subtle)(rq)}`);
    if (d.method_family || d.intervention_primitive) {
      console.log(
        `${INDENT}  ${chalk.hex(palette.dim)(
          `${d.method_family ?? '—'} · ${trunc(d.intervention_primitive ?? '', 80)}`,
        )}`,
      );
    }
  }
}

export async function previewLiterature(runId: string, branchIds: string[]): Promise<void> {
  for (const id of branchIds) {
    const d = await readJson<{ grounding?: Array<{ source_card_id?: string }> }>(
      path.join(branchDir(runId, id), 'branch_card.json'),
    );
    if (!d) continue;
    const color = branchColor(id);
    const n = Array.isArray(d.grounding) ? d.grounding.length : 0;
    const ids = Array.isArray(d.grounding)
      ? d.grounding
          .slice(0, 3)
          .map((g) => g.source_card_id)
          .filter(Boolean)
          .join(', ')
      : '';
    console.log(
      `${INDENT}${BULLET} ${color(`branch ${id.toUpperCase()}`)} ${chalk.hex(palette.subtle)(`${n} citation${n === 1 ? '' : 's'}`)}${ids ? chalk.hex(palette.dim)(` · ${ids}${n > 3 ? ', +more' : ''}`) : ''}`,
    );
  }
}

export async function previewPrototype(runId: string, branchIds: string[]): Promise<void> {
  for (const id of branchIds) {
    const d = await readJson<{ title?: string; summary?: string }>(
      path.join(branchDir(runId, id), 'prototype_spec.json'),
    );
    if (!d) continue;
    const color = branchColor(id);
    const title = d.title ?? '(no title)';
    console.log(
      `${INDENT}${BULLET} ${color(`branch ${id.toUpperCase()}`)} ${chalk.hex(palette.subtle)(trunc(title, 110))}`,
    );
  }
}

export async function previewSimulator(runId: string, branchIds: string[]): Promise<void> {
  for (const id of branchIds) {
    const lines = await readFirstLines(path.join(branchDir(runId, id), 'simulated_walkthrough.md'), 1);
    if (lines.length === 0) continue;
    const color = branchColor(id);
    const stripped = lines[0].replace(/\s*\[[A-Z_]+(:[a-z0-9_-]+)?\]\s*$/, '');
    console.log(
      `${INDENT}${BULLET} ${color(`branch ${id.toUpperCase()}`)} ${chalk.hex(palette.subtle)(trunc(stripped, 120))}`,
    );
  }
}

export async function previewAudit(runId: string, branchIds: string[]): Promise<void> {
  for (const id of branchIds) {
    const d = await readJson<{
      verdict?: string;
      findings?: Array<{ pattern_id: string; fired: boolean; score: number }>;
    }>(path.join(branchDir(runId, id), 'audit.json'));
    if (!d) continue;
    const color = branchColor(id);
    const fired = (d.findings ?? []).filter((f) => f.fired);
    const blockers = fired.filter((f) => f.score <= -2);
    const drift = fired.filter((f) => f.score === -1);
    const verdictColor =
      d.verdict === 'BLOCKED'
        ? palette.blocked
        : d.verdict === 'REVISION_REQUIRED'
          ? palette.revision
          : palette.passed;
    const topPattern = blockers[0]?.pattern_id ?? drift[0]?.pattern_id ?? '—';
    console.log(
      `${INDENT}${BULLET} ${color(`branch ${id.toUpperCase()}`)} ${chalk.hex(verdictColor).bold(d.verdict ?? '—')} ${chalk.hex(palette.subtle)(`· ${fired.length} fires (${blockers.length}×-2, ${drift.length}×-1) · ${topPattern}`)}`,
    );
  }
}

export async function previewReviewers(runId: string, branchIds: string[]): Promise<void> {
  for (const id of branchIds) {
    const m = await readJson<{ verdict?: string; disagreement_classification?: string }>(
      path.join(branchDir(runId, id), 'meta_review.json'),
    );
    if (!m) continue;
    const color = branchColor(id);
    const v = m.verdict ?? '—';
    const cls = m.disagreement_classification ?? '—';
    const verdictColor =
      v === 'accept_revise' ? palette.passed : v === 'reject' ? palette.blocked : palette.revision;
    console.log(
      `${INDENT}${BULLET} ${color(`branch ${id.toUpperCase()}`)} ${chalk.hex(verdictColor).bold(v)} ${chalk.hex(palette.subtle)(`· ${cls}`)}`,
    );
  }
}

export async function previewGuidebook(runId: string): Promise<void> {
  const lines = await readFirstLines(path.join(runDir(runId), 'PROBE_GUIDEBOOK.md'), 1);
  if (lines.length === 0) return;
  const stripped = lines[0].replace(/\s*\[[A-Z_]+(:[a-z0-9_-]+)?\]\s*$/, '');
  line(palette.probe, 'opens with', trunc(stripped, 140));
  try {
    const text = await fs.readFile(path.join(runDir(runId), 'PROBE_GUIDEBOOK.md'), 'utf8');
    const h2 = (text.match(/^##\s/gm) ?? []).length;
    line(palette.dim, 'sections', `${h2} H2 headings`);
  } catch {
    /* skip */
  }
}

interface CostEntry {
  stage: string;
  branch_id?: string;
  model: string;
  duration_ms: number;
  usd: number;
  input_tokens: number;
  output_tokens: number;
}

/**
 * Running-total footer printed between stages. Reads cost.json and
 * reports elapsed wall-time + spend + completed-stage count. Gives
 * the user a live sense of "where are we in the budget" without
 * needing to open another terminal.
 */
export async function runningTotals(runId: string, totalStages = 8): Promise<void> {
  const d = await readJson<{ stages?: CostEntry[]; totals?: { usd?: number; input_tokens?: number; output_tokens?: number } }>(
    path.join(runDir(runId), 'cost.json'),
  );
  if (!d?.stages) return;
  const totalUsd = d.totals?.usd ?? 0;
  const totalMs = d.stages.reduce((a, s) => a + (s.duration_ms ?? 0), 0);
  // "7a_methodologist" / "7b_accessibility" / "7d_meta" all roll up to "7".
  const uniqueStages = new Set(
    d.stages.map((s) => s.stage.match(/^(\d+)/)?.[1] ?? s.stage),
  );
  const done = uniqueStages.size;
  console.log(
    `${INDENT}${chalk.hex(palette.dim)('─── progress:')} ` +
      `${chalk.hex(palette.stage)(`${done}/${totalStages}`)} ${chalk.hex(palette.dim)('stages ·')} ` +
      `${chalk.hex(palette.stage)(fmtDuration(totalMs))} ${chalk.hex(palette.dim)('elapsed ·')} ` +
      `${chalk.hex(palette.passed)('$' + totalUsd.toFixed(2))} ${chalk.hex(palette.dim)('spent ───')}`,
  );
  console.log('');
}

/**
 * Per-stage footer: what did THIS stage cost and how long did it take?
 * Reads the cost entries whose `stage` field starts with the given id
 * and sums them. Handles both single-call stages (1, 2, 8) and
 * per-branch stages (3-7) that have one entry per branch.
 */
export async function stageFooter(runId: string, stageIdPrefix: string): Promise<void> {
  const d = await readJson<{ stages?: CostEntry[] }>(path.join(runDir(runId), 'cost.json'));
  if (!d?.stages) return;
  const matching = d.stages.filter((s) => s.stage.startsWith(stageIdPrefix));
  if (matching.length === 0) return;
  const usd = matching.reduce((a, s) => a + (s.usd ?? 0), 0);
  const ms = matching.reduce((a, s) => a + (s.duration_ms ?? 0), 0);
  const models = new Set(matching.map((s) => s.model));
  const modelLabel = [...models].map(shortModelName).join(', ');
  console.log(
    `${INDENT}${chalk.hex(palette.dim)(
      `took ${fmtDuration(ms)} · $${usd.toFixed(2)} · ${modelLabel}${matching.length > 1 ? ` · ${matching.length} calls` : ''}`,
    )}`,
  );
}

function shortModelName(m: string): string {
  if (m.startsWith('claude-opus')) return 'Opus 4.7';
  if (m.startsWith('claude-sonnet')) return 'Sonnet 4.6';
  if (m.startsWith('gpt-5')) return 'GPT-5';
  if (m.startsWith('gpt-4')) return 'GPT-4';
  return m;
}

function fmtDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const rem = Math.round(s - m * 60);
  return `${m}m${String(rem).padStart(2, '0')}s`;
}
