/**
 * TUI shell — reusable Ink components matching the Probe design system
 * (Probe (TUI).html). The outer box is a rounded frame with a custom
 * title in the top edge and a bottom status bar. Vertical rules can run
 * between the rail and main pane.
 *
 * The design renders as <pre>-style rows; each scene composes <Row>
 * elements (one per visual line) with inline colored spans. We mimic
 * that exactly with Ink's nested <Text>: each line is one <Text>, with
 * <Text> children for the colored spans.
 *
 * Color tokens come from src/ui/probe_tokens.ts. The status semantics
 * (moss/amber/cyan/rose/ink3) are not negotiable — both surfaces share
 * them.
 */

import React from 'react';
import { Box, Text, useStdout } from 'ink';
import { probeTokens } from './probe_tokens.js';

/** Terminal width fallback when stdout doesn't expose columns. */
const FALLBACK_COLS = 110;

export function useTermWidth(): number {
  const { stdout } = useStdout();
  const cols = stdout?.columns ?? FALLBACK_COLS;
  // Fill the whole terminal — the frame should always reach the right
  // edge so the rails read as a contiguous box rather than a window
  // floating on a black background.
  return Math.max(80, cols);
}

interface FrameHeaderProps {
  /** First half: e.g. "PROBE · config" or "PROBE › focus-rituals" */
  title: React.ReactNode;
  /** Right-side annotation, e.g. "first-run setup" or "deadline May 12 · 32d left" */
  rightLabel?: React.ReactNode;
  width: number;
}

/** Top edge: ┌─ <title> ─…─ <rightLabel> ─┐ */
export function FrameTop({ title, rightLabel, width: _width }: FrameHeaderProps): React.ReactElement {
  const width = _width;
  // Compute fill width. We render a text-only row, padding with ─.
  // The rightLabel sits flush against the closing corner with a trailing ─.
  const left = ' '; // visual gap after ┌─
  const right = rightLabel ? `${rightLabel} ` : '';
  return (
    <Text color={probeTokens.rule}>
      ┌─{left}
      <Text>{title}</Text>
      {' '}
      {fill('─', Math.max(2, width - approxLen(title) - approxLen(right) - 6))}
      {' '}
      {rightLabel && <Text color={probeTokens.ink3}>{right}</Text>}
      ─┐
    </Text>
  );
}

export function FrameBottom({ width }: { width: number }): React.ReactElement {
  return <Text color={probeTokens.rule}>└{fill('─', width - 2)}┘</Text>;
}

/** A vertical-rail content row: │ <content> │.
 *  width is accepted for API symmetry with FrameTop/FrameBottom but the
 *  row itself doesn't enforce it — child rows pad to width manually. */
export function FrameRow({ children, width: _width }: { children: React.ReactNode; width: number }): React.ReactElement {
  return (
    <Text>
      <Text color={probeTokens.rule}>│</Text>
      {children}
      <Text color={probeTokens.rule}>│</Text>
    </Text>
  );
}

/** Empty interior row (just the rails). */
export function FrameBlank({ width }: { width: number }): React.ReactElement {
  return (
    <FrameRow width={width}>
      <Text>{fill(' ', width - 2)}</Text>
    </FrameRow>
  );
}

/**
 * StatusBar — full-width inverse-amber pill on the left, then dim text,
 * then right-aligned counters or keymap. Always the bottom row.
 */
export interface StatusBarProps {
  mode?: 'NORMAL' | 'INSERT' | 'COMMAND';
  context?: React.ReactNode;
  rightLabel?: React.ReactNode;
  width: number;
}

export function StatusBar({ mode = 'NORMAL', context, rightLabel, width }: StatusBarProps): React.ReactElement {
  const modeText = ` ${mode} `;
  // Fill the middle so the right label hugs the right edge.
  const ctx = context ? ` ${typeof context === 'string' ? context : ''}` : '';
  const fillWidth = Math.max(0, width - modeText.length - approxLen(context) - approxLen(rightLabel) - 4);
  return (
    <Text>
      <Text backgroundColor={probeTokens.amber} color={probeTokens.bg} bold>
        {modeText}
      </Text>
      <Text backgroundColor="#1a2029" color={probeTokens.ink2}>
        {ctx}
        {fill(' ', fillWidth)}
        {' '}
        {rightLabel ? (typeof rightLabel === 'string' ? rightLabel : <>{rightLabel}</>) : ''}
        {' '}
      </Text>
    </Text>
  );
}

/** A status pip — colored glyph + optional label. */
export function StatusPip({
  status,
  label,
}: {
  status: 'fresh' | 'stale' | 'running' | 'queued';
  label?: string;
}): React.ReactElement {
  const map = {
    fresh:   { color: probeTokens.moss,  glyph: '●' },
    stale:   { color: probeTokens.amber, glyph: '●' },
    running: { color: probeTokens.cyan,  glyph: '●' },
    queued:  { color: probeTokens.ink3,  glyph: '○' },
  } as const;
  const m = map[status];
  return (
    <Text>
      <Text color={m.color}>{m.glyph}</Text>
      {label ? <Text color={probeTokens.ink2}> {label}</Text> : null}
    </Text>
  );
}

/** A single hotkey badge: [k] amber on bg2. */
export function HotKey({ k }: { k: string }): React.ReactElement {
  return <Text color={probeTokens.amber}>[{k}]</Text>;
}

/** Selected row using inverse video on amber. */
export function SelectedRow({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <Text backgroundColor={probeTokens.amber} color={probeTokens.bg} bold>
      {children}
    </Text>
  );
}

/** Soft-selected row using 18% amber wash + leading ▸. */
export function SoftSelectedRow({ children }: { children: React.ReactNode }): React.ReactElement {
  return <Text color={probeTokens.amber}>{children}</Text>;
}

/* ── helpers ─────────────────────────────────────────────────────── */

export function fill(ch: string, n: number): string {
  if (n <= 0) return '';
  return ch.repeat(n);
}

/** Approximate length of a React node for layout math. Strings only — for
 *  React elements we walk one level (good enough for the rows we render). */
export function approxLen(node: React.ReactNode): number {
  if (node == null || node === false) return 0;
  if (typeof node === 'string' || typeof node === 'number') return String(node).length;
  if (Array.isArray(node)) return node.reduce<number>((sum, n) => sum + approxLen(n), 0);
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    return approxLen(props.children);
  }
  return 0;
}

/** A horizontal rule line, dim. */
export function HRule({ width, char = '─' }: { width: number; char?: string }): React.ReactElement {
  return <Text color={probeTokens.ink3}>{fill(char, width)}</Text>;
}

/** Pad a string to a target visual length (truncate if needed). */
export function padTo(s: string, n: number): string {
  if (s.length >= n) return s.slice(0, n);
  return s + ' '.repeat(n - s.length);
}

/** Layout container — the term frame. Children are rows. */
export function TermFrame({ children, marginX = 1 }: { children: React.ReactNode; marginX?: number }): React.ReactElement {
  return (
    <Box flexDirection="column" paddingX={marginX}>
      {children}
    </Box>
  );
}
