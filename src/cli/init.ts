import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import { projectRoot } from '../util/paths.js';

export async function initCommand(runId: string): Promise<void> {
  const runsDir = path.join(projectRoot(), 'runs', runId);
  await fs.mkdir(path.join(runsDir, 'branches'), { recursive: true });
  const costPath = path.join(runsDir, 'cost.json');
  try {
    await fs.access(costPath);
  } catch {
    await fs.writeFile(
      costPath,
      JSON.stringify(
        {
          run_id: runId,
          stages: [],
          totals: { input_tokens: 0, output_tokens: 0, usd: 0 },
        },
        null,
        2,
      ),
    );
  }
  console.log(chalk.green(`scaffolded runs/${runId}/`));
}
