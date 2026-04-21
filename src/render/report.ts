/**
 * Markdown → PDF / HTML report renderer.
 *
 * Takes a completed Probe run and produces a single self-contained report
 * that bundles the guidebook, reviewer panel, audit findings, linter
 * status, and cost log into a shareable artifact.
 *
 * Backends (in priority order):
 *   1. pandoc + wkhtmltopdf — produces a polished PDF
 *   2. pandoc → standalone HTML — fallback when no PDF engine
 *   3. raw markdown concatenation — fallback when no pandoc
 *
 * The output is deliberately boring: single-column, no color gimmicks,
 * clear section hierarchy. The goal is legibility for a reviewer who has
 * two minutes, not design awards.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import chalk from 'chalk';
import { runDir, branchDir } from '../util/paths.js';
import { palette, brand } from '../ui/theme.js';
import { checkProvenance } from '../lint/provenance.js';
import { checkForbiddenPhrases } from '../lint/forbidden.js';

const pExecFile = promisify(execFile);

export interface RenderReportOptions {
  runId: string;
  /** 'pdf' | 'html' | 'md'. Default: auto-detect highest-quality available. */
  format?: 'pdf' | 'html' | 'md' | 'auto';
  /** Where to write the output. Default: runs/<id>/PROBE_REPORT.{pdf,html,md}. */
  outputPath?: string;
}

export async function renderReport(opts: RenderReportOptions): Promise<string> {
  const { runId } = opts;
  const dir = runDir(runId);

  // Build the combined markdown.
  const md = await buildCombinedMarkdown(runId);
  const format = opts.format ?? 'auto';

  // Resolve desired output path.
  const defaultExt = format === 'auto' ? (await detectBestFormat()) : format;
  const outputPath = opts.outputPath ?? path.join(dir, `PROBE_REPORT.${defaultExt}`);

  if (defaultExt === 'md') {
    await fs.writeFile(outputPath, md);
    console.log(brand.header('📘 report rendered') + chalk.hex(palette.dim)(' → ') + outputPath);
    return outputPath;
  }

  // pandoc path — CSS injected via a header-include file (no relative-path woes).
  try {
    const tmpMd = path.join(dir, '.tmp_report.md');
    await fs.writeFile(tmpMd, md);

    const tmpHeader = path.join(dir, '.tmp_header.html');
    await fs.writeFile(tmpHeader, `<style>\n${REPORT_CSS}\n</style>\n`);

    const args = [
      '--from=markdown',
      '--to=html5',
      '--standalone',
      `--include-in-header=${tmpHeader}`,
      '--metadata',
      `title=Probe Report · ${runId}`,
    ];
    if (defaultExt === 'pdf') {
      args.push('--pdf-engine=wkhtmltopdf');
      args.push('--pdf-engine-opt=--enable-local-file-access');
    }
    args.push('-o', outputPath);
    args.push(tmpMd);

    await pExecFile('pandoc', args);
    await fs.unlink(tmpMd).catch(() => {});
    await fs.unlink(tmpHeader).catch(() => {});
    console.log(brand.header(`${defaultExt === 'pdf' ? '📄' : '🌐'} report rendered`) + chalk.hex(palette.dim)(' → ') + outputPath);
    return outputPath;
  } catch (e) {
    console.log(chalk.hex(palette.revision)(`pandoc failed (${String((e as Error).message).slice(0, 150)}); falling back to markdown.`));
    const fallback = path.join(dir, 'PROBE_REPORT.md');
    await fs.writeFile(fallback, md);
    console.log(brand.header('📘 report rendered (markdown fallback)') + chalk.hex(palette.dim)(' → ') + fallback);
    return fallback;
  }
}

async function detectBestFormat(): Promise<'pdf' | 'html' | 'md'> {
  try {
    await pExecFile('pandoc', ['--version']);
  } catch {
    return 'md';
  }
  try {
    await pExecFile('wkhtmltopdf', ['--version']);
    return 'pdf';
  } catch {
    /* no PDF engine */
  }
  return 'html';
}

