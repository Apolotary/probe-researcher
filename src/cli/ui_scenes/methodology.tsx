/**
 * Methodology scene — 5 candidate integrated study designs (one paper,
 * layered methods that jointly cover the selected RQs). User picks
 * ONE (radio), reviews the RQ-coverage matrix, then drafts a plan
 * with phases and risks.
 *
 * Hotkeys:
 *   1..5      pick design
 *   p         draft / redraft plan
 *   esc       back to literature
 *   enter     continue → artifacts (only after a plan exists)
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { probeTokens } from '../../ui/probe_tokens.js';
import {
  FrameTop, FrameBottom, FrameRow, FrameBlank,
  StatusBar, useTermWidth, fill,
} from '../../ui/tui_frame.js';
import type { SceneProps } from '../ui_app.js';
import { livePlan, liveArtifacts } from '../ui_state.js';

export function MethodologyScene({ goto, exit, state, setState }: SceneProps): React.ReactElement {
  const width = useTermWidth();
  const innerW = width - 2;
  const [cursor, setCursor] = useState(0);

  useInput((input, key) => {
    if (input >= '1' && input <= '9') {
      const idx = parseInt(input, 10) - 1;
      if (idx < state.candidates.length) {
        setCursor(idx);
        const id = state.candidates[idx].id;
        setState((s) => ({ ...s, chosenDesignId: id, plan: null }));
      }
    } else if (key.upArrow || input === 'k') {
      setCursor((c) => Math.max(0, c - 1));
    } else if (key.downArrow || input === 'j') {
      setCursor((c) => Math.min(state.candidates.length - 1, c + 1));
    } else if (input === ' ' || input === 'x') {
      const id = state.candidates[cursor]?.id;
      if (id) setState((s) => ({ ...s, chosenDesignId: id, plan: null }));
    } else if (input === 'p') {
      if (state.chosenDesignId) {
        const design = state.candidates.find((c) => c.id === state.chosenDesignId);
        if (design) {
          // Kick off the live plan call. While it runs, the existing
          // null plan keeps the "press p to draft a phased plan" hint
          // visible; once it resolves the plan renders.
          livePlan(design, state.premise).then((p) => {
            setState((s) => ({ ...s, plan: p }));
          });
        }
      }
    } else if (key.return) {
      if (state.plan) {
        const design = state.candidates.find((c) => c.id === state.chosenDesignId);
        if (design && state.plan) {
          liveArtifacts(design, state.plan).then((arts) => {
            setState((s) => ({ ...s, artifacts: arts }));
          });
        }
        // Pre-clear artifacts so the artifacts scene shows a thinking state
        // until the LLM responds.
        setState((s) => ({ ...s, artifacts: [] }));
        goto('artifacts');
      }
    } else if (key.escape) {
      goto('literature');
    } else if (key.ctrl && input === 'c') {
      exit();
    }
  });

  const chosen = state.candidates.find((c) => c.id === state.chosenDesignId);

  return (
    <Box flexDirection="column">
      <FrameTop
        title={
          <>
            <Text color={probeTokens.amber} bold>PROBE</Text>
            <Text color={probeTokens.ink3}> › </Text>
            <Text color={probeTokens.ink}>methodology</Text>
          </>
        }
        rightLabel="stage 3 · integrated study design"
        width={width}
      />
      <FrameBlank width={width} />

      {/* Recap of main RQ + sub-RQs */}
      <FrameRow width={width}>
        <Text>
          {'  '}
          <Text color={probeTokens.ink3}>main RQ: </Text>
          <Text color={probeTokens.ink}>{trim(state.premise, innerW - 12)}</Text>
          {fill(' ', Math.max(0, innerW - 11 - Math.min(state.premise.length, innerW - 12)))}
        </Text>
      </FrameRow>
      {state.rqs.filter((r) => state.selectedRqLetters.includes(r.letter)).map((rq) => (
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
          <Text color={probeTokens.ink3}>candidate integrated designs </Text>
          <Text color={probeTokens.ink2}>— one paper, layered methods. pick </Text>
          <Text color={probeTokens.amber}>one</Text>
          <Text color={probeTokens.ink2}> with the number key or j/k+space.</Text>
          {fill(' ', Math.max(0, innerW - 110))}
        </Text>
      </FrameRow>
      <FrameBlank width={width} />

      {state.candidates.map((c, i) => {
        const isCursor = i === cursor;
        const isChosen = c.id === state.chosenDesignId;
        return (
          <React.Fragment key={c.id}>
            <FrameRow width={width}>
              <Text>
                {'  '}
                <Text color={probeTokens.amber}>[{i + 1}]</Text>
                {' '}
                <Text color={isChosen ? probeTokens.amber : probeTokens.ink3}>{isChosen ? '◉' : '○'}</Text>
                {'  '}
                {isCursor ? (
                  <Text backgroundColor={probeTokens.amberSoft} color={probeTokens.amber} bold>
                    {' '}{c.name}{' '}
                  </Text>
                ) : (
                  <Text color={probeTokens.ink} bold>{c.name}</Text>
                )}
                <Text color={probeTokens.ink3}>  ·  {c.weeks}w  ·  </Text>
                <Text color={probeTokens.cyan}>{c.arc}</Text>
                {fill(' ', Math.max(0, innerW - 16 - c.name.length - 12 - c.arc.length))}
              </Text>
            </FrameRow>
            {/* Coverage matrix line */}
            <FrameRow width={width}>
              <Text>
                {'      '}
                <Text color={probeTokens.ink3}>coverage: </Text>
                {state.selectedRqLetters.map((L) => {
                  const cov = c.coverage[L] ?? 'partial';
                  const glyph = cov === 'core' ? '●' : cov === 'partial' ? '◐' : '·';
                  const color = cov === 'core' ? probeTokens.moss : cov === 'partial' ? probeTokens.amber : probeTokens.ink3;
                  return (
                    <Text key={L}>
                      <Text color={probeTokens.ink2}>RQ {L} </Text>
                      <Text color={color}>{glyph}</Text>
                      <Text>  </Text>
                    </Text>
                  );
                })}
                <Text color={probeTokens.ink3}>{trim(c.summary, innerW - 60)}</Text>
                {fill(' ', Math.max(0, innerW - 100))}
              </Text>
            </FrameRow>
          </React.Fragment>
        );
      })}
      <FrameBlank width={width} />

      {/* Plan section */}
      {chosen && (
        <>
          <FrameRow width={width}>
            <Text>
              {'  '}
              <Text color={probeTokens.amber}>§</Text>
              {' '}
              <Text color={probeTokens.ink}>plan for </Text>
              <Text color={probeTokens.amber}>{chosen.name}</Text>
              {fill(' ', Math.max(0, innerW - 14 - chosen.name.length))}
            </Text>
          </FrameRow>
          {!state.plan && (
            <FrameRow width={width}>
              <Text>
                {'      '}
                <Text color={probeTokens.cyan}>press </Text>
                <Text color={probeTokens.amber}>p</Text>
                <Text color={probeTokens.cyan}> to draft a phased plan</Text>
                {fill(' ', Math.max(0, innerW - 35))}
              </Text>
            </FrameRow>
          )}
          {state.plan && (
            <>
              <FrameRow width={width}>
                <Text>
                  {'      '}
                  <Text color={probeTokens.ink3}>phases ({state.plan.totalWeeks}w total)</Text>
                  {fill(' ', Math.max(0, innerW - 28))}
                </Text>
              </FrameRow>
              {state.plan.phases.map((p, i) => (
                <FrameRow width={width} key={i}>
                  <Text>
                    {'        '}
                    <Text color={probeTokens.amber}>{String(p.weeks).padStart(2, ' ')}w</Text>
                    <Text color={probeTokens.ink3}> · </Text>
                    <Text color={probeTokens.ink}>{p.name.padEnd(28, ' ')}</Text>
                    <Text color={probeTokens.ink3}> {trim(p.detail, innerW - 50)}</Text>
                    {fill(' ', Math.max(0, innerW - 50 - Math.min(p.detail.length, innerW - 50)))}
                  </Text>
                </FrameRow>
              ))}
              <FrameBlank width={width} />
              <FrameRow width={width}>
                <Text>
                  {'      '}
                  <Text color={probeTokens.ink3}>risks</Text>
                  {fill(' ', Math.max(0, innerW - 13))}
                </Text>
              </FrameRow>
              {state.plan.risks.map((r, i) => (
                <FrameRow width={width} key={i}>
                  <Text>
                    {'        '}
                    <Text color={probeTokens.rose}>▲</Text>
                    {' '}
                    <Text color={probeTokens.ink2}>{trim(r, innerW - 12)}</Text>
                    {fill(' ', Math.max(0, innerW - 12 - Math.min(r.length, innerW - 12)))}
                  </Text>
                </FrameRow>
              ))}
            </>
          )}
        </>
      )}

      <FrameBlank width={width} />
      <FrameBottom width={width} />

      <StatusBar
        mode="NORMAL"
        context={`methodology   1..5 · pick    j/k · move    p · draft plan    enter · continue${state.plan ? '' : ' (need plan)'}    esc · back`}
        rightLabel={chosen ? `chosen: ${chosen.id}` : 'pick a design'}
        width={width}
      />
    </Box>
  );
}

function trim(s: string, n: number): string {
  if (n <= 0) return '';
  if (s.length <= n) return s;
  return s.slice(0, Math.max(0, n - 1)) + '…';
}
