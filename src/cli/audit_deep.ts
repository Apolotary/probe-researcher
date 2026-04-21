import { runDeepAudit } from '../managed_agents/deep_audit.js';

interface AuditDeepOptions {
  dryRun?: boolean;
}

export async function auditDeepCommand(
  runId: string,
  branchId: string,
  opts: AuditDeepOptions,
): Promise<void> {
  await runDeepAudit({ runId, branchId, dryRun: opts.dryRun ?? false });
}
