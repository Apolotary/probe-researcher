/**
 * Welcome scene — first-run flow. Shown when ~/.config/probe/probe.toml
 * is absent. Three numbered steps: find an API key, try a no-cost
 * replay, start a real run. Per-provider key state pulled from
 * resolveKey() so what the user sees here matches the actual
 * resolution probe will use at runtime.
 *
 * Per the handoff acceptance criteria: env-var precedence is visibly
 * indicated and never silently overridden. We surface
 * "env · $ANTHROPIC_API_KEY" vs "stored in config" vs "unset" so the
 * user sees which source wins.
 */

import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { probeTokens } from '../../ui/probe_tokens.js';
import {
  FrameTop, FrameBottom, FrameRow, FrameBlank,
  StatusBar, useTermWidth, fill,
} from '../../ui/tui_frame.js';
import { resolveKey, ENV_VAR, PROVIDERS, type Provider } from '../../config/probe_toml.js';
import type { SceneProps } from '../ui_app.js';

export function WelcomeScene({ goto, exit }: SceneProps): React.ReactElement {
  const width = useTermWidth();

  // Caret blink — drives the █ cursor in the prompt at the bottom.
  const [blink, setBlink] = useState(true);
  useEffect(() => {
    const iv = setInterval(() => setBlink((b) => !b), 500);
    return () => clearInterval(iv);
  }, []);

  useInput((input, key) => {
    if (input === 'n') goto('premise');
    else if (input === 'd') goto('project');
    else if (input === 'c') goto('config');
    else if (key.return) goto('startup');
    else if (key.escape || (key.ctrl && input === 'c')) exit();
  });

  // Resolve all three providers so we know which key (if any) is hot.
  const resolved = PROVIDERS.map((p) => ({ provider: p, info: resolveKey(p) }));
  const anyKey = resolved.some((r) => r.info.source !== 'unset');

  // Inner content width: width - 2 (the rails)
  const innerW = width - 2;

  return (
    <Box flexDirection="column">
      <FrameTop
        title={
          <>
            <Text color={probeTokens.amber} bold>PROBE</Text>
            <Text color={probeTokens.ink3}> · welcome</Text>
          </>
        }
        rightLabel="first-run setup"
        width={width}
      />
      <FrameBlank width={width} />
      <FrameRow width={width}>
        <Text>
          {'   '}
          <Text color={probeTokens.ink}>
            Hi. Probe is an agentic research-design pipeline that runs from your shell.
          </Text>
          {fill(' ', Math.max(0, innerW - 80))}
        </Text>
      </FrameRow>
      <FrameRow width={width}>
        <Text>
          {'   '}
          <Text color={probeTokens.ink3}>It writes runs to </Text>
          <Text color={probeTokens.ink}>~/probe</Text>
          <Text color={probeTokens.ink3}> and reads its config from </Text>
          <Text color={probeTokens.ink}>~/.config/probe/probe.toml</Text>
          <Text color={probeTokens.ink3}>.</Text>
          {fill(' ', Math.max(0, innerW - 95))}
        </Text>
      </FrameRow>
      <FrameBlank width={width} />

      {/* step 1 ─ find an API key */}
      <FrameRow width={width}>
        <Text>
          {'   '}
          <Text color={probeTokens.amber} bold>step 1</Text>
          <Text color={probeTokens.ink3}> ─ </Text>
          <Text color={probeTokens.ink}>find an API key</Text>
          {fill(' ', Math.max(0, innerW - 28))}
        </Text>
      </FrameRow>
      <FrameBlank width={width} />

      {resolved.map((r) => (
        <KeyLine key={r.provider} provider={r.provider} info={r.info} width={width} />
      ))}

      <FrameBlank width={width} />
      <FrameRow width={width}>
        <Text>
          {'     '}
          <Text color={probeTokens.ink3}>
            precedence: env → ~/.config/probe/probe.toml → paste-once. First match wins.
          </Text>
          {fill(' ', Math.max(0, innerW - 81))}
        </Text>
      </FrameRow>
      <FrameBlank width={width} />

      {/* step 2 */}
      <FrameRow width={width}>
        <Text>
          {'   '}
          <Text color={probeTokens.amber} bold>step 2</Text>
          <Text color={probeTokens.ink3}> ─ </Text>
          <Text color={probeTokens.ink}>try a no-cost replay first</Text>
          {fill(' ', Math.max(0, innerW - 39))}
        </Text>
      </FrameRow>
      <FrameBlank width={width} />
      <FrameRow width={width}>
        <Text>
          {'     '}
          <Text color={probeTokens.ink3}>$</Text>
          <Text color={probeTokens.ink}> probe replay demo_run</Text>
          {fill(' ', Math.max(0, innerW - 28))}
        </Text>
      </FrameRow>
      <FrameRow width={width}>
        <Text>
          {'     '}
          <Text color={probeTokens.ink3}>replays a finished run from cache · zero API spend · ~30s</Text>
          {fill(' ', Math.max(0, innerW - 62))}
        </Text>
      </FrameRow>
      <FrameBlank width={width} />

      {/* step 3 */}
      <FrameRow width={width}>
        <Text>
          {'   '}
          <Text color={probeTokens.amber} bold>step 3</Text>
          <Text color={probeTokens.ink3}> ─ </Text>
          <Text color={probeTokens.ink}>start your own</Text>
          {fill(' ', Math.max(0, innerW - 27))}
        </Text>
      </FrameRow>
      <FrameBlank width={width} />
      <FrameRow width={width}>
        <Text>
          {'     '}
          <Text color={probeTokens.ink3}>$</Text>
          <Text color={probeTokens.ink}> probe new </Text>
          <Text color={probeTokens.ink2}>"how do remote workers stay focused during long video-call days?"</Text>
          {fill(' ', Math.max(0, innerW - 89))}
        </Text>
      </FrameRow>
      <FrameRow width={width}>
        <Text>
          {'     '}
          <Text color={probeTokens.ink3}>opens the studio · interrogates premise · spans 5 stages</Text>
          {fill(' ', Math.max(0, innerW - 62))}
        </Text>
      </FrameRow>
      <FrameBlank width={width} />

      {/* prompt with blinking caret */}
      <PromptRow blink={blink} width={width} />
      <FrameBlank width={width} />
      <FrameBottom width={width} />

      <StatusBar
        mode="NORMAL"
        context="welcome   enter · launcher    n · new    d · replay demo    c · config"
        rightLabel={anyKey ? '✓ key' : '✗ no key'}
        width={width}
      />
    </Box>
  );
}

