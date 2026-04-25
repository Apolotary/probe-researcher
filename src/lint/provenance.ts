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
import remarkGfm from 'remark-gfm';
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
  /**
   * Claim measured by a Managed Agents tool-equipped session (bash, grep,
   * file ops) rather than reasoned about. Used by `probe audit-deep` to
   * mark findings the agent verified computationally (e.g., "the AI
   * disclosure string is 16 words, 96 characters, ~5.3s at 180 wpm").
   */
  'TOOL_VERIFIED',
  /**
   * Content ingested from the researcher's own in-progress paper draft via
   * `probe import`. NOT agent-generated and NOT rehearsal. The text is the
   * researcher's; the linter preserves it verbatim and marks the origin so
   * downstream stages (audit, review) know they are critiquing an existing
   * draft rather than generating one. Optional suffix names the section
   * type: [IMPORTED_DRAFT:premise], [IMPORTED_DRAFT:method], etc.
   */
  'IMPORTED_DRAFT',
] as const;

export type ProvenanceTag = (typeof VALID_TAGS)[number];

/**
 * Tag-anywhere matcher. Only used for diagnostic messages — NOT for deciding
 * whether an element is tagged. The rule from PROBE.md is that the tag must
 * be the last token of the element, so enforcement uses TAG_RE_END.
 */
const TAG_RE = new RegExp(`\\[(${VALID_TAGS.join('|')})(?::[a-z0-9_-]+)?\\]`);

/**
 * Anchored matcher: the element's text must end with a provenance tag,
 * optionally followed by whitespace. This prevents a paragraph from citing
 * one of the canonical tag strings inside its prose (e.g. a methodology
 * discussion that names `[SOURCE_CARD]` as a category) and having that pass
 * as its own provenance anchor.
 *
 * Two capture groups: [1] is the tag name, [2] is the optional `:id` suffix.
 * Splitting them lets the linter only treat SOURCE_CARD suffixes as card IDs
 * — typed tags like `[IMPORTED_DRAFT:method]` or `[UNCITED_ADJACENT:jakesch]`
 * carry their own subtype, not a corpus reference.
 */
const TAG_RE_END = new RegExp(
  `\\[(${VALID_TAGS.join('|')})(?::([a-z0-9_-]+))?\\]\\s*$`,
);

/** Inline `[SOURCE_CARD:id]` references that appear mid-text rather than as the closing tag. */
const INLINE_SOURCE_CARD_RE = /\[SOURCE_CARD:([a-z0-9_-]+)\]/g;

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
  /**
   * Strict anchoring for [AGENT_INFERENCE] paragraphs.
   *
   * When enabled, every AGENT_INFERENCE-tagged element must either (a) appear
   * within STRICT_INFERENCE_WINDOW elements after a tagged anchor — one of
   * SOURCE_CARD / SIMULATION_REHEARSAL / TOOL_VERIFIED / RESEARCHER_INPUT —
   * or (b) contain an inline [SOURCE_CARD:id] reference mid-text.
   *
   * Rationale (see PROMPT_FOR_LLM_ADVISORS.md §3): AGENT_INFERENCE is the
   * weakest of the eight provenance tags because the linter verifies only
   * its presence, not the model's reasoning. This flag raises the bar by
   * requiring a load-bearing inference to sit adjacent to at least one
   * grounded element, so model-only assertions can't accumulate unchecked.
   *
   * Off by default: shipped guidebooks predate the rule and the demo
   * narrative depends on them linting cleanly. New runs can opt in via
   * `probe lint --strict-inference <file>`.
   */
  strictInference?: boolean;
}

/** Number of preceding elements within which an AGENT_INFERENCE must find an anchor. */
const STRICT_INFERENCE_WINDOW = 5;

const ANCHOR_TAGS: ReadonlySet<ProvenanceTag> = new Set([
  'SOURCE_CARD',
  'SIMULATION_REHEARSAL',
  'TOOL_VERIFIED',
  'RESEARCHER_INPUT',
  // IMPORTED_DRAFT is the researcher's own text lifted verbatim from their
  // paper draft — it's the strongest anchor available, so it grounds any
  // [AGENT_INFERENCE] in an import run's generated commentary.
  'IMPORTED_DRAFT',
]);

