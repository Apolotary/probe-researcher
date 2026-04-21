import { describe, it, expect } from 'vitest';
import { checkProvenance } from '../src/lint/provenance.js';

describe('provenance linter', () => {
  it('passes on a document with tagged paragraph, bullet, blockquote, and HUMAN_REQUIRED', () => {
    const md = `# Guidebook

Tagged paragraph. [RESEARCHER_INPUT]

- tagged bullet [AGENT_INFERENCE]

> tagged blockquote [SOURCE_CARD:sanders_stappers_2014]

Handoff. [HUMAN_REQUIRED]`;
    const r = checkProvenance(md);
    expect(r.passed).toBe(true);
    expect(r.sourceCardsReferenced).toContain('sanders_stappers_2014');
  });

  it('fails when a paragraph is untagged', () => {
    const md = `# Guidebook

This paragraph has no provenance tag.

Handoff. [HUMAN_REQUIRED]`;
    const r = checkProvenance(md);
    expect(r.passed).toBe(false);
    expect(r.violations.join('\n')).toMatch(/missing provenance tag/);
  });

  it('fails when a list item is untagged', () => {
    const md = `# Guidebook

- untagged bullet

Handoff. [HUMAN_REQUIRED]`;
    const r = checkProvenance(md);
    expect(r.passed).toBe(false);
    expect(r.violations.some((v) => v.includes('list item'))).toBe(true);
  });

  it('fails when a blockquote is untagged', () => {
    const md = `# Guidebook

> untagged blockquote

Handoff. [HUMAN_REQUIRED]`;
    const r = checkProvenance(md);
    expect(r.passed).toBe(false);
    expect(r.violations.some((v) => v.includes('blockquote'))).toBe(true);
  });

  it('requires at least one HUMAN_REQUIRED element', () => {
    const md = `# Guidebook

Tagged paragraph. [RESEARCHER_INPUT]`;
    const r = checkProvenance(md);
    expect(r.passed).toBe(false);
    expect(r.violations.some((v) => v.includes('HUMAN_REQUIRED'))).toBe(true);
  });

  it('rejects SIMULATION_REHEARSAL elements that use evidence language', () => {
    const md = `# Guidebook

Users preferred the flow. [SIMULATION_REHEARSAL]

Handoff. [HUMAN_REQUIRED]`;
    const r = checkProvenance(md);
    expect(r.passed).toBe(false);
    expect(r.violations.some((v) => v.includes('SIMULATION_REHEARSAL uses evidence language'))).toBe(true);
  });

  it('rejects unknown SOURCE_CARD ids when a known list is provided', () => {
    const md = `# Guidebook

Grounded. [SOURCE_CARD:this_card_does_not_exist]

Handoff. [HUMAN_REQUIRED]`;
    const r = checkProvenance(md, { knownSourceCards: ['sanders_stappers_2014'] });
    expect(r.passed).toBe(false);
    expect(r.violations.some((v) => v.includes('unknown id'))).toBe(true);
  });

  it('rejects "Expected outcomes" heading even if paragraphs below are tagged', () => {
    const md = `## Expected outcomes

The study will likely produce clear effects. [AGENT_INFERENCE]

Handoff. [HUMAN_REQUIRED]`;
    const r = checkProvenance(md);
    expect(r.passed).toBe(false);
    expect(r.violations.some((v) => v.includes('Expected outcomes'))).toBe(true);
  });

  it('rejects headings containing evidence language', () => {
    const md = `## What participants found

Paragraph. [AGENT_INFERENCE]

Handoff. [HUMAN_REQUIRED]`;
    const r = checkProvenance(md);
    expect(r.passed).toBe(false);
    expect(r.violations.some((v) => /heading uses evidence language/.test(v))).toBe(true);
  });

  it('accepts "Failure hypotheses to test" heading', () => {
    const md = `## Failure hypotheses to test

A user encountering this flow would likely experience friction. [SIMULATION_REHEARSAL]

Handoff. [HUMAN_REQUIRED]`;
    const r = checkProvenance(md);
    expect(r.passed).toBe(true);
  });

  it('accepts UNCITED_ADJACENT tag', () => {
    const md = `# Guidebook

The reviewer flagged adjacent AI-disclosure literature (Jakesch et al.) not present in the source corpus. [UNCITED_ADJACENT]

Handoff. [HUMAN_REQUIRED]`;
    const r = checkProvenance(md);
    expect(r.passed).toBe(true);
    expect(r.tagCounts.UNCITED_ADJACENT).toBe(1);
  });

  it('counts tags correctly', () => {
    const md = `# Guidebook

P1. [AGENT_INFERENCE]

P2. [AGENT_INFERENCE]

P3. [RESEARCHER_INPUT]

Handoff. [HUMAN_REQUIRED]`;
    const r = checkProvenance(md);
    expect(r.tagCounts.AGENT_INFERENCE).toBe(2);
    expect(r.tagCounts.RESEARCHER_INPUT).toBe(1);
    expect(r.tagCounts.HUMAN_REQUIRED).toBe(1);
  });
});
