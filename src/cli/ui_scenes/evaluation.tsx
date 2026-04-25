/**
 * Evaluation scene — simulated participant pool + findings. The user
 * adjusts N (6..30) with [/] keys, optionally regenerates personas,
 * and reviews 3 frictions surfaced by the simulated walkthrough.
 *
 * Findings are expandable inline (each reveals trigger / evidence /
 * fix). The findings list is the central artifact this stage
 * outputs; it carries forward into the report.
 */

import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { probeTokens } from '../../ui/probe_tokens.js';
import {
  FrameTop, FrameBottom, FrameRow, FrameBlank,
  StatusBar, useTermWidth, fill,
} from '../../ui/tui_frame.js';
import type { SceneProps } from '../ui_app.js';
import { livePersonas, liveFindings, liveReport } from '../ui_state.js';

export function EvaluationScene({ goto, exit, state, setState }: SceneProps): React.ReactElement {
  const width = useTermWidth();
  const innerW = width - 2;
  const [cursor, setCursor] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [running, setRunning] = useState(state.findings.length === 0);

  // Run the simulation: hits /api/probe/findings (or its TUI direct
  // equivalent). Falls back to canned content automatically on error.
  useEffect(() => {
    if (state.findings.length > 0) return;
    setRunning(true);
    const studyPlan = state.plan;
    if (!studyPlan) {
      setRunning(false);
      return;
    }
    let cancelled = false;
    Promise.all([
      state.personas.length > 0 ? Promise.resolve(state.personas) : livePersonas(state.evalN, state.premise),
      liveFindings(studyPlan, state.premise),
    ]).then(([personas, findings]) => {
      if (cancelled) return;
      setState((s) => ({ ...s, personas, findings }));
      setRunning(false);
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setN(n: number): void {
    const clamped = Math.max(6, Math.min(30, n));
    setState((s) => ({ ...s, evalN: clamped }));
    // Refresh personas to match the new N (live; falls back).
    livePersonas(clamped, state.premise).then((personas) => {
      setState((s) => ({ ...s, personas }));
    });
  }

  useInput((input, key) => {
    if (input === '[') setN(state.evalN - 1);
    else if (input === ']') setN(state.evalN + 1);
    else if (input === 'r') {
      // Re-run the simulation (live).
      setRunning(true);
      setState((s) => ({ ...s, findings: [] }));
      const studyPlan = state.plan;
      if (studyPlan) {
        liveFindings(studyPlan, state.premise).then((findings) => {
          setState((s) => ({ ...s, findings }));
          setRunning(false);
        });
      } else {
        setRunning(false);
      }
    } else if (key.upArrow || input === 'k') setCursor((c) => Math.max(0, c - 1));
    else if (key.downArrow || input === 'j') setCursor((c) => Math.min(state.findings.length - 1, c + 1));
    else if (key.return || input === ' ') {
      const id = state.findings[cursor]?.id;
      if (id) setExpanded((cur) => (cur === id ? null : id));
    } else if (input === 'n') {
      // Carry forward: live discussion + conclusion + title options.
      // The report scene shows a thinking indicator until the LLM
      // call resolves.
      liveReport(state).then((r) => {
        setState((s) => ({
          ...s,
          discussion: r.discussion,
          conclusion: r.conclusion,
          paperTitle: r.titleOptions[0] ?? '',
        }));
      });
      setState((s) => ({ ...s, discussion: '', conclusion: '', paperTitle: '' }));
      goto('report');
    } else if (key.escape) {
      goto('artifacts');
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
            <Text color={probeTokens.ink}>evaluation</Text>
          </>
        }
        rightLabel="stage 5 · simulated walkthrough"
        width={width}
      />
      <FrameBlank width={width} />

      {/* SIMULATED banner — non-negotiable per CLAUDE.md */}
      <FrameRow width={width}>
        <Text>
          {'  '}
          <Text backgroundColor={probeTokens.rose} color={probeTokens.bg} bold>
            {' SIMULATION_REHEARSAL '}
          </Text>
          <Text color={probeTokens.rose}>  ! these findings are NOT evidence — they're rehearsal output. Tag accordingly in your guidebook.</Text>
          {fill(' ', Math.max(0, innerW - 120))}
        </Text>
      </FrameRow>
      <FrameBlank width={width} />

      {/* N slider */}
      <FrameRow width={width}>
        <Text>
          {'  '}
          <Text color={probeTokens.ink3}>n participants  </Text>
          <Text color={probeTokens.amber}>[</Text>
          <Text color={probeTokens.ink2}> dec  </Text>
          <Text color={probeTokens.amber}>]</Text>
          <Text color={probeTokens.ink2}> inc  </Text>
          <Text color={probeTokens.ink}> {state.evalN}</Text>
          <Text color={probeTokens.ink3}>  /  </Text>
          {renderSlider(state.evalN, 6, 30, 30)}
          {fill(' ', Math.max(0, innerW - 80))}
        </Text>
      </FrameRow>
      <FrameBlank width={width} />

      {/* persona pool — show first 6 + count */}
      <FrameRow width={width}>
        <Text>
          {'  '}
          <Text color={probeTokens.ink3}>persona pool ({state.personas.length})</Text>
          {fill(' ', Math.max(0, innerW - 25))}
        </Text>
      </FrameRow>
      {state.personas.slice(0, 6).map((p) => (
        <FrameRow width={width} key={p.id}>
          <Text>
            {'    '}
            <Text color={probeTokens.cyan}>{p.id.padStart(2, ' ')}</Text>
            <Text color={probeTokens.ink3}>  ·  </Text>
            <Text color={probeTokens.ink}>{p.name.padEnd(14, ' ')}</Text>
            <Text color={probeTokens.ink3}>{p.role.padEnd(28, ' ')}</Text>
            <Text color={probeTokens.ink2}>{trim(p.bias, innerW - 56)}</Text>
            {fill(' ', Math.max(0, innerW - 50 - Math.min(p.bias.length, innerW - 56)))}
          </Text>
        </FrameRow>
      ))}
      {state.personas.length > 6 && (
        <FrameRow width={width}>
          <Text>{'    '}<Text color={probeTokens.ink3}>… and {state.personas.length - 6} more</Text>{fill(' ', Math.max(0, innerW - 30))}</Text>
        </FrameRow>
      )}
      <FrameBlank width={width} />

      {/* findings */}
      <FrameRow width={width}>
        <Text>
          {'  '}
          <Text color={probeTokens.ink3}>findings {fill('─', Math.max(0, innerW - 12))}</Text>
        </Text>
      </FrameRow>
      {running && (
        <FrameRow width={width}>
          <Text>{'    '}<Text color={probeTokens.cyan}>~ running simulated pilot…</Text>{fill(' ', Math.max(0, innerW - 30))}</Text>
        </FrameRow>
      )}
      {state.findings.map((f, i) => {
        const isCur = i === cursor;
        const isOpen = expanded === f.id;
        const sevColor =
          f.severity === 'critical' ? probeTokens.rose :
          f.severity === 'medium'   ? probeTokens.amber :
                                      probeTokens.ink3;
        const sevGlyph = f.severity === 'low' ? '▽ low      ' : f.severity === 'medium' ? '▲ medium   ' : '▲ critical ';
        return (
          <React.Fragment key={f.id}>
            <FrameRow width={width}>
              <Text>
                {'  '}
                <Text color={isOpen ? probeTokens.amber : probeTokens.ink3}>{isOpen ? '▾' : '▸'}</Text>
                {' '}
                <Text color={sevColor}>{sevGlyph}</Text>
                {' '}
                {isCur ? (
                  <Text backgroundColor={probeTokens.amberSoft} color={probeTokens.amber}>
                    {' '}{f.id} · {f.title}{' '}
                  </Text>
                ) : (
                  <Text color={probeTokens.ink}>{f.id} · {f.title}</Text>
                )}
                {fill(' ', Math.max(0, innerW - 22 - f.title.length))}
              </Text>
            </FrameRow>
            {isOpen && (
              <>
                <FrameRow width={width}>
                  <Text>{'      '}<Text color={probeTokens.ink3}>trigger:</Text> <Text color={probeTokens.ink2}>{trim(f.trigger, innerW - 18)}</Text>{fill(' ', Math.max(0, innerW - 18 - Math.min(f.trigger.length, innerW - 18)))}</Text>
                </FrameRow>
                <FrameRow width={width}>
                  <Text>{'      '}<Text color={probeTokens.ink3}>evidence:</Text> <Text color={probeTokens.ink2}>{trim(f.evidence, innerW - 19)}</Text>{fill(' ', Math.max(0, innerW - 19 - Math.min(f.evidence.length, innerW - 19)))}</Text>
                </FrameRow>
                <FrameRow width={width}>
                  <Text>
                    {'      '}
                    <Text color={probeTokens.amber}>› fix:</Text>
                    {' '}
                    <Text color={probeTokens.ink}>{trim(f.fix, innerW - 30)}</Text>
                    {' '}
                    <Text color={probeTokens.moss}>[recommended]</Text>
                    {fill(' ', Math.max(0, innerW - 28 - Math.min(f.fix.length, innerW - 30)))}
                  </Text>
                </FrameRow>
              </>
            )}
          </React.Fragment>
        );
      })}

      <FrameBlank width={width} />
      <FrameBottom width={width} />

      <StatusBar
        mode="NORMAL"
        context={`evaluation   [/] · n=${state.evalN}    j/k · move finding    enter · expand    r · re-sim    n · continue → report    esc · back`}
        rightLabel={running ? 'running…' : `${state.findings.length} frictions`}
        width={width}
      />
    </Box>
  );
}

function renderSlider(value: number, min: number, max: number, w: number): React.ReactElement {
  const pct = (value - min) / (max - min);
  const filled = Math.round(w * pct);
  return (
    <Text>
      <Text color={probeTokens.cyan}>{'█'.repeat(filled)}</Text>
      <Text color={probeTokens.ink3}>{'░'.repeat(Math.max(0, w - filled))}</Text>
    </Text>
  );
}

function trim(s: string, n: number): string {
  if (n <= 0) return '';
  if (s.length <= n) return s;
  return s.slice(0, Math.max(0, n - 1)) + '…';
}
