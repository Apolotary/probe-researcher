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
import { exploreV2Command } from './explore_v2.js';
import { auditDeepCommand } from './audit_deep.js';
import { interviewCommand } from './interview.js';
import { symposiumCommand } from './symposium.js';
import { renderCommand } from './render.js';
import { runsCommand } from './runs.js';
import { ganttCommand } from './gantt.js';
import { panelCommand } from './panel.js';
import { doctorCommand } from './doctor.js';
import { statsCommand } from './stats.js';
import { importCommand } from './import_paper.js';
import { reportPageCommand } from './report_page.js';
import { interactiveDefault } from './interactive.js';
import { webCommand } from './web.js';
import { uiCommand } from './ui_app.js';

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
  .option('--no-novelty', 'skip the novelty hawk reviewer (stage 7c)')
  .option('--step', 'pause after each stage for user review; opens $EDITOR on demand to edit the just-produced artifact before the next stage reads it')
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
  .option('--strict-inference', 'require every [AGENT_INFERENCE] element to sit within 5 preceding elements of an anchor tag (SOURCE_CARD, SIMULATION_REHEARSAL, TOOL_VERIFIED, RESEARCHER_INPUT) or cite a source card inline — opt-in rigor check from PROMPT_FOR_LLM_ADVISORS.md §3', false)
  .option('--no-source-card-check', 'skip validating [SOURCE_CARD:<id>] against corpus/source_cards/ — only set this for fixtures stored outside the repo; the default enforces the provenance commitment')
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
  .command('explore2')
  .argument('<run_id>', 'run id to explore with the new two-pane UI')
  .description('Two-pane terminal UI (sidebar navigator + main artifact viewer) — ↑↓ to move, Enter/Tab to switch focus, e to open current artifact in $EDITOR, q to quit. SSH-friendly equivalent of `probe web`.')
  .action(exploreV2Command);

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

program
  .command('render')
  .argument('<run_id>', 'run id to render')
  .description('Render a single-file PDF/HTML/markdown report bundling the guidebook, reviewer panel, audit findings, blocked branches, lint status, and cost log. Auto-detects the best available backend (pandoc+wkhtmltopdf > pandoc HTML > raw markdown).')
  .option('-f, --format <format>', 'pdf | html | md | auto (default auto)')
  .option('-o, --output <path>', 'output path (default runs/<id>/PROBE_REPORT.<ext>)')
  .action(renderCommand);

program
  .command('runs')
  .description('List all Probe runs under runs/ with status, cost, duration, and surviving-branch count. Linear-style workflow overview.')
  .action(runsCommand);

program
  .command('gantt')
  .argument('<run_id>', 'run id to visualize')
  .description('Per-run Gantt-style terminal view of stage durations and costs, grouped by branch. Shows model (Opus/Sonnet), repair-pass count, and where time/$ went.')
  .action(ganttCommand);

program
  .command('panel')
  .argument('<run_id>', 'run id')
  .argument('<branch_id>', 'branch id (a | b | c)')
  .description('Render a standalone HTML reviewer-disagreement panel for a branch. 3-column layout shows methodologist / accessibility / novelty reviewer findings side-by-side with the meta-reviewer verdict as a banner. Self-contained, no external CSS/JS.')
  .option('-o, --output <path>', 'output path (default runs/<id>/branches/<branch>/REVIEWER_PANEL.html)')
  .action(panelCommand);

program
  .command('doctor')
  .option('--once', 'exit immediately after printing (CI-friendly, old default behavior)')
  .option('--watch [seconds]', 're-run the checks every N seconds (default 30) until Ctrl+C', (v) => {
    if (v === undefined || v === '') return true;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : 30;
  })
  .description('One-command verification sweep — typecheck, tests, lint shipped guidebooks, PDF backend availability, git cleanliness, corpus/patterns/benchmark inventory. Stays open until Ctrl+C so the output remains visible. Pass --once for the old exit-immediately behavior (CI/scripts); pass --watch [N] to re-run every N seconds as a live status page.')
  .action(doctorCommand);

program
  .command('import')
  .argument('<file>', 'paper draft to import (markdown or text; LaTeX as text)')
  .option('--run-id <id>', 'explicit run id; default: import_YYYY-MM-DD_<filename-slug>')
  .description('Warm-start a run from an existing paper draft. Classifies sections into Probe\'s schema (premise / prototype / method / rehearsal / findings / etc.), emits stage-compatible artifacts with [IMPORTED_DRAFT] provenance, and lets probe audit-deep + probe run --skip 1,2,3,4,5 critique the draft instead of generating one. Paper text is preserved verbatim — Probe audits, does not rewrite.')
  .action(importCommand);

program
  .command('report-page')
  .argument('<run_id>', 'run id to render')
  .option('-o, --output <path>', 'output path (default runs/<id>/PROBE_REPORT_PAGE.html)')
  .description('Render a single-file self-contained HTML report page for a run, in the stanfordhci.github.io/Bloom long-scroll template — top-nav anchors, title block, teaser pipeline figure, text/figure rhythm, rehearsal-quote cards, capture-risk Safety section, reviewer-panel summary, provenance legend, BibTeX footer. Shareable via a single URL; renders on mobile; zero API cost.')
  .action(reportPageCommand);

program
  .command('web')
  .option('-p, --port <port>', 'port to bind (default 4470)')
  .option('--host <host>', 'host to bind (default 127.0.0.1)')
  .option('--no-open', 'do not open the browser automatically')
  .description('Start a local web UI for browsing and editing runs. Binds 127.0.0.1 by default. Two-pane layout: sidebar with runs/stages/branches, main area with rendered artifacts and inline editor. Saves go straight to disk; the next pipeline stage reads the edited file.')
  .action(webCommand);

program
  .command('ui')
  .option('--scene <id>', 'jump to a specific scene: startup | welcome | premise | brainstorm | literature | methodology | artifacts | evaluation | report | done | project | config')
  .option('--web', 'open the HTML companion in a browser (full interactive Dossier prototype). Same probe.toml as the TUI.')
  .option('-p, --port <port>', 'with --web: port to bind (default 4470)')
  .option('--host <host>', 'with --web: host to bind (default 127.0.0.1)')
  .option('--no-open', 'with --web: do not auto-open the browser')
  .description('Launch the new Probe UI. The TUI runs the full live workflow — premise → brainstorm RQs → literature → methodology → artifacts → evaluation → report → done — with state carried across stages. Pass --web for the HTML companion (full Dossier prototype with the same flow). First-run users land on welcome; returning users on startup.')
  .action(uiCommand);

program
  .command('stats')
  .argument('[run_id]', 'run id to summarize; omit when using --all')
  .option('--all', 'produce a cross-run table + RUNS_SUMMARY.md at repo root')
  .option('--json', 'print the per-run stats object as JSON (no decorated table)')
  .description('Per-run triage summary: branch verdicts, axis-level pattern fire counts, reviewer disagreement class, cost, duration, linter status, and anomalies (repair passes, missing artifacts, failed branches). Writes stats.json under the run directory. Use --all to iterate runs/ and produce RUNS_SUMMARY.md.')
  .action((runId, opts) => statsCommand(runId, opts));

// Default action: typing `probe` with no subcommand launches the
// interactive menu. commander triggers this branch when argv has no
// recognized command. We check length rather than using .action() on
// the program root because commander's default-command handling
// swallows subcommand dispatch on some Node versions.
if (process.argv.length <= 2) {
  interactiveDefault()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
} else {
  program.parseAsync(process.argv).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
