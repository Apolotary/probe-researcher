import { describe, it, expect } from 'vitest';
import { checkForbiddenPhrases } from '../src/lint/forbidden.js';

describe('forbidden-phrase linter', () => {
  it('passes on clean hedged rehearsal prose', () => {
    const md = `A user encountering this flow would likely experience friction. [SIMULATION_REHEARSAL]`;
    const r = checkForbiddenPhrases(md);
    expect(r.passed).toBe(true);
    expect(r.violations).toHaveLength(0);
  });

  it('flags "users preferred"', () => {
    const md = `Users preferred the alternate flow. [SIMULATION_REHEARSAL]`;
    const r = checkForbiddenPhrases(md);
    expect(r.passed).toBe(false);
    expect(r.violations[0]).toMatch(/Users preferred/i);
  });

  it('flags "participants reported"', () => {
    const md = `Participants reported high satisfaction. [SIMULATION_REHEARSAL]`;
    const r = checkForbiddenPhrases(md);
    expect(r.passed).toBe(false);
  });

  it('flags "findings show"', () => {
    const md = `The findings show clear support for the hypothesis. [SIMULATION_REHEARSAL]`;
    const r = checkForbiddenPhrases(md);
    expect(r.passed).toBe(false);
  });

  it('flags "significant"', () => {
    const md = `Significant improvement was observed. [SIMULATION_REHEARSAL]`;
    const r = checkForbiddenPhrases(md);
    expect(r.passed).toBe(false);
  });

  it('flags "validated"', () => {
    const md = `The approach was validated in pilot tests. [SIMULATION_REHEARSAL]`;
    const r = checkForbiddenPhrases(md);
    expect(r.passed).toBe(false);
  });

  it('allows forbidden phrases inside blockquotes (third-party content)', () => {
    const md = `> users preferred the alternate flow, the reviewer said. [AGENT_INFERENCE]`;
    const r = checkForbiddenPhrases(md);
    expect(r.passed).toBe(true);
  });

  it('allows forbidden phrases inside double-quoted strings', () => {
    const md = `The reviewer wrote, "users preferred X", in their critique. [AGENT_INFERENCE]`;
    const r = checkForbiddenPhrases(md);
    expect(r.passed).toBe(true);
  });
});
