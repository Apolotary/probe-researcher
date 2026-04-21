/**
 * Provenance linter — the single load-bearing piece of infrastructure that
 * enforces the project's epistemic commitment.
 *
 * Walks the markdown AST (via remark) and verifies that every "content-bearing"
 * node carries a provenance tag in the form `[TAG]` or `[TAG:id]`. Content-
 * bearing nodes are: paragraphs, list items, blockquotes, table rows.
 *
 * Additional rules:
 * - `[SIMULATION_REHEARSAL]` nodes must NOT use evidence language
 * - `[SOURCE_CARD:<id>]` nodes cite a card ID that exists in corpus
 * - Document must contain at least one `[HUMAN_REQUIRED]` element
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';
import type { Node, Parent } from 'unist';
import { FORBIDDEN_PHRASES } from './forbidden.js';

export const VALID_TAGS = [
  'RESEARCHER_INPUT',
  'SOURCE_CARD',
  'SIMULATION_REHEARSAL',
  'AGENT_INFERENCE',
  'HUMAN_REQUIRED',
  'DO_NOT_CLAIM',
  /**
   * Named outside-corpus literature a reviewer (typically the novelty hawk)
   * believes is adjacent to the research but not represented in the source
   * card corpus. The downstream researcher must verify these manually before
   * treating them as grounded. Unlike [SOURCE_CARD:<id>], no linter lookup
   * enforces existence — only the format is enforced.
   */
  'UNCITED_ADJACENT',
] as const;

export type ProvenanceTag = (typeof VALID_TAGS)[number];

const TAG_RE = new RegExp(`\\[(${VALID_TAGS.join('|')})(?::[a-z0-9_-]+)?\\]`);

interface TextNode extends Node {
  type: 'text';
  value: string;
}

export interface ProvenanceLintResult {
  passed: boolean;
  violations: string[];
  tagCounts: Record<ProvenanceTag, number>;
  sourceCardsReferenced: string[];
}

export interface ProvenanceLintOptions {
  /**
   * If provided, SOURCE_CARD:<id> references are validated against this list.
   */
  knownSourceCards?: ReadonlyArray<string>;
}

export function checkProvenance(
  markdown: string,
  opts: ProvenanceLintOptions = {},
): ProvenanceLintResult {
  const tree = unified().use(remarkParse).parse(markdown);
  const violations: string[] = [];
  const tagCounts: Record<ProvenanceTag, number> = {
    RESEARCHER_INPUT: 0,
    SOURCE_CARD: 0,
    SIMULATION_REHEARSAL: 0,
    AGENT_INFERENCE: 0,
    HUMAN_REQUIRED: 0,
    DO_NOT_CLAIM: 0,
    UNCITED_ADJACENT: 0,
  };
  const sourceCardsReferenced: string[] = [];

  const checkNode = (node: Parent, kind: string): void => {
    const text = extractText(node);
    if (text.trim().length === 0) return;
    const m = text.match(TAG_RE);
    if (!m) {
      violations.push(`${kind} missing provenance tag: "${text.slice(0, 120)}"`);
      return;
    }
    const tag = m[1] as ProvenanceTag;
    tagCounts[tag]++;

    const fullMatch = text.match(new RegExp(`\\[${tag}(?::([a-z0-9_-]+))?\\]`));
    if (fullMatch?.[1]) {
      sourceCardsReferenced.push(fullMatch[1]);
      if (opts.knownSourceCards && !opts.knownSourceCards.includes(fullMatch[1])) {
        violations.push(`SOURCE_CARD references unknown id: "${fullMatch[1]}"`);
      }
    }

    // Simulation rehearsal must not use evidence language.
    if (tag === 'SIMULATION_REHEARSAL') {
      for (const re of FORBIDDEN_PHRASES) {
        const vm = text.match(re);
        if (vm) {
          violations.push(
            `SIMULATION_REHEARSAL uses evidence language "${vm[0]}": "${text.slice(0, 120)}"`,
          );
        }
      }
    }
  };

  visit(tree, (node) => {
    const n = node as Parent;
    switch (node.type) {
      case 'paragraph':
        checkNode(n, 'paragraph');
        break;
      case 'listItem':
        checkNode(n, 'list item');
        break;
      case 'blockquote':
        checkNode(n, 'blockquote');
        break;
      case 'tableRow':
        // Skip the header row; require provenance on body rows only.
        // Header detection: tableRow whose parent's first child is this node.
        checkNode(n, 'table row');
        break;
      case 'heading': {
        // Headings don't need a provenance tag, but they MUST NOT use
        // evidence language. A heading like "Expected outcomes" contradicts
        // the rehearsal framing even if every paragraph below is tagged.
        const text = extractText(n);
        for (const re of FORBIDDEN_PHRASES) {
          const vm = text.match(re);
          if (vm) {
            violations.push(
              `heading uses evidence language "${vm[0]}": "${text.slice(0, 120)}"`,
            );
          }
        }
        // Additionally reject the known anti-pattern headings that imply
        // evidence without literally containing a forbidden phrase.
        if (/^(expected outcomes|results|findings)\b/i.test(text.trim())) {
          violations.push(
            `heading "${text.trim()}" implies findings — use "Failure hypotheses" or "Questions the real study must answer" instead`,
          );
        }
        break;
      }
      default:
        break;
    }
  });

  if (tagCounts.HUMAN_REQUIRED < 1) {
    violations.push('document has no [HUMAN_REQUIRED] element');
  }

  return {
    passed: violations.length === 0,
    violations,
    tagCounts,
    sourceCardsReferenced,
  };
}

function extractText(node: Parent | Node): string {
  if ('value' in node && typeof (node as TextNode).value === 'string') {
    return (node as TextNode).value;
  }
  if ('children' in node && Array.isArray((node as Parent).children)) {
    return (node as Parent).children.map((c) => extractText(c)).join('');
  }
  return '';
}
