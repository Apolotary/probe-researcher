/**
 * Report scene — Discussion + Conclusion + export buttons. The user
 * picks one of three suggested paper titles, optionally edits
 * discussion/conclusion, and exports as markdown / latex / pdf /
 * project page.
 *
 * For the demo we generate the export files into the current working
 * directory. The user sees the path and can open them in their
 * editor.
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { probeTokens } from '../../ui/probe_tokens.js';
import {
  FrameTop, FrameBottom, FrameRow, FrameBlank,
  StatusBar, useTermWidth, fill,
} from '../../ui/tui_frame.js';
import type { SceneProps } from '../ui_app.js';
import { slugify, type ProbeWorkflowState } from '../ui_state.js';

export function ReportScene({ goto, exit, state, setState }: SceneProps): React.ReactElement {
  const width = useTermWidth();
  const innerW = width - 2;
  const [titleIdx, setTitleIdx] = useState(0);
  const [exportMsg, setExportMsg] = useState<string | null>(null);

  // Title options come from the live LLM call which the evaluation
  // scene fires before navigating here. While we wait, fall back to
  // a single placeholder. The user can still pick / edit.
  const titleOptions = state.paperTitle
    ? [state.paperTitle]
    : ['(generating titles…)'];

  function pickTitle(idx: number): void {
    setTitleIdx(idx);
    setState((s) => ({ ...s, paperTitle: titleOptions[idx] }));
  }

  function exportFile(kind: 'md' | 'tex' | 'pdf' | 'page'): void {
    const slug = slugify(state.paperTitle || state.premise);
    const dir = path.join(os.homedir(), 'probe-exports');
    fs.mkdirSync(dir, { recursive: true });
    const ext = kind === 'page' ? 'html' : kind;
    const target = path.join(dir, `${slug}.${ext}`);
    const body = composeBody(state, kind, titleOptions[titleIdx] || state.paperTitle || 'Probe report');
    fs.writeFileSync(target, body);
    setExportMsg(`✓ wrote ${target}`);
    setTimeout(() => setExportMsg(null), 4000);
  }

  useInput((input, key) => {
    if (input >= '1' && input <= '3') pickTitle(parseInt(input, 10) - 1);
    else if (input === 'm') exportFile('md');
    else if (input === 't') exportFile('tex');
    else if (input === 'p') exportFile('pdf');
    else if (input === 'g') exportFile('page');
    else if (input === 's' || (input === 'n' && key.return === undefined)) {
      // After report, the next stage is review (ARR-style). The review
      // scene fires its own LLM call on mount; we just navigate.
      goto('review');
    } else if (key.return) goto('review');
    else if (key.escape) goto('evaluation');
    else if (key.ctrl && input === 'c') exit();
  });

  return (
    <Box flexDirection="column">
      <FrameTop
        title={
          <>
            <Text color={probeTokens.amber} bold>PROBE</Text>
            <Text color={probeTokens.ink3}> › </Text>
            <Text color={probeTokens.ink}>report</Text>
          </>
        }
        rightLabel="stage 6 · discussion + export"
        width={width}
      />
      <FrameBlank width={width} />

      {/* paper title options */}
      <FrameRow width={width}>
        <Text>
          {'  '}
          <Text color={probeTokens.ink3}>paper title — pick one with </Text>
          <Text color={probeTokens.amber}>1/2/3</Text>
          {fill(' ', Math.max(0, innerW - 40))}
        </Text>
      </FrameRow>
      {titleOptions.map((t, i) => {
        const sel = i === titleIdx;
        return (
          <FrameRow width={width} key={i}>
            <Text>
              {'    '}
              <Text color={probeTokens.amber}>[{i + 1}]</Text>
              {' '}
              <Text color={sel ? probeTokens.amber : probeTokens.ink3}>{sel ? '◉' : '○'}</Text>
              {'  '}
              {sel ? (
                <Text backgroundColor={probeTokens.amberSoft} color={probeTokens.amber}>
                  {' '}{trim(t, innerW - 14)}{' '}
                </Text>
              ) : (
                <Text color={probeTokens.ink}>{trim(t, innerW - 14)}</Text>
              )}
              {fill(' ', Math.max(0, innerW - 14 - Math.min(t.length, innerW - 14)))}
            </Text>
          </FrameRow>
        );
      })}
      <FrameBlank width={width} />

      {/* Discussion */}
      <FrameRow width={width}>
        <Text>{'  '}<Text color={probeTokens.ink3}>discussion {fill('─', Math.max(0, innerW - 14))}</Text></Text>
      </FrameRow>
      {wrap(state.discussion || '(generating discussion…)', innerW - 4, 12).map((line, i) => (
        <FrameRow width={width} key={`d-${i}`}>
          <Text>{'    '}<Text color={probeTokens.ink}>{line.padEnd(innerW - 4, ' ').slice(0, innerW - 4)}</Text></Text>
        </FrameRow>
      ))}
      <FrameBlank width={width} />

      {/* Conclusion */}
      <FrameRow width={width}>
        <Text>{'  '}<Text color={probeTokens.ink3}>conclusion {fill('─', Math.max(0, innerW - 14))}</Text></Text>
      </FrameRow>
      {wrap(state.conclusion || '(generating conclusion…)', innerW - 4, 8).map((line, i) => (
        <FrameRow width={width} key={`c-${i}`}>
          <Text>{'    '}<Text color={probeTokens.ink}>{line.padEnd(innerW - 4, ' ').slice(0, innerW - 4)}</Text></Text>
        </FrameRow>
      ))}
      <FrameBlank width={width} />

      {/* Export buttons */}
      <FrameRow width={width}>
        <Text>
          {'  '}
          <Text color={probeTokens.ink3}>export ─ </Text>
          <Btn k="m" label="markdown" />
          <Text>  </Text>
          <Btn k="t" label="latex (arxiv)" />
          <Text>  </Text>
          <Btn k="p" label="pdf" />
          <Text>  </Text>
          <Btn k="g" label="project page" />
          {fill(' ', Math.max(0, innerW - 70))}
        </Text>
      </FrameRow>
      {exportMsg && (
        <FrameRow width={width}>
          <Text>{'  '}<Text color={probeTokens.moss}>{exportMsg}</Text>{fill(' ', Math.max(0, innerW - 4 - exportMsg.length))}</Text>
        </FrameRow>
      )}

      <FrameBlank width={width} />
      <FrameBottom width={width} />

      <StatusBar
        mode="NORMAL"
        context={`report   1/2/3 · title    m/t/p/g · export    enter · continue → review    esc · back`}
        rightLabel={state.paperTitle ? `title set` : 'pick a title'}
        width={width}
      />
    </Box>
  );
}

