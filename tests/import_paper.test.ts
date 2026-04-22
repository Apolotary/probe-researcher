import { describe, it, expect } from 'vitest';
import { checkProvenance } from '../src/lint/provenance.js';

/**
 * Tests for the probe import feature. The end-to-end import flow hits the
 * Anthropic API (Sonnet classifier) and is covered by a manual demo run.
 * These tests exercise the linter-visible surface: the new IMPORTED_DRAFT
 * tag and its interaction with the strict-inference rule.
 */
describe('[IMPORTED_DRAFT] provenance tag', () => {
  it('is accepted as a valid tag at the end of an element', () => {
    const md = `# Guidebook

The authors propose an ARIA-live banner prototype. [IMPORTED_DRAFT:prototype]

Handoff. [HUMAN_REQUIRED]`;
    const r = checkProvenance(md);
    expect(r.passed).toBe(true);
    expect(r.tagCounts.IMPORTED_DRAFT).toBe(1);
  });

  it('accepts both plain [IMPORTED_DRAFT] and sub-typed [IMPORTED_DRAFT:section]', () => {
    const md = `# Imported draft

Premise text from the paper. [IMPORTED_DRAFT:premise]

Method text from the paper. [IMPORTED_DRAFT:method]

Plain imported without subtype. [IMPORTED_DRAFT]

Handoff. [HUMAN_REQUIRED]`;
    const r = checkProvenance(md);
    expect(r.passed).toBe(true);
    expect(r.tagCounts.IMPORTED_DRAFT).toBe(3);
  });

  it('counts as a grounded anchor for strict-inference', () => {
    // An AGENT_INFERENCE paragraph following an IMPORTED_DRAFT paragraph
    // should pass strict-inference because IMPORTED_DRAFT is the researcher's
    // own text and counts as the strongest anchor available.
    const md = `# Import audit

The authors describe a longitudinal evaluation of an AI writing assistant for dyslexic users over a 12-week period. [IMPORTED_DRAFT:method]

This evaluation window is long enough that accumulated reliance on the assistant could reshape participants' writing practice in ways the post-test does not measure. [AGENT_INFERENCE]

Handoff. [HUMAN_REQUIRED]`;
    const r = checkProvenance(md, { strictInference: true });
    expect(r.passed).toBe(true);
  });

  it('rejects an [IMPORTED_DRAFT] tag that is not the final token', () => {
    const md = `# Guidebook

The [IMPORTED_DRAFT] category lets Probe audit existing drafts rather than paraphrasing them.

Handoff. [HUMAN_REQUIRED]`;
    const r = checkProvenance(md);
    expect(r.passed).toBe(false);
    expect(r.violations.some((v) => /not the final token/.test(v))).toBe(true);
  });
});
