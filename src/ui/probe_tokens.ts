/**
 * Probe design tokens — the single source of truth for the new TUI/Web
 * surfaces designed in Claude Design (handoff: Probe (TUI).html).
 *
 * Both the Ink-rendered terminal UI and the HTML/web companion read from
 * these constants. The status colors (moss/amber/cyan/rose) and brand
 * amber MUST stay in sync between surfaces; the handoff calls this out
 * explicitly ("don't drift the moss/amber/cyan/rose tokens").
 *
 * The older src/ui/theme.ts palette is kept untouched — it's still in use
 * by the legacy explore/interactive screens. The new Probe UI uses its
 * own canon below.
 */

export const probeTokens = {
  // Surfaces
  bg:        '#0f1419',
  bg2:       '#161b22',

  // Ink scale — primary text down through dim
  ink:       '#c5c8d4',
  ink2:      '#8b93a7',
  ink3:      '#5c6678',
  ink4:      '#3d4555',

  // Brand + status colors. Status semantics:
  //   moss  → fresh / ok
  //   amber → stale / warning / brand
  //   cyan  → running / streaming
  //   ink3  → queued / unset
  //   rose  → critical / deadline / error
  amber:     '#d9a548',
  amberSoft: 'rgba(217, 165, 72, 0.18)',
  moss:      '#7fb069',
  cyan:      '#7dcfff',
  rose:      '#e26e6e',
  blue:      '#7aa2f7',

  // Box-drawing rule lines. Slightly brighter than the design's
  // #1f2530 so the frame reads cleanly against terminals with low
  // backlight contrast (and against true-black backgrounds where the
  // original token approached invisibility).
  rule:      '#3a4458',
  ruleS:     '#2a3140',
} as const;

export type ProbeToken = keyof typeof probeTokens;

/** Stage status canonical mapping — used in pips, gantt bars, headers. */
export const stageStatus = {
  fresh:   { color: probeTokens.moss,  glyph: '●' },
  stale:   { color: probeTokens.amber, glyph: '●' },
  running: { color: probeTokens.cyan,  glyph: '●' },
  queued:  { color: probeTokens.ink3,  glyph: '○' },
} as const;

export type StageStatus = keyof typeof stageStatus;

/** Pipeline stages, in canonical order (matches the project scene rail). */
export const PIPELINE_STAGES = [
  'framing',
  'literature',
  'methodology',
  'artifacts',
  'evaluation',
  'report',
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];
