/**
 * Interactive default — what happens when the user types `probe` with no
 * subcommand. An Ink app that:
 *
 *   1. Shows a menu of options adapted to the detected provider
 *      (API-needing options hidden in demo mode).
 *   2. For free-text options (run a new premise / import a paper),
 *      switches to a TextInput SCREEN INSIDE the same Ink app — no
 *      stdin handoff. User types, hits Enter, Ink captures the value,
 *      unmounts, and dispatches to the subcommand.
 *   3. For read-only options (explore / stats / doctor), unmounts and
 *      dispatches to the existing subcommand via execFileSync.
 *
 * Earlier versions tried to hand off to readline or print launch
 * instructions. Both had issues (stdin raw-mode not released on macOS;
 * instructions made the menu feel broken). Keeping text entry inside
 * Ink sidesteps both.
 */

import React, { useState } from 'react';
import { Box, Text, useInput, useApp, render } from 'ink';
import TextInput from 'ink-text-input';
import fs from 'node:fs/promises';
import path from 'node:path';
import { palette } from '../ui/theme.js';
import { banner, tagline } from '../ui/logo.js';
import { detectProvider } from '../llm/provider.js';

interface MenuEntry {
  id: string;
  label: string;
  hint: string;
  needsApi: boolean;
  dispatch: DispatchRequest;
}

export type DispatchRequest =
  | { kind: 'subcommand'; argv: string[] }
  | { kind: 'run-with-premise'; premise: string; runId?: string; includeNovelty: boolean }
  | { kind: 'import-with-path'; filePath: string }
  | { kind: 'exit' };

