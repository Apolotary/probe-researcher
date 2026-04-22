/**
 * `probe doctor` — one-command verification of the repo's health.
 *
 * Runs every check a skeptical reviewer might run in their first five
 * minutes: typecheck, tests, linter on the shipped guidebooks, backend
 * availability for PDF rendering, git cleanliness, and the shipped-run
 * inventory. Exits non-zero on failure so it's scriptable.
 *
 * Not a replacement for the review-agent waves we ran during the build.
 * Its purpose is pre-demo reassurance: at a glance, "is everything that
 * should work, still working?"
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import chalk from 'chalk';
import { projectRoot } from '../util/paths.js';
import { palette, brand } from '../ui/theme.js';
import { checkProvenance } from '../lint/provenance.js';
import { checkForbiddenPhrases } from '../lint/forbidden.js';

const pExecFile = promisify(execFile);

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
  warning?: boolean;
}

export async function doctorCommand(): Promise<void> {
  console.log('');
  console.log(brand.header('🩺 probe doctor'));
  console.log(chalk.hex(palette.dim)('pre-demo verification sweep'));
  console.log('');

  const results: CheckResult[] = [];
  const root = projectRoot();

  results.push(await checkTypecheck(root));
  results.push(await checkTests(root));
  results.push(...(await checkGuidebooks(root)));
  results.push(await checkCommand('pandoc', 'pandoc --version'));
  results.push(await checkCommand('wkhtmltopdf', 'wkhtmltopdf --version'));
  results.push(await checkGit(root));
  results.push(...(await checkInventory(root)));

  // Render results
  const longest = Math.max(...results.map((r) => r.name.length));
  for (const r of results) {
    const marker = r.passed
      ? chalk.hex(palette.passed)('✓')
      : r.warning
        ? chalk.hex(palette.revision)('⚠')
        : chalk.hex(palette.blocked)('✗');
    const label = chalk.hex(palette.stage)(r.name.padEnd(longest + 2));
    const detailColor = r.passed ? palette.dim : r.warning ? palette.revision : palette.blocked;
    console.log(`  ${marker}  ${label}${chalk.hex(detailColor)(r.detail)}`);
  }

  console.log('');
  const failures = results.filter((r) => !r.passed && !r.warning);
  const warnings = results.filter((r) => r.warning);
  if (failures.length === 0 && warnings.length === 0) {
    console.log(chalk.hex(palette.passed).bold(`✓ all ${results.length} checks passed — repo is demo-ready`));
  } else if (failures.length === 0) {
    console.log(chalk.hex(palette.revision)(`⚠ ${warnings.length} warning${warnings.length === 1 ? '' : 's'}, ${results.length - warnings.length} passed — not blocking, but worth reviewing`));
  } else {
    console.log(chalk.hex(palette.blocked).bold(`✗ ${failures.length} check${failures.length === 1 ? '' : 's'} failed`));
    process.exitCode = 1;
  }
  console.log('');
}

async function checkTypecheck(root: string): Promise<CheckResult> {
  try {
    await pExecFile('npx', ['tsc', '--noEmit'], { cwd: root, maxBuffer: 10 * 1024 * 1024 });
    return { name: 'TypeScript typecheck', passed: true, detail: 'no errors' };
  } catch (e) {
    const err = e as { stdout?: string; message?: string };
    const errCount = (err.stdout ?? '').split('\n').filter((l) => /error TS\d+/.test(l)).length;
    return { name: 'TypeScript typecheck', passed: false, detail: `${errCount || '?'} errors` };
  }
}

async function checkTests(root: string): Promise<CheckResult> {
  try {
    const { stdout } = await pExecFile('npx', ['vitest', 'run'], { cwd: root, maxBuffer: 10 * 1024 * 1024 });
    const match = stdout.match(/Tests\s+(\d+)\s+passed\s+\((\d+)\)/);
    if (match) {
      const [, passed, total] = match;
      return {
        name: 'Vitest suite',
        passed: passed === total,
        detail: `${passed}/${total}`,
      };
    }
    return { name: 'Vitest suite', passed: true, detail: 'ran but output unparseable', warning: true };
  } catch (e) {
    return { name: 'Vitest suite', passed: false, detail: `failed: ${String((e as Error).message).slice(0, 80)}` };
  }
}

async function checkGuidebooks(root: string): Promise<CheckResult[]> {
  const runsDir = path.join(root, 'runs');
  const entries = await fs.readdir(runsDir).catch(() => [] as string[]);
  const results: CheckResult[] = [];

  for (const e of entries) {
    const gb = path.join(runsDir, e, 'PROBE_GUIDEBOOK.md');
    try {
      const md = await fs.readFile(gb, 'utf8');
      const prov = checkProvenance(md);
      const voice = checkForbiddenPhrases(md);
      const passed = prov.passed && voice.passed;
      const detail = passed
        ? 'both linters pass'
        : `prov=${prov.violations.length} violations, voice=${voice.violations.length} violations`;
      results.push({ name: `Lint: ${e}/PROBE_GUIDEBOOK.md`, passed, detail });
    } catch {
      /* no guidebook, skip */
    }
  }
  return results;
}

