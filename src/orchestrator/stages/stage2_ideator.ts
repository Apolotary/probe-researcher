import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { callClaude } from '../../anthropic/client.js';
import { parseJsonFromModel, validateAgainst } from '../../schema/validate.js';
import { agentPromptPath, branchDir, runDir, projectRoot } from '../../util/paths.js';
import { writeJson } from '../stage_util.js';

const pExecFile = promisify(execFile);

interface Stage2Args {
  runId: string;
}

interface BranchCard {
  branch_id: string;
  research_question: string;
  intervention_primitive: string;
  human_system_relationship: string;
  method_family: string;
  [k: string]: unknown;
}

/**
 * Stage 2 is special: one model call produces three outputs, then three
 * worktrees are created. Can't use the standard runJsonStage helper.
 */
export async function runStageIdeator(args: Stage2Args): Promise<string[]> {
  const premisePath = path.join(runDir(args.runId), 'premise_card.json');
  const premiseJson = await fs.readFile(premisePath, 'utf8');
  const system = await fs.readFile(agentPromptPath('ideator'), 'utf8');
  let userMessage = `run_id: ${args.runId}\n\npremise_card:\n${premiseJson}\n`;

  let branches: BranchCard[] = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await callClaude({
      stage: '2_ideator',
      runId: args.runId,
      model: 'opus',
      system,
      userMessage,
      maxTokens: 4096,
      temperature: attempt === 0 ? 0.9 : 0.4,
    });

    let parsed: unknown;
    try {
      parsed = parseJsonFromModel(response.text);
    } catch (e) {
      if (attempt === 1) throw new Error(`stage 2 JSON parse failed after repair: ${String(e)}`);
      userMessage = augment(userMessage, response.text, `Not valid JSON: ${String(e)}`);
      continue;
    }

    if (!Array.isArray(parsed) || parsed.length !== 3) {
      if (attempt === 1) throw new Error(`stage 2 expected 3-element array`);
      userMessage = augment(userMessage, response.text, 'Output must be a JSON array of exactly 3 branch_card objects.');
      continue;
    }

    let allValid = true;
    const errors: string[] = [];
    for (const branch of parsed as BranchCard[]) {
      const result = await validateAgainst('branch_card', branch);
      if (!result.valid) {
        allValid = false;
        errors.push(`branch ${branch.branch_id ?? '?'}: ${result.errors.join('; ')}`);
      }
    }
    if (!allValid) {
      if (attempt === 1) throw new Error(`stage 2 schema validation failed after repair:\n${errors.join('\n')}`);
      userMessage = augment(userMessage, response.text, `Schema violations:\n${errors.join('\n')}`);
      continue;
    }

    const divergenceCheck = checkDivergence(parsed as BranchCard[]);
    if (!divergenceCheck.passed) {
      if (attempt === 1) throw new Error(`stage 2 divergence check failed: ${divergenceCheck.reason}`);
      userMessage = augment(userMessage, response.text, `Divergence check failed: ${divergenceCheck.reason}`);
      continue;
    }

    branches = parsed as BranchCard[];
    break;
  }

  const branchIds: string[] = [];
  for (const branch of branches) {
    const id = branch.branch_id;
    const dir = branchDir(args.runId, id);
    await fs.mkdir(dir, { recursive: true });
    await ensureWorktree(args.runId, id, dir);
    await writeJson(path.join(dir, 'branch_card.json'), branch);
    branchIds.push(id);
  }
  return branchIds;
}

function augment(base: string, previous: string, reason: string): string {
  return (
    base +
    `\n\nYour previous output must be corrected.\n` +
    `Reason: ${reason}\n` +
    `Previous (truncated):\n${previous.slice(0, 800)}\n` +
    `Return only the corrected JSON array.`
  );
}

function checkDivergence(branches: BranchCard[]): { passed: boolean; reason: string } {
  const rq = new Set(branches.map((b) => normalize(b.research_question)));
  const ip = new Set(branches.map((b) => normalize(b.intervention_primitive)));
  const hs = new Set(branches.map((b) => b.human_system_relationship));
  const mf = new Set(branches.map((b) => b.method_family));
  if (rq.size < 3) return { passed: false, reason: 'research_question values are not distinct' };
  if (ip.size < 3) return { passed: false, reason: 'intervention_primitive values are not distinct' };
  if (hs.size < 3) return { passed: false, reason: 'human_system_relationship values must all differ' };
  if (mf.size < 3) return { passed: false, reason: 'method_family values must all differ' };
  return { passed: true, reason: 'ok' };
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

async function ensureWorktree(runId: string, branchId: string, dir: string): Promise<void> {
  // Derive a readable branch name from the run id. Previous version used
  // `runId.slice(-12)` which took the LAST 12 chars — the suffix is often
  // the most-identifying part of the id, but for short ids like
  // "backlog_e2ee_ai" (15 chars) it chopped the first 3 and yielded
  // "klog_e2ee_ai", which looked like a typo in the branch name. We now
  // strip common prefixes + truncate from the end instead, so short ids
  // stay readable and long ids stay git-log-friendly.
  const stripped = runId.replace(/^(backlog_|adversarial_|benchmark_|import_|_?test_)/, '');
  const slug = stripped.slice(-16).replace(/^[-_]+/, '');
  const branchName = `run-${slug}-${branchId}`;
  // CRITICAL: pin cwd to the project root. Without this, `git worktree add`
  // runs from wherever the user invoked `probe` (which via npm link is
  // often an unrelated directory like ~/probe-test), and git complains
  // "not a git repository". The project root is always the probe-researcher
  // clone, which either is a git repo or gets one via ensureRunDir's
  // auto-init path in src/orchestrator/run_dir.ts.
  try {
    await pExecFile('git', ['worktree', 'add', '-B', branchName, dir, 'HEAD'], {
      cwd: projectRoot(),
    });
  } catch (e) {
    const msg = String((e as Error).message);
    if (!/already exists|is not empty|fatal: invalid reference/.test(msg)) {
      throw e;
    }
  }
}
