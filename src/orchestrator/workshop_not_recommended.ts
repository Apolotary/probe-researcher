import path from 'node:path';
import { readJson, writeText } from './stage_util.js';
import { branchDir } from '../util/paths.js';

interface WnrArgs {
  runId: string;
  branchId: string;
  reason: string;
  blockingFinding: string;
}

/**
 * Emitted when a branch is BLOCKED by the audit or rejected by the meta-
 * reviewer. The document is deliberately structured so a researcher can
 * hand it to a collaborator as evidence for the design direction change.
 */
export async function writeWorkshopNotRecommended(args: WnrArgs): Promise<void> {
  const bd = branchDir(args.runId, args.branchId);
  const card = await readJson<{
    research_question: string;
    intervention_primitive: string;
    one_sentence_claim: string;
  }>(path.join(bd, 'branch_card.json'));

  let audit: { verdict: string; findings: Array<{ pattern_id: string; fired: boolean; score: number; evidence_span?: { source: string; quote: string }; rationale: string }> } | null = null;
  try {
    audit = await readJson(path.join(bd, 'audit.json'));
  } catch {
    /* audit not present; blocking came from reviewers */
  }

  const lines: string[] = [];
  lines.push(`# WORKSHOP NOT RECOMMENDED — branch ${args.branchId}`);
  lines.push('');
  lines.push(`This branch should not be advanced to a human study in its current form. [AGENT_INFERENCE]`);
  lines.push('');
  lines.push(`## Original intent`);
  lines.push('');
  lines.push(`- **Research question:** ${card.research_question}`);
  lines.push(`- **Intervention primitive:** ${card.intervention_primitive}`);
  lines.push(`- **Claim:** ${card.one_sentence_claim}`);
  lines.push('');
  lines.push(`## Why blocked`);
  lines.push('');
  lines.push(`${args.reason} [AGENT_INFERENCE]`);
  lines.push('');
  lines.push(`Blocking finding: \`${args.blockingFinding}\``);
  lines.push('');
  if (audit) {
    const blocking = audit.findings.filter((f) => f.fired && f.score <= -1);
    if (blocking.length > 0) {
      lines.push(`## Capture-risk audit findings`);
      lines.push('');
      for (const f of blocking) {
        lines.push(`### ${f.pattern_id} (score ${f.score})`);
        lines.push('');
        if (f.evidence_span) {
          lines.push(`> **Evidence (${f.evidence_span.source}):** ${f.evidence_span.quote}`);
          lines.push('');
        }
        lines.push(`${f.rationale} [AGENT_INFERENCE]`);
        lines.push('');
      }
    }
  }
  lines.push(`## What to reconsider`);
  lines.push('');
  lines.push(
    `Redesign the intervention so the blocking pattern no longer fires before re-running Probe. Or reframe the research question so the blocking pattern is not load-bearing on the contribution. [AGENT_INFERENCE]`,
  );
  lines.push('');
  lines.push(`## Next step`);
  lines.push('');
  lines.push(
    `A human researcher must review this finding, decide whether the blocking pattern is a mis-application (in which case file an issue against the pattern library) or a real design problem (in which case redesign), and document the decision before proceeding. [HUMAN_REQUIRED]`,
  );
  lines.push('');

  await writeText(path.join(bd, 'WORKSHOP_NOT_RECOMMENDED.md'), lines.join('\n'));
}
