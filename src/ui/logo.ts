import chalk from 'chalk';
import figlet from 'figlet';
import gradient from 'gradient-string';
import { palette } from './theme.js';

/**
 * Returns the Probe banner. Falls back to a plain string if figlet fails
 * (e.g., narrow terminal). Never throws — banner is decorative.
 */
export function banner(opts: { wide?: boolean } = {}): string {
  const wide = opts.wide ?? true;
  try {
    const ascii = figlet.textSync('Probe', {
      font: wide ? 'ANSI Shadow' : 'Small',
      horizontalLayout: 'fitted',
      verticalLayout: 'default',
    });
    const probeGradient = gradient([palette.probe, palette.branchA, palette.branchB, palette.branchC]);
    return probeGradient.multiline(ascii);
  } catch {
    return chalk.hex(palette.probe).bold('  PROBE');
  }
}

export function tagline(): string {
  return chalk.hex(palette.subtle)(
    '🔬 rehearsal stage for research  ·  ' +
      chalk.hex(palette.dim)('the performance still needs humans'),
  );
}

/**
 * One-line visual identifier used above terminal output when the pipeline
 * starts. Compact. Works on narrow terminals.
 */
export function strapline(runId: string, premise: string): string {
  const truncated = premise.length > 60 ? premise.slice(0, 57) + '...' : premise;
  return (
    chalk.hex(palette.probe).bold('🔬 probe') +
    chalk.hex(palette.dim)(' · ') +
    chalk.hex(palette.subtle)(runId) +
    chalk.hex(palette.dim)(' · ') +
    chalk.hex(palette.stage).italic(`"${truncated}"`)
  );
}
