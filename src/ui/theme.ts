/**
 * Probe theme — one tasteful palette, no skin engine (Hermes-agent lesson:
 * don't ship 9 themes for a hackathon). Each branch gets a stable color; each
 * stage verdict gets a semantic color.
 */

import chalk from 'chalk';

export const palette = {
  // Brand
  probe: '#9FFFE0',     // mint — the Probe signature color
  probeDim: '#5FA895',

  // Branch identities
  branchA: '#7DC9FF',   // cyan — formative / infrastructural
  branchB: '#E89AFF',   // magenta — evaluative / adversarial
  branchC: '#FFD166',   // yellow — longitudinal / peer-collaborative

  // Verdicts
  passed: '#6FFF9F',    // green
  revision: '#FFD166',  // amber
  blocked: '#FF6B6B',   // red
  humanRequired: '#9FFFE0', // mint (reuses probe color — this is deliberate)

  // Structural
  heading: '#FFFFFF',
  subtle: '#888C94',
  dim: '#5A5E66',
  stage: '#BFEAFF',
  evidence: '#FFB4B4',
  quote: '#BCB7D2',
} as const;

export const glyphs = {
  branchA: '│ A',
  branchB: '│ B',
  branchC: '│ C',
  stageActive: '●',
  stageDone: '✓',
  stagePending: '○',
  stageFailed: '✗',
  stageBlocked: '⊘',
  lock: '🔒',
  unlock: '🔓',
  probe: '⟐',
} as const;

export const emojis = {
  probe: '🔬',
  premise: '❓',
  ideate: '🧭',
  literature: '📚',
  prototype: '🛠',
  simulate: '🎭',
  audit: '⚖️',
  review: '🗯',
  guidebook: '📘',
  blocked: '⛔',
  survived: '🌱',
  humanRequired: '👤',
  passed: '✅',
  revision: '⚠️',
} as const;

export function branchColor(id: string): (s: string) => string {
  switch (id) {
    case 'a': return chalk.hex(palette.branchA);
    case 'b': return chalk.hex(palette.branchB);
    case 'c': return chalk.hex(palette.branchC);
    default: return chalk.white;
  }
}

export function branchGlyph(id: string): string {
  return branchColor(id)(glyphs[`branch${id.toUpperCase() as 'A' | 'B' | 'C'}`] ?? `│ ${id}`);
}

export function verdictColor(verdict: string): (s: string) => string {
  const v = verdict.toUpperCase();
  if (v === 'BLOCKED' || v === 'REJECT') return chalk.hex(palette.blocked);
  if (v === 'REVISION_REQUIRED' || v.includes('REVISION')) return chalk.hex(palette.revision);
  if (v === 'PASSED' || v.includes('ACCEPT')) return chalk.hex(palette.passed);
  if (v === 'HUMAN_JUDGMENT_REQUIRED') return chalk.hex(palette.humanRequired);
  return chalk.white;
}

export const brand = {
  header: chalk.hex(palette.probe).bold,
  sub: chalk.hex(palette.subtle),
  stage: chalk.hex(palette.stage).bold,
  dim: chalk.hex(palette.dim),
  evidence: chalk.hex(palette.evidence),
  quote: chalk.hex(palette.quote).italic,
} as const;