async function buildCombinedMarkdown(runId: string): Promise<string> {
  const dir = runDir(runId);

  const sections: string[] = [];

  // Title block
  sections.push(`# Probe report · \`${runId}\``);
  sections.push('');
  sections.push(`Generated ${new Date().toISOString().split('T')[0]}.`);
  sections.push('');

  // Premise
  const premise = await readIfExists(path.join(dir, 'premise.md'));
  if (premise) {
    sections.push(premise.trim());
    sections.push('');
  }

  // Run summary
  const summary = await readJsonIfExists(path.join(dir, 'run_summary.json'));
  if (summary) {
    sections.push('## Run summary');
    sections.push('');
    sections.push('| branch | status | stage | reason |');
    sections.push('| --- | --- | --- | --- |');
    type BranchRec = { branchId: string; status: string; stage?: string; reason?: string };
    for (const b of (summary as { branches: BranchRec[] }).branches ?? []) {
      const status = b.status === 'blocked' ? '🚫 blocked' : b.status === 'failed' ? '✗ failed' : '✓ ' + b.status;
      sections.push(`| ${b.branchId} | ${status} | ${b.stage ?? '—'} | ${b.reason ?? '—'} |`);
    }
    sections.push('');
  }

  // Cost
  const cost = await readJsonIfExists(path.join(dir, 'cost.json'));
  if (cost) {
    const c = cost as { totals: { input_tokens: number; output_tokens: number; usd: number }; stages: unknown[] };
    sections.push('## Cost');
    sections.push('');
    sections.push(`- Total input tokens: ${c.totals.input_tokens.toLocaleString()}`);
    sections.push(`- Total output tokens: ${c.totals.output_tokens.toLocaleString()}`);
    sections.push(`- Total USD: $${c.totals.usd.toFixed(4)}`);
    sections.push(`- Stage calls: ${c.stages.length}`);
    sections.push('');
  }

  // Guidebook + lint status
  const guidebook = await readIfExists(path.join(dir, 'PROBE_GUIDEBOOK.md'));
  if (guidebook) {
    sections.push('## Lint status on the guidebook');
    sections.push('');
    const prov = checkProvenance(guidebook);
    const voice = checkForbiddenPhrases(guidebook);
    sections.push(`- Provenance: ${prov.passed ? '✓ pass' : `✗ ${prov.violations.length} violations`}`);
    sections.push(`- Forbidden phrases: ${voice.passed ? '✓ pass' : `✗ ${voice.violations.length} violations`}`);
    if (!prov.passed) {
      sections.push('');
      sections.push('### Provenance violations');
      for (const v of prov.violations.slice(0, 10)) sections.push(`- ${v}`);
    }
    if (!voice.passed) {
      sections.push('');
      sections.push('### Voice violations');
      for (const v of voice.violations.slice(0, 10)) sections.push(`- ${v}`);
    }
    sections.push('');
    sections.push('## PROBE_GUIDEBOOK.md');
    sections.push('');
    sections.push(guidebook);
    sections.push('');
  }

  // Blocked branches
  const branches = summary ? (summary as { branches: Array<{ branchId: string; status: string }> }).branches : [];
  const blocked = branches.filter((b) => b.status === 'blocked');
  if (blocked.length > 0) {
    sections.push('## Blocked branches');
    sections.push('');
    for (const b of blocked) {
      const wnrPath = path.join(branchDir(runId, b.branchId), 'WORKSHOP_NOT_RECOMMENDED.md');
      const wnr = await readIfExists(wnrPath);
      if (wnr) {
        sections.push(`### Branch ${b.branchId}`);
        sections.push('');
        sections.push(wnr);
        sections.push('');
      }
    }
  }

  // Reviewer panel (surviving branch)
  const surviving = branches.find((b) => b.status === 'in_progress' || b.status === 'completed');
  if (surviving) {
    const bd = branchDir(runId, surviving.branchId);
    const reviewsDir = path.join(bd, 'reviews');
    const reviewFiles = await fs.readdir(reviewsDir).catch(() => [] as string[]);
    if (reviewFiles.length > 0) {
      sections.push(`## Reviewer panel (branch ${surviving.branchId})`);
      sections.push('');
      for (const f of reviewFiles.sort()) {
        if (!f.endsWith('.json')) continue;
        const review = await readJsonIfExists(path.join(reviewsDir, f));
        if (!review) continue;
        const r = review as {
          reviewer_persona: string;
          decisive_weakness: string;
          recommendation: string;
          criticisms?: Array<{ severity?: string; violated_criterion?: string; evidence_span?: { quote?: string; source?: string }; why_matters?: string }>;
        };
        sections.push(`### ${r.reviewer_persona} — ${r.recommendation}`);
        sections.push('');
        sections.push('**Decisive weakness:** ' + r.decisive_weakness);
        sections.push('');
        if (Array.isArray(r.criticisms) && r.criticisms.length > 0) {
          for (const c of r.criticisms.slice(0, 6)) {
            sections.push(`- **[${c.severity ?? ''}] ${c.violated_criterion ?? ''}**`);
            if (c.evidence_span?.quote) {
              sections.push(`  - Evidence (${c.evidence_span.source}): *${c.evidence_span.quote.slice(0, 300)}*`);
            }
            if (c.why_matters) {
              sections.push(`  - Why: ${c.why_matters.slice(0, 400)}`);
            }
          }
        }
        sections.push('');
      }
    }

    const metaReview = await readJsonIfExists(path.join(bd, 'meta_review.json'));
    if (metaReview) {
      const m = metaReview as { verdict: string; disagreement_classification: string; verdict_rationale: string };
      sections.push('### Meta-review');
      sections.push('');
      sections.push(`- Verdict: \`${m.verdict}\``);
      sections.push(`- Disagreement classification: \`${m.disagreement_classification}\``);
      sections.push(`- Rationale: ${m.verdict_rationale}`);
      sections.push('');
    }

    const deepAudit = await readIfExists(path.join(bd, 'deep_audit.md'));
    if (deepAudit && deepAudit.trim().length > 0) {
      sections.push('## Managed-agent deep audit');
      sections.push('');
      sections.push(deepAudit);
      sections.push('');
    }
  }

  return sections.join('\n');
}

