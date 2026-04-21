import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { callClaude, type ModelChoice } from '../anthropic/client.js';
import { parseJsonFromModel, validateAgainst } from '../schema/validate.js';
import { agentPromptPath, branchDir } from '../util/paths.js';
import type { StageId } from './types.js';

const pExecFile = promisify(execFile);

export interface RunJsonStageArgs {
  runId: string;
  branchId?: string;
  stage: StageId;
  agentName: string;
  model: ModelChoice;
  userMessage: string;
  schemaName: string;
  /** If provided, runs a domain check after schema validation; on false, triggers repair. */
  postValidate?: (parsed: unknown) => { passed: boolean; reason: string };
  maxTokens?: number;
  temperature?: number;
}

/**
 * Canonical "call Claude, parse JSON, validate schema, repair once" loop.
 * Returns the validated parsed object on success. Throws on second failure.
 */
export async function runJsonStage(args: RunJsonStageArgs): Promise<unknown> {
  const system = await fs.readFile(agentPromptPath(args.agentName), 'utf8');
  let userMessage = args.userMessage;

  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await callClaude({
      stage: args.stage,
      branchId: args.branchId,
      runId: args.runId,
      model: args.model,
      system,
      userMessage,
      maxTokens: args.maxTokens ?? 4096,
      temperature: args.temperature ?? (attempt === 0 ? 0.5 : 0.2),
    });

    let parsed: unknown;
    try {
      parsed = parseJsonFromModel(response.text);
    } catch (e) {
      if (attempt === 1) {
        throw new Error(`${args.stage} JSON parse failed after repair: ${String(e)}`);
      }
      userMessage =
        args.userMessage +
        `\n\nYour previous output was not valid JSON:\n"""\n${response.text.slice(0, 600)}\n"""\n` +
        `Return only the corrected JSON, no fences, no commentary.`;
      continue;
    }

    const schemaResult = await validateAgainst(args.schemaName, parsed);
    if (!schemaResult.valid) {
      if (attempt === 1) {
        throw new Error(
          `${args.stage} schema validation failed after repair:\n${schemaResult.errors.join('\n')}`,
        );
      }
      userMessage =
        args.userMessage +
        `\n\nYour previous output failed schema validation:\n${schemaResult.errors.join('\n')}\n` +
        `Return only the corrected JSON.`;
      continue;
    }

    if (args.postValidate) {
      const postResult = args.postValidate(parsed);
      if (!postResult.passed) {
        if (attempt === 1) {
          throw new Error(`${args.stage} post-validation failed after repair: ${postResult.reason}`);
        }
        userMessage =
          args.userMessage +
          `\n\nYour previous output passed schema but failed domain check: ${postResult.reason}\n` +
          `Return only the corrected JSON.`;
        continue;
      }
    }

    return parsed;
  }
  throw new Error('unreachable');
}

export interface RunMarkdownStageArgs {
  runId: string;
  branchId?: string;
  stage: StageId;
  agentName: string;
  model: ModelChoice;
  userMessage: string;
  /** Optional post-generation lint — on failure, triggers a repair pass with the violations. */
  postValidate?: (markdown: string) => { passed: boolean; violations: string[] };
  maxTokens?: number;
  temperature?: number;
}

/**
 * Markdown variant — no schema, optional lint-based repair.
 */
export async function runMarkdownStage(args: RunMarkdownStageArgs): Promise<string> {
  const system = await fs.readFile(agentPromptPath(args.agentName), 'utf8');
  let userMessage = args.userMessage;

  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await callClaude({
      stage: args.stage,
      branchId: args.branchId,
      runId: args.runId,
      model: args.model,
      system,
      userMessage,
      maxTokens: args.maxTokens ?? 4096,
      temperature: args.temperature ?? (attempt === 0 ? 0.6 : 0.3),
    });

    let markdown = response.text.trim();
    // Strip fences if the model wrapped the output despite instructions
    markdown = markdown.replace(/^```(?:markdown)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');

    if (!args.postValidate) return markdown;
    const check = args.postValidate(markdown);
    if (check.passed) return markdown;
    if (attempt === 1) {
      throw new Error(
        `${args.stage} lint failed after repair:\n${check.violations.slice(0, 10).join('\n')}`,
      );
    }
    userMessage =
      args.userMessage +
      `\n\nYour previous output failed linting. Specific violations:\n${check.violations.slice(0, 20).join('\n')}\n` +
      `Correct only the flagged lines. Preserve the rest. Return the full corrected markdown.`;
  }
  throw new Error('unreachable');
}

/**
 * Commits a file in a branch worktree with a structured message.
 * Safe to call even if the worktree isn't a git worktree — no-op.
 */
export async function branchCommit(
  runId: string,
  branchId: string,
  message: string,
): Promise<void> {
  const dir = branchDir(runId, branchId);
  try {
    await pExecFile('git', ['-C', dir, 'add', '.']);
    await pExecFile('git', ['-C', dir, 'commit', '--allow-empty', '-m', message]);
  } catch {
    // Worktree may not be a git worktree (fallback mode); ignore commit errors.
  }
}

/**
 * Helper to write JSON with trailing newline.
 */
export async function writeJson(file: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2) + '\n');
}

export async function writeText(file: string, data: string): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, data.endsWith('\n') ? data : data + '\n');
}

export async function readJson<T = unknown>(file: string): Promise<T> {
  const raw = await fs.readFile(file, 'utf8');
  return JSON.parse(raw) as T;
}
