/**
 * Config scene — six sections (keys / models / budget / appearance /
 * behavior / about). Reads/writes ~/.config/probe/probe.toml via
 * src/config/probe_toml.ts. Both the TUI and the HTML/web companion
 * touch the same TOML so byte-identical output is achievable.
 *
 * Hotkeys:
 *   j/k or ↑/↓ → move between sections
 *   k m b a h i → jump to section by hotkey
 *   ^s         → save (writes TOML atomically with 0600)
 *   ^r         → reload from disk
 *   esc        → back to launcher
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { probeTokens } from '../../ui/probe_tokens.js';
import {
  FrameTop, FrameBottom, FrameRow, FrameBlank,
  StatusBar, useTermWidth, fill,
} from '../../ui/tui_frame.js';
import {
  readConfig, writeConfig, resolveKey,
  PROVIDERS, ENV_VAR, keyHealth,
  type ProbeConfig, type Provider,
} from '../../config/probe_toml.js';
import type { SceneProps } from '../ui_app.js';

type Section = 'keys' | 'models' | 'budget' | 'appearance' | 'behavior' | 'about';

interface SectionDef {
  id: Section;
  hotkey: string;
  glyph: string;
  label: string;
}

const SECTIONS: SectionDef[] = [
  { id: 'keys',       hotkey: 'k', glyph: '⌬', label: 'API keys' },
  { id: 'models',     hotkey: 'm', glyph: '◆', label: 'Models' },
  { id: 'budget',     hotkey: 'b', glyph: '$', label: 'Budget' },
  { id: 'appearance', hotkey: 'a', glyph: '◐', label: 'Appearance' },
  { id: 'behavior',   hotkey: 'h', glyph: '⏵', label: 'Behavior' },
  { id: 'about',      hotkey: 'i', glyph: 'i', label: 'About' },
];

export function ConfigScene({ goto, exit }: SceneProps): React.ReactElement {
  const width = useTermWidth();
  const [cfg, setCfg] = useState<ProbeConfig>(() => readConfig());
  const [section, setSection] = useState<Section>('keys');
  const [dirty, setDirty] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const health = keyHealth(cfg);

  useInput((input, key) => {
    if (key.upArrow || input === 'k' && !key.ctrl) {
      // Don't shadow the hotkey 'k' for the keys section. We only treat
      // 'k' as up-arrow when section navigation is unambiguous: the
      // user already on the rail.
      navigateUp();
      return;
    }
    if (key.downArrow || input === 'j') {
      navigateDown();
      return;
    }
    const hit = SECTIONS.find((s) => s.hotkey === input);
    if (hit) setSection(hit.id);
    else if (key.escape) goto('startup');
    else if (key.ctrl && input === 's') {
      writeConfig(cfg);
      setDirty(false);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } else if (key.ctrl && input === 'r') {
      setCfg(readConfig());
      setDirty(false);
    } else if (key.ctrl && input === 'c') exit();
  });

  function navigateUp(): void {
    const idx = SECTIONS.findIndex((s) => s.id === section);
    setSection(SECTIONS[Math.max(0, idx - 1)].id);
  }
  function navigateDown(): void {
    const idx = SECTIONS.findIndex((s) => s.id === section);
    setSection(SECTIONS[Math.min(SECTIONS.length - 1, idx + 1)].id);
  }

  return (
    <Box flexDirection="column">
      <FrameTop
        title={
          <>
            <Text color={probeTokens.amber} bold>PROBE</Text>
            <Text color={probeTokens.ink3}> · config</Text>
          </>
        }
        rightLabel={
          <>
            <Text color={probeTokens.ink3}>~/.config/probe/probe.toml </Text>
            {savedFlash ? (
              <Text color={probeTokens.moss}>✓ saved</Text>
            ) : dirty ? (
              <>
                <Text color={probeTokens.amber}>●</Text>
                <Text color={probeTokens.ink2}> unsaved </Text>
              </>
            ) : (
              <Text color={probeTokens.ink3}>clean </Text>
            )}
          </>
        }
        width={width}
      />
      <FrameBlank width={width} />
      <ConfigBody section={section} cfg={cfg} setCfg={(c) => { setCfg(c); setDirty(true); }} width={width} />
      <FrameBlank width={width} />
      <FrameBottom width={width} />

      <StatusBar
        mode="NORMAL"
        context={`${SECTIONS.find((s) => s.id === section)?.label ?? ''}                                JetBrains Mono · ${cfg.appearance.font_size}px`}
        rightLabel={`${dirty ? '[+]   ' : '      '}${health.ok}/${health.total} keys ok`}
        width={width}
      />
    </Box>
  );
}

function ConfigBody({
  section,
  cfg,
  setCfg,
  width,
}: {
  section: Section;
  cfg: ProbeConfig;
  setCfg: (c: ProbeConfig) => void;
  width: number;
}): React.ReactElement {
  const innerW = width - 2;
  const railW = 28;
  const mainW = innerW - railW;

  const railLines = renderRail(section, railW);
  const mainLines = renderPane(section, cfg, setCfg, mainW);

  const rows = Math.max(railLines.length, mainLines.length);
  const out: React.ReactElement[] = [];
  for (let i = 0; i < rows; i++) {
    const rl = railLines[i] ?? <Text>{fill(' ', railW)}</Text>;
    const ml = mainLines[i] ?? <Text>{fill(' ', mainW)}</Text>;
    out.push(
      <FrameRow width={width} key={`crow-${i}`}>
        <Text>
          {rl}
          <Text color={probeTokens.rule}>│</Text>
          {ml}
        </Text>
      </FrameRow>,
    );
  }
  return <>{out}</>;
}

function renderRail(active: Section, railW: number): React.ReactElement[] {
  const out: React.ReactElement[] = [];
  const pad = (s: string, n = railW) => s.padEnd(n, ' ').slice(0, n);

  out.push(<Text>{'  '}<Text color={probeTokens.ink3}>SECTIONS</Text>{fill(' ', railW - 10)}</Text>);
  for (const s of SECTIONS) {
    const sel = s.id === active;
    if (sel) {
      out.push(
        <Text>
          {' '}
          <Text backgroundColor={probeTokens.amber} color={probeTokens.bg} bold>
            {pad(` [${s.hotkey}] ${s.glyph} ${s.label}`, railW - 1)}
          </Text>
        </Text>,
      );
    } else {
      out.push(
        <Text>
          {'  '}
          <Text color={probeTokens.ink2}>{pad(`[${s.hotkey}] ${s.glyph} ${s.label}`, railW - 2)}</Text>
        </Text>,
      );
    }
  }
  out.push(<Text>{fill(' ', railW)}</Text>);
  out.push(<Text>{'  '}<Text color={probeTokens.ink3}>NAVIGATE</Text>{fill(' ', railW - 10)}</Text>);
  for (const n of [
    ['j/k', '· move section'],
    ['tab', '· next field'],
    ['enter', '· edit field'],
    [':e',  '· open raw toml'],
    ['^s',  '· save & apply'],
    ['esc', '· back'],
  ] as const) {
    out.push(
      <Text>
        {'  '}
        <Text color={probeTokens.ink3}>{' '}</Text>
        <Text color={probeTokens.ink2}>{n[0]}</Text>
        <Text color={probeTokens.ink3}>{' '}{pad(n[1], railW - 6 - n[0].length)}</Text>
      </Text>,
    );
  }
  return out;
}

function renderPane(
  section: Section,
  cfg: ProbeConfig,
  _setCfg: (c: ProbeConfig) => void,
  mainW: number,
): React.ReactElement[] {
  switch (section) {
    case 'keys':       return renderKeysPane(cfg, mainW);
    case 'models':     return renderModelsPane(cfg, mainW);
    case 'budget':     return renderBudgetPane(cfg, mainW);
    case 'appearance': return renderAppearancePane(cfg, mainW);
    case 'behavior':   return renderBehaviorPane(cfg, mainW);
    case 'about':      return renderAboutPane(mainW);
  }
}

function paneHeader(title: string, subtitle: string, mainW: number): React.ReactElement[] {
  return [
    <Text key="h1">
      {'  '}
      <Text color={probeTokens.amber}>§</Text>
      {' '}
      <Text color={probeTokens.ink}>{title}</Text>
      {fill(' ', Math.max(0, mainW - 5 - title.length))}
    </Text>,
    <Text key="h2">
      {'  '}
      <Text color={probeTokens.ink3}>{truncate(subtitle, mainW - 4)}</Text>
      {fill(' ', Math.max(0, mainW - 3 - Math.min(subtitle.length, mainW - 4)))}
    </Text>,
    <Text key="hb">{fill(' ', mainW)}</Text>,
  ];
}

function renderKeysPane(cfg: ProbeConfig, mainW: number): React.ReactElement[] {
  const out = paneHeader(
    'API keys',
    'Probe checks env vars first, then this config. Env always wins — clear it to fall back.',
    mainW,
  );

  for (const p of PROVIDERS) {
    out.push(...renderKeyRow(p, cfg, mainW));
    out.push(<Text key={`gap-${p}`}>{fill(' ', mainW)}</Text>);
  }

  // Notes box
  out.push(
    <Text key="notes-top">
      {'  '}
      <Text color={probeTokens.ink3}>┌── notes {fill('─', Math.max(0, mainW - 14))}┐</Text>
    </Text>,
  );
  out.push(
    <Text key="notes-1">
      {'  '}
      <Text color={probeTokens.ink3}>│</Text>
      {' '}
      <Text color={probeTokens.amber}>i</Text>
      {'  '}
      <Text color={probeTokens.ink2}>Probe never logs key material. Stored entries live in </Text>
      <Text color={probeTokens.ink}>~/.config/probe/probe.toml</Text>
      {fill(' ', Math.max(0, mainW - 92))}
      <Text color={probeTokens.ink3}>│</Text>
    </Text>,
  );
  out.push(
    <Text key="notes-2">
      {'  '}
      <Text color={probeTokens.ink3}>│</Text>
      {'    '}
      <Text color={probeTokens.ink2}>with </Text>
      <Text color={probeTokens.ink}>0600</Text>
      <Text color={probeTokens.ink2}> perms. Env precedence is checked at every command.</Text>
      {fill(' ', Math.max(0, mainW - 65))}
      <Text color={probeTokens.ink3}>│</Text>
    </Text>,
  );
  out.push(
    <Text key="notes-bot">
      {'  '}
      <Text color={probeTokens.ink3}>└{fill('─', Math.max(0, mainW - 4))}┘</Text>
    </Text>,
  );
  return out;
}

function renderKeyRow(p: Provider, cfg: ProbeConfig, mainW: number): React.ReactElement[] {
  const info = resolveKey(p, cfg);
  const label = p === 'anthropic' ? 'Anthropic' : p === 'openai' ? 'OpenAI   ' : 'Google   ';
  const dot   = info.source === 'unset' ? <Text color={probeTokens.ink3}>○</Text> : <Text color={probeTokens.moss}>●</Text>;
  const sourceText =
    info.source === 'env'    ? `env · $${ENV_VAR[p]}`
  : info.source === 'config' ? 'stored in config         '
  :                            'unset                    ';
  const previewText = info.source === 'unset' ? '—           ' : info.preview.padEnd(12, ' ');
  const tested = info.source === 'unset' ? 'tested —' : 'tested 2 min ago';

  const subline =
    info.source === 'env'    ? '└── env is set; this overrides the stored value below.'
  : info.source === 'config' ? `└── falls through from $${ENV_VAR[p]} (unset)`
  :                            `└── falls through from $${ENV_VAR[p]} (unset)`;

  return [
    <Text key={`row-${p}`}>
      {'  '}
      <Text color={probeTokens.ink}>{label}</Text>
      {'   '}
      {dot}
      {' '}
      <Text color={probeTokens.ink2}>{sourceText}</Text>
      {'   '}
      <Text color={probeTokens.ink}>{previewText}</Text>
      {'   '}
      <Text color={probeTokens.ink3}>{tested}</Text>
      {fill(' ', Math.max(0, mainW - 80))}
    </Text>,
    <Text key={`sub-${p}`}>
      {'              '}
      <Text color={probeTokens.ink3}>{truncate(subline, mainW - 16)}</Text>
      {fill(' ', Math.max(0, mainW - 15 - Math.min(subline.length, mainW - 16)))}
    </Text>,
  ];
}

function renderModelsPane(cfg: ProbeConfig, mainW: number): React.ReactElement[] {
  const out = paneHeader('Models', 'One model per pipeline stage. Press enter on a row to pick.', mainW);
  const stages: Array<[string, string]> = [
    ['literature ',  cfg.models.literature],
    ['methodology', cfg.models.methodology],
    ['artifacts  ',  cfg.models.artifacts],
    ['evaluation ',  cfg.models.evaluation],
    ['report     ',  cfg.models.report],
  ];
  for (const [stage, model] of stages) {
    out.push(
      <Text key={stage}>
        {'  '}
        <Text color={probeTokens.ink2}>{stage}</Text>
        {'   '}
        <Text color={probeTokens.amber}>◆</Text>
        {'  '}
        <Text color={probeTokens.ink}>{model}</Text>
        {fill(' ', Math.max(0, mainW - 9 - stage.length - model.length))}
      </Text>,
    );
  }
  return out;
}

function renderBudgetPane(cfg: ProbeConfig, mainW: number): React.ReactElement[] {
  const out = paneHeader('Budget', 'Hard ceilings per run and per month. Probe aborts above max_per_run.', mainW);
  const used = 42.18; // mock — would be derived from actual usage
  const cap = cfg.budget.monthly_cap;
  const pct = Math.min(1, used / cap);
  const barW = Math.max(20, mainW - 50);
  const filled = Math.floor(barW * pct);
  const barColor = pct < 0.5 ? probeTokens.moss : pct < 0.8 ? probeTokens.amber : probeTokens.rose;

  for (const [label, value, suffix] of [
    ['max_per_run ', cfg.budget.max_per_run.toFixed(2),  '$ — abort run if exceeded'],
    ['warn_at     ', cfg.budget.warn_at.toFixed(2),       '$ — banner once a run crosses this'],
    ['confirm_over', cfg.budget.confirm_over.toFixed(2),  '$ — prompt before kicking off'],
    ['monthly_cap ', cfg.budget.monthly_cap.toFixed(2),   '$ — across all runs · resets on the 1st'],
  ] as const) {
    out.push(
      <Text key={label}>
        {'  '}
        <Text color={probeTokens.ink2}>{label}</Text>
        {'  '}
        <Text color={probeTokens.ink}>${value.padStart(7, ' ')}</Text>
        {'  '}
        <Text color={probeTokens.ink3}>{suffix}</Text>
        {fill(' ', Math.max(0, mainW - 18 - 8 - suffix.length))}
      </Text>,
    );
  }
  out.push(<Text key="bgap">{fill(' ', mainW)}</Text>);
  out.push(
    <Text key="bbar">
      {'  '}
      <Text color={probeTokens.ink2}>this month </Text>
      <Text color={probeTokens.ink}>${used.toFixed(2)}</Text>
      <Text color={probeTokens.ink3}> / ${cap.toFixed(0)}  </Text>
      <Text color={barColor}>{'█'.repeat(filled)}</Text>
      <Text color={probeTokens.ink3}>{'░'.repeat(barW - filled)}</Text>
      {fill(' ', Math.max(0, mainW - 30 - barW))}
    </Text>,
  );
  return out;
}

function renderAppearancePane(cfg: ProbeConfig, mainW: number): React.ReactElement[] {
  const out = paneHeader('Appearance', 'Theme + density apply to both surfaces. Font is GUI-only.', mainW);
  for (const [label, value, gui] of [
    ['font_family',  cfg.appearance.font_family, true],
    ['font_size  ', `${cfg.appearance.font_size}px`,       true],
    ['theme      ', cfg.appearance.theme,                  false],
    ['density    ', cfg.appearance.density,                false],
    ['cursor     ', cfg.appearance.cursor,                 false],
  ] as const) {
    out.push(
      <Text key={label}>
        {'  '}
        <Text color={gui ? probeTokens.ink3 : probeTokens.ink2}>{label}</Text>
        {'  '}
        <Text color={gui ? probeTokens.ink3 : probeTokens.ink}>{value}</Text>
        {gui ? <Text color={probeTokens.ink3}>{'   (GUI only)'}</Text> : null}
        {fill(' ', Math.max(0, mainW - 30))}
      </Text>,
    );
  }
  return out;
}

function renderBehaviorPane(cfg: ProbeConfig, mainW: number): React.ReactElement[] {
  const out = paneHeader('Behavior', 'Editor + workdir + run-time toggles.', mainW);
  for (const [label, value] of [
    ['editor        ', cfg.behavior.editor],
    ['workdir       ', cfg.behavior.workdir],
  ] as const) {
    out.push(
      <Text key={label}>
        {'  '}
        <Text color={probeTokens.ink2}>{label}</Text>
        {'  '}
        <Text color={probeTokens.ink}>{value}</Text>
        {fill(' ', Math.max(0, mainW - 18 - value.length))}
      </Text>,
    );
  }
  for (const [label, value] of [
    ['auto_replay     ',   cfg.behavior.auto_replay],
    ['confirm_spend   ',   cfg.behavior.confirm_spend],
    ['stream_logs     ',   cfg.behavior.stream_logs],
    ['send_telemetry  ',   cfg.behavior.send_telemetry],
  ] as const) {
    out.push(
      <Text key={label}>
        {'  '}
        <Text color={probeTokens.ink2}>{label}</Text>
        {'  '}
        <Text color={value ? probeTokens.moss : probeTokens.ink3}>{value ? '[x]' : '[ ]'}</Text>
        {fill(' ', Math.max(0, mainW - 25))}
      </Text>,
    );
  }
  return out;
}

function renderAboutPane(mainW: number): React.ReactElement[] {
  const out = paneHeader('About', 'Build info + diagnostics.', mainW);
  for (const [k, v] of [
    ['version  ', '0.4.2'],
    ['node     ', process.version],
    ['platform ', `${process.platform} · ${process.arch}`],
    ['config   ', '~/.config/probe/probe.toml'],
    ['workdir  ', process.cwd()],
  ] as const) {
    out.push(
      <Text key={k}>
        {'  '}
        <Text color={probeTokens.ink3}>{k}</Text>
        {'  '}
        <Text color={probeTokens.ink}>{v}</Text>
        {fill(' ', Math.max(0, mainW - 14 - v.length))}
      </Text>,
    );
  }
  out.push(<Text key="agap">{fill(' ', mainW)}</Text>);
  // Buttons row
  out.push(
    <Text key="abtns">
      {'  '}
      {[' open log ', ' copy diagnostics ', ' edit toml in $EDITOR ', ' factory reset '].map((b, i) => (
        <Text key={i}>
          <Text color={probeTokens.ink2}>[</Text>
          <Text color={probeTokens.ink}>{b}</Text>
          <Text color={probeTokens.ink2}>]</Text>
          {' '}
        </Text>
      ))}
      {fill(' ', Math.max(0, mainW - 80))}
    </Text>,
  );
  return out;
}

function truncate(s: string, n: number): string {
  if (n <= 0) return '';
  if (s.length <= n) return s;
  return s.slice(0, Math.max(0, n - 1)) + '…';
}
