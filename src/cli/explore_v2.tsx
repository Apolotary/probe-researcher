/**
 * `probe explore <run_id>` (two-pane version) — terminal-native
 * equivalent of `probe web` for SSH / narrow-window / offline use.
 *
 * Layout:
 *   ┌─────────────┬──────────────────────────────────────────────┐
 *   │ Stages      │  <selected artifact rendered here>            │
 *   │   premise   │                                               │
 *   │ > ideation  │                                               │
 *   │   ...       │                                               │
 *   │ Branches    │                                               │
 *   │   A  ✓      │                                               │
 *   │   B  ✗      │                                               │
 *   │   C  !      │                                               │
 *   └─────────────┴──────────────────────────────────────────────┘
 *
 * Keys:
 *   ↑ / ↓       move cursor within the sidebar
 *   Tab         toggle focus: sidebar vs main-area scroll
 *   Enter       open the selected artifact in the main area
 *   PgUp/PgDn   scroll the main area
 *   q / Escape  quit
 *
 * Read-only for now. Editing in Ink is a noisier surface than
 * `probe run --step` (which spawns $EDITOR) or `probe web`
 * (which has a proper textarea). If the user wants terminal-
 * native editing, we can add an `e` key that spawns $EDITOR
 * on the current artifact — same pattern as step_pause.ts.
 */

import React, { useEffect, useState } from 'react';
import { Box, Text, useInput, useApp, render } from 'ink';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { runDir, branchDir } from '../util/paths.js';
import { palette } from '../ui/theme.js';

interface NavEntry {
  kind: 'stage' | 'branch';
  key: string; // 'premise', 'guidebook', 'a', 'b', 'c'
  label: string;
  rel: string | null; // artifact path relative to run dir; null for group headers
  hint: string; // status or verdict
}

interface ExploreProps {
  runId: string;
}

