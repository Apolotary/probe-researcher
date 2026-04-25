/**
 * Probe UI — interactive workflow router. Carries state across stages
 * (premise → brainstorm → literature → methodology → artifacts →
 * evaluation → report → done) so each stage can reach back into
 * earlier choices.
 *
 * The legacy startup/welcome/project/config scenes are kept as
 * sub-flows reachable from the launcher menu.
 *
 * For the workflow content (synthesized RQs, literature, etc.) we use
 * canned templates that incorporate the user's typed premise. This
 * gives the live-feel of working through the pipeline without
 * requiring an API key in this build. Hooking in a real LLM is a
 * matter of replacing src/cli/ui_state.ts → makeBrainstorm() etc.
 * with real calls.
 */

import React, { useState } from 'react';
import { Box, useApp, render } from 'ink';
import { StartupScene } from './ui_scenes/startup.js';
import { WelcomeScene } from './ui_scenes/welcome.js';
import { PremiseScene } from './ui_scenes/premise.js';
import { BrainstormScene } from './ui_scenes/brainstorm.js';
import { LiteratureScene } from './ui_scenes/literature.js';
import { MethodologyScene } from './ui_scenes/methodology.js';
import { ArtifactsScene } from './ui_scenes/artifacts.js';
import { EvaluationScene } from './ui_scenes/evaluation.js';
import { ReportScene } from './ui_scenes/report.js';
import { ReviewScene } from './ui_scenes/review.js';
import { DoneScene } from './ui_scenes/done.js';
import { ProjectScene } from './ui_scenes/project.js';
import { ConfigScene } from './ui_scenes/config.js';
import { configExists } from '../config/probe_toml.js';
import {
  EMPTY_STATE,
  type ProbeWorkflowState,
} from './ui_state.js';

export type SceneId =
  | 'startup'
  | 'welcome'
  | 'premise'      // "What do you want to research?"
  | 'brainstorm'   // 3 sub-RQs from Main RQ
  | 'literature'   // state of the art / similar / gaps / notes
  | 'methodology'  // 5 integrated designs
  | 'artifacts'    // adaptive artifact list
  | 'evaluation'   // simulated participants + findings
  | 'report'       // discussion + conclusion + export
  | 'review'       // ARR-style peer review (1AC + 3 reviewers)
  | 'done'
  | 'project'
  | 'config'
  // Backwards-compat alias for the old --scene name
  | 'new';

/** Props every scene receives. */
export interface SceneProps {
  goto: (scene: SceneId) => void;
  exit: () => void;
  state: ProbeWorkflowState;
  setState: React.Dispatch<React.SetStateAction<ProbeWorkflowState>>;
}

interface AppProps {
  initialScene: SceneId;
}

function ProbeUIApp({ initialScene }: AppProps): React.ReactElement {
  const { exit } = useApp();
  const [scene, setScene] = useState<SceneId>(initialScene === 'new' ? 'premise' : initialScene);
  const [state, setState] = useState<ProbeWorkflowState>(EMPTY_STATE);

  const props: SceneProps = {
    goto: setScene,
    exit: () => exit(),
    state,
    setState,
  };

  return (
    <Box flexDirection="column">
      {scene === 'startup'     && <StartupScene {...props} />}
      {scene === 'welcome'     && <WelcomeScene {...props} />}
      {scene === 'premise'     && <PremiseScene {...props} />}
      {scene === 'brainstorm'  && <BrainstormScene {...props} />}
      {scene === 'literature'  && <LiteratureScene {...props} />}
      {scene === 'methodology' && <MethodologyScene {...props} />}
      {scene === 'artifacts'   && <ArtifactsScene {...props} />}
      {scene === 'evaluation'  && <EvaluationScene {...props} />}
      {scene === 'report'      && <ReportScene {...props} />}
      {scene === 'review'      && <ReviewScene {...props} />}
      {scene === 'done'        && <DoneScene {...props} />}
      {scene === 'project'     && <ProjectScene {...props} />}
      {scene === 'config'      && <ConfigScene {...props} />}
    </Box>
  );
}

export interface UICommandOptions {
  scene?: string;
  web?: boolean;
  port?: string;
  host?: string;
  open?: boolean;
}

const VALID_SCENES: SceneId[] = [
  'startup', 'welcome', 'premise', 'brainstorm', 'literature',
  'methodology', 'artifacts', 'evaluation', 'report', 'review', 'done',
  'project', 'config', 'new',
];

function pickInitialScene(opt?: UICommandOptions): SceneId {
  const requested = (opt?.scene as SceneId | undefined) ?? undefined;
  if (requested && VALID_SCENES.includes(requested)) {
    return requested;
  }
  // Both surfaces start at the LazyVim-style launcher. The legacy
  // welcome screen is still reachable via `probe ui --scene welcome`
  // (or via the launcher menu in a future iteration). configExists()
  // is no longer consulted because the launcher is the canonical
  // first screen regardless of first-run state.
  void configExists; // keep the import alive
  return 'startup';
}

export async function uiCommand(opts: UICommandOptions): Promise<void> {
  // --web routes to the HTML companion.
  if (opts.web) {
    const { startWebServer } = await import('../web/server.js');
    const port = opts.port ? parseInt(opts.port, 10) : 4470;
    void startWebServer({
      port: Number.isFinite(port) ? port : 4470,
      host: opts.host ?? '127.0.0.1',
      open: false,
    });
    // Give the listener a tick to bind, then open /ui.
    await new Promise((resolve) => setTimeout(resolve, 250));
    const url = `http://${opts.host ?? '127.0.0.1'}:${Number.isFinite(port) ? port : 4470}/ui`;
    if (opts.open !== false) {
      const { spawn } = await import('node:child_process');
      const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
      try {
        spawn(cmd, [url], { detached: true, stdio: 'ignore' }).unref();
      } catch {
        /* user can click the printed URL */
      }
    }
    // Keep the process alive — the server's never-resolving promise
    // already does this, but we're not awaiting it.
    await new Promise(() => { /* noop */ });
    return;
  }

  const initial = pickInitialScene(opts);
  const instance = render(<ProbeUIApp initialScene={initial} />);
  try {
    await instance.waitUntilExit();
  } catch {
    /* ignore */
  }
  if (process.stdin.isTTY) {
    try { process.stdin.setRawMode(false); } catch { /* already off */ }
  }
}