async function checkCommand(name: string, cmd: string): Promise<CheckResult> {
  const [exe, ...args] = cmd.split(/\s+/);
  try {
    const { stdout } = await pExecFile(exe, args, { maxBuffer: 1024 * 1024 });
    const firstLine = stdout.trim().split('\n')[0].slice(0, 60);
    return { name: `Command: ${name}`, passed: true, detail: firstLine || 'available' };
  } catch {
    return {
      name: `Command: ${name}`,
      passed: false,
      detail: `not found — PDF rendering will fall back`,
      warning: true,
    };
  }
}

async function checkGit(root: string): Promise<CheckResult> {
  try {
    const { stdout: status } = await pExecFile('git', ['status', '--porcelain'], { cwd: root });
    if (status.trim().length === 0) {
      const { stdout: branch } = await pExecFile('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: root });
      return { name: 'Git working tree', passed: true, detail: `clean on ${branch.trim()}` };
    }
    const changes = status.trim().split('\n').length;
    return { name: 'Git working tree', passed: false, detail: `${changes} uncommitted change(s)`, warning: true };
  } catch {
    return { name: 'Git working tree', passed: false, detail: 'not a git repo' };
  }
}

async function checkInventory(root: string): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  // Source card count
  const cards = (await fs.readdir(path.join(root, 'corpus', 'source_cards')).catch(() => [])).filter((f) =>
    f.endsWith('.yaml'),
  );
  results.push({
    name: 'Source card corpus',
    passed: cards.length >= 7,
    detail: `${cards.length} verified cards`,
  });

  // Pattern library
  const patterns = (await fs.readdir(path.join(root, 'patterns')).catch(() => [])).filter((f) => f.endsWith('.yaml'));
  results.push({
    name: 'Capture-risk patterns',
    passed: patterns.length === 4,
    detail: `${patterns.length}/4 axes`,
  });

  // Run count — filter out hidden entries, ablation/hallucination subdirs,
  // and underscore-prefixed scratch directories (test fixtures, tmp runs).
  const runs = (await fs.readdir(path.join(root, 'runs')).catch(() => [])).filter(
    (f) =>
      !f.startsWith('.') &&
      !f.startsWith('_') &&
      !f.startsWith('ablation_') &&
      !f.startsWith('hallucination_'),
  );
  results.push({
    name: 'Benchmark runs',
    passed: runs.length >= 1,
    detail: `${runs.length} run${runs.length === 1 ? '' : 's'} under runs/`,
  });

  // Paper
  const paperPdf = await fileSize(path.join(root, 'paper', 'probe.pdf'));
  if (paperPdf) {
    results.push({
      name: 'Paper PDF',
      passed: true,
      detail: `${(paperPdf / 1024).toFixed(0)} KB at paper/probe.pdf`,
    });
  } else {
    results.push({
      name: 'Paper PDF',
      passed: false,
      detail: 'missing — run `probe build-paper`',
      warning: true,
    });
  }

  return results;
}

async function fileSize(p: string): Promise<number | null> {
  try {
    const s = await fs.stat(p);
    return s.size;
  } catch {
    return null;
  }
}
