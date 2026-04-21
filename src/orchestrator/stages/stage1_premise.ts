import fs from 'node:fs/promises';
import path from 'node:path';
import { callClaude } from '../../anthropic/client.js';
import { parseJsonFromModel, validateAgainst } from '../../schema/validate.js';
import { agentPromptPath, runDir } from '../../util/paths.js';

interface Stage1Args {
  runId: string;
  premise: string;
}

export async function runStagePremise(args: Stage1Args): Promise<void> {
  const system = await fs.readFile(agentPromptPath('premise'), 'utf8');
  const userMessage =
    `run_id: ${args.runId}\n` +
    `\n` +
    `premise:\n"""\n${args.premise}\n"""\n`;

  let response = await callClaude({
    stage: '1_premise',
    runId: args.runId,
    model: 'opus',
    system,
    userMessage,
    maxTokens: 2048,
    temperature: 0.4,
  });

  // One repair pass if schema validation fails.
  for (let attempt = 0; attempt < 2; attempt++) {
    let parsed: unknown;
    try {
      parsed = parseJsonFromModel(response.text);
    } catch (e) {
      if (attempt === 1) throw new Error(`stage 1 JSON parse failed after repair: ${String(e)}`);
      response = await callClaude({
        stage: '1_premise',
        runId: args.runId,
        model: 'opus',
        system,
        userMessage:
          userMessage +
          `\n\nYour previous output was not valid JSON:\n"""\n${response.text.slice(0, 500)}\n"""\n` +
          `Return only the corrected JSON, no fences, no commentary.`,
        maxTokens: 2048,
        temperature: 0.2,
      });
      continue;
    }

    const result = await validateAgainst('premise_card', parsed);
    if (result.valid) {
      const out = path.join(runDir(args.runId), 'premise_card.json');
      await fs.writeFile(out, JSON.stringify(parsed, null, 2) + '\n');
      return;
    }
    if (attempt === 1) {
      throw new Error(
        `stage 1 schema validation failed after repair:\n${result.errors.join('\n')}`,
      );
    }
    // Repair pass.
    response = await callClaude({
      stage: '1_premise',
      runId: args.runId,
      model: 'opus',
      system,
      userMessage:
        userMessage +
        `\n\nYour previous output failed schema validation:\n${result.errors.join('\n')}\n` +
        `Return only the corrected JSON, no fences, no commentary.`,
      maxTokens: 2048,
      temperature: 0.2,
    });
  }
}
