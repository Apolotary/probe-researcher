#!/usr/bin/env tsx
/**
 * Opus 4.7 vs Sonnet 4.6 ablation on stage 7a (methodologist).
 *
 * The demo_run has a methodologist review of Branch B that (per the five-LLM
 * judge panel) catches the announcement-duration confound. The project's
 * capability claim is that Opus is necessary for this kind of specific,
 * evidence-anchored critique. This script tests that by re-running the
 * same prompt with Sonnet 4.6 and writing a side-by-side comparison.
 *
 * Usage:  tsx scripts/ablate_methodologist.ts [run_id] [branch_id]
 * Default: demo_run / b
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { callClaude } from '../src/anthropic/client.js';
import { parseJsonFromModel, validateAgainst } from '../src/schema/validate.js';
import { agentPromptPath, branchDir, runDir } from '../src/util/paths.js';
import { ensureRunDir } from '../src/orchestrator/run_dir.js';

const runId = process.argv[2] ?? 'demo_run';
const branchId = process.argv[3] ?? 'b';

async function main(): Promise<void> {
  const bd = branchDir(runId, branchId);
  const system = await fs.readFile(agentPromptPath('reviewer-method'), 'utf8');

  const card = JSON.parse(await fs.readFile(path.join(bd, 'branch_card.json'), 'utf8'));
  const spec = JSON.parse(await fs.readFile(path.join(bd, 'prototype_spec.json'), 'utf8'));
  const walkthrough = await fs.readFile(path.join(bd, 'simulated_walkthrough.md'), 'utf8');
  const audit = JSON.parse(await fs.readFile(path.join(bd, 'audit.json'), 'utf8'));

  const userMessage =
    `run_id: ${runId}\nbranch_id: ${branchId}\n\n` +
    `branch_card.json:\n${JSON.stringify(card, null, 2)}\n\n` +
    `prototype_spec.json:\n${JSON.stringify(spec, null, 2)}\n\n` +
    `simulated_walkthrough.md:\n${walkthrough}\n\n` +
    `audit.json:\n${JSON.stringify(audit, null, 2)}\n\n` +
    `Return methodologist review as JSON matching reviewer_finding.schema.json.`;

  const runOne = async (model: 'opus' | 'sonnet') => {
    let lastErrors = '';
    for (let attempt = 0; attempt < 2; attempt++) {
      const resp = await callClaude({
        stage: '7a_methodologist',
        runId: `ablation_${model}`,
        branchId,
        model,
        system,
        userMessage: attempt === 0
          ? userMessage
          : userMessage + `\n\nYour previous output failed schema validation:\n${lastErrors}\nReturn only the corrected JSON.`,
        maxTokens: 6144,
      });
      try {
        const parsed = parseJsonFromModel(resp.text);
        const result = await validateAgainst('reviewer_finding', parsed);
        if (result.valid) {
          return { parsed, usage: { input: resp.inputTokens, output: resp.outputTokens, usd: resp.usd, ms: resp.durationMs, model: resp.modelId } };
        }
        lastErrors = result.errors.join('\n');
        console.log(`  [${model}] attempt ${attempt + 1} schema errors: ${result.errors.slice(0, 3).join(' | ')}`);
      } catch (e) {
        lastErrors = `parse error: ${String((e as Error).message)}`;
        console.log(`  [${model}] attempt ${attempt + 1} parse error`);
      }
    }
    throw new Error(`${model} failed after repair: ${lastErrors}`);
  };

  // Pre-create ablation run dirs so the cost logger doesn't ENOENT.
  await ensureRunDir(`ablation_opus`);
  await ensureRunDir(`ablation_sonnet`);

  console.log(`[ablation] running methodologist on branch ${branchId} of ${runId}...`);
  console.log(`[ablation] calling Opus 4.7...`);
  const opus = await runOne('opus');
  console.log(`[ablation] Opus: ${opus.usage.output} output tokens, $${opus.usage.usd.toFixed(4)}, ${(opus.usage.ms / 1000).toFixed(1)}s`);

  console.log(`[ablation] calling Sonnet 4.6...`);
  const sonnet = await runOne('sonnet');
  console.log(`[ablation] Sonnet: ${sonnet.usage.output} output tokens, $${sonnet.usage.usd.toFixed(4)}, ${(sonnet.usage.ms / 1000).toFixed(1)}s`);

  // Persist both raw outputs + side-by-side summary
  await fs.mkdir(path.join(runDir(runId), 'ablation'), { recursive: true });
  await fs.writeFile(
    path.join(runDir(runId), 'ablation', 'methodologist_opus.json'),
    JSON.stringify(opus.parsed, null, 2),
  );
  await fs.writeFile(
    path.join(runDir(runId), 'ablation', 'methodologist_sonnet.json'),
    JSON.stringify(sonnet.parsed, null, 2),
  );

  const comparison = buildComparison(opus, sonnet);
  await fs.mkdir('benchmarks', { recursive: true });
  await fs.writeFile('benchmarks/model_ablation_methodologist.md', comparison);
  console.log(`[ablation] wrote benchmarks/model_ablation_methodologist.md`);
}

function buildComparison(
  opus: { parsed: Record<string, unknown>; usage: { input: number; output: number; usd: number; ms: number; model: string } },
  sonnet: { parsed: Record<string, unknown>; usage: { input: number; output: number; usd: number; ms: number; model: string } },
): string {
  const lines: string[] = [];
  lines.push('# Ablation: Opus 4.7 vs Sonnet 4.6 on the methodologist reviewer');
  lines.push('');
  lines.push('## Setup');
  lines.push('');
  lines.push('Same system prompt (`agents/reviewer-method.md`), same input context (branch B of the demo run — the ARIA-live AI-disclosure study), same schema (`reviewer_finding.schema.json`), temperature omitted on both calls. The only variable changed is the model.');
  lines.push('');
  lines.push('## Cost and latency');
  lines.push('');
  lines.push('| Model | Output tokens | USD | Latency |');
  lines.push('|---|---|---|---|');
  lines.push(`| ${opus.usage.model} | ${opus.usage.output} | $${opus.usage.usd.toFixed(4)} | ${(opus.usage.ms / 1000).toFixed(1)}s |`);
  lines.push(`| ${sonnet.usage.model} | ${sonnet.usage.output} | $${sonnet.usage.usd.toFixed(4)} | ${(sonnet.usage.ms / 1000).toFixed(1)}s |`);
  lines.push('');
  lines.push('## Decisive weakness — the single most-important line of each review');
  lines.push('');
  lines.push('### Opus 4.7');
  lines.push('');
  lines.push('> ' + String((opus.parsed as { decisive_weakness?: string }).decisive_weakness ?? ''));
  lines.push('');
  lines.push('### Sonnet 4.6');
  lines.push('');
  lines.push('> ' + String((sonnet.parsed as { decisive_weakness?: string }).decisive_weakness ?? ''));
  lines.push('');
  lines.push('## Recommendations');
  lines.push('');
  lines.push(`- **Opus 4.7:** \`${String((opus.parsed as { recommendation?: string }).recommendation ?? '')}\``);
  lines.push(`- **Sonnet 4.6:** \`${String((sonnet.parsed as { recommendation?: string }).recommendation ?? '')}\``);
  lines.push('');
  lines.push('## Criticism counts and severity distribution');
  lines.push('');
  const opusCriticisms = (opus.parsed as { criticisms?: Array<{ severity?: string }> }).criticisms ?? [];
  const sonnetCriticisms = (sonnet.parsed as { criticisms?: Array<{ severity?: string }> }).criticisms ?? [];
  const sevCount = (arr: Array<{ severity?: string }>) => ({
    blocking: arr.filter((c) => c.severity === 'blocking').length,
    major: arr.filter((c) => c.severity === 'major').length,
    minor: arr.filter((c) => c.severity === 'minor').length,
  });
  const opusSev = sevCount(opusCriticisms);
  const sonnetSev = sevCount(sonnetCriticisms);
  lines.push('| Model | Total | Blocking | Major | Minor |');
  lines.push('|---|---|---|---|---|');
  lines.push(`| Opus 4.7 | ${opusCriticisms.length} | ${opusSev.blocking} | ${opusSev.major} | ${opusSev.minor} |`);
  lines.push(`| Sonnet 4.6 | ${sonnetCriticisms.length} | ${sonnetSev.blocking} | ${sonnetSev.major} | ${sonnetSev.minor} |`);
  lines.push('');
  lines.push('## Full criticisms');
  lines.push('');
  lines.push('### Opus 4.7 criticisms');
  lines.push('');
  for (const c of opusCriticisms) {
    lines.push(`- **[${String((c as { severity?: string }).severity ?? '')}] ${String((c as { violated_criterion?: string }).violated_criterion ?? '')}**`);
    const ev = (c as { evidence_span?: { source?: string; quote?: string } }).evidence_span;
    if (ev) lines.push(`  - Evidence (${ev.source}): *${ev.quote}*`);
    lines.push(`  - Why: ${String((c as { why_matters?: string }).why_matters ?? '')}`);
    lines.push(`  - Required change: ${String((c as { required_change?: string }).required_change ?? '')}`);
    lines.push('');
  }
  lines.push('### Sonnet 4.6 criticisms');
  lines.push('');
  for (const c of sonnetCriticisms) {
    lines.push(`- **[${String((c as { severity?: string }).severity ?? '')}] ${String((c as { violated_criterion?: string }).violated_criterion ?? '')}**`);
    const ev = (c as { evidence_span?: { source?: string; quote?: string } }).evidence_span;
    if (ev) lines.push(`  - Evidence (${ev.source}): *${ev.quote}*`);
    lines.push(`  - Why: ${String((c as { why_matters?: string }).why_matters ?? '')}`);
    lines.push(`  - Required change: ${String((c as { required_change?: string }).required_change ?? '')}`);
    lines.push('');
  }
  lines.push('## Does Sonnet catch the announcement-duration confound?');
  lines.push('');
  lines.push('The single most notable finding in the Opus run is the announcement-duration confound ("AI disclosure is 18 words / ~6 seconds vs. human framing at 5 words / ~2 seconds"). This is the claim Probe uses as evidence that Opus produces specific, methodologically sharp critique.');
  lines.push('');
  const sonnetHitsConfound = JSON.stringify(sonnet.parsed).toLowerCase().includes('duration') ||
    JSON.stringify(sonnet.parsed).toLowerCase().includes('second') ||
    JSON.stringify(sonnet.parsed).toLowerCase().includes('word');
  const opusHitsConfound = JSON.stringify(opus.parsed).toLowerCase().includes('duration') ||
    JSON.stringify(opus.parsed).toLowerCase().includes('second') ||
    JSON.stringify(opus.parsed).toLowerCase().includes('word');
  lines.push(`- Opus 4.7 mentions duration/seconds/words: **${opusHitsConfound ? 'YES' : 'NO'}**`);
  lines.push(`- Sonnet 4.6 mentions duration/seconds/words: **${sonnetHitsConfound ? 'YES' : 'NO'}**`);
  lines.push('');
  lines.push('This check is lexical only — it says whether the confound surfaced at all, not whether the model quantified it the way Opus did. Read the full criticisms above for the qualitative comparison.');
  lines.push('');
  lines.push('## Conclusion');
  lines.push('');
  lines.push('This ablation is a single data point, not a definitive capability claim. What it shows is whether, on this specific prompt and input context, the two models differ in:');
  lines.push('- which concrete evidence spans they select');
  lines.push('- how specific their required-change instructions are');
  lines.push('- whether they catch the quantitative confound Probe\'s project status cites as the strongest Opus evidence');
  lines.push('');
  lines.push('Raw outputs are committed alongside this file for manual inspection:');
  lines.push(`- \`runs/${process.argv[2] ?? 'demo_run'}/ablation/methodologist_opus.json\``);
  lines.push(`- \`runs/${process.argv[2] ?? 'demo_run'}/ablation/methodologist_sonnet.json\``);
  lines.push('');
  lines.push('*Generated by `scripts/ablate_methodologist.ts` on ' + new Date().toISOString().split('T')[0] + '.*');
  return lines.join('\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
