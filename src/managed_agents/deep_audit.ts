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
 * Lifecycle: sessions/environments are deleted in a finally block.
 * Stream errors (session.error, session.status_terminated) surface as
 * thrown errors, not silent hangs.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import Anthropic from '@anthropic-ai/sdk';
import { branchDir, runDir } from '../util/paths.js';
import { palette, branchColor } from '../ui/theme.js';
import { drainStreamUntilIdle, sendUserText, withManagedSession } from './session_util.js';

const SYSTEM_PROMPT = `You are performing a *deep* capture-risk audit on a proposed research study.

A shallow audit — already completed — produced audit.json with 16 pattern findings across four axes (Capacity, Agency, Exit, Legibility). Your job is to go further than the shallow audit by using tools to MEASURE claims that would otherwise remain qualitative.

You have access to:
- bash (run shell commands in the container)
- file operations (read, write, edit, glob, grep)
- web search / fetch (for verifying external references, NOT for inventing citations)

The branch directory /workspace/branch/ contains:
- branch_card.json — the research question, intervention primitive, method family
- prototype_spec.json — the Wizard-of-Oz spec
- prototype_spec.md — a human-readable render of the above
- simulated_walkthrough.md — the agentic rehearsal (tagged [SIMULATION_REHEARSAL] throughout)
- audit.json — the existing shallow audit with 16 findings
- audit.md — a readable render of the above

Your process:

1. Read audit.json. Identify the patterns that FIRED (fired: true). These are the shallow audit's concerns.

2. For each fired pattern, ask: "can I produce a MEASURED piece of evidence for or against this finding, not just a quoted span?" Examples:
   - If agency.auto_decides_consequential_step fired, grep the task_flow for "automatically" or "without confirmation" and quantify how many steps have auto-commit semantics
   - If capacity.no_fade_mechanism fired, count the number of wizard_controls that include a conditional-hiding or fading mechanism
   - If a timing or duration claim is made anywhere, write a small script to VERIFY the character / word / estimated-speech-duration count

3. For each pattern that did NOT fire, spot-check ONE. Produce a counter-example if you find one — show where the pattern does fire that the shallow audit missed.

4. Produce a final deep_audit.md containing:
   - a "Verified findings" section: each shallow-audit finding your tool use CONFIRMED with a measured quantity or a specific grep result
   - a "Challenged findings" section: findings you could NOT verify and what you tried
   - a "New findings" section: patterns the shallow audit did not fire that your tool investigation surfaced
   - a "Tool-use log" section: a concise log of what you ran and what you learned

Every paragraph in deep_audit.md MUST end with one of: [AGENT_INFERENCE], [TOOL_VERIFIED], [HUMAN_REQUIRED], or [DO_NOT_CLAIM]. [TOOL_VERIFIED] means "I measured this with a tool"; use it only when you did.

Do not invent citations. Do not write evidence language about human participants (this is still rehearsal; there are no participants). Do not fabricate quantitative results.

When you are done, write /workspace/branch/deep_audit.md using the file tools, emit a short summary stating how many findings you verified / challenged / added, and then — so the local CLI can capture the finished file without needing managed-container file retrieval — emit the full contents of deep_audit.md one more time in your chat output, wrapped EXACTLY like this on lines by themselves:

<<PROBE_DEEP_AUDIT_CAPTURE>>
...the full markdown of deep_audit.md here...
<<END_PROBE_DEEP_AUDIT_CAPTURE>>

The capture markers must each appear on their own line with no leading or trailing text. Do not include the markers inside the file itself.`;

export interface DeepAuditOptions {
  runId: string;
  branchId: string;
  dryRun?: boolean;
}

/**
 * Extract the agent-emitted deep_audit.md content from a session trace.
 *
 * The system prompt asks the agent to wrap the final file in
 * <<PROBE_DEEP_AUDIT_CAPTURE>> and <<END_PROBE_DEEP_AUDIT_CAPTURE>> markers,
 * each on its own line. This function finds the LAST such block (so a
 * discussion of the protocol earlier in the conversation doesn't get
 * captured) and returns its content, trimmed. Returns null if no matching
 * pair of markers is found.
 *
 * Exported for unit testing; the orchestrator imports it internally.
 */
export function extractDeepAuditCapture(conversation: string): string | null {
  const startMarker = '<<PROBE_DEEP_AUDIT_CAPTURE>>';
  const endMarker = '<<END_PROBE_DEEP_AUDIT_CAPTURE>>';
  // Find the LAST start (in case the agent rehearsed the protocol earlier).
  const lastStart = conversation.lastIndexOf(startMarker);
  if (lastStart === -1) return null;
  const end = conversation.indexOf(endMarker, lastStart + startMarker.length);
  if (end === -1) return null;
  const body = conversation.slice(lastStart + startMarker.length, end);
  // Strip a single leading newline and trailing newline so the captured file
  // doesn't have blank framing. Keep the internal content byte-identical.
  return body.replace(/^\r?\n/, '').replace(/\r?\n\s*$/, '');
}

