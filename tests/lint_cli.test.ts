import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { lintCommand } from '../src/cli/lint.js';
import { loadKnownSourceCardIds } from '../src/lint/source_cards.js';

/**
 * CLI-level tests for `probe lint`. These confirm that the central provenance
 * commitment — fabricated [SOURCE_CARD:<id>] tags must not pass — is enforced
 * by default through the CLI entry point, not just at the library layer.
 *
 * The previous code path only validated source-card IDs when an explicit list
 * was passed, and the CLI never passed one. Tests below pin the new default.
 */
describe('probe lint CLI source-card validation', () => {
  async function withTempFile(contents: string, body: (file: string) => Promise<void>): Promise<void> {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'probe-lint-test-'));
    const file = path.join(dir, 'fixture.md');
    await fs.writeFile(file, contents);
    const prev = process.exitCode;
    try {
      await body(file);
    } finally {
      process.exitCode = prev;
      await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
    }
  }

  it('rejects an unknown [SOURCE_CARD:not_real] by default', async () => {
    const md = `# Fixture

Bad citation. [SOURCE_CARD:not_a_real_card_anywhere]

Handoff. [HUMAN_REQUIRED]
`;
    await withTempFile(md, async (file) => {
      process.exitCode = 0;
      await lintCommand(file, {});
      expect(process.exitCode).toBe(1);
    });
  });

  it('skips source-card validation when sourceCardCheck is false', async () => {
    // The opt-out exists for fixtures sourced outside the corpus. With it off,
    // the unknown id no longer fails — only structural lint rules apply.
    const md = `# Fixture

External citation. [SOURCE_CARD:external_paper_outside_corpus]

Handoff. [HUMAN_REQUIRED]
`;
    await withTempFile(md, async (file) => {
      process.exitCode = 0;
      await lintCommand(file, { sourceCardCheck: false });
      expect(process.exitCode).toBe(0);
    });
  });

  it('does not reject a typed [IMPORTED_DRAFT:method] suffix as a source-card id', async () => {
    // The suffix on IMPORTED_DRAFT names a section, not a corpus reference.
    // This guards against the regression where `:method` got slurped into
    // sourceCardsReferenced and validated against the corpus.
    const md = `# Fixture

Imported method text. [IMPORTED_DRAFT:method]

Handoff. [HUMAN_REQUIRED]
`;
    await withTempFile(md, async (file) => {
      process.exitCode = 0;
      await lintCommand(file, {});
      expect(process.exitCode).toBe(0);
    });
  });

  it('passes a real source-card id from the repo corpus', async () => {
    const known = await loadKnownSourceCardIds();
    // Pick a card that exists. If the corpus is empty, skip (test environment is
    // missing source cards) — the test only makes sense against real fixtures.
    if (known.length === 0) return;
    const cardId = known[0];
    const md = `# Fixture

Grounded paragraph. [SOURCE_CARD:${cardId}]

Handoff. [HUMAN_REQUIRED]
`;
    await withTempFile(md, async (file) => {
      process.exitCode = 0;
      await lintCommand(file, {});
      expect(process.exitCode).toBe(0);
    });
  });
});
