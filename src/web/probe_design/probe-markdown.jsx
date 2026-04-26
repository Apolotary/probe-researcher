/* global React */
// Minimal markdown renderer for the Probe UI's long-form text blocks.
//
// Why hand-roll instead of pulling in marked / react-markdown:
// the UI surface is a single dark-mode chrome and we want full
// control over styling. The renderer covers what the LLM actually
// produces: headers (# / ## / ###), **bold**, *italic*, `code`,
// numbered + dash lists, blockquotes, and paragraph breaks.
//
// Anything more ambitious (links, tables, images) would warrant a
// real parser; we intentionally keep this tight.
//
// Exposed on window.MarkdownText so any .jsx file can `<window.MarkdownText text={…} />`.

const mdPalette = window.__probePalette;

// Escape HTML so user content can't inject markup. Inline span helpers
// then replace specific patterns with React elements (avoiding
// dangerouslySetInnerHTML).
function inline(text) {
  // Returns an array of React nodes (strings + spans).
  const parts = [];
  let i = 0;
  let key = 0;
  while (i < text.length) {
    // ** bold ** — fgStrong on the new ramp; weight 600 keeps it
    // distinguishable in Inter Tight without going full bold-black.
    let m = text.slice(i).match(/^\*\*([^*]+?)\*\*/);
    if (m) {
      parts.push(<strong key={key++} style={{
        color: mdPalette.fgStrong || mdPalette.ink, fontWeight: 600,
      }}>{m[1]}</strong>);
      i += m[0].length;
      continue;
    }
    // ` code ` — keep mono inline so identifiers, file paths, env
    // vars, and CLI commands read as data inside prose. Cooler-blue
    // accent (was cyan) per rec §08 demotion of amber.
    m = text.slice(i).match(/^`([^`]+?)`/);
    if (m) {
      parts.push(
        <code key={key++} style={{
          fontFamily: mdPalette.fontMono || '"JetBrains Mono", ui-monospace, Menlo, monospace',
          background: mdPalette.bg,
          color: mdPalette.accentLink || mdPalette.cyan,
          padding: '1px 5px', borderRadius: 2, fontSize: '0.92em',
        }}>{m[1]}</code>
      );
      i += m[0].length;
      continue;
    }
    // *italic* — but not bullet markers (handled separately).
    // Italic uses fgSecondary on the new ramp so emphasis reads as
    // a half-step softer rather than as a different luminance band.
    m = text.slice(i).match(/^\*([^*\n]+?)\*/);
    if (m && !text.slice(i).startsWith('* ')) {
      parts.push(<em key={key++} style={{
        color: mdPalette.fgSecondary || mdPalette.ink2,
      }}>{m[1]}</em>);
      i += m[0].length;
      continue;
    }
    // _underscore italic_
    m = text.slice(i).match(/^_([^_\n]+?)_/);
    if (m) {
      parts.push(<em key={key++} style={{
        color: mdPalette.fgSecondary || mdPalette.ink2,
      }}>{m[1]}</em>);
      i += m[0].length;
      continue;
    }
    // Otherwise plain text up to the next markdown trigger.
    //
    // Subtle correctness bug fixed here: if the trigger character at
    // position `i` (e.g. an unbalanced `*` like "**bold" with no
    // closing pair, or a stray `_` inside a word) didn't match any
    // of the inline regexes above, `nextTrigger` is 0. Without
    // guarding this, the loop pushes an empty slice and i += 0 — i.e.
    // no progress — until parts.length overflows and React throws
    // `RangeError: Invalid array length`. The artifact bodies the
    // Sonnet model produces are particularly susceptible because they
    // contain bullets like "* X" inside list paragraphs and markdown-
    // looking emphasis fragments. Always advance by at least one
    // character so the worst case is a stray asterisk rendered as
    // text rather than a crashed React tree.
    const nextTrigger = text.slice(i).search(/[*`_]/);
    if (nextTrigger === -1) {
      parts.push(text.slice(i));
      break;
    }
    if (nextTrigger === 0) {
      // The trigger char itself didn't match any inline pattern —
      // emit it verbatim and step over it.
      parts.push(text[i]);
      i += 1;
      continue;
    }
    parts.push(text.slice(i, i + nextTrigger));
    i += nextTrigger;
  }
  return parts;
}

