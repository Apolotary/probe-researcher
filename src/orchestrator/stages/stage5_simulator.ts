import fs from 'node:fs/promises';
import path from 'node:path';
import { branchCommit, readJson, runMarkdownStage, writeText } from '../stage_util.js';
import { branchDir } from '../../util/paths.js';
import { FORBIDDEN_PHRASES } from '../../lint/forbidden.js';

interface Stage5Args {
  runId: string;
  branchId: string;
}

export async function runStageSimulator(args: Stage5Args): Promise<void> {
  const bd = branchDir(args.runId, args.branchId);
  const spec = await readJson(path.join(bd, 'prototype_spec.json'));
  const specMd = await fs.readFile(path.join(bd, 'prototype_spec.md'), 'utf8');

  const userMessage =
    `run_id: ${args.runId}\nbranch_id: ${args.branchId}\n\n` +
    `prototype_spec (JSON):\n${JSON.stringify(spec, null, 2)}\n\n` +
    `prototype_spec (rendered markdown):\n\n${specMd}\n\n` +
    `Produce the simulated walkthrough as markdown. Tag every paragraph and bullet with [SIMULATION_REHEARSAL]. Hedged voice only.`;

  const markdown = await runMarkdownStage({
    runId: args.runId,
    branchId: args.branchId,
    stage: '5_simulator',
    agentName: 'simulator',
    model: 'opus',
    userMessage,
    maxTokens: 6144,
    temperature: 0.6,
    postValidate: (md) => {
      const violations: string[] = [];
      // Every paragraph/bullet should end with [SIMULATION_REHEARSAL]
      const blocks = md.split(/\n{2,}/);
      for (const block of blocks) {
        const trimmed = block.trim();
        if (trimmed.length === 0) continue;
        if (trimmed.startsWith('#')) continue; // headings
        // If block is a list, check each line
        if (/^\s*[-*]\s/.test(trimmed)) {
          for (const line of trimmed.split(/\n/)) {
            const t = line.trim();
            if (t.length === 0 || !/^\s*[-*]\s/.test(t)) continue;
            if (!/\[SIMULATION_REHEARSAL\]/.test(t)) {
              violations.push(`bullet missing [SIMULATION_REHEARSAL]: "${t.slice(0, 100)}"`);
            }
          }
        } else {
          if (!/\[SIMULATION_REHEARSAL\]/.test(trimmed)) {
            violations.push(`paragraph missing [SIMULATION_REHEARSAL]: "${trimmed.slice(0, 100)}"`);
          }
        }
        // Forbidden evidence language — strip quoted regions first
        const stripped = block.replace(/"[^"]*"/g, '""');
        for (const re of FORBIDDEN_PHRASES) {
          const m = stripped.match(re);
          if (m) {
            violations.push(`evidence language "${m[0]}" in: "${trimmed.slice(0, 100)}"`);
          }
        }
      }
      return { passed: violations.length === 0, violations };
    },
  });

  await writeText(path.join(bd, 'simulated_walkthrough.md'), markdown);
  await branchCommit(
    args.runId,
    args.branchId,
    `stage-5 [branch-${args.branchId}]: simulated walkthrough (Mode A)`,
  );
}
