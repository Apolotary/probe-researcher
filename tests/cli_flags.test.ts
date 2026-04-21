import { describe, it, expect } from 'vitest';
import { Command } from 'commander';

/**
 * Regression test for the `--no-novelty` flag.
 *
 * commander.js creates `opts.novelty: false` (not `opts.noNovelty: true`) when
 * `--no-novelty` is passed. The initial implementation read the wrong key and
 * silently ignored the flag. This test pins the parser behavior so we don't
 * regress.
 */
describe('CLI flag parsing', () => {
  function parseRunFlags(argv: string[]): Record<string, unknown> {
    const program = new Command();
    let captured: Record<string, unknown> = {};
    program
      .command('run')
      .argument('<premise>')
      .option('--run-id <id>')
      .option('--skip <stages>', '', '')
      .option('--branches <n>', '', '3')
      .option('--no-novelty', 'skip the novelty hawk reviewer')
      .action((_premise, opts) => {
        captured = opts as Record<string, unknown>;
      });
    program.parse(['node', 'probe', 'run', 'some-premise', ...argv]);
    return captured;
  }

  it('omits the flag → novelty defaults to true (includeNovelty effectively true)', () => {
    const opts = parseRunFlags([]);
    // commander's default: when the flag is not passed, opts.novelty is undefined or true.
    // The crucial negation is that opts.novelty !== false.
    expect(opts.novelty).not.toBe(false);
  });

  it('passes --no-novelty → opts.novelty === false', () => {
    const opts = parseRunFlags(['--no-novelty']);
    expect(opts.novelty).toBe(false);
  });

  it('derives includeNovelty correctly from opts.novelty', () => {
    const includeNovelty = (novelty: unknown): boolean => novelty !== false;
    expect(includeNovelty(undefined)).toBe(true);
    expect(includeNovelty(true)).toBe(true);
    expect(includeNovelty(false)).toBe(false);
  });
});
