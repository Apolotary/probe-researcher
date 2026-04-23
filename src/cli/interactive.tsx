/**
 * Interactive default — what happens when the user types `probe` with no
 * subcommand. An Ink menu that detects which providers are available and
 * offers a fork:
 *   - Run a new premise      (needs an API key)
 *   - Import a paper draft   (needs an API key)
 *   - Explore an existing run (works offline)
 *   - View the runs dashboard (works offline)
 *   - Run the health check   (works offline)
 *   - Quit
 *
 * Each option dispatches to the existing subcommand machinery — the menu
 * is a launcher, not a reimplementation.
 */

import React, { useState } from 'react';
import { Box, Text, useInput, useApp, render } from 'ink';
import fs from 'node:fs/promises';
import path from 'node:path';
import { palette } from '../ui/theme.js';
import { banner, tagline } from '../ui/logo.js';
import { runDir } from '../util/paths.js';
import { detectProvider } from '../llm/provider.js';

interface MenuEntry {
  id: string;
  label: string;
  hint: string;
  needsApi: boolean;
  /**
   * Return value tells the caller what to do after the Ink app exits.
   * The outer wrapper executes it. This pattern keeps dispatch logic
   * out of the Ink event loop.
   */
  dispatch: DispatchRequest;
}

export type DispatchRequest =
  | { kind: 'subcommand'; argv: string[] }
  | { kind: 'premise-then-run' }
  | { kind: 'import-then-audit' }
  | { kind: 'exit' };

function buildMenu(hasApi: boolean): MenuEntry[] {
  const entries: MenuEntry[] = [
    {
      id: 'run',
      label: 'Run a new premise',
      hint: 'Full 8-stage pipeline (~$3-6, ~25-45 min)',
      needsApi: true,
      dispatch: { kind: 'premise-then-run' },
    },
    {
      id: 'import',
      label: 'Import a paper draft',
      hint: 'Warm-start — classify sections of an existing paper (~$0.10, ~1 min)',
      needsApi: true,
      dispatch: { kind: 'import-then-audit' },
    },
    {
      id: 'explore',
      label: 'Explore an existing run',
      hint: 'Browse 3-pane worktree UI. Offline.',
      needsApi: false,
      dispatch: { kind: 'subcommand', argv: ['runs'] },
    },
    {
      id: 'stats',
      label: 'View the runs dashboard',
      hint: 'Cross-run table + RUNS_SUMMARY.md. Offline.',
      needsApi: false,
      dispatch: { kind: 'subcommand', argv: ['stats', '--all'] },
    },
    {
      id: 'doctor',
      label: 'Run the health check',
      hint: 'Typecheck + tests + linters + inventory. Offline.',
      needsApi: false,
      dispatch: { kind: 'subcommand', argv: ['doctor'] },
    },
    {
      id: 'quit',
      label: 'Quit',
      hint: '',
      needsApi: false,
      dispatch: { kind: 'exit' },
    },
  ];
  return entries.filter((e) => (hasApi ? true : !e.needsApi || e.id === 'quit'));
}

interface AppProps {
  onChoose: (request: DispatchRequest) => void;
  runsInventory: string[];
}

function InteractiveApp({ onChoose, runsInventory }: AppProps): React.ReactElement {
  const { exit } = useApp();
  const provider = detectProvider();
  const menu = buildMenu(provider.canCallApi);
  const [cursor, setCursor] = useState(0);

  useInput((input, key) => {
    if (key.upArrow || input === 'k') {
      setCursor((c) => Math.max(0, c - 1));
    } else if (key.downArrow || input === 'j') {
      setCursor((c) => Math.min(menu.length - 1, c + 1));
    } else if (key.return) {
      const entry = menu[cursor];
      onChoose(entry.dispatch);
      exit();
    } else if (input === 'q' || key.escape) {
      onChoose({ kind: 'exit' });
      exit();
    }
  });

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text>{banner()}</Text>
      <Text>{tagline()}</Text>
      <Box marginTop={1}>
        <Text color={palette.subtle}>
          Provider: <Text color={provider.canCallApi ? palette.passed : palette.revision}>{provider.label}</Text>
        </Text>
      </Box>
      <Box marginTop={1} marginBottom={1}>
        <Text color={palette.dim}>{provider.description}</Text>
      </Box>
      {!provider.canCallApi && (
        <Box marginBottom={1}>
          <Text color={palette.revision}>
            No API-backed commands are available. Set ANTHROPIC_API_KEY or OPENAI_API_KEY to unlock the full menu.
          </Text>
        </Box>
      )}
      <Box marginBottom={1}>
        <Text color={palette.dim}>
          {runsInventory.length} run{runsInventory.length === 1 ? '' : 's'} in runs/
          {runsInventory.length > 0 ? `: ${runsInventory.slice(0, 3).join(', ')}${runsInventory.length > 3 ? `, +${runsInventory.length - 3} more` : ''}` : ''}
        </Text>
      </Box>
      <Box flexDirection="column">
        {menu.map((entry, i) => {
          const selected = i === cursor;
          return (
            <Box key={entry.id} marginBottom={0}>
              <Text color={selected ? palette.probe : palette.heading}>
                {selected ? '▸ ' : '  '}
                {entry.label}
              </Text>
              {entry.hint && (
                <Text color={palette.dim}>
                  {'    '}
                  {entry.hint}
                </Text>
              )}
            </Box>
          );
        })}
      </Box>
      <Box marginTop={1}>
        <Text color={palette.dim}>↑↓ move · Enter pick · q quit</Text>
      </Box>
    </Box>
  );
}

