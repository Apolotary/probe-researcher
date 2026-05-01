// v3.1 — Per-paragraph provenance taxonomy in the UI.
//
// The rehearsal memo carries a footer line listing the provenance
// categories. The .tex / .pdf / project-page exports carry banner
// watermarks. But the *interactive* UI used to show mixed-provenance
// text in single text boxes — there was no per-paragraph tag, and no
// way to filter "show me only researcher input vs. simulation."
//
// This module exposes:
//   window.ProvenanceTaxonomy   — the shared color/label registry
//   window.TaggedParagraph      — single block renderer with gutter
//   window.TaggedView           — full text renderer with filter chips
//
// The taxonomy mirrors the linter's enforced tags
// (src/anthropic/provenance.ts) so what the UI surfaces matches what
// the linter validates on export.

const palette = window.__probePalette;

// Color discipline: each category maps to a shade that's already in
// the Probe palette so the gutter strips don't introduce new colors.
// Tag names match the strings the linter recognizes verbatim.
const TAXONOMY = {
  RESEARCHER_INPUT:     { color: palette.cyan,   label: 'researcher',     hint: 'content the researcher provided verbatim' },
  SOURCE_CARD:          { color: palette.moss,   label: 'source card',    hint: 'grounded in a hand-curated source-card YAML' },
  SIMULATION_REHEARSAL: { color: palette.amber,  label: 'simulated',      hint: 'output of a simulated walkthrough — not evidence' },
  AGENT_INFERENCE:      { color: palette.ink2,   label: 'agent reasoning',hint: "Probe's reasoning, not grounded in source or simulation" },
  HUMAN_REQUIRED:       { color: palette.rose,   label: 'human required', hint: 'explicit handoff — a human must act here' },
  DO_NOT_CLAIM:         { color: '#a89bd8',      label: 'do not claim',   hint: 'flagged as unclaimable in any external context' },
  UNCITED_ADJACENT:     { color: '#ad7ad9',      label: 'uncited',        hint: 'named outside-corpus literature — verify before grounding' },
  TOOL_VERIFIED:        { color: palette.moss,   label: 'tool-verified',  hint: 'measured by a tool-equipped Managed Agents session' },
};

window.ProvenanceTaxonomy = TAXONOMY;

// Parse free-form text into provenance-tagged blocks. Each paragraph
// (separated by blank lines) is examined for a leading `[TAG]` or
// `[TAG:<id>]` marker; if absent, the caller's default applies.
//
// Returns: [{ tag, sourceId, body }]
function parseTagged(text, defaultTag) {
  const out = [];
  const paras = String(text || '').split(/\n\s*\n/);
  for (const raw of paras) {
    const para = raw.trim();
    if (!para) continue;
    const m = para.match(/^\[(RESEARCHER_INPUT|SOURCE_CARD(?::([^\]]+))?|SIMULATION_REHEARSAL|AGENT_INFERENCE|HUMAN_REQUIRED|DO_NOT_CLAIM|UNCITED_ADJACENT|TOOL_VERIFIED)\]\s*/);
    if (m) {
      const fullTag = m[1].split(':')[0];  // collapse SOURCE_CARD:id → SOURCE_CARD
      out.push({
        tag: fullTag,
        sourceId: m[2] || null,
        body: para.slice(m[0].length).trim(),
      });
    } else {
      out.push({ tag: defaultTag || 'AGENT_INFERENCE', sourceId: null, body: para });
    }
  }
  return out;
}

window.parseTaggedProvenance = parseTagged;

// Single-paragraph renderer: colored left gutter, hover tooltip with
// tag name + hint, optional source-card pill on the right.
//
// Props:
//   tag        — taxonomy key (RESEARCHER_INPUT / SIMULATION_REHEARSAL / …)
//   sourceId   — optional pill on the right (e.g. SOURCE_CARD:<id>)
//   body       — the paragraph text (markdown rendered via MarkdownText)
//   compact    — tighter padding + smaller body text
//   hideHeader — drop the label/source row entirely; gutter strip + body
//                only. Useful when the surrounding card already labels
//                the content (e.g., a reviewer card that's already
//                colored / framed). Tag name still surfaces on hover
//                via title attribute so the provenance is recoverable.
//   inline     — when true, removes outer margin so the paragraph can
//                slot directly into a card body without bottom gap.
function TaggedParagraph({ tag, sourceId, body, compact, hideHeader, inline }) {
  const meta = TAXONOMY[tag] || TAXONOMY.AGENT_INFERENCE;
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={hideHeader ? `${meta.label} — ${meta.hint}` : undefined}
      style={{
        position: 'relative',
        padding: compact ? '6px 12px 6px 14px' : '10px 14px 10px 18px',
        margin: inline ? 0 : '0 0 8px',
        borderLeft: `3px solid ${meta.color}`,
        background: hover ? 'rgba(255,255,255,0.02)' : 'transparent',
        borderRadius: '0 3px 3px 0',
        transition: 'background 120ms',
      }}>
      {!hideHeader && (
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 10,
          marginBottom: compact ? 2 : 4,
        }}>
          <span style={{
            color: meta.color, fontSize: 9.5, fontWeight: 700,
            letterSpacing: '0.10em', textTransform: 'uppercase',
          }}>{meta.label}</span>
          {sourceId && (
            <span style={{
              color: meta.color, fontSize: 10,
              border: `1px solid ${meta.color}`, padding: '0 6px',
              borderRadius: 999, opacity: 0.7,
            }}>{sourceId}</span>
          )}
          {hover && (
            <span style={{
              marginLeft: 'auto', color: palette.ink3, fontSize: 10.5, fontStyle: 'italic',
            }}>{meta.hint}</span>
          )}
        </div>
      )}
      <div style={{
        color: palette.ink, fontSize: compact ? 12.5 : 13.5, lineHeight: 1.6,
      }}>
        {/* Render through MarkdownText so headings / bullets / **bold**
            in pre-mortem and discussion-shaped text actually format.
            Without this, the gutter strip wraps a wall of pre-wrap
            plain text. Falls back to whitespace-pre-wrap if the
            module isn't loaded yet (script-order edge case). */}
        {window.MarkdownText
          ? <window.MarkdownText text={body} />
          : <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{body}</div>}
      </div>
    </div>
  );
}

