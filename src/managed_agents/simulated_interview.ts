/**
 * Simulated user interview — v2 feature using Claude Managed Agents.
 *
 * The guidebook's Study Protocol section describes the interview script. A
 * researcher who wants to *rehearse* their script before recruiting real
 * participants spawns a simulated participant via this command:
 *
 *     probe interview <run_id>
 *
 * The agent is instantiated with the simulated-participant system prompt
 * and holds a session across turns. The researcher types interview
 * questions; the agent answers in persona. At the end, the agent emits an
 * INTERVIEW_DEBRIEF block naming script problems the researcher should fix.
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

export interface SimulatedInterviewOptions {
  runId: string;
  persona?: string;
  /** If true, exit immediately after first response (smoke test). */
  singleTurn?: boolean;
}

export async function runSimulatedInterview(opts: SimulatedInterviewOptions): Promise<void> {
  const { runId } = opts;
  const system = await fs.readFile(agentPromptPath('simulated-participant'), 'utf8');

  // Optionally enrich the system prompt with the guidebook's study protocol
  // so the agent knows what interview is being rehearsed.
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

  const personaBlock = opts.persona
    ? `\n\n## Persona\n\n${opts.persona}`
    : '';

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
  const agent = await client.beta.agents.create({
    name: `probe-simulated-participant-${runId.slice(-12)}`,
    model: 'claude-opus-4-7',
    system: enrichedSystem,
    tools: [{ type: 'agent_toolset_20260401' }],
  } as unknown as Parameters<typeof client.beta.agents.create>[0]);
  const agentId = (agent as { id: string }).id;

  const env = await client.beta.environments.create({
    name: `probe-interview-env-${runId.slice(-12)}`,
    config: { type: 'cloud', networking: { type: 'unrestricted' } },
  } as unknown as Parameters<typeof client.beta.environments.create>[0]);
  const envId = (env as { id: string }).id;

  const session = await client.beta.sessions.create({
    agent: agentId,
    environment_id: envId,
    title: `simulated-interview ${runId}`,
  } as unknown as Parameters<typeof client.beta.sessions.create>[0]);
  const sessionId = (session as { id: string }).id;

  console.log(chalk.hex(palette.dim)(`session.id = ${sessionId}`));
  console.log('');

  const transcript: Array<{ role: 'researcher' | 'participant'; text: string }> = [];
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  // Start a single stream; reuse for all turns
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const events = (client.beta.sessions as any).events;

  let turn = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    turn++;
    const prompt = chalk.hex(palette.probe).bold(`[${turn}] researcher: `);
    const question = (await rl.question(prompt)).trim();
    if (!question) continue;
    if (/^(end|quit|exit|bye|that'?s the end|thank(s| you).*that'?s the end)$/i.test(question)) {
      await sendUserMessage(events, sessionId, `${question}\n\n(session ending — please emit the INTERVIEW_DEBRIEF block now)`);
      const text = await streamUntilIdle(events, sessionId);
      console.log('\n' + chalk.hex(palette.stage).bold('participant:'));
      console.log(text);
      transcript.push({ role: 'researcher', text: question });
      transcript.push({ role: 'participant', text });
      break;
    }

    transcript.push({ role: 'researcher', text: question });
    await sendUserMessage(events, sessionId, question);
    const response = await streamUntilIdle(events, sessionId);
    console.log('\n' + chalk.hex(palette.stage).bold('participant:'));
    console.log(response);
    console.log('');
    transcript.push({ role: 'participant', text: response });

    // Voice-lint each participant response as it comes in
    const violations = lintParticipantResponse(response);
    if (violations.length > 0) {
      console.log(chalk.hex(palette.revision)('⚠  voice-lint warnings on participant response:'));
      for (const v of violations.slice(0, 5)) console.log(chalk.hex(palette.dim)(`    ${v}`));
      console.log('');
    }

    if (opts.singleTurn) break;
  }
  rl.close();

  // Write transcript
  const outputPath = path.join(runDir(runId), 'simulated_interview.md');
  const md = renderTranscript(runId, transcript);
  await fs.writeFile(outputPath, md);
  console.log('\n' + chalk.hex(palette.passed)(`✓ wrote ${outputPath} (${md.length} chars, ${transcript.length / 2} turn pairs)`));

  // Save session metadata
  const metaPath = path.join(runDir(runId), 'managed_agents', `simulated_interview.json`);
  await fs.mkdir(path.dirname(metaPath), { recursive: true });
  await fs.writeFile(
    metaPath,
    JSON.stringify(
      {
        run_id: runId,
        agent_id: agentId,
        environment_id: envId,
        session_id: sessionId,
        turn_pairs: transcript.length / 2,
        created_at: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendUserMessage(events: any, sessionId: string, text: string): Promise<void> {
  await events.send(sessionId, {
    events: [{ type: 'user.message', content: [{ type: 'text', text }] }],
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function streamUntilIdle(events: any, sessionId: string): Promise<string> {
  const stream = await events.stream(sessionId);
  let response = '';
  for await (const event of stream) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ev = event as any;
    if (ev.type === 'agent.message') {
      response += (ev.content ?? [])
        .filter((c: { type: string }) => c.type === 'text')
        .map((c: { text: string }) => c.text)
        .join('');
    }
    if (ev.type === 'session.status_idle') break;
  }
  return response.trim();
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
  lines.push(`Every participant response below is \`[SIMULATION_REHEARSAL]\` and is NOT evidence. The researcher recruits real participants before drawing any conclusion. [DO_NOT_CLAIM]`);
  lines.push('');
  lines.push(`Before running the real study, the researcher must address the INTERVIEW_DEBRIEF block below and revise the interview script accordingly. [HUMAN_REQUIRED]`);
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
