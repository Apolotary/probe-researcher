import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { projectRoot } from '../util/paths.js';

const pExecFile = promisify(execFile);

export async function buildPaperCommand(): Promise<void> {
  const script = path.join(projectRoot(), 'scripts', 'build_paper.ts');
  // Delegate to the script — it's the canonical implementation.
  const { stdout, stderr } = await pExecFile('npx', ['tsx', script], {
    cwd: projectRoot(),
    maxBuffer: 10 * 1024 * 1024,
  });
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
}
