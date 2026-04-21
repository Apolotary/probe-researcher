/**
 * Simulated user interview — v2 feature using Claude Managed Agents.
 *
 * The guidebook's Study Protocol section describes the interview script. A
 * researcher who wants to *rehearse* their script before recruiting real
 * participants spawns a simulated participant via:
 *
 *     probe interview <run_id>
 *
 * Session lifecycle is managed through withManagedSession so the cloud
 * container is cleaned up on exit (including Ctrl-C-induced unhandled
 * rejections propagated through readline).
 *
 * Epistemic commitment: every agent turn carries [SIMULATION_REHEARSAL] in
 * the transcript. The forbidden-phrase linter rejects the transcript if any
 * evidence language appears.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';
import chalk from 'chalk';
import Anthropic from '@anthropic-ai/sdk';
import { agentPromptPath, runDir } from '../util/paths.js';
import { palette, brand } from '../ui/theme.js';
import { FORBIDDEN_PHRASES } from '../lint/forbidden.js';
import { drainStreamUntilIdle, sendUserText, withManagedSession } from './session_util.js';

export interface SimulatedInterviewOptions {
  runId: string;
  persona?: string;
  singleTurn?: boolean;
}

export async function runSimulatedInterview(opts: SimulatedInterviewOptions): Promise<void> {
  const { runId } = opts;
  const system = await fs.readFile(agentPromptPath('simulated-participant'), 'utf8');

  let studyProtocolContext = '';
  const guidebookPath = path.join(runDir(runId), 'PROBE_GUIDEBOOK.md');
  try {
    const gb = await fs.readFile(guidebookPath, 'utf8');
    const protocolMatch = gb.match(/##\s*Study protocol[\s\S]*?(?=\n## |$)/);
    if (protocolMatch) {
      studyProtocolContext = `\n\n## Study protocol context\n\n${protocolMatch[0]}`;
    }
  } catch {
    /* guidebook not present; that's fine */
  }

  const personaBlock = opts.persona ? `\n\n## Persona\n\n${opts.persona}` : '';
  const enrichedSystem = system + studyProtocolContext + personaBlock;

  console.log('');
  console.log(brand.header('🎭 probe interview') + chalk.hex(palette.dim)(` · simulated participant · run ${runId}`));
  console.log(chalk.hex(palette.subtle)('Every agent response is [SIMULATION_REHEARSAL]. Not evidence.'));
  console.log(chalk.hex(palette.dim)('Type your interview question and press enter. Type "end" to close the session.'));
  if (studyProtocolContext) {
    console.log(chalk.hex(palette.dim)('Study protocol from PROBE_GUIDEBOOK.md loaded into agent context.'));
  }
  console.log('');

  const client = new Anthropic();

  await withManagedSession(
    {
      client,
      agentName: `probe-simulated-participant-${runId.slice(-12)}`,
      systemPrompt: enrichedSystem,
      environmentName: `probe-interview-env-${runId.slice(-12)}`,
      sessionTitle: `simulated-interview ${runId}`,
      withTools: true,
    },
    async ({ agentId, environmentId, sessionId }) => {
      console.log(chalk.hex(palette.dim)(`session.id = ${sessionId}`));
      console.log('');

      const transcript: Array<{ role: 'researcher' | 'participant'; text: string }> = [];
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

      try {
        let turn = 0;
        // eslint-disable-next-line no-constant-condition
        while (true) {
          turn++;
          const prompt = chalk.hex(palette.probe).bold(`[${turn}] researcher: `);
          const question = (await rl.question(prompt)).trim();
          if (!question) continue;
          if (/^(end|quit|exit|bye|that'?s the end|thank(s| you).*that'?s the end)$/i.test(question)) {
            await sendUserText(
              client,
              sessionId,
              `${question}\n\n(session ending — please emit the INTERVIEW_DEBRIEF block now)`,
            );
            const { text } = await drainStreamUntilIdle(client, sessionId);
            console.log('\n' + chalk.hex(palette.stage).bold('participant:'));
            console.log(text);
            transcript.push({ role: 'researcher', text: question });
            transcript.push({ role: 'participant', text });
            break;
          }

          transcript.push({ role: 'researcher', text: question });
          await sendUserText(client, sessionId, question);
          const { text: response } = await drainStreamUntilIdle(client, sessionId);
          console.log('\n' + chalk.hex(palette.stage).bold('participant:'));
          console.log(response);
          console.log('');
          transcript.push({ role: 'participant', text: response });

          const violations = lintParticipantResponse(response);
          if (violations.length > 0) {
            console.log(chalk.hex(palette.revision)('⚠  voice-lint warnings on participant response:'));
            for (const v of violations.slice(0, 5)) console.log(chalk.hex(palette.dim)(`    ${v}`));
            console.log('');
          }

          if (opts.singleTurn) break;
        }
      } finally {
        rl.close();
      }

      const outputPath = path.join(runDir(runId), 'simulated_interview.md');
      const md = renderTranscript(runId, transcript);
      await fs.writeFile(outputPath, md);
      console.log(
        '\n' +
          chalk.hex(palette.passed)(
            `✓ wrote ${outputPath} (${md.length} chars, ${transcript.length / 2} turn pairs)`,
          ),
      );

      const metaPath = path.join(runDir(runId), 'managed_agents', `simulated_interview.json`);
      await fs.mkdir(path.dirname(metaPath), { recursive: true });
      await fs.writeFile(
        metaPath,
        JSON.stringify(
          {
            run_id: runId,
            agent_id: agentId,
            environment_id: environmentId,
            session_id: sessionId,
            turn_pairs: transcript.length / 2,
            created_at: new Date().toISOString(),
          },
          null,
          2,
        ),
      );
    },
  );
}

function lintParticipantResponse(text: string): string[] {
  const violations: string[] = [];
  for (const re of FORBIDDEN_PHRASES) {
    const m = text.match(re);
    if (m) violations.push(`forbidden phrase "${m[0]}" in participant response`);
  }
  return violations;
}

function renderTranscript(runId: string, turns: Array<{ role: 'researcher' | 'participant'; text: string }>): string {
  const lines: string[] = [];
  lines.push(`# Simulated interview — run ${runId}`);
  lines.push('');
  lines.push(
    `Every participant response below is \`[SIMULATION_REHEARSAL]\` and is NOT evidence. The researcher recruits real participants before drawing any conclusion. [DO_NOT_CLAIM]`,
  );
  lines.push('');
  lines.push(
    `Before running the real study, the researcher must address the INTERVIEW_DEBRIEF block below and revise the interview script accordingly. [HUMAN_REQUIRED]`,
  );
  lines.push('');
  for (const t of turns) {
    if (t.role === 'researcher') {
      lines.push(`## Researcher`);
      lines.push('');
      lines.push(t.text);
      lines.push('');
    } else {
      lines.push(`## Participant (simulated)`);
      lines.push('');
      lines.push(t.text + '  [SIMULATION_REHEARSAL]');
      lines.push('');
    }
  }
  return lines.join('\n');
}
