/**
 * Done scene — final landing after the report stage. Shows a project
 * recap and routes to the project management page (steady-state) or
 * back to the launcher to start over.
 */

import React from 'react';
import { Box, Text, useInput } from 'ink';
import { probeTokens } from '../../ui/probe_tokens.js';
import {
  FrameTop, FrameBottom, FrameRow, FrameBlank,
  StatusBar, useTermWidth, fill,
} from '../../ui/tui_frame.js';
import type { SceneProps } from '../ui_app.js';

export function DoneScene({ goto, exit, state }: SceneProps): React.ReactElement {
  const width = useTermWidth();
  const innerW = width - 2;

  useInput((input, key) => {
    if (input === 'p') goto('project');
    else if (input === 'n') goto('startup');
    else if (input === 'r') goto('review'); // back to review (was: report)
    else if (key.escape || input === 'q') goto('startup');
    else if (key.ctrl && input === 'c') exit();
  });

  const selectedRqs = state.rqs.filter((r) => state.selectedRqLetters.includes(r.letter));
  const chosen = state.candidates.find((c) => c.id === state.chosenDesignId);

  return (
    <Box flexDirection="column">
      <FrameTop
        title={
          <>
            <Text color={probeTokens.amber} bold>PROBE</Text>
            <Text color={probeTokens.ink3}> › </Text>
            <Text color={probeTokens.moss}>done</Text>
          </>
        }
        rightLabel="run rehearsed · ready to ship"
        width={width}
      />
      <FrameBlank width={width} />

      <FrameRow width={width}>
        <Text>
          {'  '}
          <Text color={probeTokens.moss} bold>✓ Project rehearsed end-to-end.</Text>
          {fill(' ', Math.max(0, innerW - 35))}
        </Text>
      </FrameRow>
      <FrameRow width={width}>
        <Text>
          {'  '}
          <Text color={probeTokens.ink2}>Probe walked through premise → brainstorm → literature → methodology → artifacts → evaluation → report → review. Below is what would feed into your project page.</Text>
          {fill(' ', Math.max(0, innerW - 168))}
        </Text>
      </FrameRow>
      <FrameBlank width={width} />

      {/* Recap */}
      <FrameRow width={width}>
        <Text>
          {'  '}
          <Text color={probeTokens.ink3}>premise</Text>
          {fill(' ', Math.max(0, innerW - 9))}
        </Text>
      </FrameRow>
      <FrameRow width={width}>
        <Text>
          {'      '}
          <Text color={probeTokens.ink}>{trim(state.premise, innerW - 8)}</Text>
          {fill(' ', Math.max(0, innerW - 7 - Math.min(state.premise.length, innerW - 8)))}
        </Text>
      </FrameRow>
      <FrameBlank width={width} />

      <FrameRow width={width}>
        <Text>
          {'  '}
          <Text color={probeTokens.ink3}>selected RQs</Text>
          {fill(' ', Math.max(0, innerW - 14))}
        </Text>
      </FrameRow>
      {selectedRqs.map((rq) => (
        <FrameRow width={width} key={rq.letter}>
          <Text>
            {'      '}
            <Text color={probeTokens.amber}>RQ {rq.letter}</Text>
            <Text color={probeTokens.ink3}>  ·  </Text>
            <Text color={probeTokens.ink2}>{trim(rq.rq, innerW - 16)}</Text>
            {fill(' ', Math.max(0, innerW - 15 - Math.min(rq.rq.length, innerW - 16)))}
          </Text>
        </FrameRow>
      ))}
      <FrameBlank width={width} />

      <FrameRow width={width}>
        <Text>
          {'  '}
          <Text color={probeTokens.ink3}>chosen design</Text>
          {fill(' ', Math.max(0, innerW - 15))}
        </Text>
      </FrameRow>
      <FrameRow width={width}>
        <Text>
          {'      '}
          <Text color={probeTokens.amber}>{chosen?.name ?? '(none chosen)'}</Text>
          <Text color={probeTokens.ink3}>  ·  {chosen?.weeks ?? 0}w  ·  {chosen?.arc ?? ''}</Text>
          {fill(' ', Math.max(0, innerW - 24 - (chosen?.name.length ?? 0) - (chosen?.arc.length ?? 0)))}
        </Text>
      </FrameRow>
      <FrameBlank width={width} />

      <FrameRow width={width}>
        <Text>
          {'  '}
          <Text color={probeTokens.ink3}>artifacts drafted: </Text>
          <Text color={probeTokens.ink}>{state.artifacts.length}</Text>
          <Text color={probeTokens.ink3}>   ·   simulated personas: </Text>
          <Text color={probeTokens.ink}>{state.personas.length}</Text>
          <Text color={probeTokens.ink3}>   ·   frictions surfaced: </Text>
          <Text color={state.findings.some((f) => f.severity === 'critical') ? probeTokens.rose : probeTokens.ink}>{state.findings.length}</Text>
          {fill(' ', Math.max(0, innerW - 75))}
        </Text>
      </FrameRow>
      {state.reviewSession && (
        <FrameRow width={width}>
          <Text>
            {'  '}
            <Text color={probeTokens.ink3}>review verdict: </Text>
            <Text color={
              state.reviewSession.meta.verdict === 'accept' ? probeTokens.moss :
              state.reviewSession.meta.verdict === 'minor'  ? probeTokens.moss :
              state.reviewSession.meta.verdict === 'major'  ? probeTokens.amber :
                                                               probeTokens.rose
            }>{state.reviewSession.meta.verdict} revisions</Text>
            <Text color={probeTokens.ink3}>   ·   reviewers: </Text>
            <Text color={probeTokens.ink}>{state.reviewSession.reviewers.length}</Text>
            <Text color={probeTokens.ink3}>   ·   recs: </Text>
            <Text color={probeTokens.ink}>{state.reviewSession.reviewers.map((r) => r.rec).join(' / ')}</Text>
            {fill(' ', Math.max(0, innerW - 80))}
          </Text>
        </FrameRow>
      )}

      <FrameBlank width={width} />
      <FrameBlank width={width} />

      {/* Action buttons */}
      <FrameRow width={width}>
        <Text>
          {'  '}
          <Text color={probeTokens.ink3}>next ─ </Text>
          <Btn k="p" label="open project page" />
          <Text>  </Text>
          <Btn k="r" label="revisit review" />
          <Text>  </Text>
          <Btn k="n" label="new project" />
          <Text>  </Text>
          <Btn k="q" label="quit" />
          {fill(' ', Math.max(0, innerW - 80))}
        </Text>
      </FrameRow>

      <FrameBlank width={width} />
      <FrameBottom width={width} />

      <StatusBar
        mode="NORMAL"
        context={`done   p · project page    r · revise report    n · new project    q · launcher`}
        rightLabel="✓ rehearsed"
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

function trim(s: string, n: number): string {
  if (n <= 0) return '';
  if (s.length <= n) return s;
  return s.slice(0, Math.max(0, n - 1)) + '…';
}
