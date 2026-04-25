import fs from 'node:fs/promises';
import path from 'node:path';
import { readJson, runMarkdownStage, writeJson, writeText } from '../stage_util.js';
import { branchDir, runDir } from '../../util/paths.js';
import { checkForbiddenPhrases } from '../../lint/forbidden.js';
import { checkProvenance } from '../../lint/provenance.js';
import { loadKnownSourceCardIds } from '../../lint/source_cards.js';

interface Stage8Args {
  runId: string;
  survivingBranchId: string;
  blockedBranches: Array<{ branch_id: string; reason: string; blocking_finding: string }>;
}

interface GuidebookManifest {
  stage: '8_guidebook';
  schema_version: '1.0.0';
  run_id: string;
  surviving_branch: string;
  blocked_branches: Stage8Args['blockedBranches'];
  sections: Array<{ heading: string; anchor: string; provenance_dominant: string }>;
  source_cards_cited: string[];
  provenance_tag_counts: Record<string, number>;
  forbidden_phrase_check: { passed: boolean; violations: Array<{ phrase: string; location: string }> };
  assembly_rationale: string;
  human_required_next_steps: string[];
  provenance: { assembly: 'AGENT_INFERENCE' };
}

export async function runStageGuidebook(args: Stage8Args): Promise<void> {
  const bd = branchDir(args.runId, args.survivingBranchId);
  const card = await readJson(path.join(bd, 'branch_card.json'));
  const spec = await readJson(path.join(bd, 'prototype_spec.json'));
  const walkthrough = await fs.readFile(path.join(bd, 'simulated_walkthrough.md'), 'utf8');
  const audit = await readJson(path.join(bd, 'audit.json'));
  const reviewsDir = path.join(bd, 'reviews');
  const reviewFiles = await fs.readdir(reviewsDir).catch(() => [] as string[]);
  const reviews: unknown[] = [];
  for (const f of reviewFiles) {
    if (f.endsWith('.json')) {
      reviews.push(await readJson(path.join(reviewsDir, f)));
    }
  }
  const meta = await readJson(path.join(bd, 'meta_review.json'));
  const premisePath = path.join(runDir(args.runId), 'premise_card.json');
  const premise = await readJson(premisePath);

  const knownCards = await loadKnownSourceCardIds();

  const userMessage =
    `run_id: ${args.runId}\nsurviving_branch: ${args.survivingBranchId}\n\n` +
    `premise_card.json:\n${JSON.stringify(premise, null, 2)}\n\n` +
    `branch_card.json:\n${JSON.stringify(card, null, 2)}\n\n` +
    `prototype_spec.json:\n${JSON.stringify(spec, null, 2)}\n\n` +
    `simulated_walkthrough.md:\n${walkthrough}\n\n` +
    `audit.json:\n${JSON.stringify(audit, null, 2)}\n\n` +
    `reviewer findings:\n${JSON.stringify(reviews, null, 2)}\n\n` +
    `meta_review.json:\n${JSON.stringify(meta, null, 2)}\n\n` +
    `Valid source_card IDs (for [SOURCE_CARD:<id>] tags): ${knownCards.join(', ')}.\n\n` +
    `Produce PROBE_GUIDEBOOK.md with all six sections. Every paragraph, bullet, ` +
    `blockquote, and list item must end with a provenance tag. Include at least ` +
    `one [HUMAN_REQUIRED] element in the next-steps section.`;

  const markdown = await runMarkdownStage({
    runId: args.runId,
    stage: '8_guidebook',
    agentName: 'guidebook',
    model: 'opus',
    userMessage,
    maxTokens: 8192,
    temperature: 0.5,
    postValidate: (md) => {
      const provResult = checkProvenance(md, { knownSourceCards: knownCards });
      const voiceResult = checkForbiddenPhrases(md);
      const violations = [...provResult.violations, ...voiceResult.violations];
      return { passed: violations.length === 0, violations };
    },
  });

  const guidebookPath = path.join(runDir(args.runId), 'PROBE_GUIDEBOOK.md');
  await writeText(guidebookPath, markdown);

  const manifest = buildManifest({
    runId: args.runId,
    survivingBranchId: args.survivingBranchId,
    blockedBranches: args.blockedBranches,
    markdown,
    knownCards,
  });
  await writeJson(path.join(runDir(args.runId), 'guidebook_manifest.json'), manifest);
}

function buildManifest(params: {
  runId: string;
  survivingBranchId: string;
  blockedBranches: Stage8Args['blockedBranches'];
  markdown: string;
  knownCards: string[];
}): GuidebookManifest {
  const prov = checkProvenance(params.markdown, { knownSourceCards: params.knownCards });
  const voice = checkForbiddenPhrases(params.markdown);

  const sectionHeaders = Array.from(
    params.markdown.matchAll(/^##\s+(.+)$/gm),
    (m) => m[1].trim(),
  );

  const sections = sectionHeaders.map((heading) => ({
    heading,
    anchor: heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    provenance_dominant: 'AGENT_INFERENCE',
  }));

  const humanNextSteps = Array.from(
    params.markdown.matchAll(/^[^\n]*\[HUMAN_REQUIRED\][^\n]*$/gm),
    (m) => m[0].replace(/\[HUMAN_REQUIRED\]/, '').trim(),
  );

  return {
    stage: '8_guidebook',
    schema_version: '1.0.0',
    run_id: params.runId,
    surviving_branch: params.survivingBranchId,
    blocked_branches: params.blockedBranches,
    sections,
    source_cards_cited: Array.from(new Set(prov.sourceCardsReferenced)),
    provenance_tag_counts: prov.tagCounts,
    forbidden_phrase_check: {
      passed: voice.passed,
      violations: voice.violations.map((v) => ({ phrase: v.split(':')[1]?.trim() ?? v, location: v })),
    },
    assembly_rationale: `Branch ${params.survivingBranchId} survived capture-risk audit and meta-review; it provides the sole basis for this guidebook. Blocked branches: ${params.blockedBranches.map((b) => b.branch_id).join(', ') || 'none'}.`,
    human_required_next_steps: humanNextSteps.slice(0, 10),
    provenance: { assembly: 'AGENT_INFERENCE' },
  };
}
