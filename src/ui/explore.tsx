/**
 * Multi-screen worktree-style exploration UI — `probe explore <run_id>`.
 *
 * Inspired by Google Fabula's lock/regenerate-unlocked primitive and Hermes-
 * agent's visual vocabulary. Three panes, one per branch, plus a focus
 * indicator and a lock state. This is a read-only explorer for a completed
 * run — keyboard-driven, terminal-native.
 *
 * Keys:
 *   ← / →      focus previous / next branch
 *   ↑ / ↓      scroll within focused pane
 *   L          toggle lock on focused branch
 *   a / s      cycle artifact view (spec / walkthrough / audit / reviews / guidebook)
 *   q          quit
 */

import React, { useEffect, useState } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import fs from 'node:fs/promises';
import path from 'node:path';
import { runDir, branchDir } from '../util/paths.js';
import { palette, glyphs } from './theme.js';

type ArtifactView = 'branch_card' | 'prototype_spec' | 'walkthrough' | 'audit' | 'reviews' | 'wnr';
const VIEWS: ArtifactView[] = ['branch_card', 'prototype_spec', 'walkthrough', 'audit', 'reviews', 'wnr'];

const VIEW_LABEL: Record<ArtifactView, string> = {
  branch_card: 'branch card',
  prototype_spec: 'prototype spec',
  walkthrough: 'simulated walkthrough',
  audit: 'capture-risk audit',
  reviews: 'reviewer panel',
  wnr: 'WORKSHOP_NOT_RECOMMENDED',
};

const BRANCH_COLORS: Record<string, string> = {
  a: palette.branchA,
  b: palette.branchB,
  c: palette.branchC,
};

interface BranchPaneData {
  id: string;
  locked: boolean;
  view: ArtifactView;
  contents: Record<ArtifactView, string>;
  status: 'surviving' | 'blocked' | 'failed' | 'unknown';
}

interface ExploreProps {
  runId: string;
}

export function Explore({ runId }: ExploreProps): React.ReactElement {
  const { exit } = useApp();
  const [branches, setBranches] = useState<BranchPaneData[]>([]);
  const [focused, setFocused] = useState(0);
  const [scrollOffsets, setScrollOffsets] = useState<number[]>([0, 0, 0]);
  const [premise, setPremise] = useState<string>('');
  const [guidebook, setGuidebook] = useState<string>('');
  const [showGuidebook, setShowGuidebook] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const premisePath = path.join(runDir(runId), 'premise.md');
        const p = await fs.readFile(premisePath, 'utf8').catch(() => '');
        setPremise(p);

        const gbPath = path.join(runDir(runId), 'PROBE_GUIDEBOOK.md');
        const gb = await fs.readFile(gbPath, 'utf8').catch(() => '');
        setGuidebook(gb);

        const branchesDir = path.join(runDir(runId), 'branches');
        const entries = await fs.readdir(branchesDir);
        const ids = entries.filter((e) => /^[a-z]$/.test(e)).sort();

        const loaded: BranchPaneData[] = [];
        for (const id of ids) {
          const bd = branchDir(runId, id);
          const contents: Record<ArtifactView, string> = {
            branch_card: await readOrEmpty(path.join(bd, 'branch_card.json')),
            prototype_spec: await readOrEmpty(path.join(bd, 'prototype_spec.md'), path.join(bd, 'prototype_spec.json')),
            walkthrough: await readOrEmpty(path.join(bd, 'simulated_walkthrough.md')),
            audit: await readOrEmpty(path.join(bd, 'audit.md'), path.join(bd, 'audit.json')),
            reviews: await readReviews(path.join(bd, 'reviews')),
            wnr: await readOrEmpty(path.join(bd, 'WORKSHOP_NOT_RECOMMENDED.md')),
          };

          const status: BranchPaneData['status'] = contents.wnr.trim().length > 0
            ? 'blocked'
            : contents.audit.trim().length > 0
              ? 'surviving'
              : 'unknown';

          loaded.push({
            id,
            locked: false,
            view: 'branch_card',
            contents,
            status,
          });
        }
        setBranches(loaded);
      } catch (e) {
        setPremise(`error loading run: ${String((e as Error).message)}`);
      }
    })();
  }, [runId]);

  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      exit();
      return;
    }
    if (showGuidebook) {
      if (input === 'g' || key.escape) setShowGuidebook(false);
      return;
    }
    if (input === 'g') {
      setShowGuidebook(true);
      return;
    }
    if (key.leftArrow) {
      setFocused((f) => Math.max(0, f - 1));
    } else if (key.rightArrow) {
      setFocused((f) => Math.min(branches.length - 1, f + 1));
    } else if (key.downArrow) {
      setScrollOffsets((o) => {
        const next = [...o];
        next[focused] = (next[focused] ?? 0) + 1;
        return next;
      });
    } else if (key.upArrow) {
      setScrollOffsets((o) => {
        const next = [...o];
        next[focused] = Math.max(0, (next[focused] ?? 0) - 1);
        return next;
      });
    } else if (input === 'l' || input === 'L') {
      setBranches((arr) => arr.map((b, i) => (i === focused ? { ...b, locked: !b.locked } : b)));
    } else if (input === 'a' || input === 'A') {
      setBranches((arr) =>
        arr.map((b, i) => {
          if (i !== focused) return b;
          const idx = VIEWS.indexOf(b.view);
          return { ...b, view: VIEWS[(idx + VIEWS.length - 1) % VIEWS.length] };
        }),
      );
    } else if (input === 's' || input === 'S') {
      setBranches((arr) =>
        arr.map((b, i) => {
          if (i !== focused) return b;
          const idx = VIEWS.indexOf(b.view);
          return { ...b, view: VIEWS[(idx + 1) % VIEWS.length] };
        }),
      );
    }
  });

  const termCols = process.stdout.columns ?? 120;
  const termRows = process.stdout.rows ?? 30;
  const paneCols = branches.length > 0 ? Math.floor((termCols - 2) / branches.length) - 2 : termCols;
  const paneRows = termRows - 8;

  if (showGuidebook) {
    return (
      <Box flexDirection="column">
        <Header runId={runId} premise={premise} hint="g/esc to return" />
        <Box borderStyle="round" borderColor={palette.probe} flexDirection="column" paddingX={1}>
          <Text color={palette.probe} bold>📘 PROBE_GUIDEBOOK.md</Text>
          <Text color={palette.dim}>(scroll unsupported in this view; read the file at runs/{runId}/PROBE_GUIDEBOOK.md)</Text>
          <Text>{guidebook.slice(0, paneCols * paneRows)}</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Header runId={runId} premise={premise} hint="←/→ focus · ↑/↓ scroll · L lock · a/s artifact · g guidebook · q quit" />
      <Box flexDirection="row" gap={1}>
        {branches.map((b, i) => (
          <BranchPane
            key={b.id}
            branch={b}
            focused={i === focused}
            cols={paneCols}
            rows={paneRows}
            scrollOffset={scrollOffsets[i] ?? 0}
          />
        ))}
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text color={palette.dim}>
          runs/{runId}/ · {branches.length} branches · {branches.filter((b) => b.status === 'surviving').length} surviving · {branches.filter((b) => b.status === 'blocked').length} blocked
        </Text>
      </Box>
    </Box>
  );
}

