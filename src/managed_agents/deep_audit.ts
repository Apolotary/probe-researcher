/**
 * Deep-audit command using Claude Managed Agents.
 *
 * A standard Probe audit (stage 6) uses a single Messages API call: Opus
 * reads the prototype spec and the simulated walkthrough, fires pattern
 * rules, and produces quoted evidence spans. It cannot run computations
 * or grep the source files itself.
 *
 * `probe audit-deep` spawns a Managed Agent (claude-opus-4-7) with the
 * built-in agent toolset — bash, file operations, web fetch — inside a
 * managed container with the branch directory pushed as context. The
 * agent can:
 *   - grep the prototype_spec.md for specific patterns
 *   - compute announcement-duration diffs from literal strings in the spec
 *   - cross-reference the audit.json findings against the evidence
 *   - run python/node scripts to verify quantitative claims
 *   - produce a deep_audit.md that cites measured evidence
 *
 * This is the Managed Agents value-add over direct API calls: the model
 * reasons WITH tool execution in the loop, not about it after the fact.
 *
 * Beta: requires the `managed-agents-2026-04-01` header. The SDK sets it
 * automatically when using `client.beta.agents` / `client.beta.sessions`.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import Anthropic from '@anthropic-ai/sdk';
import { branchDir, runDir } from '../util/paths.js';
import { palette, branchColor } from '../ui/theme.js';

const SYSTEM_PROMPT = `You are performing a *deep* capture-risk audit on a proposed research study.

A shallow audit — already completed — produced audit.json with 16 pattern findings across four axes (Capacity, Agency, Exit, Legibility). Your job is to go further than the shallow audit by using tools to MEASURE claims that would otherwise remain qualitative.

You have access to:
- bash (run shell commands in the container)
- file operations (read, write, edit, glob, grep)
- web search / fetch (for verifying external references, NOT for inventing citations)

The branch directory /workspace/branch/ contains:
- branch_card.json — the research question, intervention primitive, method family
- prototype_spec.json — the Wizard-of-Oz spec (actors, task_flow, wizard_controls, observable_signals, failure_cases, materials_needed)
- prototype_spec.md — a human-readable render of the above
- simulated_walkthrough.md — the agentic rehearsal (tagged [SIMULATION_REHEARSAL] throughout)
- audit.json — the existing shallow audit with 16 findings
- audit.md — a readable render of the above

Your process:

1. Read audit.json. Identify the patterns that FIRED (fired: true). These are the shallow audit's concerns.

2. For each fired pattern, ask: "can I produce a MEASURED piece of evidence for or against this finding, not just a quoted span?" Examples:
   - If agency.auto_decides_consequential_step fired, grep the task_flow for the word "automatically" or "without confirmation" and quantify how many steps have auto-commit semantics
   - If capacity.no_fade_mechanism fired, count the number of wizard_controls that include a conditional-hiding or fading mechanism
   - If a timing or duration claim is made anywhere (e.g., "AI disclosure string is 18 words / ~6 seconds"), write a small script to VERIFY the character / word / estimated-speech-duration count

3. For each pattern that did NOT fire, spot-check ONE. Produce a counter-example if you find one — show where the pattern does fire that the shallow audit missed.

4. Produce a final deep_audit.md containing:
   - a "Verified findings" section: each finding from the shallow audit that your tool use CONFIRMED with a measured quantity or a specific grep result
   - a "Challenged findings" section: findings you could NOT verify and what you tried
   - a "New findings" section: patterns the shallow audit did not fire that your tool investigation surfaced
   - a "Tool-use log" section: a concise log of what you ran and what you learned

Every paragraph in deep_audit.md MUST end with one of: [AGENT_INFERENCE], [TOOL_VERIFIED], [HUMAN_REQUIRED], or [DO_NOT_CLAIM]. You are inventing a new provenance tag, [TOOL_VERIFIED], which means "I measured this with a tool". That is legitimate because you really did.

Do not invent citations. Do not write evidence language about human participants (this is still rehearsal; there are no participants). Do not fabricate quantitative results.

When you are done, write deep_audit.md and emit a short summary stating how many findings you verified / challenged / added.`;

export interface DeepAuditOptions {
  runId: string;
  branchId: string;
  /** If true, do not actually create the session — just print what would happen. */
  dryRun?: boolean;
}

