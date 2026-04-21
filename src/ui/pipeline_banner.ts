/**
 * ASCII pipeline banner — the eight-stage research-process DAG lit up as
 * stages complete. Fits in ~80 cols. Borrows the "status bar above input"
 * visual idea from Hermes-agent, but adapted to Probe's linear pipeline.
 */

import chalk from 'chalk';
import { palette } from './theme.js';
import { describe } from './stage.js';

export type StageState = 'pending' | 'active' | 'done' | 'blocked' | 'failed';

const stateGlyph: Record<StageState, string> = {
  pending: '○',
  active: '●',
  done: '✓',
  blocked: '⊘',
  failed: '✗',
};

const stateColor: Record<StageState, string> = {
  pending: palette.dim,
  active: palette.probe,
  done: palette.passed,
  blocked: palette.blocked,
  failed: palette.blocked,
};

const stageOrder = [
  '1_premise',
  '2_ideator',
  '3_literature',
  '4_prototype',
  '5_simulator',
  '6_audit',
  '7a_methodologist',
  '7b_accessibility',
  '7d_meta',
  '8_guidebook',
];

/**
 * Render a one-line pipeline banner. States is a map of stage_id → state.
 * Defaults to pending.
 */
export function renderBanner(states: Partial<Record<string, StageState>> = {}): string {
  const parts = stageOrder.map((id) => {
    const state = states[id] ?? 'pending';
    const desc = describe(id);
    const glyph = stateGlyph[state];
    const color = chalk.hex(stateColor[state]);
    return color(`${glyph} ${desc.emoji}`);
  });
  return parts.join(chalk.hex(palette.dim)(' ─ '));
}

/**
 * Render a more detailed two-line banner: emojis on top, stage labels on
 * bottom. Used at the start of a run.
 */
export function renderBannerDetailed(states: Partial<Record<string, StageState>> = {}): string {
  const stagesToShow = stageOrder.slice(0, 8); // 8 visible steps fits in ~100 cols
  const top: string[] = [];
  const bot: string[] = [];
  for (const id of stagesToShow) {
    const state = states[id] ?? 'pending';
    const desc = describe(id);
    const color = chalk.hex(stateColor[state]);
    const glyph = stateGlyph[state];
    const shortLabel = desc.label.split(' ')[0].slice(0, 10);
    top.push(color(`${glyph} ${desc.emoji}`));
    bot.push(chalk.hex(palette.dim)(shortLabel.padEnd(10)));
  }
  return top.join(chalk.hex(palette.dim)(' ─ ')) + '\n' + bot.join(' ');
}
