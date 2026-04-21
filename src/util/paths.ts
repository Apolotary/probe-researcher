import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Returns the absolute path to the repository root.
 * This file lives at <root>/src/util/paths.ts (compiled to dist/util/paths.js).
 * Walking up three directories from the compiled location lands at the root.
 */
export function projectRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  // src/util → src → root (dev via tsx)
  // dist/util → dist → root (built)
  return path.resolve(here, '..', '..');
}

export function runDir(runId: string): string {
  return path.join(projectRoot(), 'runs', runId);
}

export function branchDir(runId: string, branchId: string): string {
  return path.join(runDir(runId), 'branches', branchId);
}

export function agentPromptPath(agentName: string): string {
  return path.join(projectRoot(), 'agents', `${agentName}.md`);
}

export function schemaPath(schemaName: string): string {
  return path.join(projectRoot(), 'schemas', `${schemaName}.schema.json`);
}

export function sourceCardDir(): string {
  return path.join(projectRoot(), 'corpus', 'source_cards');
}

export function patternsDir(): string {
  return path.join(projectRoot(), 'patterns');
}