export async function runDeepAudit(opts: DeepAuditOptions): Promise<void> {
  const { runId, branchId } = opts;
  const bd = branchDir(runId, branchId);

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

  const artifacts: Record<string, string> = {};
  for (const f of required) {
    artifacts[f] = await fs.readFile(path.join(bd, f), 'utf8');
  }
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

  await withManagedSession(
    {
      client,
      agentName: 'probe-deep-auditor',
      systemPrompt: SYSTEM_PROMPT,
      environmentName: `probe-env-${runId.slice(-12)}-${branchId}`,
      sessionTitle: `deep-audit runs/${runId}/branches/${branchId}`,
      withTools: true,
    },
    async ({ agentId, environmentId, sessionId }) => {
      console.log(`\n   ${chalk.hex(palette.passed)('✓')} agent.id = ${chalk.hex(palette.dim)(agentId)}`);
      console.log(`   ${chalk.hex(palette.passed)('✓')} environment.id = ${chalk.hex(palette.dim)(environmentId)}`);
      console.log(`   ${chalk.hex(palette.passed)('✓')} session.id = ${chalk.hex(palette.dim)(sessionId)}`);
      console.log(`\n   ${chalk.hex(palette.stage)('streaming agent events...')}\n`);

      await sendUserText(client, sessionId, userMessage);
      const drain = await drainStreamUntilIdle(client, sessionId, {
        onAgentText: (chunk) => process.stdout.write(chalk.hex(palette.subtle)(chunk)),
        onToolUse: (name, idx) => console.log(`\n${chalk.hex(palette.stage)(`┊ [tool ${idx}: ${name}]`)}`),
        onToolResult: (content) => {
          const preview = JSON.stringify(content).slice(0, 120);
          console.log(`${chalk.hex(palette.dim)(`┊   → ${preview}${preview.length >= 120 ? '...' : ''}`)}`);
        },
      });

      if (drain.terminated) {
        console.log(
          '\n\n' +
            chalk.hex(palette.revision)(
              `⚠ session terminated: ${drain.terminated.reason} — ${drain.terminated.message ?? ''}`,
            ),
        );
      } else {
        console.log(
          '\n\n' +
            chalk.hex(palette.passed)(`✓ agent idle — ${drain.toolUseCount} tool calls`),
        );
      }

      // Extract the captured file from the conversation stream. The agent
      // has been instructed to wrap the complete deep_audit.md in
      // <<PROBE_DEEP_AUDIT_CAPTURE>> … <<END_PROBE_DEEP_AUDIT_CAPTURE>>
      // markers, each on its own line. Prefer that; fall back to the full
      // conversation trace if the markers are missing (so older agent
      // behavior still produces a readable file).
      const captured = extractDeepAuditCapture(drain.text);
      const outputPath = path.join(bd, 'deep_audit.md');
      if (captured) {
        await fs.writeFile(outputPath, captured);
        console.log(
          `\n   ${chalk.hex(palette.passed)('✓')} wrote ${outputPath} (${captured.length} chars, captured via delimiter)`,
        );
        // Also save the full conversation trace for reviewability.
        const tracePath = path.join(bd, 'deep_audit_trace.md');
        await fs.writeFile(tracePath, drain.text);
        console.log(
          `   ${chalk.hex(palette.passed)('✓')} session trace: ${tracePath} (${drain.text.length} chars)`,
        );
      } else {
        await fs.writeFile(outputPath, drain.text);
        console.log(
          `\n   ${chalk.hex(palette.revision)('⚠')} capture delimiters not found in agent output — wrote full conversation trace to ${outputPath} (${drain.text.length} chars)`,
        );
      }

      const metaPath = path.join(runDir(runId), 'managed_agents', `deep_audit_${branchId}.json`);
      await fs.mkdir(path.dirname(metaPath), { recursive: true });
      await fs.writeFile(
        metaPath,
        JSON.stringify(
          {
            run_id: runId,
            branch_id: branchId,
            agent_id: agentId,
            environment_id: environmentId,
            session_id: sessionId,
            tool_use_count: drain.toolUseCount,
            output_chars: drain.text.length,
            terminated: drain.terminated ?? null,
            created_at: new Date().toISOString(),
          },
          null,
          2,
        ),
      );
      console.log(`   ${chalk.hex(palette.passed)('✓')} session metadata: ${metaPath}`);
    },
  );
}
