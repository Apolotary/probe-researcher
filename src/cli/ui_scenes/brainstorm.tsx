/**
 * Brainstorm scene — Main RQ + 3 sub-RQs (A/B/C). User toggles which
 * ones to carry forward via 1/2/3, can add a custom RQ with `c`, can
 * regenerate with `r`, and continues with `enter` once at least one
 * is selected.
 *
 * The 3 candidate RQs are computed in ui_state → makeBrainstorm()
 * from the user's premise, so the screen feels responsive to what
 * they actually typed.
 */

import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { probeTokens } from '../../ui/probe_tokens.js';
import {
  FrameTop, FrameBottom, FrameRow, FrameBlank,
  StatusBar, useTermWidth, fill,
} from '../../ui/tui_frame.js';
import type { SceneProps } from '../ui_app.js';
import { liveBrainstorm, liveLiterature, type SubRQ } from '../ui_state.js';

export function BrainstormScene({ goto, exit, state, setState }: SceneProps): React.ReactElement {
  const width = useTermWidth();
  const innerW = width - 2;

  const [revealed, setRevealed] = useState(state.rqs.length); // already populated → reveal all
  const [customMode, setCustomMode] = useState(false);
  const [customDraft, setCustomDraft] = useState('');
  const [thinking, setThinking] = useState(state.rqs.length === 0 && !!state.premise);

  // If we entered fresh (no cached rqs), call the LLM via liveBrainstorm.
  // Falls back to canned content automatically if the API is unreachable.
  useEffect(() => {
    if (state.rqs.length > 0 || !state.premise) {
      setRevealed(state.rqs.length);
      setThinking(false);
      return;
    }
    let cancelled = false;
    setThinking(true);
    setRevealed(0);
    liveBrainstorm(state.premise).then((rqs) => {
      if (cancelled) return;
      setState((s) => ({ ...s, rqs }));
      setThinking(false);
      // stagger the reveal so it feels like the agent is producing them
      rqs.forEach((_, i) => setTimeout(() => {
        if (!cancelled) setRevealed(i + 1);
      }, 200 + i * 350));
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle(letter: string): void {
    setState((s) => {
      const has = s.selectedRqLetters.includes(letter);
      return {
        ...s,
        selectedRqLetters: has
          ? s.selectedRqLetters.filter((L) => L !== letter)
          : [...s.selectedRqLetters, letter].sort(),
      };
    });
  }

  function regenerate(): void {
    if (!state.premise) return;
    setThinking(true);
    setRevealed(0);
    setState((s) => ({ ...s, rqs: [], selectedRqLetters: [] }));
    liveBrainstorm(state.premise).then((rqs) => {
      setState((s) => ({ ...s, rqs }));
      setThinking(false);
      rqs.forEach((_, i) => setTimeout(() => setRevealed(i + 1), 200 + i * 350));
    });
  }

  function addCustom(text: string): void {
    const t = text.trim();
    if (!t) {
      setCustomMode(false);
      setCustomDraft('');
      return;
    }
    const nextLetter = String.fromCharCode(65 + state.rqs.length); // A, B, C, D, …
    const custom: SubRQ = {
      letter: nextLetter,
      rq: t,
      angle: 'custom',
      method: 'researcher choice',
      n: 'tbd',
      custom: true,
    };
    setState((s) => ({
      ...s,
      rqs: [...s.rqs, custom],
      selectedRqLetters: [...s.selectedRqLetters, nextLetter].sort(),
    }));
    setCustomMode(false);
    setCustomDraft('');
    setRevealed(state.rqs.length + 1);
  }

  useInput(
    (input, key) => {
      if (customMode) {
        if (key.escape) {
          setCustomMode(false);
          setCustomDraft('');
        }
        return;
      }
      if (input >= '1' && input <= '9') {
        const idx = parseInt(input, 10) - 1;
        const rq = state.rqs[idx];
        if (rq) toggle(rq.letter);
      } else if (input === 'c') {
        setCustomMode(true);
      } else if (input === 'r') {
        regenerate();
      } else if (key.return) {
        if (state.selectedRqLetters.length > 0) {
          // Kick off literature calls for selected RQs (live: hits LLM
          // when ANTHROPIC_API_KEY is set, else falls back to stock).
          // The call runs while the user moves to the literature scene
          // so the perceived latency is low.
          const selected = state.rqs.filter((rq) => state.selectedRqLetters.includes(rq.letter));
          liveLiterature(selected).then((blocks) => {
            setState((s) => ({ ...s, literature: blocks }));
          });
          goto('literature');
        }
      } else if (key.escape) {
        goto('premise');
      } else if (key.ctrl && input === 'c') {
        exit();
      }
    },
    { isActive: !customMode },
  );

  const selectedCount = state.selectedRqLetters.length;

  return (
    <Box flexDirection="column">
      <FrameTop
        title={
          <>
            <Text color={probeTokens.amber} bold>PROBE</Text>
            <Text color={probeTokens.ink3}> › new project › </Text>
            <Text color={probeTokens.ink}>brainstorm</Text>
          </>
        }
        rightLabel="stage 1 · interrogator"
        width={width}
      />
      <FrameBlank width={width} />

      {/* main RQ box */}
      <FrameRow width={width}>
        <Text>
          {'  '}
          <Text color={probeTokens.ink3}>main RQ</Text>
          {fill(' ', Math.max(0, innerW - 9))}
        </Text>
      </FrameRow>
      <PremiseBox text={state.premise} width={width} />
      <FrameBlank width={width} />

      <FrameRow width={width}>
        <Text>
          {'  '}
          <Text color={probeTokens.ink3}>interrogator </Text>
          <Text color={probeTokens.ink2}>— pick the angle(s) to investigate. you can add a custom RQ with </Text>
          <Text color={probeTokens.amber}>c</Text>
          <Text color={probeTokens.ink2}>, regenerate with </Text>
          <Text color={probeTokens.amber}>r</Text>
          <Text color={probeTokens.ink2}>.</Text>
          {fill(' ', Math.max(0, innerW - 105))}
        </Text>
      </FrameRow>
      <FrameBlank width={width} />

      {state.rqs.slice(0, revealed).map((rq, i) => (
        <RQRow
          key={rq.letter}
          rq={rq}
          number={i + 1}
          selected={state.selectedRqLetters.includes(rq.letter)}
          width={width}
        />
      ))}

      {(thinking || revealed < state.rqs.length) && (
        <FrameRow width={width}>
          <Text>
            {'  '}
            <Text color={probeTokens.cyan}>~</Text>
            {' '}
            <Text color={probeTokens.ink3}>{thinking && state.rqs.length === 0 ? 'calling Claude (interrogator)…' : 'thinking…'}</Text>
            {fill(' ', Math.max(0, innerW - 36))}
          </Text>
        </FrameRow>
      )}

      <FrameBlank width={width} />

      {/* custom RQ row */}
      <FrameRow width={width}>
        <Text>
          {'  '}
          {customMode ? (
            <>
              <Text color={probeTokens.cyan}>+</Text>
              <Text> </Text>
              <Text color={probeTokens.ink}>
                <TextInput
                  value={customDraft}
                  onChange={setCustomDraft}
                  onSubmit={addCustom}
                  placeholder="describe your own follow-up RQ…"
                />
              </Text>
              {fill(' ', Math.max(0, innerW - 50 - customDraft.length))}
            </>
          ) : (
            <>
              <Text color={probeTokens.amber}>[c]</Text>
              <Text>  </Text>
              <Text color={probeTokens.cyan}>+ write your own follow-up research question</Text>
              {fill(' ', Math.max(0, innerW - 52))}
            </>
          )}
        </Text>
      </FrameRow>

      <FrameBlank width={width} />
      <FrameBottom width={width} />

      <StatusBar
        mode={customMode ? 'INSERT' : 'NORMAL'}
        context={`brainstorm   1/2/3 · toggle    c · custom    r · regenerate    enter · continue (${selectedCount} selected)    esc · back`}
        rightLabel={state.premise ? '$0.00' : ''}
        width={width}
      />
    </Box>
  );
}

function RQRow({
  rq,
  number,
  selected,
  width,
}: {
  rq: SubRQ;
  number: number;
  selected: boolean;
  width: number;
}): React.ReactElement {
  const innerW = width - 2;
  // Trim long RQ to fit the frame width.
  const maxRq = Math.max(40, innerW - 16);
  const rqDisplay = rq.rq.length > maxRq ? rq.rq.slice(0, maxRq - 1) + '…' : rq.rq;
  return (
    <>
      <FrameRow width={width}>
        <Text>
          {'  '}
          <Text color={probeTokens.amber}>[{number}]</Text>
          {' '}
          {selected ? (
            <Text backgroundColor={probeTokens.amberSoft} color={probeTokens.amber}>
              {' '}{rq.custom ? `RQ ${rq.letter} (custom)` : `RQ ${rq.letter}`}{' '}
            </Text>
          ) : (
            <Text color={probeTokens.ink3}>
              {' '}{rq.custom ? `RQ ${rq.letter} (custom)` : `RQ ${rq.letter}`}{' '}
            </Text>
          )}
          <Text>  </Text>
          <Text color={probeTokens.ink}>{rqDisplay}</Text>
          {fill(' ', Math.max(0, innerW - 16 - rqDisplay.length))}
        </Text>
      </FrameRow>
      <FrameRow width={width}>
        <Text>
          {'           '}
          <Text color={probeTokens.ink3}>angle: </Text>
          <Text color={probeTokens.cyan}>{rq.angle}</Text>
          <Text color={probeTokens.ink3}>  ·  method: </Text>
          <Text color={probeTokens.ink2}>{rq.method}</Text>
          <Text color={probeTokens.ink3}>  ·  </Text>
          <Text color={probeTokens.ink2}>{rq.n}</Text>
          {fill(' ', Math.max(0, innerW - 50 - rq.angle.length - rq.method.length - rq.n.length))}
        </Text>
      </FrameRow>
      <FrameBlank width={width} />
    </>
  );
}

function PremiseBox({ text, width }: { text: string; width: number }): React.ReactElement {
  const innerW = width - 2;
  const boxW = Math.max(60, innerW - 8);
  const display = text || '(no premise — go back to enter one)';
  return (
    <>
      <FrameRow width={width}>
        <Text>
          {'  '}
          <Text color={probeTokens.amber}>┌{fill('─', boxW)}┐</Text>
          {fill(' ', Math.max(0, innerW - 4 - boxW))}
        </Text>
      </FrameRow>
      <FrameRow width={width}>
        <Text>
          {'  '}
          <Text color={probeTokens.amber}>│</Text>
          {' '}
          <Text color={probeTokens.ink}>{padOrTrim(display, boxW - 2)}</Text>
          {' '}
          <Text color={probeTokens.amber}>│</Text>
          {fill(' ', Math.max(0, innerW - 4 - boxW))}
        </Text>
      </FrameRow>
      <FrameRow width={width}>
        <Text>
          {'  '}
          <Text color={probeTokens.amber}>└{fill('─', boxW)}┘</Text>
          {fill(' ', Math.max(0, innerW - 4 - boxW))}
        </Text>
      </FrameRow>
    </>
  );
}

function padOrTrim(s: string, n: number): string {
  if (s.length >= n) return s.slice(0, n - 1) + '…';
  return s + ' '.repeat(n - s.length);
}