export async function runDeepAudit(opts: DeepAuditOptions): Promise<void> {
  const { runId, branchId } = opts;
  const bd = branchDir(runId, branchId);

  // Verify the branch has all expected artifacts
  const required = ['branch_card.json', 'prototype_spec.json', 'prototype_spec.md', 'simulated_walkthrough.md', 'audit.json'];
  for (const f of required) {
    try {
      await fs.access(path.join(bd, f));
    } catch {
      throw new Error(`deep-audit: branch ${branchId} is missing ${f}. Run the full pipeline first.`);
    }
  }

  const color = branchColor(branchId);
  console.log(`\n${color(`│ ${branchId.toUpperCase()}`)}  ${chalk.hex(palette.probe).bold('🔬 deep audit (managed agent)')}`);
  console.log(`   ${chalk.hex(palette.dim)(`branch:   runs/${runId}/branches/${branchId}/`)}`);
  console.log(`   ${chalk.hex(palette.dim)(`artifacts in scope: ${required.join(', ')}`)}`);

  if (opts.dryRun) {
    console.log(chalk.hex(palette.revision)('\n   [dry run] no session created.'));
    return;
  }

  const client = new Anthropic();

  // 1. Create (or reuse) the deep-auditor agent.
  console.log(`\n   ${chalk.hex(palette.stage)('creating agent...')}`);
  const agent = await client.beta.agents.create({
    name: `probe-deep-auditor`,
    model: 'claude-opus-4-7',
    system: SYSTEM_PROMPT,
    tools: [{ type: 'agent_toolset_20260401' }],
  } as unknown as Parameters<typeof client.beta.agents.create>[0]);
  const agentId = (agent as { id: string }).id;
  console.log(`   ${chalk.hex(palette.passed)('✓')} agent.id = ${chalk.hex(palette.dim)(agentId)}`);

  // 2. Create an environment (cloud container with unrestricted networking).
  console.log(`   ${chalk.hex(palette.stage)('creating environment...')}`);
  const env = await client.beta.environments.create({
    name: `probe-env-${runId.slice(-12)}-${branchId}`,
    config: {
      type: 'cloud',
      networking: { type: 'unrestricted' },
    },
  } as unknown as Parameters<typeof client.beta.environments.create>[0]);
  const envId = (env as { id: string }).id;
  console.log(`   ${chalk.hex(palette.passed)('✓')} environment.id = ${chalk.hex(palette.dim)(envId)}`);

  // 3. Load all branch artifacts into the initial user message. The agent
  //    can then run bash and file operations inside its container.
  const artifacts: Record<string, string> = {};
  for (const f of required) {
    artifacts[f] = await fs.readFile(path.join(bd, f), 'utf8');
  }
  // Include audit.md if present (it's a nicer render of audit.json)
  try {
    artifacts['audit.md'] = await fs.readFile(path.join(bd, 'audit.md'), 'utf8');
  } catch {
    /* optional */
  }

  const userMessage =
    `Deep audit for runs/${runId}/branches/${branchId}/.\n\n` +
    `I have pasted the branch artifacts below. First, write each to a file under /workspace/branch/ ` +
    `using the write tool so you can grep and bash against them. Then perform the deep audit per your instructions.\n\n` +
    required
      .map((f) => `--- ${f} ---\n${artifacts[f]}\n`)
      .join('\n') +
    `\nWhen done, emit ONE final summary line prefixed with DEEP_AUDIT_SUMMARY: with verified / challenged / new counts.`;

  // 4. Create the session.
  console.log(`   ${chalk.hex(palette.stage)('starting session...')}`);
  const session = await client.beta.sessions.create({
    agent: agentId,
    environment_id: envId,
    title: `deep-audit runs/${runId}/branches/${branchId}`,
  } as unknown as Parameters<typeof client.beta.sessions.create>[0]);
  const sessionId = (session as { id: string }).id;
  console.log(`   ${chalk.hex(palette.passed)('✓')} session.id = ${chalk.hex(palette.dim)(sessionId)}`);

  // 5. Open the stream, send the user message, and process events.
  console.log(`\n   ${chalk.hex(palette.stage)('streaming agent events...')}\n`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const events = (client.beta.sessions as any).events;
  const stream = await events.stream(sessionId);
  await events.send(sessionId, {
    events: [
      {
        type: 'user.message',
        content: [{ type: 'text', text: userMessage }],
      },
    ],
  });

  let finalMessage = '';
  let toolUseCount = 0;

  for await (const event of stream) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ev = event as any;
    switch (ev.type) {
      case 'agent.message': {
        const text = (ev.content ?? [])
          .filter((c: { type: string }) => c.type === 'text')
          .map((c: { text: string }) => c.text)
          .join('');
        if (text.length > 0) {
          process.stdout.write(chalk.hex(palette.subtle)(text));
          finalMessage += text;
        }
        break;
      }
      case 'agent.tool_use': {
        toolUseCount++;
        console.log(`\n${chalk.hex(palette.stage)(`┊ [tool ${toolUseCount}: ${ev.name}]`)}`);
        break;
      }
      case 'agent.tool_result': {
        // Print a short preview
        const preview = JSON.stringify(ev.content).slice(0, 120);
        console.log(`${chalk.hex(palette.dim)(`┊   → ${preview}${preview.length >= 120 ? '...' : ''}`)}`);
        break;
      }
      case 'session.status_idle': {
        console.log('\n\n' + chalk.hex(palette.passed)(`✓ agent idle — ${toolUseCount} tool calls`));
        break;
      }
      default:
        break;
    }
    if (ev.type === 'session.status_idle') break;
  }

  // 6. Write output.
  const outputPath = path.join(bd, 'deep_audit.md');
  await fs.writeFile(outputPath, finalMessage);
  console.log(`\n   ${chalk.hex(palette.passed)('✓')} wrote ${outputPath} (${finalMessage.length} chars)`);

  // Also persist session metadata under the run for traceability
  const metaPath = path.join(runDir(runId), 'managed_agents', `deep_audit_${branchId}.json`);
  await fs.mkdir(path.dirname(metaPath), { recursive: true });
  await fs.writeFile(
    metaPath,
    JSON.stringify(
      {
        run_id: runId,
        branch_id: branchId,
        agent_id: agentId,
        environment_id: envId,
        session_id: sessionId,
        tool_use_count: toolUseCount,
        output_chars: finalMessage.length,
        created_at: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
  console.log(`   ${chalk.hex(palette.passed)('✓')} session metadata: ${metaPath}`);
}