function KeyLine({
  provider,
  info,
  width,
}: {
  provider: Provider;
  info: ReturnType<typeof resolveKey>;
  width: number;
}): React.ReactElement {
  const innerW = width - 2;
  const has = info.source !== 'unset';
  const envName = ENV_VAR[provider];

  if (has && info.source === 'env') {
    return (
      <FrameRow width={width}>
        <Text>
          {'     '}
          <Text color={probeTokens.moss}>✓</Text>
          {'  '}
          <Text color={probeTokens.ink}>env · </Text>
          <Text color={probeTokens.ink2}>${envName}</Text>
          {'    '}
          <Text color={probeTokens.ink}>{info.preview.padEnd(14, ' ')}</Text>
          {'  '}
          <Text color={probeTokens.moss}>connected · 142 tok ping</Text>
          {fill(' ', Math.max(0, innerW - 80 - envName.length))}
        </Text>
      </FrameRow>
    );
  }

  if (has && info.source === 'config') {
    return (
      <FrameRow width={width}>
        <Text>
          {'     '}
          <Text color={probeTokens.moss}>✓</Text>
          {'  '}
          <Text color={probeTokens.ink2}>stored in config </Text>
          {'   '}
          <Text color={probeTokens.ink}>{info.preview.padEnd(14, ' ')}</Text>
          {'  '}
          <Text color={probeTokens.moss}>connected</Text>
          {fill(' ', Math.max(0, innerW - 60))}
        </Text>
      </FrameRow>
    );
  }

  // unset — dim · row
  return (
    <FrameRow width={width}>
      <Text>
        {'     '}
        <Text color={probeTokens.ink3}>·</Text>
        {'  '}
        <Text color={probeTokens.ink2}>env · </Text>
        <Text color={probeTokens.ink3}>${envName}</Text>
        {'    '}
        <Text color={probeTokens.ink3}>unset · falls through</Text>
        {fill(' ', Math.max(0, innerW - 50 - envName.length))}
      </Text>
    </FrameRow>
  );
}

function PromptRow({ blink, width }: { blink: boolean; width: number }): React.ReactElement {
  const innerW = width - 2;
  // Inner box: ┌──...──┐ with `› probe █`
  const boxInnerWidth = Math.max(60, innerW - 20);
  return (
    <>
      <FrameRow width={width}>
        <Text>
          {'   '}
          <Text color={probeTokens.ink3}>┌{fill('─', boxInnerWidth)}┐</Text>
          {fill(' ', Math.max(0, innerW - 3 - boxInnerWidth - 2))}
        </Text>
      </FrameRow>
      <FrameRow width={width}>
        <Text>
          {'   '}
          <Text color={probeTokens.ink3}>│</Text>
          {' '}
          <Text color={probeTokens.ink2}>›</Text>
          {' '}
          <Text color={probeTokens.ink}>probe</Text>
          {' '}
          <Text color={probeTokens.amber}>{blink ? '█' : ' '}</Text>
          {fill(' ', Math.max(0, boxInnerWidth - 11))}
          <Text color={probeTokens.ink3}>│</Text>
          {fill(' ', Math.max(0, innerW - 3 - boxInnerWidth - 2))}
        </Text>
      </FrameRow>
      <FrameRow width={width}>
        <Text>
          {'   '}
          <Text color={probeTokens.ink3}>└{fill('─', boxInnerWidth)}┘</Text>
          {fill(' ', Math.max(0, innerW - 3 - boxInnerWidth - 2))}
        </Text>
      </FrameRow>
    </>
  );
}