function ExploreApp({ runId }: ExploreProps): React.ReactElement {
  const { exit } = useApp();
  const [entries, setEntries] = useState<NavEntry[]>([]);
  const [cursor, setCursor] = useState(0);
  const [content, setContent] = useState<string>('Loading…');
  const [scroll, setScroll] = useState(0);
  const [focus, setFocus] = useState<'nav' | 'main'>('nav');
  const [terminalSize, setTerminalSize] = useState({
    cols: process.stdout.columns ?? 120,
    rows: process.stdout.rows ?? 40,
  });

  // Build the nav entries from disk.
  useEffect(() => {
    void (async () => {
      const rd = runDir(runId);
      const exists = async (p: string): Promise<boolean> => {
        try {
          await fs.access(p);
          return true;
        } catch {
          return false;
        }
      };
      const summary = await readJsonOrNull<{ branches?: Array<{ branchId: string; status: string }> }>(
        path.join(rd, 'run_summary.json'),
      );

      const out: NavEntry[] = [];
      out.push({
        kind: 'stage',
        key: 'premise',
        label: '1. Premise',
        rel: 'premise_card.json',
        hint: (await exists(path.join(rd, 'premise_card.json'))) ? '✓' : '—',
      });
      out.push({
        kind: 'stage',
        key: 'guidebook',
        label: '8. Guidebook',
        rel: 'PROBE_GUIDEBOOK.md',
        hint: (await exists(path.join(rd, 'PROBE_GUIDEBOOK.md'))) ? '✓' : '—',
      });

      const branchIds = summary?.branches?.map((b) => b.branchId) ?? (await listBranchIds(rd));
      for (const b of branchIds) {
        const bd = branchDir(runId, b);
        const audit = await readJsonOrNull<{ verdict?: string }>(path.join(bd, 'audit.json'));
        const meta = await readJsonOrNull<{ verdict?: string }>(path.join(bd, 'meta_review.json'));
        const status =
          summary?.branches?.find((x) => x.branchId === b)?.status ??
          meta?.verdict ??
          audit?.verdict ??
          '—';
        out.push({ kind: 'branch', key: b, label: `Branch ${b.toUpperCase()}`, rel: null, hint: status });
        if (await exists(path.join(bd, 'branch_card.json'))) {
          out.push({ kind: 'branch', key: `${b}-card`, label: `  branch_card`, rel: `branches/${b}/branch_card.json`, hint: '' });
        }
        if (await exists(path.join(bd, 'prototype_spec.md'))) {
          out.push({ kind: 'branch', key: `${b}-proto`, label: `  prototype_spec`, rel: `branches/${b}/prototype_spec.md`, hint: '' });
        }
        if (await exists(path.join(bd, 'simulated_walkthrough.md'))) {
          out.push({ kind: 'branch', key: `${b}-sim`, label: `  walkthrough`, rel: `branches/${b}/simulated_walkthrough.md`, hint: '' });
        }
        if (await exists(path.join(bd, 'audit.md'))) {
          out.push({ kind: 'branch', key: `${b}-audit`, label: `  audit`, rel: `branches/${b}/audit.md`, hint: audit?.verdict ?? '' });
        }
        if (await exists(path.join(bd, 'meta_review.json'))) {
          out.push({ kind: 'branch', key: `${b}-meta`, label: `  meta_review`, rel: `branches/${b}/meta_review.json`, hint: meta?.verdict ?? '' });
        }
        if (await exists(path.join(bd, 'WORKSHOP_NOT_RECOMMENDED.md'))) {
          out.push({ kind: 'branch', key: `${b}-wnr`, label: `  WNR`, rel: `branches/${b}/WORKSHOP_NOT_RECOMMENDED.md`, hint: '' });
        }
      }
      setEntries(out);
    })();
  }, [runId]);

  // Track terminal resize so the layout adapts.
  useEffect(() => {
    const onResize = (): void => {
      setTerminalSize({
        cols: process.stdout.columns ?? 120,
        rows: process.stdout.rows ?? 40,
      });
    };
    process.stdout.on('resize', onResize);
    return () => {
      process.stdout.off('resize', onResize);
    };
  }, []);

  // Load the selected artifact when cursor lands on an openable entry.
  useEffect(() => {
    if (entries.length === 0) return;
    const cur = entries[Math.min(cursor, entries.length - 1)];
    if (!cur.rel) {
      setContent(`(${cur.label} — group header; move cursor to a leaf entry)`);
      return;
    }
    void (async () => {
      try {
        const text = await fs.readFile(path.join(runDir(runId), cur.rel!), 'utf8');
        setContent(text);
        setScroll(0);
      } catch (e) {
        setContent(`(could not read ${cur.rel}: ${String((e as Error).message)})`);
      }
    })();
  }, [cursor, entries, runId]);

  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      exit();
      return;
    }
    if (input === 'e') {
      const cur = entries[cursor];
      if (!cur?.rel) return;
      // Spawn $EDITOR, Ink pauses rendering while editor is foregrounded.
      const abs = path.join(runDir(runId), cur.rel);
      const editor = process.env.VISUAL ?? process.env.EDITOR ?? 'vi';
      const child = spawn(editor, [abs], { stdio: 'inherit' });
      child.on('exit', () => {
        // force re-read after editor closes
        setCursor((c) => c);
      });
      return;
    }
    if (key.tab) {
      setFocus((f) => (f === 'nav' ? 'main' : 'nav'));
      return;
    }
    if (focus === 'nav') {
      if (key.upArrow) {
        setCursor((c) => Math.max(0, c - 1));
      } else if (key.downArrow) {
        setCursor((c) => Math.min(entries.length - 1, c + 1));
      } else if (key.return) {
        setFocus('main');
      }
    } else {
      if (key.upArrow || key.pageUp) {
        setScroll((s) => Math.max(0, s - (key.pageUp ? 10 : 1)));
      } else if (key.downArrow || key.pageDown) {
        setScroll((s) => s + (key.pageDown ? 10 : 1));
      }
    }
  });

  const sidebarWidth = Math.max(28, Math.min(36, Math.floor(terminalSize.cols * 0.25)));
  const mainWidth = terminalSize.cols - sidebarWidth - 3; // 3 for the separator + padding
  const mainRows = Math.max(10, terminalSize.rows - 4);
  const visibleLines = content.split('\n').slice(scroll, scroll + mainRows);

  return (
    <Box flexDirection="column" height={terminalSize.rows}>
      <Box>
        <Box width={sidebarWidth} flexDirection="column" borderStyle="single" borderColor={'gray'} paddingX={1}>
          <Text color={palette.stage} bold>
            {runId.length > sidebarWidth - 4 ? runId.slice(0, sidebarWidth - 5) + '…' : runId}
          </Text>
          <Text color={palette.dim}>{focus === 'nav' ? '↑↓ move · Enter open · q quit' : 'Tab: focus nav'}</Text>
          <Box marginTop={1} flexDirection="column">
            {entries.map((e, i) => {
              const active = i === cursor;
              const isGroup = e.rel === null;
              return (
                <Box key={e.key}>
                  <Text
                    color={active ? palette.probe : isGroup ? palette.stage : palette.heading}
                    bold={isGroup}
                  >
                    {active ? '▸ ' : '  '}
                    {truncateToWidth(e.label, sidebarWidth - 8)}
                  </Text>
                  {e.hint && (
                    <Text color={palette.dim}>{' '}{truncateToWidth(e.hint, 6)}</Text>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
        <Box
          width={mainWidth}
          flexDirection="column"
          borderStyle="single"
          borderColor={focus === 'main' ? (palette.probe) : ('gray')}
          paddingX={1}
        >
          <Text color={palette.stage}>
            {entries[cursor]?.rel ?? '(select an artifact)'}{' '}
            <Text color={palette.dim}>
              {content.split('\n').length > mainRows ? ` · line ${scroll + 1}–${scroll + visibleLines.length}/${content.split('\n').length}` : ''}
            </Text>
          </Text>
          <Box flexDirection="column" marginTop={1}>
            {visibleLines.map((ln, i) => (
              <Text key={i} color={palette.heading}>
                {truncateToWidth(ln, mainWidth - 4)}
              </Text>
            ))}
          </Box>
        </Box>
      </Box>
      <Box paddingX={1}>
        <Text color={palette.dim}>
          Tab: switch focus · q: quit · e: edit current artifact in $EDITOR · ↑/↓ PgUp/PgDn: move/scroll
        </Text>
      </Box>
    </Box>
  );
}

function truncateToWidth(s: string, w: number): string {
  if (s.length <= w) return s;
  return s.slice(0, Math.max(0, w - 1)) + '…';
}

async function listBranchIds(rd: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(path.join(rd, 'branches'));
    return entries.filter((e) => /^[a-z]$/.test(e));
  } catch {
    return [];
  }
}

async function readJsonOrNull<T = unknown>(p: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(p, 'utf8')) as T;
  } catch {
    return null;
  }
}

export async function exploreV2Command(runId: string): Promise<void> {
  const instance = render(<ExploreApp runId={runId} />);
  try {
    await instance.waitUntilExit();
  } finally {
    if (process.stdin.isTTY) {
      try {
        process.stdin.setRawMode(false);
      } catch {
        /* already off */
      }
    }
  }
}