function MarkdownText({ text, density }) {
  if (!text) return null;
  const lines = String(text).split('\n');
  const blocks = [];
  let buf = []; // paragraph accumulator
  let listType = null; // 'ul' | 'ol' | null
  let listItems = [];

  const flushParagraph = () => {
    if (buf.length === 0) return;
    blocks.push({ kind: 'p', content: buf.join(' ') });
    buf = [];
  };
  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push({ kind: 'list', listType, items: listItems });
    listItems = [];
    listType = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    // Blank line ends the current paragraph / list
    if (line.trim() === '') {
      flushParagraph();
      flushList();
      continue;
    }
    // Headers
    let m = line.match(/^(#{1,3})\s+(.*)$/);
    if (m) {
      flushParagraph();
      flushList();
      blocks.push({ kind: 'h', level: m[1].length, content: m[2] });
      continue;
    }
    // Blockquote
    m = line.match(/^>\s?(.*)$/);
    if (m) {
      flushParagraph();
      flushList();
      blocks.push({ kind: 'q', content: m[1] });
      continue;
    }
    // Unordered list
    m = line.match(/^\s*[-•]\s+(.*)$/);
    if (m) {
      flushParagraph();
      if (listType !== 'ul') { flushList(); listType = 'ul'; }
      listItems.push(m[1]);
      continue;
    }
    // Ordered list
    m = line.match(/^\s*\d+\.\s+(.*)$/);
    if (m) {
      flushParagraph();
      if (listType !== 'ol') { flushList(); listType = 'ol'; }
      listItems.push(m[1]);
      continue;
    }
    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      flushParagraph();
      flushList();
      blocks.push({ kind: 'hr' });
      continue;
    }
    // Default: continuation of a paragraph
    flushList();
    buf.push(line);
  }
  flushParagraph();
  flushList();

  const tight = density === 'compact';
  const sectionGap = tight ? 8 : 12;

  // Prose-mode rendering after the Claude Design readability audit:
  // long-form text (paragraphs, blockquotes) renders in Inter Tight
  // 15/24 with a 68ch measure cap; lists and headings keep mono +
  // tighter sizes because they're navigational, not reading material.
  // Inline runs (bold/italic/code) inside paragraphs inherit the sans
  // family except code which switches to mono inline. The container
  // sets max-width: 68ch so multi-paragraph text stays readable without
  // each <p> needing its own width.
  const sansFamily = mdPalette.fontSans || '"Inter Tight", "Inter", system-ui, sans-serif';
  const monoFamily = mdPalette.fontMono || '"JetBrains Mono", ui-monospace, monospace';

  return (
    <div style={{
      color: mdPalette.fgBody || mdPalette.ink,
      lineHeight: 1.62,
      fontSize: 15,
      maxWidth: mdPalette.proseMeasure || '68ch',
    }}>
      {blocks.map((b, i) => {
        if (b.kind === 'h') {
          const sizes = { 1: 22, 2: 17, 3: 15 };
          return (
            <div key={i} style={{
              color: b.level === 1 ? mdPalette.amber : (mdPalette.fgStrong || mdPalette.ink),
              fontFamily: sansFamily,
              fontSize: sizes[b.level] || 15,
              fontWeight: 600,
              marginTop: i === 0 ? 0 : sectionGap + 4,
              marginBottom: 6,
              letterSpacing: b.level === 1 ? '-0.01em' : 0,
              lineHeight: 1.25,
            }}>{inline(b.content)}</div>
          );
        }
        if (b.kind === 'q') {
          return (
            <div key={i} style={{
              borderLeft: `3px solid ${mdPalette.amber}`,
              paddingLeft: 12,
              color: mdPalette.fgSecondary || mdPalette.ink2,
              fontFamily: mdPalette.fontSerif || 'Charter, Georgia, serif',
              fontStyle: 'italic',
              fontSize: 14.5,
              margin: `${sectionGap}px 0`,
            }}>{inline(b.content)}</div>
          );
        }
        if (b.kind === 'hr') {
          return <hr key={i} style={{
            border: 'none', borderTop: `1px solid ${mdPalette.border || mdPalette.rule}`,
            margin: `${sectionGap}px 0`,
          }} />;
        }
        if (b.kind === 'list') {
          const Tag = b.listType === 'ol' ? 'ol' : 'ul';
          return (
            <Tag key={i} style={{
              margin: `${sectionGap / 2}px 0`,
              paddingLeft: 22,
              fontFamily: sansFamily,
              fontSize: 15,
              lineHeight: 1.55,
              color: mdPalette.fgBody || mdPalette.ink,
            }}>
              {b.items.map((it, j) => (
                <li key={j} style={{ marginBottom: 4 }}>{inline(it)}</li>
              ))}
            </Tag>
          );
        }
        // paragraph
        return (
          <p key={i} style={{
            margin: `${sectionGap / 2}px 0`,
            fontFamily: sansFamily,
            fontSize: 15,
            lineHeight: 1.62,
            letterSpacing: '0.005em',
            color: mdPalette.fgBody || mdPalette.ink,
          }}>{inline(b.content)}</p>
        );
      })}
    </div>
  );
}

window.MarkdownText = MarkdownText;