async function listRuns(): Promise<string[]> {
  try {
    const runsRoot = path.join(process.cwd(), 'runs');
    const entries = await fs.readdir(runsRoot);
    return entries
      .filter((e) => !e.startsWith('.') && !e.startsWith('_'))
      .filter((e) => !e.startsWith('ablation_') && !e.startsWith('hallucination_'))
      .sort();
  } catch {
    return [];
  }
}

/**
 * Launch the interactive menu. Resolves with the dispatch request the
 * user picked. Caller is responsible for executing the dispatch (i.e.
 * re-entering the CLI with a subcommand, or prompting for a premise).
 *
 * This function takes care to fully hand stdin back to the caller after
 * the Ink app exits — Ink puts stdin into raw mode, and if we don't
 * unmount + await the instance + reset raw mode before the next reader
 * (readline, execFile inherit, etc.) takes stdin, the follow-up prompt
 * swallows keystrokes silently. First Mac-terminal bug report surfaced
 * exactly this: the premise `>` prompt rendered but accepted no input.
 */
export async function runInteractiveMenu(): Promise<DispatchRequest> {
  const runsInventory = await listRuns();
  let pick: DispatchRequest | null = null;
  const finishedPromise = new Promise<void>((resolve) => {
    const instance = render(
      <InteractiveApp
        onChoose={(req) => {
          if (pick === null) pick = req;
        }}
        runsInventory={runsInventory}
      />,
    );
    // waitUntilExit resolves when the Ink app unmounts (triggered by
    // useApp().exit() inside the component). After that the stdin
    // handoff is safe, which is what we need for the subsequent
    // readline.createInterface / execFileSync call to actually receive
    // user keystrokes.
    instance
      .waitUntilExit()
      .then(() => {
        // Belt-and-braces: reset raw mode explicitly. Ink's cleanup
        // usually handles this, but the Mac terminal bug report above
        // showed at least one path where it didn't.
        if (process.stdin.isTTY) {
          try {
            process.stdin.setRawMode(false);
          } catch {
            /* already off */
          }
        }
        resolve();
      })
      .catch(() => resolve());
  });
  await finishedPromise;
  return pick ?? { kind: 'exit' };
}

/**
 * Top-level entry that maps the menu's dispatch request onto concrete
 * CLI behavior. Called from src/cli/index.ts as the default action.
 *
 * The read-only dispatch paths (explore / stats / doctor) re-enter the
 * CLI via execFileSync with stdio: 'inherit'. The write paths (run a
 * new premise / import a paper) print the exact command and exit so
 * the shell handles input — this avoids a class of stdin-handoff bugs
 * between Ink and readline that caused the premise prompt to silently
 * swallow keystrokes on macOS Terminal.
 */
export async function interactiveDefault(): Promise<void> {
  const pick = await runInteractiveMenu();
  if (pick.kind === 'exit') return;

  if (pick.kind === 'subcommand') {
    // Re-enter the CLI with the picked subcommand. These are offline
    // read-only commands (runs / stats --all / doctor) — no input
    // needed after launch, so stdio: 'inherit' works cleanly.
    const { execFileSync } = await import('node:child_process');
    try {
      execFileSync('probe', pick.argv, { stdio: 'inherit' });
    } catch {
      // child command manages its own exit codes.
    }
    return;
  }

  if (pick.kind === 'premise-then-run') {
    printLaunchInstructions('run');
    return;
  }

  if (pick.kind === 'import-then-audit') {
    printLaunchInstructions('import');
    return;
  }

  // dummy reference so unused-import lint doesn't trip on runDir / fs,
  // both of which are kept for a future in-Ink TextInput path we may
  // add back once Ink's stdin handoff is more reliable on macOS.
  void runDir;
  void fs;
}

function printLaunchInstructions(mode: 'run' | 'import'): void {
  const lines: string[] = [];
  if (mode === 'run') {
    lines.push('');
    lines.push('Run a new premise — copy one of these into your shell:');
    lines.push('');
    lines.push('    probe run "design a study to evaluate X for Y"');
    lines.push('');
    lines.push('Or with explicit flags:');
    lines.push('');
    lines.push('    probe run --run-id my_run_2026 "your premise sentence"');
    lines.push('    probe run --no-novelty "your premise"       # skip the novelty-hawk reviewer');
    lines.push('');
    lines.push('Typical cost: $3–6, typical wall-clock: 25–45 min.');
    lines.push('Cost scales with premise specificity + branch divergence.');
  } else {
    lines.push('');
    lines.push('Import a paper draft — copy this into your shell:');
    lines.push('');
    lines.push('    probe import path/to/your/paper.md');
    lines.push('');
    lines.push('Then, to audit the imported draft:');
    lines.push('');
    lines.push('    probe audit-deep <the-run-id-from-output> a');
    lines.push('');
    lines.push('Typical cost: $0.05–0.20, typical wall-clock: ~1 min.');
  }
  for (const l of lines) {
    // eslint-disable-next-line no-console
    console.log(l);
  }
}
