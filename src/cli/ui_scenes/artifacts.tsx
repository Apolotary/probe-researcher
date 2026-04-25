/**
 * Artifacts scene — adaptive list of artifacts the chosen design
 * needs (implementation spec, validation protocol, IRB memo, …).
 * Each row is expandable; pressing Enter reveals the actual draft
 * body inline.
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { probeTokens } from '../../ui/probe_tokens.js';
import {
  FrameTop, FrameBottom, FrameRow, FrameBlank,
  StatusBar, useTermWidth, fill,
} from '../../ui/tui_frame.js';
import type { SceneProps } from '../ui_app.js';
import { livePersonas, liveFindings } from '../ui_state.js';

export function ArtifactsScene({ goto, exit, state, setState }: SceneProps): React.ReactElement {
  const width = useTermWidth();
  const innerW = width - 2;
  const [cursor, setCursor] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(state.artifacts[0]?.id ?? null);

  useInput((input, key) => {
    if (key.upArrow || input === 'k') setCursor((c) => Math.max(0, c - 1));
    else if (key.downArrow || input === 'j') setCursor((c) => Math.min(state.artifacts.length - 1, c + 1));
    else if (key.return || input === ' ') {
      const id = state.artifacts[cursor]?.id;
      if (id) setExpanded((cur) => (cur === id ? null : id));
    } else if (input === 'n') {
      // Continue to evaluation. Fire personas + findings in the
      // background; evaluation shows thinking state until they land.
      const studyPlan = state.plan;
      if (studyPlan) {
        livePersonas(state.evalN, state.premise).then((personas) => {
          setState((s) => ({ ...s, personas }));
        });
        liveFindings(studyPlan, state.premise).then((findings) => {
          setState((s) => ({ ...s, findings }));
        });
      }
      // Pre-clear so the evaluation scene shows its loading state.
      setState((s) => ({ ...s, personas: [], findings: [] }));
      goto('evaluation');
    } else if (key.escape) {
      goto('methodology');
    } else if (key.ctrl && input === 'c') {
      exit();
    }
  });

  return (
    <Box flexDirection="column">
      <FrameTop
        title={
          <>
            <Text color={probeTokens.amber} bold>PROBE</Text>
            <Text color={probeTokens.ink3}> › </Text>
            <Text color={probeTokens.ink}>artifacts</Text>
          </>
        }
        rightLabel="stage 4 · agent-drafted artifacts"
        width={width}
      />
      <FrameBlank width={width} />

      <FrameRow width={width}>
        <Text>
          {'  '}
          <Text color={probeTokens.ink2}>The agents drafted these handoffs based on your chosen study design. Press </Text>
          <Text color={probeTokens.amber}>enter</Text>
          <Text color={probeTokens.ink2}> on a row to expand/collapse.</Text>
          {fill(' ', Math.max(0, innerW - 120))}
        </Text>
      </FrameRow>
      <FrameBlank width={width} />

      {state.artifacts.map((a, i) => {
        const isCur = i === cursor;
        const isOpen = expanded === a.id;
        return (
          <React.Fragment key={a.id}>
            <FrameRow width={width}>
              <Text>
                {'  '}
                <Text color={isOpen ? probeTokens.amber : probeTokens.ink3}>{isOpen ? '▾' : '▸'}</Text>
                {' '}
                {isCur ? (
                  <Text backgroundColor={probeTokens.amberSoft} color={probeTokens.amber} bold>
                    {' '}{a.title}{' '}
                  </Text>
                ) : (
                  <Text color={probeTokens.ink} bold>{a.title}</Text>
                )}
                <Text color={probeTokens.ink3}>  ·  </Text>
                <Text color={kindColor(a.kind)}>{a.kind}</Text>
                {fill(' ', Math.max(0, innerW - 6 - a.title.length - 8 - a.kind.length))}
              </Text>
            </FrameRow>
            {isOpen && (
              <>
                <FrameRow width={width}>
                  <Text>
                    {'      '}
                    <Text color={probeTokens.ink3}>┌{fill('─', innerW - 8)}┐</Text>
                  </Text>
                </FrameRow>
                {a.body.split('\n').slice(0, 18).map((line, j) => (
                  <FrameRow width={width} key={j}>
                    <Text>
                      {'      '}
                      <Text color={probeTokens.ink3}>│</Text>
                      {' '}
                      <Text color={
                        line.startsWith('# ')   ? probeTokens.amber :
                        line.startsWith('## ')  ? probeTokens.cyan :
                        line.startsWith('- ')   ? probeTokens.ink :
                        line === ''             ? probeTokens.ink3 :
                                                  probeTokens.ink2
                      }>{line.padEnd(innerW - 10, ' ').slice(0, innerW - 10)}</Text>
                      <Text color={probeTokens.ink3}>│</Text>
                    </Text>
                  </FrameRow>
                ))}
                <FrameRow width={width}>
                  <Text>
                    {'      '}
                    <Text color={probeTokens.ink3}>└{fill('─', innerW - 8)}┘</Text>
                  </Text>
                </FrameRow>
                <FrameRow width={width}>
                  <Text>
                    {'      '}
                    <Text color={probeTokens.ink3}>{a.body.split('\n').length} lines · drafted by agent · editable in $EDITOR</Text>
                    {fill(' ', Math.max(0, innerW - 65))}
                  </Text>
                </FrameRow>
              </>
            )}
            <FrameBlank width={width} />
          </React.Fragment>
        );
      })}

      <FrameBottom width={width} />

      <StatusBar
        mode="NORMAL"
        context={`artifacts   j/k · move    enter · expand    n · continue → evaluation    esc · back`}
        rightLabel={`${state.artifacts.length} artifacts drafted`}
        width={width}
      />
    </Box>
  );
}

function kindColor(kind: string): string {
  switch (kind) {
    case 'spec':     return probeTokens.cyan;
    case 'protocol': return probeTokens.moss;
    case 'survey':   return probeTokens.amber;
    case 'irb':      return probeTokens.rose;
    case 'diary':    return probeTokens.blue;
    default:         return probeTokens.ink2;
  }
}
