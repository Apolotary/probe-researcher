/**
 * Premise scene — "What do you want to research?". Centered text
 * input with a placeholder and a `›` prompt marker. The user types,
 * hits Enter, and we move to brainstorm with the premise stored in
 * shared state.
 *
 * UX detail: the textbox is the default focus target. Pressing Tab
 * switches to BROWSE mode where j/k highlights an example and Enter
 * fills the textbox + returns to typing. Tab/Esc returns to typing
 * without picking. This avoids the previous bug where 1/2/3 in the
 * textbox would type a digit instead of picking an example.
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { probeTokens } from '../../ui/probe_tokens.js';
import { StatusBar, useTermWidth, fill } from '../../ui/tui_frame.js';
import type { SceneProps } from '../ui_app.js';

const EXAMPLES = [
  'How do remote workers stay focused during long video-call days?',
  'Can short visual cues help dyslexic readers skim long documents?',
  'What makes AI-pair-programming feel collaborative vs. supervisory?',
];

type Mode = 'typing' | 'browsing';

export function PremiseScene({ goto, exit, state, setState }: SceneProps): React.ReactElement {
  const width = useTermWidth();
  const [draft, setDraft] = useState(state.premise);
  const [mode, setMode] = useState<Mode>('typing');
  const [browseIdx, setBrowseIdx] = useState(0);

  // useInput is always active. We only do work in the BROWSING mode
  // here — the TextInput consumes its own keys when focused.
  useInput((input, key) => {
    if (mode === 'browsing') {
      if (key.escape || key.tab) {
        setMode('typing');
        return;
      }
      if (key.upArrow || input === 'k') {
        setBrowseIdx((i) => Math.max(0, i - 1));
        return;
      }
      if (key.downArrow || input === 'j') {
        setBrowseIdx((i) => Math.min(EXAMPLES.length - 1, i + 1));
        return;
      }
      if (input >= '1' && input <= String(EXAMPLES.length)) {
        // Direct pick by number works in browsing mode where it
        // doesn't conflict with the textbox.
        const idx = parseInt(input, 10) - 1;
        setDraft(EXAMPLES[idx]);
        setBrowseIdx(idx);
        setMode('typing');
        return;
      }
      if (key.return) {
        setDraft(EXAMPLES[browseIdx]);
        setMode('typing');
        return;
      }
      return;
    }
    // typing mode — global hotkeys only. Esc returns to launcher.
    // Tab switches to browse mode.
    if (key.tab) {
      setMode('browsing');
      return;
    }
    if (key.escape) {
      goto('startup');
    } else if (key.ctrl && input === 'c') {
      exit();
    }
  });

  function commit(value: string): void {
    const trimmed = value.trim();
    if (!trimmed) return; // empty Enter does nothing
    // Save the premise + clear downstream state. Brainstorm scene
    // fires the LLM call when it mounts.
    setState((s) => ({
      ...s,
      premise: trimmed,
      rqs: [],
      selectedRqLetters: [],
      rqNotes: {},
      literature: [],
      candidates: [],
      chosenDesignId: null,
      plan: null,
      artifacts: [],
      personas: [],
      findings: [],
      paperTitle: '',
      discussion: '',
      conclusion: '',
    }));
    goto('brainstorm');
  }

  const inputBoxWidth = Math.min(width - 8, 100);

  return (
    <Box flexDirection="column">
      <Text> </Text><Text> </Text>
      <CenterText width={width}>
        <Text color={probeTokens.ink3}>── </Text>
        <Text color={probeTokens.amber} bold>probe</Text>
        <Text color={probeTokens.ink3}> · new project ──</Text>
      </CenterText>
      <Text> </Text>
      <Text> </Text>
      <CenterText width={width}>
        <Text color={probeTokens.ink} bold>What do you want to research?</Text>
      </CenterText>
      <Text> </Text>
      <CenterText width={width}>
        <Text color={probeTokens.ink3}>One sentence. The interrogator picks it up from there.</Text>
      </CenterText>
      <Text> </Text>
      <Text> </Text>

      {/* input box — rounded rule with a › prompt and the text input */}
      <CenterBlock width={width} blockWidth={inputBoxWidth}>
        <Text color={mode === 'typing' ? probeTokens.amber : probeTokens.ink3}>
          ┌{fill('─', inputBoxWidth - 2)}┐
        </Text>
        <Text>
          <Text color={mode === 'typing' ? probeTokens.amber : probeTokens.ink3}>│ </Text>
          <Text color={probeTokens.amber}>›</Text>
          <Text> </Text>
          <TextInput
            value={draft}
            onChange={setDraft}
            onSubmit={commit}
            focus={mode === 'typing'}
            placeholder="How do remote workers stay focused during long video-call days?"
          />
          <Text color={mode === 'typing' ? probeTokens.amber : probeTokens.ink3}>{` │`}</Text>
        </Text>
        <Text color={mode === 'typing' ? probeTokens.amber : probeTokens.ink3}>
          └{fill('─', inputBoxWidth - 2)}┘
        </Text>
      </CenterBlock>

      <Text> </Text>

      {/* word + char count, hint */}
      <CenterText width={width}>
        <Text color={probeTokens.ink3}>
          {wordCount(draft)} words · {draft.length} chars · {mode === 'typing' ? 'enter · confirm    tab · examples    esc · back' : 'j/k · pick    enter · use    tab/esc · cancel'}
        </Text>
      </CenterText>
      <Text> </Text>
      <Text> </Text>

      {/* example list — highlighted in browse mode */}
      <CenterText width={width}>
        <Text color={mode === 'browsing' ? probeTokens.amber : probeTokens.ink3}>
          {mode === 'browsing' ? '▸ pick an example (j/k + enter):' : 'or pick an example — press tab to browse:'}
        </Text>
      </CenterText>
      <Text> </Text>
      {EXAMPLES.map((ex, i) => {
        const isCursor = mode === 'browsing' && i === browseIdx;
        return (
          <CenterText key={i} width={width}>
            <Text color={probeTokens.amber}>[{i + 1}]</Text>
            <Text>  </Text>
            {isCursor ? (
              <Text backgroundColor={probeTokens.amberSoft} color={probeTokens.amber} bold>
                {' '}{ex}{' '}
              </Text>
            ) : (
              <Text color={probeTokens.ink2}>{ex}</Text>
            )}
          </CenterText>
        );
      })}

      <Text> </Text>
      <Text> </Text>

      <StatusBar
        mode={mode === 'typing' ? 'INSERT' : 'NORMAL'}
        context={mode === 'typing' ? 'new project · type your question — tab to browse examples' : 'browse examples · j/k to move, enter to pick, tab/esc to cancel'}
        rightLabel={mode === 'typing' ? 'enter · confirm' : 'enter · use'}
        width={width}
      />
    </Box>
  );
}

function wordCount(s: string): number {
  const t = s.trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

function CenterText({ width, children }: { width: number; children: React.ReactNode }): React.ReactElement {
  const pad = ' '.repeat(Math.max(0, Math.floor((width - 60) / 2)));
  return <Text>{pad}{children}</Text>;
}

function CenterBlock({
  width,
  blockWidth,
  children,
}: {
  width: number;
  blockWidth: number;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <Box flexDirection="column" paddingLeft={Math.max(0, Math.floor((width - blockWidth) / 2))}>
      {children}
    </Box>
  );
}
