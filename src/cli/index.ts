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
import { exploreCommand } from './explore.js';
import { auditDeepCommand } from './audit_deep.js';
import { interviewCommand } from './interview.js';
import { symposiumCommand } from './symposium.js';

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
  .option('--no-novelty', 'skip the novelty hawk reviewer (stage 7c)')
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

program
  .command('explore')
  .argument('<run_id>', 'run id to explore visually (worktree-style 3-pane UI)')
  .description('Open a multi-pane terminal UI for a completed run — navigate branches, toggle artifact views, lock/unlock branches')
  .action(exploreCommand);

program
  .command('audit-deep')
  .argument('<run_id>', 'run id')
  .argument('<branch_id>', 'branch id (a | b | c)')
  .description('Deep capture-risk audit using Claude Managed Agents — the agent can bash/grep/file-read the branch artifacts and measure quantitative claims (like announcement-duration confounds) rather than only reason about them')
  .option('--dry-run', 'print what would happen without creating a session')
  .action(auditDeepCommand);

program
  .command('interview')
  .argument('<run_id>', 'run id (guidebook study protocol will be loaded as context)')
  .description('Rehearse the guidebook\'s interview protocol against a simulated participant (Managed Agents session). Not evidence — every participant response is [SIMULATION_REHEARSAL].')
  .option('--persona <description>', 'inline persona description for the simulated participant')
  .option('--persona-file <path>', 'file path containing persona description')
  .option('--single-turn', 'single question/answer, then exit (smoke test)')
  .action(interviewCommand);

program
  .command('symposium')
  .argument('<run_ids...>', 'two or more run ids of completed Probe runs on adjacent premises')
  .description('Convene N completed Probe runs as a simulated symposium. Produces a disagreement-preserving convener report that maps where the position papers agree, disagree, and share blind spots. Not a synthesis paper — a workshop-planning artifact.')
  .action(symposiumCommand);

program.parseAsync(process.argv).catch((err) => {
  console.error(err);
  process.exit(1);
});
