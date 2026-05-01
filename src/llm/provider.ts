/**
 * LLM provider abstraction. Probe was built against Claude Opus 4.7 /
 * Sonnet 4.6 and the paper's capability claims are specifically about
 * those models. This module adds a principled fallback path for users
 * who have an OpenAI key but not an Anthropic one, and a demo mode for
 * users with neither (so the CLI still opens without crashing).
 *
 * Precedence: anthropic > openai > demo.
 *
 * Cost model: each provider has its own per-MTok pricing table. Costs
 * emitted into runs/<id>/cost.json are calculated with the active
 * provider's pricing, so the cost log is still accurate regardless of
 * which provider served the call.
 *
 * Honest caveat: the capability claims (Opus's sustained role-separation
 * under flattery pressure, Sonnet's ablation data) DO NOT generalize
 * when OpenAI is backing the call. The paper documents Anthropic
 * behavior; a user running Probe with OpenAI models gets working
 * infrastructure but the specific Opus/Sonnet comparative findings
 * become an Anthropic-specific footnote rather than a live claim.
 */

export type ProviderName = 'anthropic' | 'openai' | 'demo';

export interface ProviderInfo {
  name: ProviderName;
  /** True when the provider can actually service API calls. */
  canCallApi: boolean;
  /** Short human description for the UI. */
  label: string;
  /** Longer description shown in the interactive menu. */
  description: string;
}

import { resolveKey } from '../config/probe_toml.js';

/**
 * Detect the active provider, taking BOTH environment variables and stored
 * config keys into account (env wins). Returns the most-capable provider
 * that has any usable key.
 *
 * Note for the new web UI surface: live `/api/probe/<stage>` calls only
 * dispatch to Anthropic right now (see `src/llm/probe_calls.ts`). OpenAI
 * detection is preserved here because the older offline pipeline can still
 * use it, but the web stage path will throw if it sees a non-Anthropic
 * provider — and the frontend's stock-content fallback handles that case.
 */
export function detectProvider(): ProviderInfo {
  const hasAnthropic = resolveKey('anthropic').source !== 'unset';
  const hasOpenAI = resolveKey('openai').source !== 'unset';
  const forced = process.env.PROBE_PROVIDER;

  if (forced === 'anthropic' && hasAnthropic) return anthropicInfo();
  if (forced === 'openai' && hasOpenAI) return openaiInfo();
  if (forced === 'demo') return demoInfo();

  if (hasAnthropic) return anthropicInfo();
  if (hasOpenAI) return openaiInfo('fallback');
  return demoInfo();
}

/**
 * Whether the live-web `/api/probe/<stage>` path can actually serve a real
 * LLM response. Returns true if either Anthropic or OpenAI has a usable
 * key — `probe_calls.ts` dispatches to whichever provider `detectProvider`
 * resolves. Used by `/api/probe/status` so the frontend knows when to skip
 * the stock-content fallback.
 */
export function canRunLiveWeb(): boolean {
  return (
    resolveKey('anthropic').source !== 'unset' ||
    resolveKey('openai').source !== 'unset'
  );
}

function anthropicInfo(): ProviderInfo {
  return {
    name: 'anthropic',
    canCallApi: true,
    label: 'Anthropic · Claude Opus 4.7 / Sonnet 4.6',
    description:
      'Primary provider. The paper\'s capability claims are grounded in these models.',
  };
}

function openaiInfo(mode: 'primary' | 'fallback' = 'primary'): ProviderInfo {
  return {
    name: 'openai',
    canCallApi: true,
    label: mode === 'fallback'
      ? 'OpenAI · fallback (no ANTHROPIC_API_KEY set)'
      : 'OpenAI · forced via PROBE_PROVIDER=openai',
    description:
      'Functional. Probe\'s model-specific findings in the paper do not generalize to this backend — treat outputs as infrastructure-correct but not capability-audited.',
  };
}

function demoInfo(): ProviderInfo {
  return {
    name: 'demo',
    canCallApi: false,
    label: 'Demo mode · no API keys detected',
    description:
      'Read-only. You can explore shipped runs, run linters, render report pages, and inspect the pipeline UI — anything that does not spend API credit.',
  };
}

export interface ModelSpec {
  /** ModelChoice the caller requested; 'opus' is the stronger model, 'sonnet' is the cheaper/faster one. */
  choice: 'opus' | 'sonnet';
  /** Resolved provider-specific model id — e.g. "claude-opus-4-7", "gpt-5". */
  modelId: string;
  /** USD per 1M input tokens. */
  inUsd: number;
  /** USD per 1M output tokens. */
  outUsd: number;
}

export function resolveModel(provider: ProviderName, choice: 'opus' | 'sonnet'): ModelSpec {
  if (provider === 'anthropic') {
    const opusId = process.env.PROBE_OPUS_MODEL ?? 'claude-opus-4-7';
    const sonnetId = process.env.PROBE_SONNET_MODEL ?? 'claude-sonnet-4-6';
    const modelId = choice === 'opus' ? opusId : sonnetId;
    const pricing =
      modelId === opusId
        ? { inUsd: 5, outUsd: 25 }
        : { inUsd: 3, outUsd: 15 };
    return { choice, modelId, ...pricing };
  }
  if (provider === 'openai') {
    // Defaults are conservative, widely-available OpenAI models. Users with
    // access to frontier models (gpt-5, o-series) can override via env.
    // Pricing reflects published list prices as of Q2 2026; the env
    // variables exist to let users track price changes without a code edit.
    const opusId = process.env.PROBE_OPENAI_OPUS_MODEL ?? 'gpt-5';
    const sonnetId = process.env.PROBE_OPENAI_SONNET_MODEL ?? 'gpt-4.1-mini';
    const modelId = choice === 'opus' ? opusId : sonnetId;
    const pricing =
      choice === 'opus'
        ? { inUsd: parseFloat(process.env.PROBE_OPENAI_OPUS_USD_IN ?? '10'), outUsd: parseFloat(process.env.PROBE_OPENAI_OPUS_USD_OUT ?? '30') }
        : { inUsd: parseFloat(process.env.PROBE_OPENAI_SONNET_USD_IN ?? '0.4'), outUsd: parseFloat(process.env.PROBE_OPENAI_SONNET_USD_OUT ?? '1.6') };
    return { choice, modelId, ...pricing };
  }
  // demo
  return { choice, modelId: 'demo-no-op', inUsd: 0, outUsd: 0 };
}

export class NoApiKeysError extends Error {
  constructor() {
    super(
      'No provider API key detected. Set ANTHROPIC_API_KEY (preferred) or OPENAI_API_KEY, or use demo-only commands (probe stats, probe lint, probe render, probe explore, probe report-page).',
    );
    this.name = 'NoApiKeysError';
  }
}
