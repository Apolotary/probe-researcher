import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { callClaude } from '../../anthropic/client.js';
import { parseJsonFromModel, validateAgainst } from '../../schema/validate.js';
import { agentPromptPath, branchDir, runDir } from '../../util/paths.js';

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

export async function runStageIdeator(args: Stage2Args): Promise<string[]> {
  const premisePath = path.join(runDir(args.runId), 'premise_card.json');
  const premiseJson = await fs.readFile(premisePath, 'utf8');
  const system = await fs.readFile(agentPromptPath('ideator'), 'utf8');
  const userMessage = `run_id: ${args.runId}\n\npremise_card:\n${premiseJson}\n`;

  let response = await callClaude({
    stage: '2_ideator',
    runId: args.runId,
    model: 'opus',
    system,
    userMessage,
    maxTokens: 4096,
    temperature: 0.9,
  });

  let branches: BranchCard[] = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    let parsed: unknown;
    try {
      parsed = parseJsonFromModel(response.text);
    } catch (e) {
      if (attempt === 1) throw new Error(`stage 2 JSON parse failed after repair: ${String(e)}`);
      response = await repair(args.runId, system, userMessage, response.text, String(e));
      continue;
    }

    if (!Array.isArray(parsed) || parsed.length !== 3) {
      if (attempt === 1) throw new Error(`stage 2 expected 3-element array, got ${JSON.stringify(parsed).slice(0, 200)}`);
      response = await repair(
        args.runId,
        system,
        userMessage,
        response.text,
        'Output must be a JSON array of exactly 3 branch_card objects.',
      );
      continue;
    }

    // Validate each branch
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
      response = await repair(args.runId, system, userMessage, response.text, errors.join('\n'));
      continue;
    }

    // Divergence self-check
    const divergenceCheck = checkDivergence(parsed as BranchCard[]);
    if (!divergenceCheck.passed) {
      if (attempt === 1) throw new Error(`stage 2 divergence check failed: ${divergenceCheck.reason}`);
      response = await repair(args.runId, system, userMessage, response.text, `Divergence check failed: ${divergenceCheck.reason}`);
      continue;
    }

    branches = parsed as BranchCard[];
    break;
  }

  // Write each branch card + create worktrees.
  const branchIds: string[] = [];
  for (const branch of branches) {
    const id = branch.branch_id;
    const dir = branchDir(args.runId, id);
    await fs.mkdir(dir, { recursive: true });
    await ensureWorktree(args.runId, id, dir);
    const out = path.join(dir, 'branch_card.json');
    await fs.writeFile(out, JSON.stringify(branch, null, 2) + '\n');
    branchIds.push(id);
  }
  return branchIds;
}

async function repair(
  runId: string,
  system: string,
  userMessage: string,
  previous: string,
  reason: string,
) {
  return callClaude({
    stage: '2_ideator',
    runId,
    model: 'opus',
    system,
    userMessage:
      userMessage +
      `\n\nYour previous output must be corrected.\n` +
      `Reason: ${reason}\n` +
      `Previous (truncated):\n${previous.slice(0, 800)}\n` +
      `Return only the corrected JSON array. No fences, no commentary.`,
    maxTokens: 4096,
    temperature: 0.4,
  });
}

function checkDivergence(
  branches: BranchCard[],
): { passed: boolean; reason: string } {
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
  // Worktree creation uses git plumbing. Skip if a worktree is already there.
  // For the demo, the orchestrator creates a short-lived branch named
  // run-<runId>-<branchId> pointing at HEAD, then sets up the worktree.
  const branchName = `run-${runId.slice(-12)}-${branchId}`;
  try {
    await pExecFile('git', ['worktree', 'add', '-B', branchName, dir, 'HEAD']);
  } catch (e) {
    const msg = String((e as Error).message);
    // Fallback: if worktree add fails (e.g., path exists without .git), continue
    // without crashing — the branch directory is still usable as a plain folder.
    if (!/already exists|is not empty|fatal: invalid reference/.test(msg)) {
      throw e;
    }
  }
}
