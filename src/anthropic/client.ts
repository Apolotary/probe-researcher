import Anthropic from '@anthropic-ai/sdk';
import { appendCost } from '../orchestrator/run_dir.js';
import type { StageCost, StageId } from '../orchestrator/types.js';

/**
 * Thin wrapper around the Anthropic SDK. Responsibilities:
 * - model routing (opus vs sonnet) per stage
 * - cost estimation using published per-MTok rates
 * - logging every call to runs/<id>/cost.json
 * - NOT response prefilling (Opus 4.7 / Sonnet 4.6 don't support it)
 */

const OPUS_MODEL = process.env.PROBE_OPUS_MODEL ?? 'claude-opus-4-7';
const SONNET_MODEL = process.env.PROBE_SONNET_MODEL ?? 'claude-sonnet-4-6';

// USD per 1M tokens, verified at kickoff.
const PRICING: Record<string, { inUsd: number; outUsd: number }> = {
  [OPUS_MODEL]: { inUsd: 5, outUsd: 25 },
  [SONNET_MODEL]: { inUsd: 3, outUsd: 15 },
};

export type ModelChoice = 'opus' | 'sonnet';

let clientInstance: Anthropic | null = null;
function client(): Anthropic {
  if (!clientInstance) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not set; see .env.example');
    }
    clientInstance = new Anthropic({ apiKey });
  }
  return clientInstance;
}

export interface CallOptions {
  stage: StageId;
  branchId?: string;
  runId: string;
  model: ModelChoice;
  system: string;
  userMessage: string;
  maxTokens?: number;
  /** Accepted but ignored — Opus 4.7 deprecates this parameter. */
  temperature?: number;
}

export interface CallResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  usd: number;
  modelId: string;
  durationMs: number;
}

export async function callClaude(opts: CallOptions): Promise<CallResult> {
  // PROBE_FORCE_SONNET=1 collapses all Opus calls to Sonnet. Used for the
  // overnight test batch on user instruction (2026-04-22) when budget
  // pressure outweighs the CLAUDE.md hard constraint against downgrading
  // stages 5-7. Flag is opt-in and always logged so the effect is visible
  // in the run's cost.json (model field).
  let effectiveModel: ModelChoice = opts.model;
  if (process.env.PROBE_FORCE_SONNET === '1' && opts.model === 'opus') {
    effectiveModel = 'sonnet';
  }
  const modelId = effectiveModel === 'opus' ? OPUS_MODEL : SONNET_MODEL;
  const pricing = PRICING[modelId];
  if (!pricing) throw new Error(`no pricing entry for ${modelId}`);

  // Opus 4.7 does not accept temperature. Sonnet 4.6 still does, but we
  // keep behavior consistent across models by omitting temperature for all
  // calls — the agent prompts carry the behavioral direction instead.
  const start = Date.now();
  const response = await client().messages.create({
    model: modelId,
    max_tokens: opts.maxTokens ?? 8192,
    system: opts.system,
    messages: [{ role: 'user', content: opts.userMessage }],
  });
  const durationMs = Date.now() - start;

  const text = response.content
    .filter((c): c is Anthropic.Messages.TextBlock => c.type === 'text')
    .map((c) => c.text)
    .join('');

  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;
  const usd = (inputTokens / 1_000_000) * pricing.inUsd + (outputTokens / 1_000_000) * pricing.outUsd;

  const costEntry: StageCost = {
    stage: opts.stage,
    branch_id: opts.branchId,
    model: modelId,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    usd,
    duration_ms: durationMs,
  };
  await appendCost(opts.runId, costEntry);

  return { text, inputTokens, outputTokens, usd, modelId, durationMs };
}