window.TaggedParagraph = TaggedParagraph;

// Full-text renderer with filter chips. Use this in place of a raw
// text block when you want the user to see provenance per paragraph
// and toggle visibility by tag.
//
// Props:
//   text         — the raw multi-paragraph string
//   defaultTag   — applied to paragraphs without an inline tag
//   showFilters  — render the chip row above the body (default true)
//   compact      — tighter spacing
function TaggedView({ text, defaultTag, showFilters = true, compact = false, label }) {
  const blocks = React.useMemo(() => parseTagged(text, defaultTag), [text, defaultTag]);
  const presentTags = React.useMemo(() => {
    const set = new Set();
    blocks.forEach((b) => set.add(b.tag));
    return [...set];
  }, [blocks]);
  const [active, setActive] = React.useState(() => new Set(presentTags));
  React.useEffect(() => {
    // When the underlying text changes and brings a new tag, surface
    // it as enabled by default (don't strand a paragraph behind a
    // chip the user never saw).
    setActive((prev) => {
      const next = new Set(prev);
      presentTags.forEach((t) => next.add(t));
      return next;
    });
  }, [presentTags.join('|')]);

  const visible = blocks.filter((b) => active.has(b.tag));
  const allOn = presentTags.every((t) => active.has(t));

  const toggle = (tag) => {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag); else next.add(tag);
      return next;
    });
  };
  const setOnly = (tag) => setActive(new Set([tag]));
  const setAll = () => setActive(new Set(presentTags));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {label && (
        <div style={{
          color: palette.ink3, fontSize: 11, letterSpacing: '0.10em',
          textTransform: 'uppercase',
        }}>{label}</div>
      )}
      {showFilters && presentTags.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
          padding: '6px 0',
          borderBottom: `1px dashed ${palette.rule}`,
        }}>
          <span style={{
            color: palette.ink3, fontSize: 10.5, letterSpacing: '0.10em',
            textTransform: 'uppercase', marginRight: 4,
          }}>show</span>
          <button
            onClick={setAll}
            style={{
              background: allOn ? palette.bg2 : 'transparent',
              border: `1px solid ${allOn ? palette.amber : palette.rule}`,
              color: allOn ? palette.amber : palette.ink3,
              fontFamily: 'inherit', fontSize: 11, padding: '2px 9px',
              borderRadius: 999, cursor: 'pointer',
            }}>all</button>
          {presentTags.map((tag) => {
            const meta = TAXONOMY[tag] || TAXONOMY.AGENT_INFERENCE;
            const on = active.has(tag);
            const count = blocks.filter((b) => b.tag === tag).length;
            return (
              <button
                key={tag}
                onClick={(e) => {
                  if (e.altKey || e.metaKey) { setOnly(tag); return; }
                  toggle(tag);
                }}
                title={`${meta.hint}\nalt-click to isolate`}
                style={{
                  background: on ? `${meta.color}15` : 'transparent',
                  border: `1px solid ${on ? meta.color : palette.rule}`,
                  color: on ? meta.color : palette.ink3,
                  fontFamily: 'inherit', fontSize: 11, padding: '2px 9px',
                  borderRadius: 999, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}>
                <span style={{
                  display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                  background: on ? meta.color : palette.ink4,
                }} />
                {meta.label}
                <span style={{ color: on ? meta.color : palette.ink4, opacity: 0.7 }}>
                  · {count}
                </span>
              </button>
            );
          })}
          {visible.length < blocks.length && (
            <span style={{
              marginLeft: 'auto', color: palette.ink3, fontSize: 10.5,
            }}>{blocks.length - visible.length} hidden</span>
          )}
        </div>
      )}
      <div>
        {visible.length === 0 && (
          <div style={{
            padding: '14px', color: palette.ink3, fontSize: 12,
            border: `1px dashed ${palette.rule}`, borderRadius: 3,
            textAlign: 'center',
          }}>
            All paragraphs are filtered out. Click a chip above to show them.
          </div>
        )}
        {visible.map((b, i) => (
          <TaggedParagraph key={i} tag={b.tag} sourceId={b.sourceId}
            body={b.body} compact={compact} />
        ))}
      </div>
    </div>
  );
}

window.TaggedView = TaggedView;
