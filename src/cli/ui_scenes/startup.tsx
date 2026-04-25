/**
 * Startup scene — what `probe` shows with no arguments. Centered ASCII
 * PROBE logo, version + tagline, hotkey menu, recent runs list. No outer
 * frame (per the mock). Status line at the bottom.
 *
 * Hotkey list:
 *   n New project   o Open project   r Recent   d Replay demo
 *   c Config        h Help & docs    q Quit
 *
 * j/k or ↑/↓ moves cursor; <enter> activates the focused row; the
 * single-letter hotkeys jump straight to actions.
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { probeTokens } from '../../ui/probe_tokens.js';
import { StatusBar, useTermWidth } from '../../ui/tui_frame.js';
import type { SceneProps } from '../ui_app.js';
import { readConfig } from '../../config/probe_toml.js';

/** Block-style PROBE logo, double-stroke for the LazyVim feel. */
const LOGO = String.raw`██████╗  ██████╗   ██████╗  ██████╗  ███████╗
██╔══██╗ ██╔══██╗ ██╔═══██╗ ██╔══██╗ ██╔════╝
██████╔╝ ██████╔╝ ██║   ██║ ██████╔╝ █████╗
██╔═══╝  ██╔══██╗ ██║   ██║ ██╔══██╗ ██╔══╝
██║      ██║  ██║ ╚██████╔╝ ██████╔╝ ███████╗
╚═╝      ╚═╝  ╚═╝  ╚═════╝  ╚═════╝  ╚══════╝`.split('\n');

interface MenuItem {
  key: string;
  icon: string;
  label: string;
  hint: string;
  scene?: SceneProps['goto'] extends (s: infer S) => void ? S : never;
}

const MENU: MenuItem[] = [
  { key: 'n', icon: '+', label: 'New project',     hint: 'state a premise', scene: 'premise' },
  { key: 'o', icon: '↗', label: 'Open project',    hint: 'pick local run',  scene: 'project' },
  { key: 'r', icon: '↻', label: 'Recent',          hint: '3 runs · 12d' },
  { key: 'd', icon: '▶', label: 'Replay demo_run', hint: 'cached · $0' },
  { key: 'c', icon: '⚙', label: 'Config',          hint: 'probe.toml',      scene: 'config' },
  { key: 'h', icon: '?', label: 'Help & docs',     hint: 'man probe' },
  { key: 'q', icon: '×', label: 'Quit',            hint: 'goodbye' },
];

interface RecentRun {
  id: string;
  premise: string;
  age: string;
  cost: string;
  status: 'fresh' | 'stale' | 'queued';
}

const RECENTS: RecentRun[] = [
  { id: 'demo_run',    premise: 'ARIA-live disclosure',   age: '2d',  cost: '$5.12', status: 'fresh' },
  { id: 'civic-trust', premise: 'source provenance',       age: '5d',  cost: '$4.04', status: 'fresh' },
  { id: 'pair-debug',  premise: 'AI pair-programming',     age: '12d', cost: '$7.31', status: 'queued' },
];

export function StartupScene({ goto, exit }: SceneProps): React.ReactElement {
  const width = useTermWidth();
  const [cursor, setCursor] = useState(0);

  const cfg = readConfig();
  const monthlyCap = cfg.budget.monthly_cap;

  useInput((input, key) => {
    if (key.upArrow || input === 'k') {
      setCursor((c) => Math.max(0, c - 1));
    } else if (key.downArrow || input === 'j') {
      setCursor((c) => Math.min(MENU.length - 1, c + 1));
    } else if (key.return) {
      activate(MENU[cursor]);
    } else if (input && /^[a-z]$/i.test(input)) {
      const m = MENU.find((x) => x.key === input.toLowerCase());
      if (m) activate(m);
    } else if (key.ctrl && input === 'c') {
      exit();
    }
  });

  function activate(m: MenuItem): void {
    if (m.key === 'q') {
      exit();
      return;
    }
    if (m.scene) {
      goto(m.scene);
      return;
    }
    // For r/d/h we don't have a target scene yet — fall through silently.
  }

  // Center-padding amount. We render content that's ~46 chars wide for the
  // logo and ~46 for the menu/recent box. Center it within the term width.
  const pad = Math.max(0, Math.floor((width - 50) / 2));
  const padStr = ' '.repeat(pad);

  return (
    <Box flexDirection="column">
      <Text> </Text>
      {LOGO.map((line, i) => (
        <Text key={i}>
          {padStr}
          <Text color={probeTokens.amber} bold>{line}</Text>
        </Text>
      ))}
      <Text> </Text>
      <Text>
        {padStr}
        <Text color={probeTokens.ink3}>     v0.4.2 · the agentic research-design pipeline</Text>
      </Text>
      <Text> </Text>

      {/* Menu box — ┌─ … ─┐ around the hotkey list. */}
      <Text>
        {padStr}
        <Text color={probeTokens.ink3}>     ┌───────────────────────────────────────────┐</Text>
      </Text>
      {MENU.map((m, i) => {
        const sel = i === cursor;
        const inner = (
          <>
            {' '}
            <Text color={probeTokens.amber}>[{m.key}]</Text>
            {'  '}
            <Text color={sel ? probeTokens.bg : probeTokens.ink}>{padTo(`${m.icon} ${m.label}`, 22)}</Text>
            <Text color={sel ? probeTokens.bg : probeTokens.ink3}>{padTo(m.hint, 16)}</Text>
            {' '}
          </>
        );
        return (
          <Text key={m.key}>
            {padStr}
            <Text color={probeTokens.ink3}>     │</Text>
            {sel ? (
              <Text backgroundColor={probeTokens.amber} color={probeTokens.bg} bold>
                {inner}
              </Text>
            ) : inner}
            <Text color={probeTokens.ink3}>│</Text>
          </Text>
        );
      })}
      <Text>
        {padStr}
        <Text color={probeTokens.ink3}>     └───────────────────────────────────────────┘</Text>
      </Text>
      <Text> </Text>

      {/* Recent runs */}
      <Text>
        {padStr}
        <Text color={probeTokens.ink3}>     recent</Text>
      </Text>
      <Text>
        {padStr}
        <Text color={probeTokens.ink3}>     ─────────────────────────────────────────</Text>
      </Text>
      {RECENTS.map((r) => (
        <Text key={r.id}>
          {padStr}
          <Text color={probeTokens.ink3}>     </Text>
          <Text color={r.status === 'fresh' ? probeTokens.moss : probeTokens.ink3}>
            {r.status === 'fresh' ? '●' : '○'}
          </Text>
          <Text color={r.status === 'queued' ? probeTokens.ink3 : probeTokens.ink}>
            {' '}{padTo(r.id, 12)}
          </Text>
          <Text color={probeTokens.ink3}>
            {' '}{padTo(r.premise, 22)}{r.age} · {r.cost}
          </Text>
        </Text>
      ))}
      <Text> </Text>
      <Text> </Text>

      <StatusBar
        mode="NORMAL"
        context="press a hotkey or j/k to move · enter to select"
        rightLabel={`$0.00 / $${monthlyCap.toFixed(0)} cap`}
        width={width}
      />
    </Box>
  );
}

function padTo(s: string, n: number): string {
  if (s.length >= n) return s.slice(0, n);
  return s + ' '.repeat(n - s.length);
}
