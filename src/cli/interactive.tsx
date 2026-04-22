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
 */
export async function runInteractiveMenu(): Promise<DispatchRequest> {
  const runsInventory = await listRuns();
  return new Promise((resolve) => {
    let resolved = false;
    const finish = (req: DispatchRequest): void => {
      if (resolved) return;
      resolved = true;
      resolve(req);
    };
    render(<InteractiveApp onChoose={finish} runsInventory={runsInventory} />);
  });
}

/**
 * Top-level entry that maps the menu's dispatch request onto concrete
 * CLI behavior. Called from src/cli/index.ts as the default action.
 */
export async function interactiveDefault(): Promise<void> {
  const pick = await runInteractiveMenu();
  if (pick.kind === 'exit') return;

  if (pick.kind === 'subcommand') {
    // Re-enter the CLI with the picked subcommand.
    const { execFileSync } = await import('node:child_process');
    try {
      execFileSync('npx', ['probe', ...pick.argv], { stdio: 'inherit' });
    } catch {
      // child command manages its own exit codes.
    }
    return;
  }

  if (pick.kind === 'premise-then-run') {
    await promptThenRun('run');
    return;
  }

  if (pick.kind === 'import-then-audit') {
    await promptThenRun('import');
    return;
  }
}

/**
 * After the menu closes, prompt for either a premise (for run) or a file
 * path (for import). We drop Ink for the prompt — a readline line is
 * enough and avoids Ink's input-focus rough edges for free-text.
 */
async function promptThenRun(mode: 'run' | 'import'): Promise<void> {
  const readline = await import('node:readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const prompt = (q: string): Promise<string> =>
    new Promise((resolve) => rl.question(q, (answer) => resolve(answer)));

  console.log('');
  if (mode === 'run') {
    const premise = (
      await prompt('Premise (one sentence, e.g. "design a study to evaluate X for Y"):\n> ')
    ).trim();
    rl.close();
    if (!premise) {
      console.log('(no premise entered, exiting)');
      return;
    }
    const { execFileSync } = await import('node:child_process');
    try {
      execFileSync('npx', ['probe', 'run', premise], { stdio: 'inherit' });
    } catch {
      /* subcommand handles exit */
    }
    return;
  }

  // import
  const filePath = (await prompt('Path to paper draft (.md or .tex):\n> ')).trim();
  rl.close();
  if (!filePath) {
    console.log('(no file entered, exiting)');
    return;
  }
  const absPath = path.resolve(filePath);
  try {
    await fs.access(absPath);
  } catch {
    console.log(`File not found: ${absPath}`);
    return;
  }
  const { execFileSync } = await import('node:child_process');
  try {
    execFileSync('npx', ['probe', 'import', absPath], { stdio: 'inherit' });
  } catch {
    /* subcommand handles exit */
  }
  // dummy reference to keep runDir import linted as "in use" without polluting runtime.
  void runDir;
}
