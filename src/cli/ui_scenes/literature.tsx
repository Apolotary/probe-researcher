/**
 * Literature scene — one tab per selected RQ. Each tab streams in:
 * pipeline progress (search / read / synthesize), state of the art
 * paragraph, similar papers list, research gaps, and a notes
 * textarea that persists across tabs and into later stages.
 *
 * Hotkeys:
 *   1..n       jump to RQ tab
 *   ←/→ h/l    prev/next tab
 *   tab        focus notes textarea
 *   esc        return to brainstorm
 *   enter      continue → methodology (only after synthesis is done)
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
import { liveCandidates } from '../ui_state.js';

type PipelineStep = 'search' | 'read' | 'synthesize';

export function LiteratureScene({ goto, exit, state, setState }: SceneProps): React.ReactElement {
  const width = useTermWidth();
  const innerW = width - 2;

  const [activeTab, setActiveTab] = useState(0);
  const [progress, setProgress] = useState<PipelineStep>('search');
  const [notesMode, setNotesMode] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');

  // Drive the streaming progress: search → read → synthesize.
  useEffect(() => {
    setProgress('search');
    const t1 = setTimeout(() => setProgress('read'), 700);
    const t2 = setTimeout(() => setProgress('synthesize'), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [activeTab]);

  const selected = state.rqs.filter((r) => state.selectedRqLetters.includes(r.letter));
  const block = state.literature[activeTab];
  const activeRq = selected[activeTab];
  const synthesisDone = progress === 'synthesize';

  // When the user opens the notes editor we seed it with whatever is
  // already saved for this RQ, so editing is additive.
  useEffect(() => {
    if (notesMode && activeRq) {
      setNotesDraft(state.rqNotes[activeRq.letter] ?? '');
    }
  }, [notesMode, activeRq, state.rqNotes]);

  function commitNotes(value: string): void {
    if (!activeRq) {
      setNotesMode(false);
      return;
    }
    setState((s) => ({
      ...s,
      rqNotes: { ...s.rqNotes, [activeRq.letter]: value },
    }));
    setNotesMode(false);
  }

  useInput(
    (input, key) => {
      if (notesMode) {
        if (key.escape) {
          setNotesMode(false);
        }
        return;
      }
      if (input >= '1' && input <= '9') {
        const idx = parseInt(input, 10) - 1;
        if (idx < selected.length) setActiveTab(idx);
      } else if (key.leftArrow || input === 'h') {
        setActiveTab((t) => Math.max(0, t - 1));
      } else if (key.rightArrow || input === 'l') {
        setActiveTab((t) => Math.min(selected.length - 1, t + 1));
      } else if (key.tab) {
        setNotesMode(true);
      } else if (key.return) {
        if (synthesisDone) {
          // Kick off candidate-design generation in the background
          // and move to the methodology scene; methodology shows a
          // thinking indicator until the LLM responds.
          const selectedRqs = state.rqs.filter((r) => state.selectedRqLetters.includes(r.letter));
          liveCandidates(state.premise, selectedRqs).then((candidates) => {
            setState((s) => ({ ...s, candidates }));
          });
          // Pre-clear so methodology shows its thinking state.
          setState((s) => ({ ...s, candidates: [] }));
          goto('methodology');
        }
      } else if (key.escape) {
        goto('brainstorm');
      } else if (key.ctrl && input === 'c') {
        exit();
      }
    },
    { isActive: !notesMode },
  );

  if (selected.length === 0) {
    // Defensive — if we got here without any selection, bounce back.
    return (
      <Box flexDirection="column">
        <Text color={probeTokens.rose}>No RQs selected. Press esc to return to brainstorm.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <FrameTop
        title={
          <>
            <Text color={probeTokens.amber} bold>PROBE</Text>
            <Text color={probeTokens.ink3}> › </Text>
            <Text color={probeTokens.ink}>literature</Text>
          </>
        }
        rightLabel="stage 2 · literature review"
        width={width}
      />
      <FrameBlank width={width} />

      {/* Tabs strip — one per selected RQ */}
      <FrameRow width={width}>
        <Text>
          {'  '}
          {selected.map((rq, i) => {
            const active = i === activeTab;
            const hasNotes = !!state.rqNotes[rq.letter];
            const label = `RQ ${rq.letter}${hasNotes ? ' ●' : ''}`;
            return (
              <React.Fragment key={rq.letter}>
                {active ? (
                  <Text backgroundColor={probeTokens.amberSoft} color={probeTokens.amber}>
                    {' '}{label}{' '}
                  </Text>
                ) : (
                  <Text color={probeTokens.ink3}>{' '}{label}{' '}</Text>
                )}
                <Text> </Text>
              </React.Fragment>
            );
          })}
          {fill(' ', Math.max(0, innerW - selected.length * 8 - 2))}
        </Text>
      </FrameRow>
      <FrameBlank width={width} />

      {/* Pipeline progress strip */}
      <FrameRow width={width}>
        <Text>
          {'  '}
          <Text color={probeTokens.ink3}>pipeline ─ </Text>
          <ProgressStep label="search" me="search" cur={progress} />
          <Text color={probeTokens.ink3}> → </Text>
          <ProgressStep label="read" me="read" cur={progress} />
          <Text color={probeTokens.ink3}> → </Text>
          <ProgressStep label="synthesize" me="synthesize" cur={progress} />
          {fill(' ', Math.max(0, innerW - 50))}
        </Text>
      </FrameRow>
      <FrameBlank width={width} />

      {/* Active RQ context */}
      {activeRq && (
        <FrameRow width={width}>
          <Text>
            {'  '}
            <Text color={probeTokens.amber}>§</Text>
            {' '}
            <Text color={probeTokens.ink}>RQ {activeRq.letter}: </Text>
            <Text color={probeTokens.ink2}>{trim(activeRq.rq, innerW - 12)}</Text>
            {fill(' ', Math.max(0, innerW - 12 - Math.min(activeRq.rq.length, innerW - 12)))}
          </Text>
        </FrameRow>
      )}
      <FrameBlank width={width} />

      {/* State of the art */}
      <FrameRow width={width}>
        <Text>
          {'  '}
          <Text color={probeTokens.ink3}>state of the art</Text>
          {fill(' ', Math.max(0, innerW - 18))}
        </Text>
      </FrameRow>
      {block && progress === 'synthesize' && wrap(block.stateOfArt, innerW - 4, 6).map((line, i) => (
        <FrameRow width={width} key={`soa-${i}`}>
          <Text>{'    '}<Text color={probeTokens.ink}>{line.padEnd(innerW - 4, ' ')}</Text></Text>
        </FrameRow>
      ))}
      {block && progress !== 'synthesize' && (
        <FrameRow width={width}>
          <Text>{'    '}<Text color={probeTokens.cyan}>~ synthesizing…</Text>{fill(' ', Math.max(0, innerW - 19))}</Text>
        </FrameRow>
      )}
      <FrameBlank width={width} />

      {/* Similar papers */}
      <FrameRow width={width}>
        <Text>
          {'  '}
          <Text color={probeTokens.ink3}>most similar work</Text>
          {fill(' ', Math.max(0, innerW - 19))}
        </Text>
      </FrameRow>
      {block?.similar.map((p, i) => (
        <FrameRow width={width} key={`sim-${i}`}>
          <Text>
            {'    '}
            <Text color={probeTokens.cyan}>{p.cite.padEnd(20, ' ')}</Text>
            <Text color={probeTokens.ink}>{p.title.padEnd(Math.max(20, innerW - 36), ' ').slice(0, Math.max(20, innerW - 36))}</Text>
            <Text color={probeTokens.ink3}>{p.venue}</Text>
            {fill(' ', Math.max(0, innerW - 25 - Math.min(p.title.length, innerW - 36) - p.venue.length))}
          </Text>
        </FrameRow>
      ))}
      <FrameBlank width={width} />

      {/* Research gaps */}
      <FrameRow width={width}>
        <Text>
          {'  '}
          <Text color={probeTokens.ink3}>research gaps · where you can differentiate</Text>
          {fill(' ', Math.max(0, innerW - 47))}
        </Text>
      </FrameRow>
      {block?.gaps.map((g, i) => (
        <FrameRow width={width} key={`gap-${i}`}>
          <Text>
            {'    '}
            <Text color={probeTokens.moss}>·</Text>
            {' '}
            <Text color={probeTokens.ink2}>{trim(g, innerW - 8)}</Text>
            {fill(' ', Math.max(0, innerW - 8 - Math.min(g.length, innerW - 8)))}
          </Text>
        </FrameRow>
      ))}
      <FrameBlank width={width} />

      {/* Notes textarea (single-line for now) */}
      <FrameRow width={width}>
        <Text>
          {'  '}
          <Text color={probeTokens.ink3}>your notes for RQ {activeRq?.letter} </Text>
          <Text color={probeTokens.ink3}>(persists into methodology)</Text>
          {fill(' ', Math.max(0, innerW - 50))}
        </Text>
      </FrameRow>
      <FrameRow width={width}>
        <Text>
          {'    '}
          <Text color={probeTokens.cyan}>┌{fill('─', innerW - 8)}┐</Text>
        </Text>
      </FrameRow>
      <FrameRow width={width}>
        <Text>
          {'    '}
          <Text color={probeTokens.cyan}>│</Text>
          <Text> </Text>
          {notesMode ? (
            <Text color={probeTokens.ink}>
              <TextInput
                value={notesDraft}
                onChange={setNotesDraft}
                onSubmit={commitNotes}
                placeholder="constraints, hard requirements, tone notes…"
              />
            </Text>
          ) : (
            <Text color={state.rqNotes[activeRq?.letter ?? ''] ? probeTokens.ink : probeTokens.ink3}>
              {trim(state.rqNotes[activeRq?.letter ?? ''] || 'press tab to edit', innerW - 12)}
            </Text>
          )}
          {fill(' ', Math.max(0, innerW - 12 - Math.min(80, (state.rqNotes[activeRq?.letter ?? ''] || 'press tab to edit').length)))}
          <Text color={probeTokens.cyan}>│</Text>
        </Text>
      </FrameRow>
      <FrameRow width={width}>
        <Text>
          {'    '}
          <Text color={probeTokens.cyan}>└{fill('─', innerW - 8)}┘</Text>
        </Text>
      </FrameRow>

      <FrameBlank width={width} />
      <FrameBottom width={width} />

      <StatusBar
        mode={notesMode ? 'INSERT' : 'NORMAL'}
        context={`literature   ${activeTab + 1}/${selected.length}   1..n · jump tab    ←/→ · move    tab · notes    enter · continue${synthesisDone ? '' : ' (waiting…)'}    esc · back`}
        rightLabel="$0.00"
        width={width}
      />
    </Box>
  );
}

function ProgressStep({ label, me, cur }: { label: string; me: PipelineStep; cur: PipelineStep }): React.ReactElement {
  const order: PipelineStep[] = ['search', 'read', 'synthesize'];
  const myIdx = order.indexOf(me);
  const curIdx = order.indexOf(cur);
  const state = myIdx < curIdx ? 'done' : myIdx === curIdx ? 'active' : 'pending';
  const color = state === 'done' ? probeTokens.moss : state === 'active' ? probeTokens.cyan : probeTokens.ink3;
  const glyph = state === 'done' ? '✓' : state === 'active' ? '~' : '·';
  return (
    <Text>
      <Text color={color}>{glyph}</Text>
      <Text color={state === 'pending' ? probeTokens.ink3 : probeTokens.ink}> {label}</Text>
    </Text>
  );
}

function trim(s: string, n: number): string {
  if (n <= 0) return '';
  if (s.length <= n) return s;
  return s.slice(0, Math.max(0, n - 1)) + '…';
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
