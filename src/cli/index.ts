#!/usr/bin/env node
/**
 * Probe CLI entry point.
 *
 * Commands:
 *   probe run <premise>    — run the full pipeline on a fresh premise
 *   probe replay <run_id>  — replay a previously recorded run deterministically
 *   probe lint <file>      — validate provenance tags and forbidden phrases
 *   probe init <run_id>    — scaffold an empty run directory (debug)
 */

import { Command } from 'commander';
import { runCommand } from './run.js';
import { replayCommand } from './replay.js';
import { lintCommand } from './lint.js';
import { initCommand } from './init.js';

const program = new Command();

program
  .name('probe')
  .description('Research-design triage for screen-based interactive research.')
  .version('0.1.0');

program
  .command('run')
  .argument('<premise>', 'research premise in quotes')
  .option('--run-id <id>', 'override auto-generated run id')
  .option('--skip <stages>', 'comma-separated stage numbers to skip', '')
  .option('--branches <n>', 'number of parallel branches', '3')
  .action(runCommand);

program
  .command('replay')
  .argument('<run_id>', 'run id to replay from runs/<run_id>')
  .action(replayCommand);

program
  .command('lint')
  .argument('<file>', 'guidebook markdown file to lint')
  .option('--voice-only', 'only run forbidden-phrase check', false)
  .option('--provenance-only', 'only run provenance tag check', false)
  .action(lintCommand);

program
  .command('init')
  .argument('<run_id>', 'run id to scaffold')
  .action(initCommand);

program.parseAsync(process.argv).catch((err) => {
  console.error(err);
  process.exit(1);
});
