/**
 * Shared helpers for Managed Agents sessions. Both deep_audit and
 * simulated_interview use the same pattern: create agent/env/session,
 * stream events until idle, tear down.
 *
 * All three new exports consolidate behavior that was duplicated and
 * error-prone in the first pass:
 *
 *   - `withManagedSession` wraps session lifecycle in try/finally so
 *     agents/environments/sessions are deleted even on failure
 *
 *   - `drainStreamUntilIdle` consumes events with proper error-event
 *     handling (session.error, session.status_terminated etc.) so a
 *     failed session does not hang the CLI forever
 *
 *   - `textFromEvent` extracts text content from an agent message event
 *     without forcing callers to deal with the union type inline
 */

import chalk from 'chalk';
import Anthropic from '@anthropic-ai/sdk';
import { palette } from '../ui/theme.js';

export interface ManagedSessionHandle {
  agentId: string;
  environmentId: string;
  sessionId: string;
  client: Anthropic;
}

export interface CreateSessionArgs {
  client: Anthropic;
  agentName: string;
  systemPrompt: string;
  environmentName: string;
  sessionTitle: string;
  /** Set to false if the session does not need the default agent toolset. Default true. */
  withTools?: boolean;
}

/**
 * Creates an agent, environment, and session, runs the body, and deletes
 * everything in a finally block — so unresponsive CLIs don't leak
 * managed cloud containers at $X per hour.
 *
 * Returns the body's result.
 */
export async function withManagedSession<T>(
  args: CreateSessionArgs,
  body: (handle: ManagedSessionHandle) => Promise<T>,
): Promise<T> {
  const { client } = args;
  let agentId: string | undefined;
  let environmentId: string | undefined;
  let sessionId: string | undefined;
  try {
    const agent = await client.beta.agents.create({
      name: args.agentName,
      model: 'claude-opus-4-7',
      system: args.systemPrompt,
      ...(args.withTools !== false && {
        tools: [{ type: 'agent_toolset_20260401' }],
      }),
    });
    agentId = agent.id;

    const environment = await client.beta.environments.create({
      name: args.environmentName,
      config: { type: 'cloud', networking: { type: 'unrestricted' } },
    });
    environmentId = environment.id;

    const session = await client.beta.sessions.create({
      agent: agentId,
      environment_id: environmentId,
      title: args.sessionTitle,
    });
    sessionId = session.id;

    return await body({ agentId, environmentId, sessionId, client });
  } finally {
    // Always attempt cleanup; log but do not rethrow on cleanup failure.
    if (sessionId) {
      await client.beta.sessions.delete(sessionId).catch((e) => {
        console.error(chalk.hex(palette.dim)(`[cleanup] session.delete failed: ${String(e)}`));
      });
    }
    if (environmentId) {
      await client.beta.environments.delete(environmentId).catch((e) => {
        console.error(chalk.hex(palette.dim)(`[cleanup] environment.delete failed: ${String(e)}`));
      });
    }
    // Agents are reusable across sessions; keep them by name. We do not
    // delete them on every invocation because a named agent resolves to
    // the same versioned record.
  }
}

/**
 * Event discriminator for the streaming API. Local union; the SDK event
 * types are unioned through BetaAgentsEventStreamEvent which we narrow by
 * inspecting `type` literal strings.
 */
interface AgentStreamEvent {
  type: string;
  content?: Array<{ type: string; text?: string }>;
  name?: string;
  message?: string;
  [k: string]: unknown;
}

export interface DrainResult {
  text: string;
  toolUseCount: number;
  terminated?: {
    reason: string;
    message?: string;
  };
}

export interface DrainOptions {
  /** Called each time an agent.message event arrives. Text is the just-arrived chunk. */
  onAgentText?: (chunk: string) => void;
  /** Called each time a tool is invoked. */
  onToolUse?: (name: string, index: number) => void;
  /** Called on tool_result events with the result content. */
  onToolResult?: (content: unknown) => void;
}

/**
 * Consumes the session stream until `session.status_idle`. Throws on
 * `session.error` or `session.status_terminated` with a useful message.
 * Returns the accumulated text content, tool-use count, and — if the
 * stream ended in terminated state — the termination reason.
 */
export async function drainStreamUntilIdle(
  client: Anthropic,
  sessionId: string,
  opts: DrainOptions = {},
): Promise<DrainResult> {
  const stream = await client.beta.sessions.events.stream(sessionId);

  let text = '';
  let toolUseCount = 0;
  let terminated: DrainResult['terminated'];

  for await (const rawEvent of stream) {
    const event = rawEvent as unknown as AgentStreamEvent;
    switch (event.type) {
      case 'agent.message': {
        const chunk = (event.content ?? [])
          .filter((c) => c.type === 'text' && typeof c.text === 'string')
          .map((c) => c.text as string)
          .join('');
        if (chunk.length > 0) {
          text += chunk;
          opts.onAgentText?.(chunk);
        }
        break;
      }
      case 'agent.tool_use': {
        toolUseCount++;
        const name = typeof event.name === 'string' ? event.name : 'unknown';
        opts.onToolUse?.(name, toolUseCount);
        break;
      }
      case 'agent.tool_result': {
        opts.onToolResult?.(event.content);
        break;
      }
      case 'session.error': {
        const msg = typeof event.message === 'string' ? event.message : JSON.stringify(event);
        throw new Error(`session.error: ${msg}`);
      }
      case 'session.status_terminated': {
        const msg = typeof event.message === 'string' ? event.message : 'terminated without message';
        terminated = { reason: 'terminated', message: msg };
        return { text, toolUseCount, terminated };
      }
      case 'session.retries_exhausted': {
        throw new Error(`session.retries_exhausted: the session exceeded its retry budget`);
      }
      case 'session.requires_action': {
        // We don't support custom-tool round-trips yet. Fail clearly.
        throw new Error(
          `session.requires_action: agent requested a user-side action Probe does not currently handle. Emit this as a feature request.`,
        );
      }
      case 'session.status_idle':
        return { text, toolUseCount, terminated };
      default:
        // Ignore other event types (there are many: message-start, content-block-*, etc.)
        break;
    }
  }

  return { text, toolUseCount, terminated };
}

export async function sendUserText(
  client: Anthropic,
  sessionId: string,
  text: string,
): Promise<void> {
  await client.beta.sessions.events.send(sessionId, {
    events: [{ type: 'user.message', content: [{ type: 'text', text }] }],
  });
}
