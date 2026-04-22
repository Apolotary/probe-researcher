import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { appendCost } from '../orchestrator/run_dir.js';
import type { StageCost, StageId } from '../orchestrator/types.js';
import { detectProvider, resolveModel, NoApiKeysError, type ProviderName } from '../llm/provider.js';

/**
 * Thin wrapper around the model providers. Responsibilities:
 * - provider selection (anthropic preferred, openai fallback)
 * - model routing (opus-tier vs sonnet-tier) per stage
 * - cost estimation using published per-MTok rates
 * - logging every call to runs/<id>/cost.json
 */

export type ModelChoice = 'opus' | 'sonnet';

let anthropicInstance: Anthropic | null = null;
let openaiInstance: OpenAI | null = null;

function anthropicClient(): Anthropic {
  if (!anthropicInstance) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set; see .env.example');
    anthropicInstance = new Anthropic({ apiKey });
  }
  return anthropicInstance;
}

function openaiClient(): OpenAI {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not set');
    openaiInstance = new OpenAI({ apiKey });
  }
  return openaiInstance;
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
  let effectiveChoice: ModelChoice = opts.model;
  if (process.env.PROBE_FORCE_SONNET === '1' && opts.model === 'opus') {
    effectiveChoice = 'sonnet';
  }

  const provider = detectProvider();
  if (!provider.canCallApi) throw new NoApiKeysError();

  const modelSpec = resolveModel(provider.name, effectiveChoice);
  const start = Date.now();

  const { text, inputTokens, outputTokens } = await dispatchCall(
    provider.name,
    modelSpec.modelId,
    opts,
  );

  const durationMs = Date.now() - start;
  const usd =
    (inputTokens / 1_000_000) * modelSpec.inUsd +
    (outputTokens / 1_000_000) * modelSpec.outUsd;

  const costEntry: StageCost = {
    stage: opts.stage,
    branch_id: opts.branchId,
    model: modelSpec.modelId,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    usd,
    duration_ms: durationMs,
  };
  await appendCost(opts.runId, costEntry);

  return { text, inputTokens, outputTokens, usd, modelId: modelSpec.modelId, durationMs };
}

async function dispatchCall(
  provider: ProviderName,
  modelId: string,
  opts: CallOptions,
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  if (provider === 'anthropic') {
    const response = await anthropicClient().messages.create({
      model: modelId,
      max_tokens: opts.maxTokens ?? 8192,
      system: opts.system,
      messages: [{ role: 'user', content: opts.userMessage }],
    });
    const text = response.content
      .filter((c): c is Anthropic.Messages.TextBlock => c.type === 'text')
      .map((c) => c.text)
      .join('');
    return {
      text,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };
  }

  if (provider === 'openai') {
    // OpenAI's Chat Completions API. System message goes in the messages
    // array rather than as a top-level field. The response text is in
    // choices[0].message.content. max_completion_tokens caps output.
    const response = await openaiClient().chat.completions.create({
      model: modelId,
      max_completion_tokens: opts.maxTokens ?? 8192,
      messages: [
        { role: 'system', content: opts.system },
        { role: 'user', content: opts.userMessage },
      ],
    });
    const text = response.choices[0]?.message?.content ?? '';
    return {
      text,
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
    };
  }

  throw new NoApiKeysError();
}
