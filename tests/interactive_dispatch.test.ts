import { describe, it, expect } from 'vitest';
import { buildMenu, buildSubcommandSpawn } from '../src/cli/interactive.js';

/**
 * Regression tests for the interactive-menu dispatch path.
 *
 * The prior code shelled out to a literal `probe` and used `dispatch:
 * { argv: ['doctor'] }`. Both were brittle: the literal binary doesn't
 * exist when running from source, and the bare `doctor` subcommand now
 * blocks until Ctrl+C, which prevents returning to the menu. The fixes
 * pinned here:
 *
 *   - the doctor menu entry passes --once
 *   - the spawn helper uses the current Node executable and entry script,
 *     not a literal `probe` from PATH.
 */
describe('interactive menu — doctor entry', () => {
  it('passes --once so doctor returns to the menu instead of blocking', () => {
    const menu = buildMenu(true);
    const doctor = menu.find((e) => e.id === 'doctor');
    expect(doctor).toBeDefined();
    if (!doctor) return;
    expect(doctor.dispatch.kind).toBe('subcommand');
    if (doctor.dispatch.kind !== 'subcommand') return;
    expect(doctor.dispatch.argv).toEqual(['doctor', '--once']);
  });
});

describe('interactive menu — buildSubcommandSpawn', () => {
  it('uses process.execPath and process.argv[1], not a literal probe binary', () => {
    const result = buildSubcommandSpawn(['stats', '--all']);
    expect(result.command).toBe(process.execPath);
    expect(result.args[0]).toBe(process.argv[1]);
    expect(result.args.slice(1)).toEqual(['stats', '--all']);
  });

  it('falls back to a probe literal only when argv[1] is missing', () => {
    // Defensive path: argv[1] is set in any normal CLI invocation, but if
    // the harness ever stripped it we want a debuggable failure (visible
    // ENOENT) rather than a silent no-op.
    const original = process.argv[1];
    try {
      // @ts-expect-error — intentionally unsetting for this assertion.
      process.argv[1] = undefined;
      const result = buildSubcommandSpawn(['runs']);
      expect(result.command).toBe('probe');
      expect(result.args).toEqual(['runs']);
    } finally {
      process.argv[1] = original;
    }
  });
});
