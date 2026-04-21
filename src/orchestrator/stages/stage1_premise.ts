import path from 'node:path';
import { runJsonStage, writeJson } from '../stage_util.js';
import { runDir } from '../../util/paths.js';

interface Stage1Args {
  runId: string;
  premise: string;
}

export async function runStagePremise(args: Stage1Args): Promise<void> {
  const userMessage =
    `run_id: ${args.runId}\n` +
    `\n` +
    `premise:\n"""\n${args.premise}\n"""\n`;

  const parsed = await runJsonStage({
    runId: args.runId,
    stage: '1_premise',
    agentName: 'premise',
    model: 'opus',
    userMessage,
    schemaName: 'premise_card',
    maxTokens: 2048,
    temperature: 0.4,
  });

  const out = path.join(runDir(args.runId), 'premise_card.json');
  await writeJson(out, parsed);
}
