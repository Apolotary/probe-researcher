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
import { loadKnownSourceCardIds } from '../lint/source_cards.js';

const pExecFile = promisify(execFile);

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
  warning?: boolean;
}

interface DoctorOptions {
  /** `--once` makes the command exit immediately after printing, for CI/scripts. */
  once?: boolean;
  /** `--watch` re-runs the checks every N seconds (default 30). */
  watch?: number | boolean;
}

export async function doctorCommand(opts: DoctorOptions = {}): Promise<void> {
  const runChecks = async (): Promise<{ failures: number; warnings: number; total: number }> => {
    const results: CheckResult[] = [];
    const root = projectRoot();

    results.push(await checkTypecheck(root));
    results.push(await checkTests(root));
    results.push(...(await checkGuidebooks(root)));
    results.push(await checkCommand('pandoc', 'pandoc --version'));
    results.push(await checkCommand('wkhtmltopdf', 'wkhtmltopdf --version'));
    results.push(await checkGit(root));
    results.push(...(await checkInventory(root)));

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
    }
    return { failures: failures.length, warnings: warnings.length, total: results.length };
  };

  const renderHeader = (): void => {
    console.log('');
    console.log(brand.header('🩺 probe doctor'));
    console.log(chalk.hex(palette.dim)(`pre-demo verification sweep · ${new Date().toLocaleTimeString()}`));
    console.log('');
  };

  renderHeader();
  const first = await runChecks();
  console.log('');

  // --once exits immediately. This is the CI-friendly / script-friendly
  // behavior; preserved as an opt-in because the previous default.
  if (opts.once) {
    if (first.failures > 0) process.exitCode = 1;
    return;
  }

  // Default: stay open until the user Ctrl+Cs. This is the terminal-
  // friendly behavior — the output stays visible rather than being
  // swallowed by the shell's next prompt. A single-line "press Ctrl+C"
  // hint makes the expectation explicit.
  const watchInterval =
    typeof opts.watch === 'number' ? opts.watch : opts.watch ? 30 : null;

  if (watchInterval === null) {
    console.log(chalk.hex(palette.dim)('Press Ctrl+C to exit. Pass --once to exit immediately (CI-friendly). Pass --watch [N] to re-run every N seconds.'));
    // Block on a never-resolving promise until SIGINT. Exit code is
    // carried over from the first check result.
    if (first.failures > 0) process.exitCode = 1;
    await new Promise(() => {
      /* intentionally blocks forever; Ctrl+C terminates the process */
    });
    return;
  }

  // --watch mode: re-run every N seconds until Ctrl+C.
  console.log(chalk.hex(palette.dim)(`Watching every ${watchInterval}s. Press Ctrl+C to exit.`));
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, watchInterval * 1000));
    console.log('');
    console.log(chalk.hex(palette.dim)(`—— re-checking at ${new Date().toLocaleTimeString()} ——`));
    console.log('');
    await runChecks();
    console.log('');
  }
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

  // Validate `[SOURCE_CARD:<id>]` references against the repo corpus.
  // Doctor checks shipped guidebooks, which are repo-internal — fabricated
  // card IDs here are a hard failure, not a soft warning.
  const knownSourceCards = await loadKnownSourceCardIds().catch(() => undefined);

  for (const e of entries) {
    const gb = path.join(runsDir, e, 'PROBE_GUIDEBOOK.md');
    try {
      const md = await fs.readFile(gb, 'utf8');
      const prov = checkProvenance(md, { knownSourceCards });
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
    // Categorise so a fresh clone with normal worktree drift doesn't look
    // alarming. Three buckets:
    //   - source: modified/staged tracked files outside runs/<id>/branches
    //     (these are real uncommitted code changes)
    //   - worktree: gitlink-mode entries under runs/*/branches/* — every
    //     active research-run worktree is one of these by design, the
    //     parent always lags behind the worktree's HEAD
    //   - untracked: ?? entries (new files not yet added)
    const lines = status.trim().split('\n');
    const isWorktreeBranch = (l: string) =>
      /^.M\s+runs\/[^/]+\/branches\/[^/]+\/?$/.test(l);
    const isUntracked = (l: string) => l.startsWith('??');
    const worktree = lines.filter(isWorktreeBranch).length;
    const untracked = lines.filter(isUntracked).length;
    const source = lines.length - worktree - untracked;
    if (source === 0) {
      const parts: string[] = ['source clean'];
      if (worktree > 0)  parts.push(`${worktree} worktree branch(es) drifted`);
      if (untracked > 0) parts.push(`${untracked} untracked`);
      return { name: 'Git working tree', passed: true, detail: parts.join(' · ') };
    }
    const parts: string[] = [`${source} source change(s)`];
    if (worktree > 0)  parts.push(`${worktree} worktree drift`);
    if (untracked > 0) parts.push(`${untracked} untracked`);
    return { name: 'Git working tree', passed: false, detail: parts.join(' · '), warning: true };
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
