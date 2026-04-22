import { describe, it, expect } from 'vitest';
import { generateRunId } from '../src/cli/run.js';

/**
 * Regression test for the run_id schema violation.
 *
 * Every schema file under schemas/ declares run_id as:
 *   { "type": "string", "pattern": "^[a-z0-9_-]{3,64}$" }
 *
 * An earlier implementation used `new Date().toISOString()` which produces
 * "2026-04-22T12:31:12.000Z" — the uppercase 'T' fails the pattern and the
 * first stage that validates against schema rejects the run on fresh calls
 * from the README quick-start. The test pins the generator format so we
 * don't regress.
 */
describe('generateRunId', () => {
  const schemaPattern = /^[a-z0-9_-]{3,64}$/;

  it('satisfies the run_id schema pattern for a typical premise', () => {
    const id = generateRunId('Voice-first transit app for blind users');
    expect(id).toMatch(schemaPattern);
  });

  it('satisfies the pattern for punctuation-heavy premises', () => {
    const id = generateRunId('What if — AI disclosure? (2026) // test');
    expect(id).toMatch(schemaPattern);
  });

  it('contains no uppercase characters', () => {
    const id = generateRunId('Some Research Premise With Caps');
    expect(id).toBe(id.toLowerCase());
  });

  it('stays within the 64-char schema ceiling', () => {
    const long = 'a'.repeat(200);
    const id = generateRunId(long);
    expect(id.length).toBeLessThanOrEqual(64);
    expect(id).toMatch(schemaPattern);
  });

  it('produces a usable id even when the slug is empty', () => {
    const id = generateRunId('!!!@@@###');
    expect(id).toMatch(schemaPattern);
    expect(id.length).toBeGreaterThanOrEqual(3);
  });
});
