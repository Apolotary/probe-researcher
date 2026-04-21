import fs from 'node:fs/promises';
import path from 'node:path';
import { branchCommit, readJson, runJsonStage, writeJson } from '../stage_util.js';
import { branchDir, sourceCardDir } from '../../util/paths.js';

interface Stage3Args {
  runId: string;
  branchId: string;
}

interface BranchCard {
  branch_id: string;
  grounding: Array<{ source_card: string; relevance: string; quoted_claim: string }>;
  [k: string]: unknown;
}

export async function runStageLiterature(args: Stage3Args): Promise<void> {
  const bd = branchDir(args.runId, args.branchId);
  const cardPath = path.join(bd, 'branch_card.json');
  const card = await readJson<BranchCard>(cardPath);

  const corpus = await loadCorpus();
  const corpusIds = corpus.map((c) => c.id);
  const corpusBlock = corpus
    .map(
      (c) =>
        `--- source_card: ${c.id} ---\n${c.raw}\n`,
    )
    .join('\n');

  const userMessage =
    `run_id: ${args.runId}\nbranch_id: ${args.branchId}\n\n` +
    `branch_card.json:\n${JSON.stringify(card, null, 2)}\n\n` +
    `Available source cards (${corpusIds.length} total):\n${corpusBlock}\n` +
    `\nValid source_card IDs: ${corpusIds.join(', ')}.\n` +
    `Return the entire branch_card with the grounding array filled (2-5 entries).`;

  const parsed = (await runJsonStage({
    runId: args.runId,
    branchId: args.branchId,
    stage: '3_literature',
    agentName: 'literature',
    model: 'sonnet',
    userMessage,
    schemaName: 'branch_card',
    maxTokens: 3072,
    temperature: 0.4,
    postValidate: (data) => {
      const c = data as BranchCard;
      if (!Array.isArray(c.grounding) || c.grounding.length < 2 || c.grounding.length > 5) {
        return { passed: false, reason: 'grounding must have 2-5 entries' };
      }
      for (const g of c.grounding) {
        if (!corpusIds.includes(g.source_card)) {
          return {
            passed: false,
            reason: `grounding references unknown source_card "${g.source_card}". Valid IDs: ${corpusIds.join(', ')}`,
          };
        }
      }
      return { passed: true, reason: 'ok' };
    },
  })) as BranchCard;

  await writeJson(cardPath, parsed);
  await branchCommit(
    args.runId,
    args.branchId,
    `stage-3 [branch-${args.branchId}]: literature grounded to ${parsed.grounding.length} source cards`,
  );
}

async function loadCorpus(): Promise<Array<{ id: string; raw: string }>> {
  const dir = sourceCardDir();
  const entries = await fs.readdir(dir);
  const files = entries.filter((e) => e.endsWith('.yaml'));
  const out: Array<{ id: string; raw: string }> = [];
  for (const f of files) {
    const raw = await fs.readFile(path.join(dir, f), 'utf8');
    out.push({ id: f.replace(/\.yaml$/, ''), raw });
  }
  return out;
}
