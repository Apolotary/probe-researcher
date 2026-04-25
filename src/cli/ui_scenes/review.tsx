/**
 * Review scene — stage 07 of the new-project workflow. ARR-style peer
 * review session with one Area Chair (1AC) meta-review and three
 * reviewer cards (R1/R2/R3) each with their own recommendation,
 * strengths, weaknesses, comments to authors, comments to chairs.
 *
 * Layout (matches the design's TUI mock in CHANGES.md §1.5):
 *   ┌─ PROBE › review ─ ARR · cycle 14 · due may 30 ─┐
 *   │  VERDICT  ▸ major revisions   ac agrees with majority
 *   │  ─── meta-review · 1AC ─────────────────────────────
 *   │   <AC summary>
 *   │  ─── reviewers ──────────────────────────────────────
 *   │   R1  RR   conf high   "<one-line tldr>"
 *   │   R2  ARR  conf medium "<one-line tldr>"
 *   │   R3  RRX  conf medium "<one-line tldr>"
 *
 * Hotkeys:
 *   j/k        move between AC, R1, R2, R3
 *   enter/space toggle expand
 *   r          re-run review (live LLM call)
 *   n          continue → done
 *   esc        back to report
 */

import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { probeTokens } from '../../ui/probe_tokens.js';
import {
  FrameTop, FrameBottom, FrameRow, FrameBlank,
  StatusBar, useTermWidth, fill,
} from '../../ui/tui_frame.js';
import type { SceneProps } from '../ui_app.js';
import { liveReviewSession, type ReviewerCard, type MetaReview } from '../ui_state.js';

const REC_LABEL: Record<ReviewerCard['rec'], { label: string; color: string }> = {
  A:   { label: 'accept',                 color: probeTokens.moss },
  ARR: { label: 'accept w/ revisions',    color: probeTokens.moss },
  RR:  { label: 'revise & resubmit',      color: probeTokens.amber },
  RRX: { label: 'major revision',         color: probeTokens.amber },
  X:   { label: 'reject',                 color: probeTokens.rose },
};

const VERDICT_LABEL: Record<MetaReview['verdict'], { label: string; color: string; glyph: string }> = {
  accept: { label: 'accept',           color: probeTokens.moss,  glyph: '✓' },
  minor:  { label: 'minor revisions',  color: probeTokens.moss,  glyph: '✓' },
  major:  { label: 'major revisions',  color: probeTokens.amber, glyph: '~' },
  reject: { label: 'reject',           color: probeTokens.rose,  glyph: '✗' },
};

