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

  it('rejects a paragraph whose tag is not the final token', () => {
    // A paragraph that mentions a tag string mid-prose and then continues
    // with more text used to pass (TAG_RE was unanchored). Harden against
    // guidebooks that describe tags as a category — "the [SOURCE_CARD] tag
    // indicates grounding" shouldn't satisfy provenance for its own paragraph.
    const md = `# Guidebook

The [SOURCE_CARD] family of tags indicates grounding in the corpus, but the paragraph continues for another sentence.

Handoff. [HUMAN_REQUIRED]`;
    const r = checkProvenance(md);
    expect(r.passed).toBe(false);
    expect(r.violations.some((v) => /not the final token/.test(v))).toBe(true);
  });

  it('enforces provenance on GFM table rows (non-header)', () => {
    // Without remark-gfm, remark-parse treats tables as plain paragraphs and
    // never emits tableRow nodes, so the table-row branch of the linter was
    // effectively dead. With remark-gfm wired in, a data row without a tag
    // must be rejected.
    const md = `# Guidebook

| Axis | Finding |
|------|---------|
| Legibility | no failure signal |

Handoff. [HUMAN_REQUIRED]`;
    const r = checkProvenance(md);
    expect(r.passed).toBe(false);
    expect(r.violations.some((v) => /table row/.test(v))).toBe(true);
  });

  it('accepts a GFM table row that ends with a tag', () => {
    const md = `# Guidebook

| Axis | Finding |
|------|---------|
| Legibility | no failure signal [AGENT_INFERENCE] |

Handoff. [HUMAN_REQUIRED]`;
    const r = checkProvenance(md);
    expect(r.passed).toBe(true);
  });

  describe('strict-inference mode (--strict-inference)', () => {
    it('accepts AGENT_INFERENCE immediately after a SOURCE_CARD anchor', () => {
      const md = `# Guidebook

Prior work on AI-disclosure timing. [SOURCE_CARD:jakesch_2023_cowriting]

Building on that, a timing manipulation here would probe the same asymmetry. [AGENT_INFERENCE]

Handoff. [HUMAN_REQUIRED]`;
      const r = checkProvenance(md, { strictInference: true });
      expect(r.passed).toBe(true);
    });

    it('accepts AGENT_INFERENCE after a SIMULATION_REHEARSAL within the window', () => {
      const md = `# Guidebook

A participant encountering the condition might pause at the disclosure banner and re-read the heading region. [SIMULATION_REHEARSAL]

The pause would be consistent with heightened epistemic monitoring of the disclosed source. [AGENT_INFERENCE]

Handoff. [HUMAN_REQUIRED]`;
      const r = checkProvenance(md, { strictInference: true });
      expect(r.passed).toBe(true);
    });

    it('rejects AGENT_INFERENCE with no preceding anchor and no inline card', () => {
      const md = `# Guidebook

Some reasoning the model performed with no grounding. [AGENT_INFERENCE]

Handoff. [HUMAN_REQUIRED]`;
      const r = checkProvenance(md, { strictInference: true });
      expect(r.passed).toBe(false);
      expect(
        r.violations.some((v) => /strict-inference mode requires one/.test(v)),
      ).toBe(true);
    });

    it('accepts AGENT_INFERENCE that cites a source card inline', () => {
      const md = `# Guidebook

As Jakesch shows [SOURCE_CARD:jakesch_2023_cowriting] in the co-writing setting, disclosure timing shifts attitudes downstream. [AGENT_INFERENCE]

Handoff. [HUMAN_REQUIRED]`;
      const r = checkProvenance(md, { strictInference: true });
      expect(r.passed).toBe(true);
    });

    it('rejects AGENT_INFERENCE if the anchor is beyond the recency window', () => {
      // Five filler AGENT_INFERENCE paragraphs between the anchor and the
      // paragraph being checked should push the anchor out of the window.
      const md = `# Guidebook

Prior work. [SOURCE_CARD:jakesch_2023_cowriting]

Filler 1. [AGENT_INFERENCE]

Filler 2. [AGENT_INFERENCE]

Filler 3. [AGENT_INFERENCE]

Filler 4. [AGENT_INFERENCE]

Filler 5. [AGENT_INFERENCE]

This one is too far from any anchor. [AGENT_INFERENCE]

Handoff. [HUMAN_REQUIRED]`;
      const r = checkProvenance(md, { strictInference: true });
      // The first several AGENT_INFERENCEs are within window; the last isn't.
      expect(r.passed).toBe(false);
      expect(
        r.violations.some((v) =>
          /too far from any anchor|strict-inference mode requires one/.test(v),
        ),
      ).toBe(true);
    });

    it('default mode (strictInference off) does not enforce the anchor rule', () => {
      const md = `# Guidebook

Unanchored reasoning. [AGENT_INFERENCE]

Handoff. [HUMAN_REQUIRED]`;
      const r = checkProvenance(md); // strictInference omitted
      expect(r.passed).toBe(true);
    });
  });

  describe('typed-tag suffix parsing', () => {
    it('does not treat an [IMPORTED_DRAFT:method] suffix as a source-card id', () => {
      // Regression: TAG_RE_END used to slurp every `:id` suffix into
      // sourceCardsReferenced, which caused IMPORTED_DRAFT subtypes (and any
      // future typed tag) to be falsely validated against the corpus.
      const md = `# Imported draft

Method text from the paper. [IMPORTED_DRAFT:method]

Handoff. [HUMAN_REQUIRED]`;
      const r = checkProvenance(md, { knownSourceCards: ['sanders_stappers_2014'] });
      expect(r.passed).toBe(true);
      expect(r.tagCounts.IMPORTED_DRAFT).toBe(1);
      expect(r.sourceCardsReferenced).not.toContain('method');
    });

    it('does not treat an [UNCITED_ADJACENT:jakesch] suffix as a source-card id', () => {
      const md = `# Guidebook

Reviewer flagged adjacent literature. [UNCITED_ADJACENT:jakesch]

Handoff. [HUMAN_REQUIRED]`;
      const r = checkProvenance(md, { knownSourceCards: ['sanders_stappers_2014'] });
      expect(r.passed).toBe(true);
      expect(r.sourceCardsReferenced).not.toContain('jakesch');
    });

    it('rejects a bare [SOURCE_CARD] tag with no id', () => {
      const md = `# Guidebook

Citation without id. [SOURCE_CARD]

Handoff. [HUMAN_REQUIRED]`;
      const r = checkProvenance(md);
      expect(r.passed).toBe(false);
      expect(r.violations.some((v) => /SOURCE_CARD tag missing id/.test(v))).toBe(true);
    });

    it('validates inline [SOURCE_CARD:id] references against knownSourceCards', () => {
      // Mid-paragraph inline citation followed by a different closing tag.
      // The previous regex only checked the final tag, so an inline unknown
      // id could leak through into the guidebook manifest.
      const md = `# Guidebook

As shown by prior work [SOURCE_CARD:not_a_real_card], the disclosure timing matters. [AGENT_INFERENCE]

Handoff. [HUMAN_REQUIRED]`;
      const r = checkProvenance(md, { knownSourceCards: ['sanders_stappers_2014'] });
      expect(r.passed).toBe(false);
      expect(r.violations.some((v) => /inline \[SOURCE_CARD:not_a_real_card\]/.test(v))).toBe(true);
    });

    it('records a known inline [SOURCE_CARD:id] in sourceCardsReferenced', () => {
      const md = `# Guidebook

As Jakesch shows [SOURCE_CARD:jakesch_2023_cowriting] in the co-writing setting, disclosure shifts attitudes. [AGENT_INFERENCE]

Handoff. [HUMAN_REQUIRED]`;
      const r = checkProvenance(md, { knownSourceCards: ['jakesch_2023_cowriting'] });
      expect(r.passed).toBe(true);
      expect(r.sourceCardsReferenced).toContain('jakesch_2023_cowriting');
    });

    it('strict-inference rejects inline [SOURCE_CARD:not_real] anchoring an AGENT_INFERENCE', () => {
      // Without validation, an unknown inline ID would silently satisfy
      // strict-inference. With validation, the AGENT_INFERENCE has no valid
      // anchor and the rule fires.
      const md = `# Guidebook

As shown by some made-up paper [SOURCE_CARD:not_a_real_card], disclosure timing matters. [AGENT_INFERENCE]

Handoff. [HUMAN_REQUIRED]`;
      const r = checkProvenance(md, {
        knownSourceCards: ['jakesch_2023_cowriting'],
        strictInference: true,
      });
      expect(r.passed).toBe(false);
      expect(
        r.violations.some((v) => /inline \[SOURCE_CARD:not_a_real_card\]/.test(v)),
      ).toBe(true);
      expect(
        r.violations.some((v) => /strict-inference mode requires one/.test(v)),
      ).toBe(true);
    });

    it('strict-inference accepts a known inline [SOURCE_CARD:id]', () => {
      const md = `# Guidebook

As Jakesch shows [SOURCE_CARD:jakesch_2023_cowriting], disclosure timing matters. [AGENT_INFERENCE]

Handoff. [HUMAN_REQUIRED]`;
      const r = checkProvenance(md, {
        knownSourceCards: ['jakesch_2023_cowriting'],
        strictInference: true,
      });
      expect(r.passed).toBe(true);
    });
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