async function readIfExists(file: string): Promise<string | null> {
  try {
    return await fs.readFile(file, 'utf8');
  } catch {
    return null;
  }
}

async function readJsonIfExists(file: string): Promise<unknown> {
  const raw = await readIfExists(file);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const REPORT_CSS = `
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  font-size: 11pt;
  line-height: 1.55;
  max-width: 7.5in;
  margin: 1in auto;
  color: #1a1a1a;
}
h1 { font-size: 20pt; font-weight: 600; margin: 0.4em 0; border-bottom: 2px solid #333; padding-bottom: 0.2em; }
h2 { font-size: 15pt; font-weight: 600; margin: 1.8em 0 0.5em; color: #2a4f7a; }
h3 { font-size: 12pt; font-weight: 600; margin: 1.2em 0 0.4em; color: #333; }
code { background: #f5f5f7; padding: 1px 4px; border-radius: 2px; font-size: 0.9em; font-family: Menlo, Consolas, monospace; }
pre { background: #1f2226; color: #d8dbe0; padding: 0.8em; border-radius: 4px; overflow-x: auto; font-size: 0.85em; }
blockquote { border-left: 3px solid #b0b0b0; margin: 0.8em 0; padding: 0.2em 1em; color: #555; font-style: italic; }
table { border-collapse: collapse; width: 100%; margin: 0.8em 0; }
th, td { border: 1px solid #d0d0d0; padding: 6px 10px; text-align: left; font-size: 0.95em; }
th { background: #f0f1f3; font-weight: 600; }
ul, ol { padding-left: 1.6em; }
li { margin: 0.2em 0; }
strong { color: #1a1a1a; }
a { color: #2a4f7a; text-decoration: none; border-bottom: 1px dotted #2a4f7a; }
`.trim();
