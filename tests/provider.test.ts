import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { detectProvider, resolveModel } from '../src/llm/provider.js';

/**
 * Provider detection is env-driven — the tests temporarily wipe keys
 * and restore them so other tests that share the suite don't see a
 * modified env.
 */
describe('detectProvider', () => {
  const originalAnthropic = process.env.ANTHROPIC_API_KEY;
  const originalOpenAI = process.env.OPENAI_API_KEY;
  const originalForced = process.env.PROBE_PROVIDER;

  beforeEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.PROBE_PROVIDER;
  });

  afterEach(() => {
    if (originalAnthropic !== undefined) process.env.ANTHROPIC_API_KEY = originalAnthropic;
    if (originalOpenAI !== undefined) process.env.OPENAI_API_KEY = originalOpenAI;
    if (originalForced !== undefined) process.env.PROBE_PROVIDER = originalForced;
  });

  it('returns demo mode when no keys are set', () => {
    const p = detectProvider();
    expect(p.name).toBe('demo');
    expect(p.canCallApi).toBe(false);
  });

  it('prefers anthropic when both keys are set', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-...';
    process.env.OPENAI_API_KEY = 'sk-...';
    const p = detectProvider();
    expect(p.name).toBe('anthropic');
    expect(p.canCallApi).toBe(true);
  });

  it('falls back to openai when only openai key is set', () => {
    process.env.OPENAI_API_KEY = 'sk-...';
    const p = detectProvider();
    expect(p.name).toBe('openai');
    expect(p.canCallApi).toBe(true);
    expect(p.label).toContain('fallback');
  });

  it('PROBE_PROVIDER=openai forces openai even when anthropic key is present', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-...';
    process.env.OPENAI_API_KEY = 'sk-...';
    process.env.PROBE_PROVIDER = 'openai';
    const p = detectProvider();
    expect(p.name).toBe('openai');
  });

  it('PROBE_PROVIDER=demo forces demo mode even when keys are present', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-...';
    process.env.PROBE_PROVIDER = 'demo';
    const p = detectProvider();
    expect(p.name).toBe('demo');
  });

  it('PROBE_PROVIDER=anthropic is ignored when no anthropic key is set', () => {
    process.env.OPENAI_API_KEY = 'sk-...';
    process.env.PROBE_PROVIDER = 'anthropic';
    const p = detectProvider();
    // Falls through to normal precedence → openai
    expect(p.name).toBe('openai');
  });
});

describe('resolveModel', () => {
  it('maps anthropic opus/sonnet to the expected model ids + pricing', () => {
    const opus = resolveModel('anthropic', 'opus');
    expect(opus.modelId).toBe('claude-opus-4-7');
    expect(opus.inUsd).toBe(5);
    expect(opus.outUsd).toBe(25);

    const sonnet = resolveModel('anthropic', 'sonnet');
    expect(sonnet.modelId).toBe('claude-sonnet-4-6');
    expect(sonnet.inUsd).toBe(3);
    expect(sonnet.outUsd).toBe(15);
  });

  it('maps openai opus-tier/sonnet-tier to default GPT model ids', () => {
    const opus = resolveModel('openai', 'opus');
    expect(opus.modelId).toBe('gpt-5');
    const sonnet = resolveModel('openai', 'sonnet');
    expect(sonnet.modelId).toBe('gpt-4.1-mini');
  });

  it('honors PROBE_OPENAI_OPUS_MODEL override', () => {
    const original = process.env.PROBE_OPENAI_OPUS_MODEL;
    process.env.PROBE_OPENAI_OPUS_MODEL = 'gpt-5-custom';
    try {
      const opus = resolveModel('openai', 'opus');
      expect(opus.modelId).toBe('gpt-5-custom');
    } finally {
      if (original !== undefined) process.env.PROBE_OPENAI_OPUS_MODEL = original;
      else delete process.env.PROBE_OPENAI_OPUS_MODEL;
    }
  });

  it('demo provider returns a no-op placeholder with zero cost', () => {
    const opus = resolveModel('demo', 'opus');
    expect(opus.modelId).toBe('demo-no-op');
    expect(opus.inUsd).toBe(0);
    expect(opus.outUsd).toBe(0);
  });
});