function Header(props: { runId: string; premise: string; hint: string }): React.ReactElement {
  const premiseText = props.premise.replace(/^#\s+Research premise\s*\n\n?/i, '').trim().slice(0, 100);
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text>
        <Text color={palette.probe} bold>🔬 probe explore</Text>{' '}
        <Text color={palette.dim}>·</Text>{' '}
        <Text color={palette.stage}>{props.runId}</Text>
      </Text>
      {premiseText ? (
        <Text>
          <Text color={palette.subtle}>premise: </Text>
          <Text color={palette.stage} italic>"{premiseText}"</Text>
        </Text>
      ) : null}
      <Text color={palette.dim}>{props.hint}</Text>
    </Box>
  );
}

function BranchPane(props: {
  branch: BranchPaneData;
  focused: boolean;
  cols: number;
  rows: number;
  scrollOffset: number;
}): React.ReactElement {
  const { branch, focused, cols, rows, scrollOffset } = props;
  const color = BRANCH_COLORS[branch.id] ?? palette.probe;
  const statusBadge = branch.status === 'surviving'
    ? { label: 'SURVIVING', color: palette.passed }
    : branch.status === 'blocked'
      ? { label: 'BLOCKED', color: palette.blocked }
      : { label: 'UNKNOWN', color: palette.dim };

  const raw = branch.contents[branch.view] || '(no content for this view)';
  const lines = raw.split('\n');
  const visible = lines.slice(scrollOffset, scrollOffset + rows).join('\n');

  return (
    <Box
      flexDirection="column"
      borderStyle={focused ? 'bold' : 'round'}
      borderColor={focused ? color : palette.dim}
      paddingX={1}
      width={cols}
      height={rows + 4}
    >
      <Box justifyContent="space-between">
        <Text color={color} bold>
          {glyphs[`branch${branch.id.toUpperCase() as 'A' | 'B' | 'C'}`] ?? `│ ${branch.id}`}
        </Text>
        <Text>
          <Text color={statusBadge.color}>{statusBadge.label}</Text>
          {' '}
          <Text color={branch.locked ? palette.passed : palette.dim}>
            {branch.locked ? '🔒' : '🔓'}
          </Text>
        </Text>
      </Box>
      <Box marginBottom={1}>
        <Text color={palette.stage}>[{VIEW_LABEL[branch.view]}]</Text>
      </Box>
      <Text>{visible}</Text>
    </Box>
  );
}

async function readOrEmpty(...paths: string[]): Promise<string> {
  for (const p of paths) {
    try {
      return await fs.readFile(p, 'utf8');
    } catch {
      /* try next */
    }
  }
  return '';
}

async function readReviews(dir: string): Promise<string> {
  try {
    const files = await fs.readdir(dir);
    const parts: string[] = [];
    for (const f of files.sort()) {
      if (!f.endsWith('.json')) continue;
      const raw = await fs.readFile(path.join(dir, f), 'utf8');
      try {
        const parsed = JSON.parse(raw) as { reviewer_persona?: string; decisive_weakness?: string; recommendation?: string };
        parts.push(`## ${parsed.reviewer_persona ?? f}`);
        parts.push('');
        parts.push(`**Recommendation:** ${parsed.recommendation ?? '?'}`);
        parts.push('');
        parts.push(`**Decisive weakness:** ${parsed.decisive_weakness ?? ''}`);
        parts.push('');
      } catch {
        parts.push(`## ${f}`);
        parts.push(raw.slice(0, 1000));
      }
    }
    return parts.join('\n');
  } catch {
    return '';
  }
}