export function buildMenu(hasApi: boolean): MenuEntry[] {
  const entries: MenuEntry[] = [
    {
      id: 'run',
      label: 'Run a new premise',
      hint: 'Full 8-stage pipeline (~$3-6, ~25-45 min)',
      needsApi: true,
      // The actual dispatch is built from the TextInput screen; this
      // placeholder is replaced before resolve().
      dispatch: { kind: 'run-with-premise', premise: '', includeNovelty: true },
    },
    {
      id: 'import',
      label: 'Import a paper draft',
      hint: 'Warm-start — classify sections of an existing paper (~$0.10, ~1 min)',
      needsApi: true,
      dispatch: { kind: 'import-with-path', filePath: '' },
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
      // `doctor` without --once blocks on Ctrl+C, which prevents returning
      // to the menu naturally. The menu wants the CI-friendly one-shot
      // behavior so the report prints and control returns here.
      dispatch: { kind: 'subcommand', argv: ['doctor', '--once'] },
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

type Screen =
  | { kind: 'menu' }
  | { kind: 'premise-input' }
  | { kind: 'import-input' };

interface AppProps {
  onChoose: (request: DispatchRequest) => void;
  runsInventory: string[];
}

function InteractiveApp({ onChoose, runsInventory }: AppProps): React.ReactElement {
  const { exit } = useApp();
  const provider = detectProvider();
  const menu = buildMenu(provider.canCallApi);
  const [cursor, setCursor] = useState(0);
  const [screen, setScreen] = useState<Screen>({ kind: 'menu' });
  const [textValue, setTextValue] = useState('');

  useInput((input, key) => {
    if (screen.kind !== 'menu') return; // let TextInput handle its own keys
    if (key.upArrow || input === 'k') {
      setCursor((c) => Math.max(0, c - 1));
    } else if (key.downArrow || input === 'j') {
      setCursor((c) => Math.min(menu.length - 1, c + 1));
    } else if (key.return) {
      const entry = menu[cursor];
      if (entry.dispatch.kind === 'run-with-premise') {
        setTextValue('');
        setScreen({ kind: 'premise-input' });
      } else if (entry.dispatch.kind === 'import-with-path') {
        setTextValue('');
        setScreen({ kind: 'import-input' });
      } else {
        onChoose(entry.dispatch);
        exit();
      }
    } else if (input === 'q' || key.escape) {
      onChoose({ kind: 'exit' });
      exit();
    }
  });

  // ── Header (always visible) ────────────────────────────────────────
  const header = (
    <>
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
    </>
  );

  // ── Menu screen ────────────────────────────────────────────────────
  if (screen.kind === 'menu') {
    return (
      <Box flexDirection="column" paddingX={1}>
        {header}
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

  // ── Premise-input screen ───────────────────────────────────────────
  if (screen.kind === 'premise-input') {
    return (
      <Box flexDirection="column" paddingX={1}>
        {header}
        <Box marginBottom={1}>
          <Text color={palette.stage}>Run a new premise</Text>
        </Box>
        <Box marginBottom={1}>
          <Text color={palette.dim}>
            Type one sentence describing the study you want Probe to triage.
            {'\n'}Example: "design a study to evaluate an ARIA-live AI disclosure banner for BLV screen-reader users"
          </Text>
        </Box>
        <Box>
          <Text color={palette.probe}>▸ </Text>
          <TextInput
            value={textValue}
            onChange={setTextValue}
            onSubmit={(v) => {
              const trimmed = v.trim();
              if (!trimmed) {
                onChoose({ kind: 'exit' });
              } else {
                onChoose({ kind: 'run-with-premise', premise: trimmed, includeNovelty: true });
              }
              exit();
            }}
            placeholder="your research premise…"
          />
        </Box>
        <Box marginTop={1}>
          <Text color={palette.dim}>Enter to launch · (empty Enter cancels)</Text>
        </Box>
      </Box>
    );
  }

  // ── Import-input screen ────────────────────────────────────────────
  return (
    <Box flexDirection="column" paddingX={1}>
      {header}
      <Box marginBottom={1}>
        <Text color={palette.stage}>Import a paper draft</Text>
      </Box>
      <Box marginBottom={1}>
        <Text color={palette.dim}>Path to a .md or .tex file. Relative paths resolve from the current directory.</Text>
      </Box>
      <Box>
        <Text color={palette.probe}>▸ </Text>
        <TextInput
          value={textValue}
          onChange={setTextValue}
          onSubmit={(v) => {
            const trimmed = v.trim();
            if (!trimmed) {
              onChoose({ kind: 'exit' });
            } else {
              onChoose({ kind: 'import-with-path', filePath: trimmed });
            }
            exit();
          }}
          placeholder="examples/sample_imported_paper.md"
        />
      </Box>
      <Box marginTop={1}>
        <Text color={palette.dim}>Enter to import · (empty Enter cancels)</Text>
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

/** Launch the Ink menu + text-input app; resolve with the dispatch request. */
export async function runInteractiveMenu(): Promise<DispatchRequest> {
  const runsInventory = await listRuns();
  let pick: DispatchRequest | null = null;
  const instance = render(
    <InteractiveApp
      onChoose={(req) => {
        if (pick === null) pick = req;
      }}
      runsInventory={runsInventory}
    />,
  );
  try {
    await instance.waitUntilExit();
  } catch {
    /* ignore */
  }
  // Defensive stdin reset in case Ink left it in raw mode.
  if (process.stdin.isTTY) {
    try {
      process.stdin.setRawMode(false);
    } catch {
      /* already off */
    }
  }
  return pick ?? { kind: 'exit' };
}

/**
 * Build the (executable, args) tuple for re-invoking probe with new
 * subcommand args. Uses the current Node binary and the current entry
 * point so the menu works regardless of how the user launched probe:
 *
 *   - global npm link (probe binary on PATH)
 *   - direct compiled run (`node dist/cli/index.js`)
 *   - dev source run (`npm run probe`, `tsx src/cli/index.ts`)
 *
 * The previous implementation shelled out to a literal "probe", which
 * silently failed in any of the latter cases — the menu would appear to
 * do nothing because the catch block swallowed the ENOENT. Returning the
 * current process's argv[0] / argv[1] keeps the dispatch consistent with
 * however the user got here.
 *
 * Exported so unit tests can verify the dispatch shape without needing
 * to spawn child processes.
 */
export function buildSubcommandSpawn(argv: string[]): { command: string; args: string[] } {
  const entry = process.argv[1];
  if (!entry) {
    // Defensive: argv[1] is always set in a normal CLI invocation. If
    // something invokes probe in a way that strips it, fall back to the
    // literal binary name and let the user see the resulting error rather
    // than silently no-op.
    return { command: 'probe', args: argv };
  }
  return { command: process.execPath, args: [entry, ...argv] };
}

async function spawnSubcommand(argv: string[]): Promise<void> {
  const { execFileSync } = await import('node:child_process');
  const { command, args } = buildSubcommandSpawn(argv);
  try {
    execFileSync(command, args, { stdio: 'inherit' });
  } catch (e) {
    // Print the failure rather than swallowing it. Subcommands manage their
    // own non-zero exit code via stderr, but spawn-level failures (ENOENT,
    // permission denied, signal kill) need to surface here so the user
    // doesn't see a menu silently looping.
    const err = e as NodeJS.ErrnoException & { status?: number; signal?: string };
    if (err.code === 'ENOENT') {
      console.log(`subcommand failed to launch: ${command} not found`);
    } else if (err.signal) {
      console.log(`subcommand interrupted (${err.signal})`);
    } else if (typeof err.status === 'number' && err.status !== 0) {
      console.log(`subcommand exited with status ${err.status}`);
    }
    // Otherwise: subcommand exited zero or with a status it printed itself —
    // nothing to add.
  }
}

/**
 * Default entry. Runs the menu in a loop — after each action completes,
 * the menu comes back. This is the "claude-code but for papers"
 * feel: one persistent session, `q` / Quit is the only way out. The
 * subcommand output stays in the terminal's scrollback so the user can
 * still read what ran.
 */
export async function interactiveDefault(): Promise<void> {
  while (true) {
    const pick = await runInteractiveMenu();

    if (pick.kind === 'exit') return;

    if (pick.kind === 'subcommand') {
      printSeparator();
      await spawnSubcommand(pick.argv);
      await pauseForReturn();
      continue;
    }

    if (pick.kind === 'run-with-premise') {
      const args = ['run'];
      if (pick.runId) args.push('--run-id', pick.runId);
      if (!pick.includeNovelty) args.push('--no-novelty');
      args.push(pick.premise);
      printSeparator();
      await spawnSubcommand(args);
      await pauseForReturn();
      continue;
    }

    if (pick.kind === 'import-with-path') {
      const abs = path.resolve(pick.filePath);
      printSeparator();
      try {
        await fs.access(abs);
      } catch (e) {
        console.log(`File not found: ${abs}`);
        console.log(String((e as Error).message ?? ''));
        await pauseForReturn();
        continue;
      }
      await spawnSubcommand(['import', abs]);
      await pauseForReturn();
      continue;
    }
  }
}

function printSeparator(): void {
  console.log('');
  console.log('─'.repeat(60));
  console.log('');
}

/** After a subcommand completes, wait for Enter before redrawing the menu so the user has time to read. */
async function pauseForReturn(): Promise<void> {
  console.log('');
  console.log('─'.repeat(60));
  process.stdout.write('Press Enter to return to the menu (Ctrl+C to exit)… ');
  // Use a native readline here — Ink is not mounted at this point, so stdin is fully ours.
  const readline = await import('node:readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  await new Promise<void>((resolve) => {
    rl.once('line', () => {
      rl.close();
      resolve();
    });
    rl.once('close', () => resolve());
  });
  console.log('');
}
