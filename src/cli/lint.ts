import fs from 'node:fs/promises';
import chalk from 'chalk';
import { checkProvenance } from '../lint/provenance.js';
import { checkForbiddenPhrases } from '../lint/forbidden.js';

interface LintOptions {
  voiceOnly?: boolean;
  provenanceOnly?: boolean;
}

export async function lintCommand(file: string, opts: LintOptions): Promise<void> {
  const md = await fs.readFile(file, 'utf8');

  let provenanceResult: { passed: boolean; violations: string[] } | null = null;
  let voiceResult: { passed: boolean; violations: string[] } | null = null;

  if (!opts.voiceOnly) {
    provenanceResult = checkProvenance(md);
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