export function checkProvenance(
  markdown: string,
  opts: ProvenanceLintOptions = {},
): ProvenanceLintResult {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown);
  const violations: string[] = [];
  const tagCounts: Record<ProvenanceTag, number> = {
    RESEARCHER_INPUT: 0,
    SOURCE_CARD: 0,
    SIMULATION_REHEARSAL: 0,
    AGENT_INFERENCE: 0,
    HUMAN_REQUIRED: 0,
    DO_NOT_CLAIM: 0,
    UNCITED_ADJACENT: 0,
    TOOL_VERIFIED: 0,
    IMPORTED_DRAFT: 0,
  };
  const sourceCardsReferenced: string[] = [];
  /**
   * Ring buffer of the last N element tags (document order). Used by the
   * --strict-inference rule to verify that each AGENT_INFERENCE element
   * sits within reach of a grounded anchor.
   */
  const recentTags: ProvenanceTag[] = [];

  const checkNode = (node: Parent, kind: string): void => {
    const text = extractText(node);
    if (text.trim().length === 0) return;
    // Enforce the "tag is the element's final token" rule from PROBE.md.
    const mEnd = text.match(TAG_RE_END);
    if (!mEnd) {
      // Diagnostic: if a tag appears anywhere in the text but not at the end,
      // the message should say so — helps the author fix it quickly.
      const mid = text.match(TAG_RE);
      const detail = mid
        ? `${kind} has tag "${mid[0]}" but it is not the final token: "${text.slice(0, 120)}"`
        : `${kind} missing provenance tag: "${text.slice(0, 120)}"`;
      violations.push(detail);
      return;
    }
    const tag = mEnd[1] as ProvenanceTag;
    const suffix = mEnd[2];
    tagCounts[tag]++;

    // Suffix semantics depend on the tag. SOURCE_CARD's suffix is a corpus
    // reference and must be validated against `knownSourceCards`. Suffixes on
    // other typed tags (IMPORTED_DRAFT:method, UNCITED_ADJACENT:jakesch) name
    // a subtype or an external citation handle — they are not corpus IDs and
    // must not be treated as such.
    if (tag === 'SOURCE_CARD') {
      if (!suffix) {
        violations.push(
          'SOURCE_CARD tag missing id — use [SOURCE_CARD:<id>] referencing a card in corpus/source_cards/',
        );
      } else {
        sourceCardsReferenced.push(suffix);
        if (opts.knownSourceCards && !opts.knownSourceCards.includes(suffix)) {
          violations.push(`SOURCE_CARD references unknown id: "${suffix}"`);
        }
      }
    }

    // Inline [SOURCE_CARD:id] references appearing mid-text (before the final
    // tag) are still corpus references the linter must validate. They show up
    // in patterns like "as Jakesch shows [SOURCE_CARD:jakesch_2023_cowriting],
    // …" inside an [AGENT_INFERENCE] paragraph. Validate every one against
    // `knownSourceCards` and add them to `sourceCardsReferenced` so the
    // guidebook manifest sees them.
    const finalTagStart = text.length - mEnd[0].length;
    const beforeFinal = text.slice(0, finalTagStart);
    INLINE_SOURCE_CARD_RE.lastIndex = 0;
    let inlineMatch: RegExpExecArray | null;
    while ((inlineMatch = INLINE_SOURCE_CARD_RE.exec(beforeFinal)) !== null) {
      const inlineId = inlineMatch[1];
      sourceCardsReferenced.push(inlineId);
      if (opts.knownSourceCards && !opts.knownSourceCards.includes(inlineId)) {
        violations.push(
          `inline [SOURCE_CARD:${inlineId}] references unknown id`,
        );
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

    // AGENT_INFERENCE elements must not contain predictive outcome claims.
    // Sentences like "condition X produces higher Y" are rehearsal at best
    // and must be tagged [SIMULATION_REHEARSAL] so the researcher is
    // warned they are looking at a prior, not a finding.
    if (tag === 'AGENT_INFERENCE') {
      const predictiveRe = /\b(produces?|yields?|would (produce|yield|demonstrate|show|find|cause)|predict(s|ed)?\s+(that|a|an)|will (produce|yield|demonstrate|show|find|increase|decrease|reduce))\b[^.]{3,}\b(higher|lower|greater|more|less|increase|decrease|elevated|reduced|significant)\b/i;
      const m = text.match(predictiveRe);
      if (m) {
        violations.push(
          `AGENT_INFERENCE contains predictive outcome claim "${m[0].slice(0, 80)}" — this must be tagged [SIMULATION_REHEARSAL]`,
        );
      }

      // Strict-inference mode: every AGENT_INFERENCE element must either
      // sit within STRICT_INFERENCE_WINDOW of a grounded anchor tag, or
      // cite a source card inline (e.g. "as Jakesch shows [SOURCE_CARD:jakesch_2023_cowriting], …").
      // The inline card must itself be valid when knownSourceCards is given —
      // an unknown ID has already been recorded as a violation above, but it
      // must not silently satisfy the strict-inference rule.
      if (opts.strictInference) {
        let hasValidInlineCard = false;
        INLINE_SOURCE_CARD_RE.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = INLINE_SOURCE_CARD_RE.exec(beforeFinal)) !== null) {
          if (!opts.knownSourceCards || opts.knownSourceCards.includes(m[1])) {
            hasValidInlineCard = true;
            break;
          }
        }
        const anchoredInWindow = recentTags.some((t) => ANCHOR_TAGS.has(t));
        if (!hasValidInlineCard && !anchoredInWindow) {
          violations.push(
            `AGENT_INFERENCE has no grounded anchor within ${STRICT_INFERENCE_WINDOW} preceding elements and no inline [SOURCE_CARD:id] — strict-inference mode requires one: "${text.slice(0, 120)}"`,
          );
        }
      }
    }

    // Maintain the recency ring so the NEXT element can check against it.
    recentTags.push(tag);
    if (recentTags.length > STRICT_INFERENCE_WINDOW) {
      recentTags.shift();
    }
  };

  visit(tree, (node, _index, parent) => {
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
      case 'tableRow': {
        // Skip the header row. In mdast, table.children[0] is the header row.
        if (parent && (parent as Parent).children?.[0] === node) {
          break;
        }
        checkNode(n, 'table row');
        break;
      }
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
