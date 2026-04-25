/**
 * Project scene — the day-to-day surface. Two tabs (stages / timeline)
 * over the same data. Left rail of pipeline stages, main pane shows
 * the focused stage's detail (or a deadline-anchored gantt in the
 * timeline tab).
 *
 * Switch tabs with ⇧1 / ⇧2 (we accept `1` / `2` too for convenience).
 *
 * Status colors are the canonical set:
 *   fresh   → moss   ●
 *   stale   → amber  ●
 *   running → cyan   ●
 *   queued  → ink3   ○
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { probeTokens, type StageStatus } from '../../ui/probe_tokens.js';
import {
  FrameTop, FrameBottom, FrameRow, FrameBlank,
  StatusBar, useTermWidth, fill,
} from '../../ui/tui_frame.js';
import type { SceneProps } from '../ui_app.js';

type Tab = 'stages' | 'timeline';

interface StageRow {
  id: string;
  label: string;
  age: string;
  status: StageStatus;
}

const STAGES: StageRow[] = [
  { id: '01', label: '01 framing',     age: '4d ago', status: 'fresh' },
  { id: '02', label: '02 literature',  age: '2d ago', status: 'fresh' },
  { id: '03', label: '03 methodology', age: '2d ago', status: 'fresh' },
  { id: '03', label: '03 artifacts',   age: '2d ago', status: 'fresh' },
  { id: '04', label: '04 evaluation',  age: '8d ago', status: 'stale' },
  { id: '05', label: '05 report',      age: 'never',  status: 'queued' },
];

interface Friction {
  severity: 'critical' | 'medium' | 'low';
  id: string;
  title: string;
  rationale: string;
  fix: string;
}

const FRICTIONS: Friction[] = [
  {
    severity:  'critical',
    id:        'F1',
    title:     'ESM window too short',
    rationale: 'losing the densest meeting days = losing the high-fatigue tail of the distribution',
    fix:       'shorten window to 90s · optional "remind in 10 min" defer',
  },
  {
    severity:  'medium',
    id:        'F2',
    title:     'perceived surveillance at onboarding',
    rationale: 'confusion compounds · biases sample toward high-trust workers · weakens external validity',
    fix:       'add 60s explainer screen BEFORE the OS prompt',
  },
  {
    severity:  'low',
    id:        'F3',
    title:     'weekly digest open-rate',
    rationale: 'supplemental, not primary data — but main retention lever',
    fix:       'move send to Wednesday morning',
  },
];

export function ProjectScene({ goto, exit }: SceneProps): React.ReactElement {
  const width = useTermWidth();
  const [tab, setTab] = useState<Tab>('stages');
  const [cursor, setCursor] = useState(4); // start on evaluation (the stale row)

  useInput((input, key) => {
    if (key.upArrow || input === 'k') setCursor((c) => Math.max(0, c - 1));
    else if (key.downArrow || input === 'j') setCursor((c) => Math.min(STAGES.length - 1, c + 1));
    else if (input === '1') setTab('stages');
    else if (input === '2') setTab('timeline');
    else if (key.escape || input === 'q') goto('startup');
    else if (key.ctrl && input === 'c') exit();
  });

  const focused = STAGES[cursor];
  const counts = STAGES.reduce(
    (acc, s) => {
      acc[s.status] = (acc[s.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<StageStatus, number>,
  );

  return (
    <Box flexDirection="column">
      <FrameTop
        title={
          <>
            <Text color={probeTokens.amber} bold>PROBE</Text>
            <Text color={probeTokens.ink3}> › </Text>
            <Text color={probeTokens.ink}>focus-rituals</Text>
            <Text color={probeTokens.ink3}>{'  '}</Text>
            <TabPill label="stages [⇧1]" active={tab === 'stages'} />
            <Text> </Text>
            <TabPill label="timeline [⇧2]" active={tab === 'timeline'} />
          </>
        }
        rightLabel={
          <>
            <Text color={probeTokens.ink3}>deadline </Text>
            <Text color={probeTokens.ink}>Jun 12</Text>
            <Text color={probeTokens.ink3}> · </Text>
            <Text color={probeTokens.amber} bold>32d left</Text>
          </>
        }
        width={width}
      />
      <FrameBlank width={width} />

      {tab === 'stages' ? (
        <StagesTab focused={cursor} width={width} />
      ) : (
        <TimelineTab width={width} />
      )}

      <FrameBlank width={width} />
      <FrameBottom width={width} />

      <StatusBar
        mode="NORMAL"
        context={`${focused.label} · ${focused.status}    ${STAGES.length} stages · ${counts.fresh ?? 0} fresh · ${counts.stale ?? 0} stale · ${counts.queued ?? 0} queued`}
        rightLabel="cost · $14.20 / $50 budget"
        width={width}
      />
    </Box>
  );
}

function TabPill({ label, active }: { label: string; active: boolean }): React.ReactElement {
  if (active) {
    return (
      <Text backgroundColor={probeTokens.amberSoft} color={probeTokens.amber}>
        {' '}{label}{' '}
      </Text>
    );
  }
  return <Text color={probeTokens.ink3}> {label} </Text>;
}

/* ── stages tab ────────────────────────────────────────────────────── */

