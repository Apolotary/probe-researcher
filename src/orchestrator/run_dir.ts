import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { runDir } from '../util/paths.js';
import { projectRoot } from '../util/paths.js';
import type { CostLog } from './types.js';

const pExecFile = promisify(execFile);

export async function ensureRunDir(runId: string): Promise<void> {
  // Probe's pipeline creates a real git worktree per branch. Worktrees
  // need a parent git repository. When `probe` is installed globally
  // (via npm link) and invoked from a non-repo directory like ~/probe-test,
  // we need to initialize the project root as a git repo on first run
  // so `git worktree add` doesn't fail with "not a git repository".
  await ensureProjectRootIsGitRepo();

  const dir = runDir(runId);
  await fs.mkdir(path.join(dir, 'branches'), { recursive: true });
  const costPath = path.join(dir, 'cost.json');
  try {
    await fs.access(costPath);
  } catch {
    const initial: CostLog = {
      run_id: runId,
      stages: [],
      totals: { input_tokens: 0, output_tokens: 0, usd: 0 },
    };
    await fs.writeFile(costPath, JSON.stringify(initial, null, 2));
  }
}

async function ensureProjectRootIsGitRepo(): Promise<void> {
  const root = projectRoot();
  try {
    await pExecFile('git', ['rev-parse', '--git-dir'], { cwd: root });
    return; // already a git repo
  } catch {
    // fall through to init
  }
  try {
    await pExecFile('git', ['init', '--initial-branch=main'], { cwd: root });
  } catch {
    // Older git doesn't support --initial-branch; retry with plain init.
    await pExecFile('git', ['init'], { cwd: root });
  }
  // Worktrees need at least one commit — they branch off HEAD. Make an
  // empty bootstrap commit so `git worktree add … HEAD` resolves.
  try {
    await pExecFile('git', ['-c', 'user.name=probe', '-c', 'user.email=probe@local',
      'commit', '--allow-empty', '-m', 'probe: bootstrap commit for worktree branches'], { cwd: root });
  } catch {
    // If a commit already exists (concurrent init), ignore.
  }
  // Light-weight .gitignore so the user doesn't accidentally commit huge
  // runs/ artifacts if they `git add .` later. Only written if missing.
  const giPath = path.join(root, '.gitignore');
  try {
    await fs.access(giPath);
  } catch {
    await fs.writeFile(
      giPath,
      'node_modules/\ndist/\n.env\n.env.local\nANTHROPIC_API_KEY*\nOPENAI_API_KEY*\n# runs/ contains generated artifacts — track selectively\n',
    );
  }
}

export async function writePremiseInput(runId: string, premise: string): Promise<void> {
  const p = path.join(runDir(runId), 'premise.md');
  const body = `# Research premise\n\n${premise}\n`;
  await fs.writeFile(p, body);
}

/**
 * Per-run promise chain serializing cost.json read-modify-write sequences.
 *
 * Stages 3-7 run across three branches in parallel via Promise.all. Without
 * serialization, two branches completing simultaneously could both read the
 * same cost.json, both append their own entry to an in-memory copy, and the
 * second write would silently discard the first. Chaining each append onto
 * the previous one guarantees the write sequence is linear per run.
 */
const costWriteChains = new Map<string, Promise<void>>();

export async function appendCost(
  runId: string,
  entry: CostLog['stages'][number],
): Promise<void> {
  const prior = costWriteChains.get(runId) ?? Promise.resolve();
  const next = prior.then(() => writeCostEntry(runId, entry));
  // Replace the chain's tail with a never-rejecting promise so a single
  // write failure doesn't poison subsequent appends for the same run.
  costWriteChains.set(
    runId,
    next.catch(() => undefined),
  );
  return next;
}

async function writeCostEntry(runId: string, entry: CostLog['stages'][number]): Promise<void> {
  const p = path.join(runDir(runId), 'cost.json');
  const raw = await fs.readFile(p, 'utf8');
  const log = JSON.parse(raw) as CostLog;
  log.stages.push(entry);
  log.totals.input_tokens += entry.input_tokens;
  log.totals.output_tokens += entry.output_tokens;
  log.totals.usd += entry.usd;
  await fs.writeFile(p, JSON.stringify(log, null, 2));
}