export function ReviewScene({ goto, exit, state, setState }: SceneProps): React.ReactElement {
  const width = useTermWidth();
  const innerW = width - 2;
  const [running, setRunning] = useState(state.reviewSession === null);
  const [cursor, setCursor] = useState(0); // 0 = AC, 1..3 = reviewers
  const [expanded, setExpanded] = useState<string | null>('AC'); // AC expanded by default

  // On mount, if no reviewSession yet, fetch one. Falls back to canned
  // content automatically when no API key.
  useEffect(() => {
    if (state.reviewSession) {
      setRunning(false);
      return;
    }
    let cancelled = false;
    setRunning(true);
    liveReviewSession(state).then((session) => {
      if (cancelled) return;
      setState((s) => ({ ...s, reviewSession: session }));
      setRunning(false);
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function rerun(): void {
    setRunning(true);
    setState((s) => ({ ...s, reviewSession: null }));
    liveReviewSession(state).then((session) => {
      setState((s) => ({ ...s, reviewSession: session }));
      setRunning(false);
    });
  }

  useInput((input, key) => {
    if (key.upArrow || input === 'k') setCursor((c) => Math.max(0, c - 1));
    else if (key.downArrow || input === 'j') setCursor((c) => Math.min(3, c + 1));
    else if (key.return || input === ' ') {
      const id = cursor === 0 ? 'AC' : `R${cursor}`;
      setExpanded((cur) => (cur === id ? null : id));
    } else if (input === 'r') rerun();
    else if (input === 'n') goto('done');
    else if (key.escape) goto('report');
    else if (key.ctrl && input === 'c') exit();
  });

  const session = state.reviewSession;
  const verdict = session?.meta.verdict ?? 'major';
  const v = VERDICT_LABEL[verdict];

  return (
    <Box flexDirection="column">
      <FrameTop
        title={
          <>
            <Text color={probeTokens.amber} bold>PROBE</Text>
            <Text color={probeTokens.ink3}> › </Text>
            <Text color={probeTokens.ink}>review</Text>
            <Text color={probeTokens.ink3}> · ARR-style peer review</Text>
          </>
        }
        rightLabel="stage 7 · review"
        width={width}
      />
      <FrameBlank width={width} />

      {/* Loading state */}
      {running && (
        <FrameRow width={width}>
          <Text>
            {'  '}
            <Text color={probeTokens.cyan}>~ </Text>
            <Text color={probeTokens.ink3}>convening review panel — claude-sonnet-4-5 · planning › reading paper › drafting reviews › verifying</Text>
            {fill(' ', Math.max(0, innerW - 110))}
          </Text>
        </FrameRow>
      )}

      {!running && session && (
        <>
          {/* Verdict header */}
          <FrameRow width={width}>
            <Text>
              {'  '}
              <Text color={probeTokens.ink3}>VERDICT</Text>
              <Text>  </Text>
              <Text color={v.color} bold>{v.glyph} {v.label}</Text>
              <Text color={probeTokens.ink3}>     </Text>
              <Text color={probeTokens.ink2}>paper · </Text>
              <Text color={probeTokens.ink}>{trim(session.paperTitle, innerW - 50)}</Text>
              {fill(' ', Math.max(0, innerW - 50 - Math.min(session.paperTitle.length, innerW - 50)))}
            </Text>
          </FrameRow>
          <FrameBlank width={width} />

          {/* Meta-review (1AC) */}
          <FrameRow width={width}>
            <Text>
              {'  '}
              <Text color={cursor === 0 ? probeTokens.amber : probeTokens.ink3}>{cursor === 0 ? '▸' : ' '}</Text>
              {' '}
              <Text color={probeTokens.amber}>{expanded === 'AC' ? '▾' : '▸'}</Text>
              {' '}
              {cursor === 0 ? (
                <Text backgroundColor={probeTokens.amberSoft} color={probeTokens.amber} bold>
                  {' meta-review · 1AC '}
                </Text>
              ) : (
                <Text color={probeTokens.ink} bold>meta-review · 1AC</Text>
              )}
              <Text color={probeTokens.ink3}>  ·  verdict: </Text>
              <Text color={v.color}>{v.label}</Text>
              {fill(' ', Math.max(0, innerW - 50 - v.label.length))}
            </Text>
          </FrameRow>

          {expanded === 'AC' && (
            <>
              <FrameBlank width={width} />
              {wrap(session.meta.summary, innerW - 6, 8).map((line, i) => (
                <FrameRow width={width} key={`m-${i}`}>
                  <Text>{'      '}<Text color={probeTokens.ink}>{line.padEnd(innerW - 6, ' ').slice(0, innerW - 6)}</Text></Text>
                </FrameRow>
              ))}
              <FrameBlank width={width} />
              <FrameRow width={width}>
                <Text>{'      '}<Text color={probeTokens.amber}>› proposed:</Text>{fill(' ', Math.max(0, innerW - 17))}</Text>
              </FrameRow>
              {wrap(session.meta.proposed, innerW - 8, 6).map((line, i) => (
                <FrameRow width={width} key={`p-${i}`}>
                  <Text>{'        '}<Text color={probeTokens.ink}>{line.padEnd(innerW - 8, ' ').slice(0, innerW - 8)}</Text></Text>
                </FrameRow>
              ))}
              <FrameBlank width={width} />
              <FrameRow width={width}>
                <Text>{'      '}<Text color={probeTokens.ink3}>consensus points</Text>{fill(' ', Math.max(0, innerW - 23))}</Text>
              </FrameRow>
              {session.meta.consensusPoints.map((c, i) => {
                const tagColor = c.priority === 'high' ? probeTokens.rose : c.priority === 'medium' ? probeTokens.amber : probeTokens.ink3;
                return (
                  <FrameRow width={width} key={`c-${i}`}>
                    <Text>
                      {'        '}
                      <Text color={tagColor}>[{c.tag}]</Text>
                      {' '}
                      <Text color={probeTokens.ink2}>{trim(c.text, innerW - 22)}</Text>
                      {fill(' ', Math.max(0, innerW - 22 - Math.min(c.text.length, innerW - 22)))}
                    </Text>
                  </FrameRow>
                );
              })}
            </>
          )}
          <FrameBlank width={width} />

          {/* Reviewers */}
          <FrameRow width={width}>
            <Text>
              {'  '}
              <Text color={probeTokens.ink3}>reviewers · {session.reviewers.length} </Text>
              <Text color={probeTokens.ink3}>{fill('─', Math.max(0, innerW - 18))}</Text>
            </Text>
          </FrameRow>

          {session.reviewers.map((r, i) => {
            const isCursor = cursor === i + 1;
            const isOpen = expanded === r.id;
            const rec = REC_LABEL[r.rec];
            return (
              <React.Fragment key={r.id}>
                <FrameRow width={width}>
                  <Text>
                    {'  '}
                    <Text color={isCursor ? probeTokens.amber : probeTokens.ink3}>{isCursor ? '▸' : ' '}</Text>
                    {' '}
                    <Text color={probeTokens.amber}>{isOpen ? '▾' : '▸'}</Text>
                    {' '}
                    {isCursor ? (
                      <Text backgroundColor={probeTokens.amberSoft} color={probeTokens.amber} bold>
                        {' '}{r.id}{' '}
                      </Text>
                    ) : (
                      <Text color={probeTokens.ink} bold>{r.id}</Text>
                    )}
                    <Text color={probeTokens.ink3}>  </Text>
                    <Text color={rec.color}>{r.rec.padEnd(3, ' ')}</Text>
                    <Text color={probeTokens.ink3}>  conf </Text>
                    <Text color={probeTokens.ink}>{r.confidence}</Text>
                    <Text color={probeTokens.ink3}>  expertise {r.expertise}/5</Text>
                    <Text color={probeTokens.ink3}>  </Text>
                    <Text color={probeTokens.ink2}>{trim(r.oneLine, innerW - 60)}</Text>
                    {fill(' ', Math.max(0, innerW - 60 - Math.min(r.oneLine.length, innerW - 60)))}
                  </Text>
                </FrameRow>
                {isOpen && (
                  <>
                    <FrameRow width={width}>
                      <Text>{'        '}<Text color={probeTokens.moss}>strengths</Text>{fill(' ', Math.max(0, innerW - 20))}</Text>
                    </FrameRow>
                    {r.strengths.map((s, j) => (
                      <FrameRow width={width} key={`s-${j}`}>
                        <Text>{'          '}<Text color={probeTokens.ink2}>· {trim(s, innerW - 16)}</Text>{fill(' ', Math.max(0, innerW - 14 - Math.min(s.length, innerW - 16)))}</Text>
                      </FrameRow>
                    ))}
                    <FrameRow width={width}>
                      <Text>{'        '}<Text color={probeTokens.amber}>weaknesses</Text>{fill(' ', Math.max(0, innerW - 21))}</Text>
                    </FrameRow>
                    {r.weaknesses.map((w, j) => (
                      <FrameRow width={width} key={`w-${j}`}>
                        <Text>{'          '}<Text color={probeTokens.ink2}>· {trim(w, innerW - 16)}</Text>{fill(' ', Math.max(0, innerW - 14 - Math.min(w.length, innerW - 16)))}</Text>
                      </FrameRow>
                    ))}
                    <FrameRow width={width}>
                      <Text>{'        '}<Text color={probeTokens.cyan}>to authors</Text>{fill(' ', Math.max(0, innerW - 21))}</Text>
                    </FrameRow>
                    {wrap(r.toAuthors, innerW - 12, 6).map((line, j) => (
                      <FrameRow width={width} key={`a-${j}`}>
                        <Text>{'          '}<Text color={probeTokens.ink}>{line.padEnd(innerW - 12, ' ').slice(0, innerW - 12)}</Text></Text>
                      </FrameRow>
                    ))}
                    <FrameRow width={width}>
                      <Text>{'        '}<Text color={probeTokens.ink3}>to chairs</Text>{fill(' ', Math.max(0, innerW - 20))}</Text>
                    </FrameRow>
                    {wrap(r.toChairs, innerW - 12, 4).map((line, j) => (
                      <FrameRow width={width} key={`tc-${j}`}>
                        <Text>{'          '}<Text color={probeTokens.ink2}>{line.padEnd(innerW - 12, ' ').slice(0, innerW - 12)}</Text></Text>
                      </FrameRow>
                    ))}
                    <FrameBlank width={width} />
                  </>
                )}
              </React.Fragment>
            );
          })}
        </>
      )}

      <FrameBlank width={width} />
      <FrameBottom width={width} />

      <StatusBar
        mode="NORMAL"
        context={`review   j/k · move    enter · expand    r · re-run    n · continue → done    esc · back`}
        rightLabel={running ? 'convening…' : `verdict · ${v.label}`}
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

function wrap(text: string, lineW: number, maxLines: number): string[] {
  const words = (text || '').split(/\s+/).filter(Boolean);
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
