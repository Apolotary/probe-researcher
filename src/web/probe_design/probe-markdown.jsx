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
    // ** bold **
    let m = text.slice(i).match(/^\*\*([^*]+?)\*\*/);
    if (m) {
      parts.push(<strong key={key++} style={{ color: mdPalette.ink, fontWeight: 600 }}>{m[1]}</strong>);
      i += m[0].length;
      continue;
    }
    // ` code `
    m = text.slice(i).match(/^`([^`]+?)`/);
    if (m) {
      parts.push(
        <code key={key++} style={{
          fontFamily: 'ui-monospace, "JetBrains Mono", Menlo, monospace',
          background: mdPalette.bg, color: mdPalette.cyan,
          padding: '1px 5px', borderRadius: 2, fontSize: '0.95em',
        }}>{m[1]}</code>
      );
      i += m[0].length;
      continue;
    }
    // *italic* — but not bullet markers (handled separately)
    m = text.slice(i).match(/^\*([^*\n]+?)\*/);
    if (m && !text.slice(i).startsWith('* ')) {
      parts.push(<em key={key++} style={{ color: mdPalette.ink2 }}>{m[1]}</em>);
      i += m[0].length;
      continue;
    }
    // _underscore italic_
    m = text.slice(i).match(/^_([^_\n]+?)_/);
    if (m) {
      parts.push(<em key={key++} style={{ color: mdPalette.ink2 }}>{m[1]}</em>);
      i += m[0].length;
      continue;
    }
    // Otherwise plain text up to the next markdown trigger
    const nextTrigger = text.slice(i).search(/[*`_]/);
    if (nextTrigger === -1) {
      parts.push(text.slice(i));
      break;
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

  return (
    <div style={{ color: mdPalette.ink, lineHeight: 1.6, fontSize: 13.5 }}>
      {blocks.map((b, i) => {
        if (b.kind === 'h') {
          const sizes = { 1: 18, 2: 16, 3: 14 };
          return (
            <div key={i} style={{
              color: b.level === 1 ? mdPalette.amber : mdPalette.ink,
              fontSize: sizes[b.level] || 14,
              fontWeight: 600,
              marginTop: i === 0 ? 0 : sectionGap + 4,
              marginBottom: 6,
              letterSpacing: b.level === 1 ? '0.01em' : 0,
            }}>{inline(b.content)}</div>
          );
        }
        if (b.kind === 'q') {
          return (
            <div key={i} style={{
              borderLeft: `3px solid ${mdPalette.amber}`,
              paddingLeft: 12, color: mdPalette.ink2,
              fontStyle: 'italic',
              margin: `${sectionGap}px 0`,
            }}>{inline(b.content)}</div>
          );
        }
        if (b.kind === 'hr') {
          return <hr key={i} style={{
            border: 'none', borderTop: `1px solid ${mdPalette.rule}`,
            margin: `${sectionGap}px 0`,
          }} />;
        }
        if (b.kind === 'list') {
          const Tag = b.listType === 'ol' ? 'ol' : 'ul';
          return (
            <Tag key={i} style={{
              margin: `${sectionGap / 2}px 0`,
              paddingLeft: 22, color: mdPalette.ink,
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
            color: mdPalette.ink,
          }}>{inline(b.content)}</p>
        );
      })}
    </div>
  );
}

window.MarkdownText = MarkdownText;
