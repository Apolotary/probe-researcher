import fs from 'node:fs/promises';
import path from 'node:path';
import { branchCommit, readJson, runJsonStage, writeJson } from '../stage_util.js';
import { branchDir } from '../../util/paths.js';

interface Stage7Args {
  runId: string;
  branchId: string;
  /** If true, run the optional novelty hawk reviewer (Stage 7c). */
  includeNovelty?: boolean;
}

interface ReviewerFinding {
  reviewer_persona: string;
  decisive_weakness: string;
  recommendation: string;
  [k: string]: unknown;
}

interface MetaReview {
  verdict: 'accept_revise' | 'reject' | 'human_judgment_required';
  disagreement_classification: string;
  [k: string]: unknown;
}

/**
 * Runs all adversarial reviewers in sequence (not parallel — each is cheap
 * relative to whole-branch cost, and keeping them serial avoids interleaved
 * cost log entries). Returns the meta-review verdict so the orchestrator
 * knows whether to advance this branch to guidebook assembly.
 */
export async function runStageReviewers(args: Stage7Args): Promise<MetaReview['verdict']> {
  const bd = branchDir(args.runId, args.branchId);
  const reviewsDir = path.join(bd, 'reviews');
  await fs.mkdir(reviewsDir, { recursive: true });

  const card = await readJson(path.join(bd, 'branch_card.json'));
  const spec = await readJson(path.join(bd, 'prototype_spec.json'));
  const walkthrough = await fs.readFile(path.join(bd, 'simulated_walkthrough.md'), 'utf8');
  const audit = await readJson(path.join(bd, 'audit.json'));

  const commonInput =
    `run_id: ${args.runId}\nbranch_id: ${args.branchId}\n\n` +
    `branch_card.json:\n${JSON.stringify(card, null, 2)}\n\n` +
    `prototype_spec.json:\n${JSON.stringify(spec, null, 2)}\n\n` +
    `simulated_walkthrough.md:\n${walkthrough}\n\n` +
    `audit.json:\n${JSON.stringify(audit, null, 2)}\n\n`;

  // 7a methodologist
  const methodologist = (await runJsonStage({
    runId: args.runId,
    branchId: args.branchId,
    stage: '7a_methodologist',
    agentName: 'reviewer-method',
    model: 'opus',
    userMessage: commonInput + `Return methodologist review as JSON matching reviewer_finding.schema.json.`,
    schemaName: 'reviewer_finding',
    maxTokens: 6144,
    temperature: 0.5,
    postValidate: (data) => {
      const r = data as ReviewerFinding;
      return r.reviewer_persona === 'methodologist'
        ? { passed: true, reason: 'ok' }
        : { passed: false, reason: 'reviewer_persona must be "methodologist"' };
    },
  })) as ReviewerFinding;
  await writeJson(path.join(reviewsDir, 'methodologist.json'), methodologist);
  await branchCommit(
    args.runId,
    args.branchId,
    `stage-7a [branch-${args.branchId}]: methodologist ${methodologist.recommendation}`,
  );

  // 7b accessibility advocate
  const accessibility = (await runJsonStage({
    runId: args.runId,
    branchId: args.branchId,
    stage: '7b_accessibility',
    agentName: 'reviewer-access',
    model: 'opus',
    userMessage: commonInput + `Return accessibility advocate review as JSON matching reviewer_finding.schema.json.`,
    schemaName: 'reviewer_finding',
    maxTokens: 6144,
    temperature: 0.5,
    postValidate: (data) => {
      const r = data as ReviewerFinding;
      return r.reviewer_persona === 'accessibility_advocate'
        ? { passed: true, reason: 'ok' }
        : { passed: false, reason: 'reviewer_persona must be "accessibility_advocate"' };
    },
  })) as ReviewerFinding;
  await writeJson(path.join(reviewsDir, 'accessibility.json'), accessibility);
  await branchCommit(
    args.runId,
    args.branchId,
    `stage-7b [branch-${args.branchId}]: accessibility advocate ${accessibility.recommendation}`,
  );

  let novelty: ReviewerFinding | null = null;
  if (args.includeNovelty) {
    novelty = (await runJsonStage({
      runId: args.runId,
      branchId: args.branchId,
      stage: '7c_novelty',
      agentName: 'reviewer-novelty',
      model: 'opus',
      userMessage: commonInput + `Return novelty hawk review as JSON matching reviewer_finding.schema.json.`,
      schemaName: 'reviewer_finding',
      maxTokens: 3072,
      temperature: 0.5,
      postValidate: (data) => {
        const r = data as ReviewerFinding;
        return r.reviewer_persona === 'novelty_hawk'
          ? { passed: true, reason: 'ok' }
          : { passed: false, reason: 'reviewer_persona must be "novelty_hawk"' };
      },
    })) as ReviewerFinding;
    await writeJson(path.join(reviewsDir, 'novelty.json'), novelty);
    await branchCommit(
      args.runId,
      args.branchId,
      `stage-7c [branch-${args.branchId}]: novelty hawk ${novelty.recommendation}`,
    );
  }

  // 7d meta-reviewer
  const reviewers: ReviewerFinding[] = novelty ? [methodologist, accessibility, novelty] : [methodologist, accessibility];
  const metaInput =
    `run_id: ${args.runId}\nbranch_id: ${args.branchId}\n\n` +
    reviewers
      .map((r) => `${r.reviewer_persona} review:\n${JSON.stringify(r, null, 2)}`)
      .join('\n\n') +
    `\n\nReturn meta_review JSON matching schemas/meta_review.schema.json.`;

  const meta = (await runJsonStage({
    runId: args.runId,
    branchId: args.branchId,
    stage: '7d_meta',
    agentName: 'reviewer-meta',
    model: 'opus',
    userMessage: metaInput,
    schemaName: 'meta_review',
    maxTokens: 2048,
    temperature: 0.4,
  })) as MetaReview;

  await writeJson(path.join(bd, 'meta_review.json'), meta);
  await branchCommit(
    args.runId,
    args.branchId,
    `stage-7d [branch-${args.branchId}]: meta-review ${meta.verdict} (${meta.disagreement_classification})`,
  );

  return meta.verdict;
}