function StagesTab({ focused, width }: { focused: number; width: number }): React.ReactElement {
  const innerW = width - 2;
  const railW = 32; // left rail width including its right rule
  const mainW = innerW - railW;

  // We render rail and main as parallel <Text> rows with the rail
  // padded to railW chars and a │ separator before the main content.
  const railLines = renderRailLines(focused, railW);
  const mainLines = renderEvalMainLines(mainW);

  const rows = Math.max(railLines.length, mainLines.length);
  const out: React.ReactElement[] = [];
  for (let i = 0; i < rows; i++) {
    const rl = railLines[i] ?? <Text>{fill(' ', railW)}</Text>;
    const ml = mainLines[i] ?? <Text>{fill(' ', mainW)}</Text>;
    out.push(
      <FrameRow width={width} key={`row-${i}`}>
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

function renderRailLines(focused: number, railW: number): React.ReactElement[] {
  const r: React.ReactElement[] = [];
  const pad = (s: string, n = railW) => s.padEnd(n, ' ').slice(0, n);

  r.push(<Text>{'  '}<Text color={probeTokens.ink3}>STAGES</Text>{fill(' ', railW - 8)}</Text>);
  STAGES.forEach((s, i) => {
    const sel = i === focused;
    const pip = stagePip(s.status);
    const ageW = 8;
    const labelW = railW - 4 - ageW - 1;
    if (sel) {
      r.push(
        <Text>
          {' '}
          <Text backgroundColor={probeTokens.amber} color={probeTokens.bg} bold>
            {' '}{pipBgGlyph(s.status)} {pad(s.label, labelW)} {pad(s.age, ageW)}
          </Text>
          {' '}
        </Text>,
      );
    } else {
      r.push(
        <Text>
          {'  '}
          {pip}
          {' '}
          <Text color={probeTokens.ink2}>{pad(s.label, labelW)}</Text>
          <Text color={probeTokens.ink3}>{pad(s.age, ageW)}</Text>
          {' '}
        </Text>,
      );
    }
  });
  r.push(<Text>{fill(' ', railW)}</Text>);

  // LEGEND
  r.push(<Text>{'  '}<Text color={probeTokens.ink3}>LEGEND</Text>{fill(' ', railW - 8)}</Text>);
  r.push(<Text>{'  '}<Text color={probeTokens.moss}>● fresh   </Text><Text color={probeTokens.ink2}>green</Text>{fill(' ', railW - 21)}</Text>);
  r.push(<Text>{'  '}<Text color={probeTokens.amber}>● stale   </Text><Text color={probeTokens.ink2}>amber</Text>{fill(' ', railW - 21)}</Text>);
  r.push(<Text>{'  '}<Text color={probeTokens.cyan}>● running </Text><Text color={probeTokens.ink2}>cyan</Text>{fill(' ', railW - 21)}</Text>);
  r.push(<Text>{'  '}<Text color={probeTokens.ink2}>○ queued  </Text><Text color={probeTokens.ink3}>dim</Text>{fill(' ', railW - 19)}</Text>);
  r.push(<Text>{fill(' ', railW)}</Text>);

  // ACTIONS
  r.push(<Text>{'  '}<Text color={probeTokens.ink3}>ACTIONS </Text><Text color={probeTokens.ink2}>on focused stage</Text>{fill(' ', Math.max(0, railW - 28))}</Text>);
  for (const a of [
    [' r', '· rerun this stage'],
    [' e', '· edit prompt'],
    [' v', '· view artifacts'],
    [' d', '· diff vs previous'],
    [' a', '· accept & mark fresh'],
  ] as const) {
    r.push(<Text>{'  '}<Text color={probeTokens.ink2}>{a[0]} </Text><Text color={probeTokens.ink3}>{pad(a[1], railW - 6)}</Text></Text>);
  }
  r.push(<Text>{fill(' ', railW)}</Text>);

  // NAVIGATE
  r.push(<Text>{'  '}<Text color={probeTokens.ink3}>NAVIGATE</Text>{fill(' ', railW - 10)}</Text>);
  for (const n of [
    [' j/k', '· move stage'],
    [' ⇧1 ', '· stages tab'],
    [' ⇧2 ', '· timeline tab'],
    [' R  ', '· rerun whole project'],
  ] as const) {
    r.push(<Text>{'  '}<Text color={probeTokens.ink2}>{n[0]} </Text><Text color={probeTokens.ink3}>{pad(n[1], railW - 8)}</Text></Text>);
  }
  return r;
}

function stagePip(status: StageStatus): React.ReactElement {
  const map: Record<StageStatus, { color: string; glyph: string }> = {
    fresh:   { color: probeTokens.moss,  glyph: '●' },
    stale:   { color: probeTokens.amber, glyph: '●' },
    running: { color: probeTokens.cyan,  glyph: '●' },
    queued:  { color: probeTokens.ink3,  glyph: '○' },
  };
  const m = map[status];
  return <Text color={m.color}>{m.glyph}</Text>;
}

function pipBgGlyph(status: StageStatus): string {
  return status === 'queued' ? '○' : '●';
}

function renderEvalMainLines(mainW: number): React.ReactElement[] {
  const r: React.ReactElement[] = [];
  const pad = (n = mainW) => fill(' ', n);

  r.push(
    <Text>
      {'  '}
      <Text color={probeTokens.amber}>§</Text>
      {' '}
      <Text color={probeTokens.ink}>04 evaluation</Text>
      {pad(mainW - 17)}
    </Text>,
  );
  r.push(
    <Text>
      {'  '}
      <Text color={probeTokens.ink3}>simulated pilot · friction surfaced ─ stale, last run 8d ago</Text>
      {pad(Math.max(0, mainW - 62))}
    </Text>,
  );
  r.push(<Text>{pad()}</Text>);
  r.push(
    <Text>
      {'  '}
      <Text color={probeTokens.ink3}>runs {fill('─', Math.max(0, mainW - 8))}</Text>
    </Text>,
  );
  r.push(
    <Text>
      {'  '}
      <Text color={probeTokens.amber}>▸</Text>
      {' '}
      <Text color={probeTokens.ink}>r1</Text>
      <Text color={probeTokens.ink3}> · pilot of 6, simulated · 8d ago · current</Text>
      {pad(Math.max(0, mainW - 50))}
    </Text>,
  );
  r.push(
    <Text>
      {'      '}
      <Text color={probeTokens.ink3}>3 frictions surfaced · adherence model fit</Text>
      {pad(Math.max(0, mainW - 47))}
    </Text>,
  );
  r.push(<Text>{pad()}</Text>);
  r.push(
    <Text>
      {'  '}
      <Text color={probeTokens.ink3}>findings {fill('─', Math.max(0, mainW - 12))}</Text>
    </Text>,
  );

  for (const f of FRICTIONS) {
    const sevColor = f.severity === 'critical' ? probeTokens.rose : f.severity === 'medium' ? probeTokens.amber : probeTokens.ink3;
    const sevGlyph = f.severity === 'low' ? '▽ low     ' : f.severity === 'medium' ? '▲ medium  ' : '▲ critical';
    r.push(
      <Text>
        {'  '}
        <Text color={sevColor}>{sevGlyph}</Text>
        {' '}
        <Text color={probeTokens.ink}>{f.id} · {f.title}</Text>
        {pad(Math.max(0, mainW - 18 - f.title.length))}
      </Text>,
    );
    r.push(
      <Text>
        {'      '}
        <Text color={probeTokens.ink3}>{truncate(f.rationale, mainW - 8)}</Text>
        {pad(Math.max(0, mainW - 7 - Math.min(f.rationale.length, mainW - 8)))}
      </Text>,
    );
    r.push(
      <Text>
        {'      '}
        <Text color={probeTokens.ink2}>› fix:</Text>
        {' '}
        <Text color={probeTokens.ink}>{truncate(f.fix, mainW - 24)}</Text>
        {' '}
        <Text color={probeTokens.moss}>[recommended]</Text>
        {pad(Math.max(0, mainW - 22 - Math.min(f.fix.length, mainW - 24)))}
      </Text>,
    );
    r.push(<Text>{pad()}</Text>);
  }

  // rerun modal
  r.push(
    <Text>
      {'  '}
      <Text color={probeTokens.ink3}>┌── rerun {fill('─', Math.max(0, mainW - 14))}┐</Text>
    </Text>,
  );
  const rerunText = 're-pilot with shortened ESM windows and added explainer screen';
  r.push(
    <Text>
      {'  '}
      <Text color={probeTokens.ink3}>│</Text>
      {' '}
      <Text color={probeTokens.amber}>›</Text>
      {' '}
      <Text color={probeTokens.ink}>{rerunText}</Text>
      <Text color={probeTokens.amber}>█</Text>
      {pad(Math.max(0, mainW - rerunText.length - 9))}
      <Text color={probeTokens.ink3}>│</Text>
    </Text>,
  );
  r.push(
    <Text>
      {'  '}
      <Text color={probeTokens.ink3}>└{fill('─', Math.max(0, mainW - 4))}┘</Text>
    </Text>,
  );
  r.push(
    <Text>
      {'     '}
      <Text color={probeTokens.ink3}>[enter] queue rerun · est. </Text>
      <Text color={probeTokens.ink}>$2.10</Text>
      <Text color={probeTokens.ink3}> · uses cached lit & method · [esc] cancel</Text>
      {pad(Math.max(0, mainW - 78))}
    </Text>,
  );
  return r;
}

function truncate(s: string, n: number): string {
  if (n <= 0) return '';
  if (s.length <= n) return s;
  return s.slice(0, Math.max(0, n - 1)) + '…';
}

/* ── timeline tab ──────────────────────────────────────────────────── */

function TimelineTab({ width }: { width: number }): React.ReactElement {
  const innerW = width - 2;

  const out: React.ReactElement[] = [];
  out.push(
    <FrameRow width={width} key="title">
      <Text>
        {'  '}
        <Text color={probeTokens.ink3}>TIMELINE  ─</Text>
        {' '}
        <Text color={probeTokens.ink2}>deadline-anchored gantt · today is May 11 · drag :deadline=YYYY-MM-DD</Text>
        {fill(' ', Math.max(0, innerW - 90))}
      </Text>
    </FrameRow>,
  );
  out.push(<FrameBlank width={width} key="g1" />);

  // X axis date labels
  const dates = ['apr 14', 'apr 21', 'apr 28', 'may 05', 'may 12 ◀ today', 'may 19', 'may 26', 'jun 02', 'jun 12 ◀ deadline'];
  const colWidth = Math.max(12, Math.floor((innerW - 14) / dates.length));
  const xAxisRow = dates.map((d, i) => {
    const isToday = d.includes('today');
    const isDeadline = d.includes('deadline');
    const color = isToday ? probeTokens.amber : isDeadline ? probeTokens.rose : probeTokens.ink3;
    return (
      <Text key={i} color={color}>
        {(d).padEnd(colWidth, ' ').slice(0, colWidth)}
      </Text>
    );
  });
  out.push(
    <FrameRow width={width} key="xaxis">
      <Text>
        {'             '}
        {xAxisRow}
      </Text>
    </FrameRow>,
  );
  // tick row
  out.push(
    <FrameRow width={width} key="ticks">
      <Text>
        {'             '}
        <Text color={probeTokens.ink3}>{Array(dates.length).fill(0).map(() => '│' + ' '.repeat(colWidth - 1)).join('')}</Text>
        {fill(' ', Math.max(0, innerW - 13 - colWidth * dates.length))}
      </Text>
    </FrameRow>,
  );

  interface BarSpec {
    stage: string;
    startCol: number;
    len: number;
    status: 'fresh' | 'stale' | 'queued';
    tail: string;
    dashed?: number;
    light?: boolean;
  }
  const bars: BarSpec[] = [
    { stage: 'framing    ', startCol: 0, len: 10, status: 'fresh',  tail: 'fresh' },
    { stage: 'literature ', startCol: 1, len: 17, status: 'fresh',  tail: 'fresh' },
    { stage: 'methodology', startCol: 2, len: 14, status: 'fresh',  tail: 'fresh' },
    { stage: 'artifacts  ', startCol: 3, len: 13, status: 'fresh',  tail: 'fresh' },
    { stage: 'evaluation ', startCol: 4, len: 10, status: 'stale',  tail: 'stale → rerun queued', dashed: 5 },
    { stage: 'report     ', startCol: 6, len: 30, status: 'queued', tail: 'queued', light: true },
  ];

  for (const b of bars) {
    const offset = b.startCol * colWidth;
    const barColor = b.status === 'fresh' ? probeTokens.moss : b.status === 'stale' ? probeTokens.amber : probeTokens.ink3;
    const solid = (b.light ? '░' : '█').repeat(b.len);
    const dashed = b.status === 'stale' && b.dashed ? '▒'.repeat(b.dashed) : '';
    out.push(
      <FrameRow width={width} key={`bar-${b.stage}`}>
        <Text>
          {'  '}
          <Text color={probeTokens.ink2}>{b.stage}</Text>
          {' '}
          {fill(' ', offset)}
          <Text color={barColor}>{solid}</Text>
          {dashed && <Text color={probeTokens.amber}>{dashed}</Text>}
          {' '}
          <Text color={probeTokens.ink3}>{b.tail}</Text>
          {fill(' ', Math.max(0, innerW - 14 - offset - b.len - dashed.length - 1 - b.tail.length))}
        </Text>
      </FrameRow>,
    );
  }

  // today/deadline guides
  out.push(
    <FrameRow width={width} key="guides">
      <Text>
        {'             '}
        {fill(' ', 4 * colWidth)}
        <Text color={probeTokens.amber} bold>│</Text>
        {fill(' ', Math.max(0, 4 * colWidth - 1))}
        <Text color={probeTokens.rose} bold>│</Text>
        {fill(' ', Math.max(0, innerW - 13 - 9 * colWidth))}
      </Text>
    </FrameRow>,
  );
  out.push(
    <FrameRow width={width} key="labels">
      <Text>
        {'             '}
        {fill(' ', 4 * colWidth)}
        <Text color={probeTokens.amber} bold>today</Text>
        {fill(' ', Math.max(0, 4 * colWidth - 5))}
        <Text color={probeTokens.rose} bold>deadline</Text>
        {fill(' ', Math.max(0, innerW - 13 - 9 * colWidth - 8))}
      </Text>
    </FrameRow>,
  );
  out.push(<FrameBlank width={width} key="g2" />);

  out.push(
    <FrameRow width={width} key="slack">
      <Text>
        {'  '}
        <Text color={probeTokens.ink3}>slack to deadline ─ </Text>
        <Text color={probeTokens.ink}>~12 days</Text>
        <Text color={probeTokens.ink3}> after planned report finish · </Text>
        <Text color={probeTokens.amber}>healthy</Text>
        <Text color={probeTokens.ink3}> if you start report by may 22</Text>
        {fill(' ', Math.max(0, innerW - 96))}
      </Text>
    </FrameRow>,
  );
  return <>{out}</>;
}