function Btn({ k, label }: { k: string; label: string }): React.ReactElement {
  return (
    <Text>
      <Text color={probeTokens.ink2}>[</Text>
      <Text color={probeTokens.amber}>{k}</Text>
      <Text color={probeTokens.ink2}>]</Text>
      <Text color={probeTokens.ink}> {label}</Text>
    </Text>
  );
}

function wrap(text: string, lineW: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > lineW) {
      lines.push(cur.trim());
      cur = w;
      if (lines.length >= maxLines) break;
    } else {
      cur = (cur + ' ' + w).trim();
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur.trim());
  return lines;
}

function trim(s: string, n: number): string {
  if (n <= 0) return '';
  if (s.length <= n) return s;
  return s.slice(0, Math.max(0, n - 1)) + '…';
}

function composeBody(state: ProbeWorkflowState, kind: 'md' | 'tex' | 'pdf' | 'page', title: string): string {
  if (kind === 'tex') {
    return [
      '\\documentclass{article}',
      `\\title{${title}}`,
      '\\begin{document}',
      '\\maketitle',
      '\\section*{Premise}',
      state.premise,
      '\\section*{Discussion}',
      state.discussion,
      '\\section*{Conclusion}',
      state.conclusion,
      '\\end{document}',
    ].join('\n');
  }
  if (kind === 'page') {
    return [
      '<!doctype html>',
      `<title>${title}</title>`,
      '<style>body{font-family:Inter,system-ui,sans-serif;max-width:680px;margin:48px auto;padding:0 24px;color:#222;line-height:1.6}</style>',
      `<h1>${title}</h1>`,
      `<p><em>${state.premise}</em></p>`,
      '<h2>Discussion</h2>',
      `<p>${state.discussion}</p>`,
      '<h2>Conclusion</h2>',
      `<p>${state.conclusion}</p>`,
      '<p><small>[SIMULATION_REHEARSAL] — this artifact is a Probe rehearsal, not user research evidence.</small></p>',
    ].join('\n');
  }
  // md (and pdf reuses md as input)
  return [
    `# ${title}`,
    '',
    `**Premise.** ${state.premise}`,
    '',
    '## Discussion',
    '',
    state.discussion,
    '',
    '## Conclusion',
    '',
    state.conclusion,
    '',
    '---',
    '',
    '_[SIMULATION_REHEARSAL] — Probe rehearsal output. Not evidence._',
    '',
  ].join('\n');
}
