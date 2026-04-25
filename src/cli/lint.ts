import fs from 'node:fs/promises';
import chalk from 'chalk';
import { checkProvenance } from '../lint/provenance.js';
import { checkForbiddenPhrases } from '../lint/forbidden.js';
import { loadKnownSourceCardIds } from '../lint/source_cards.js';

interface LintOptions {
  voiceOnly?: boolean;
  provenanceOnly?: boolean;
  strictInference?: boolean;
  /**
   * Commander maps the `--no-source-card-check` flag to `sourceCardCheck:
   * false`; the default is `true`. When false, the linter skips validating
   * `[SOURCE_CARD:<id>]` references against the repo corpus. The default
   * enforces the provenance commitment — `probe lint` is the linter that
   * blocks fabricated citations, and silently allowing them would defeat
   * the central guarantee. The opt-out exists for the rare case of linting
   * markdown sourced outside the corpus (external fixtures, docs stored
   * in another repo).
   */
  sourceCardCheck?: boolean;
}

export async function lintCommand(file: string, opts: LintOptions): Promise<void> {
  const md = await fs.readFile(file, 'utf8');

  let provenanceResult: { passed: boolean; violations: string[] } | null = null;
  let voiceResult: { passed: boolean; violations: string[] } | null = null;

  if (!opts.voiceOnly) {
    const checkCards = opts.sourceCardCheck !== false;
    const knownSourceCards = checkCards
      ? await loadKnownSourceCardIds().catch(() => undefined)
      : undefined;
    provenanceResult = checkProvenance(md, {
      strictInference: opts.strictInference,
      knownSourceCards,
    });
  }
  if (!opts.provenanceOnly) {
    voiceResult = checkForbiddenPhrases(md);
  }

  let exitCode = 0;
  if (provenanceResult) {
    console.log(chalk.bold('provenance lint'));
    if (provenanceResult.passed) {
      console.log(chalk.green('  ✓ every element carries a provenance tag'));
    } else {
      console.log(chalk.red(`  ✗ ${provenanceResult.violations.length} violations`));
      for (const v of provenanceResult.violations.slice(0, 30)) {
        console.log(chalk.red(`    ${v}`));
      }
      exitCode = 1;
    }
  }
  if (voiceResult) {
    console.log(chalk.bold('voice lint'));
    if (voiceResult.passed) {
      console.log(chalk.green('  ✓ no forbidden phrases outside quoted context'));
    } else {
      console.log(chalk.red(`  ✗ ${voiceResult.violations.length} violations`));
      for (const v of voiceResult.violations.slice(0, 30)) {
        console.log(chalk.red(`    ${v}`));
      }
      exitCode = 1;
    }
  }

  process.exitCode = exitCode;
}
