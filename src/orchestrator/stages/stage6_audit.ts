import fs from 'node:fs/promises';
import path from 'node:path';
import { branchCommit, readJson, runJsonStage, writeJson, writeText } from '../stage_util.js';
import { branchDir, patternsDir } from '../../util/paths.js';

interface Stage6Args {
  runId: string;
  branchId: string;
}

interface Finding {
  pattern_id: string;
  axis: 'capacity' | 'agency' | 'exit' | 'legibility';
  fired: boolean;
  score: number;
  evidence_span?: { source: string; quote: string };
  rationale: string;
}

interface Audit {
  findings: Finding[];
  verdict: 'PASSED' | 'REVISION_REQUIRED' | 'BLOCKED';
  axis_scores: Record<string, number>;
  [k: string]: unknown;
}

/**
 * Returns the Stage 6 verdict so the orchestrator can decide whether to
 * continue with reviewers or emit WORKSHOP_NOT_RECOMMENDED.
 */
export async function runStageAudit(args: Stage6Args): Promise<Audit['verdict']> {
  const bd = branchDir(args.runId, args.branchId);
  const spec = await readJson(path.join(bd, 'prototype_spec.json'));
  const walkthrough = await fs.readFile(path.join(bd, 'simulated_walkthrough.md'), 'utf8');
  const patterns = await loadPatterns();
  const validPatternIds = extractPatternIds(patterns);

  const userMessage =
    `run_id: ${args.runId}\nbranch_id: ${args.branchId}\n\n` +
    `prototype_spec.json:\n${JSON.stringify(spec, null, 2)}\n\n` +
    `simulated_walkthrough.md:\n${walkthrough}\n\n` +
    `Pattern library (use these exact pattern_ids; produce one finding per pattern):\n\n${patterns}\n\n` +
    `Return JSON matching schemas/audit.schema.json with all 16 findings.`;

  const parsed = (await runJsonStage({
    runId: args.runId,
    branchId: args.branchId,
    stage: '6_audit',
    agentName: 'auditor',
    model: 'opus',
    userMessage,
    schemaName: 'audit',
    maxTokens: 6144,
    temperature: 0.4,
    postValidate: (data) => {
      const a = data as Audit;
      if (a.findings.length < 16) {
        return { passed: false, reason: `expected 16 findings (one per pattern), got ${a.findings.length}` };
      }
      const seen = new Set<string>();
      for (const f of a.findings) {
        if (!validPatternIds.has(f.pattern_id)) {
          return { passed: false, reason: `unknown pattern_id "${f.pattern_id}"` };
        }
        seen.add(f.pattern_id);
        if (f.fired && !f.evidence_span) {
          return { passed: false, reason: `pattern ${f.pattern_id} fired but has no evidence_span` };
        }
      }
      if (seen.size < validPatternIds.size) {
        const missing = Array.from(validPatternIds).filter((id) => !seen.has(id));
        return { passed: false, reason: `missing patterns: ${missing.join(', ')}` };
      }
      return { passed: true, reason: 'ok' };
    },
  })) as Audit;

  // The orchestrator — not the model — is the source of truth for the
  // verdict. Compute it from the findings and overwrite any inconsistent
  // self-report from the agent.
  const hasMinusTwo = parsed.findings.some((f) => f.score === -2);
  const countMinusOne = parsed.findings.filter((f) => f.score === -1).length;
  const computedVerdict: Audit['verdict'] = hasMinusTwo
    ? 'BLOCKED'
    : countMinusOne >= 2
      ? 'REVISION_REQUIRED'
      : 'PASSED';
  if (parsed.verdict !== computedVerdict) {
    parsed.verdict = computedVerdict;
  }
  // Recompute axis_scores from findings rather than trusting the model.
  parsed.axis_scores = {
    capacity: parsed.findings.filter((f) => f.axis === 'capacity').reduce((a, f) => a + f.score, 0),
    agency: parsed.findings.filter((f) => f.axis === 'agency').reduce((a, f) => a + f.score, 0),
    exit: parsed.findings.filter((f) => f.axis === 'exit').reduce((a, f) => a + f.score, 0),
    legibility: parsed.findings.filter((f) => f.axis === 'legibility').reduce((a, f) => a + f.score, 0),
  };

  await writeJson(path.join(bd, 'audit.json'), parsed);
  await writeText(path.join(bd, 'audit.md'), renderAudit(parsed));
  await branchCommit(
    args.runId,
    args.branchId,
    `stage-6 [branch-${args.branchId}]: capture-risk audit verdict ${parsed.verdict}`,
  );
  return parsed.verdict;
}

async function loadPatterns(): Promise<string> {
  const dir = patternsDir();
  const files = ['capacity.yaml', 'agency.yaml', 'exit.yaml', 'legibility.yaml'];
  const out: string[] = [];
  for (const f of files) {
    out.push(`--- ${f} ---\n${await fs.readFile(path.join(dir, f), 'utf8')}\n`);
  }
  return out.join('\n');
}

function extractPatternIds(patternsText: string): Set<string> {
  const ids = new Set<string>();
  const re = /^\s*-\s*id:\s*([a-z_.]+)/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(patternsText)) !== null) ids.add(m[1]);
  return ids;
}

function renderAudit(a: Audit): string {
  const lines: string[] = [];
  lines.push(`# Capture-risk audit`);
  lines.push('');
  lines.push(`**Verdict:** ${a.verdict}`);
  lines.push('');
  lines.push(`## Axis scores`);
  lines.push('');
  lines.push(`| axis | score |`);
  lines.push(`|------|-------|`);
  for (const [k, v] of Object.entries(a.axis_scores)) {
    lines.push(`| ${k} | ${v} |`);
  }
  lines.push('');
  lines.push(`## Findings`);
  lines.push('');
  for (const f of a.findings) {
    if (!f.fired) continue;
    lines.push(`### ${f.pattern_id} (score ${f.score})`);
    lines.push('');
    if (f.evidence_span) {
      lines.push(`> **Evidence (${f.evidence_span.source}):** ${f.evidence_span.quote}`);
      lines.push('');
    }
    lines.push(f.rationale);
    lines.push('');
  }
  const notFired = a.findings.filter((f) => !f.fired);
  if (notFired.length > 0) {
    lines.push(`## Patterns not fired`);
    lines.push('');
    for (const f of notFired) {
      lines.push(`- **${f.pattern_id}**: ${f.rationale}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}
