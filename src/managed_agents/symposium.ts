/**
 * Agent symposium — v2 feature (scaffold for submission, full feature for v2).
 *
 * Takes N run_ids of completed Probe runs, reads each run's
 * PROBE_GUIDEBOOK.md, hands them all to a convener agent (Managed Agents
 * session with file/bash access), and produces a disagreement-preserving
 * convener report.
 *
 * The convener report is NOT a synthesis paper. It is a map of the
 * argumentative space across N adjacent premises, suitable for planning a
 * real workshop. It explicitly preserves disagreement rather than
 * collapsing it.
 *
 *   probe symposium run_id1 run_id2 run_id3 [...]
 *
 * Minimum: 2 runs; recommended: 3-6 runs on adjacent premises.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import Anthropic from '@anthropic-ai/sdk';
import { agentPromptPath, projectRoot, runDir } from '../util/paths.js';
import { brand, palette } from '../ui/theme.js';
import { checkProvenance } from '../lint/provenance.js';
import { checkForbiddenPhrases } from '../lint/forbidden.js';

export interface SymposiumOptions {
  runIds: string[];
  outputDir?: string;
}

export async function runSymposium(opts: SymposiumOptions): Promise<void> {
  const { runIds } = opts;
  if (runIds.length < 2) {
    throw new Error('symposium requires at least 2 runs; recommended 3-6 on adjacent premises');
  }
  const outputDir = opts.outputDir ?? path.join(projectRoot(), 'symposium');
  await fs.mkdir(outputDir, { recursive: true });

  // Load each run's guidebook
  const guidebooks: Array<{ runId: string; text: string }> = [];
  for (const id of runIds) {
    const p = path.join(runDir(id), 'PROBE_GUIDEBOOK.md');
    try {
      const text = await fs.readFile(p, 'utf8');
      guidebooks.push({ runId: id, text });
    } catch {
      throw new Error(`symposium: run ${id} has no PROBE_GUIDEBOOK.md at ${p}. Run the full pipeline first.`);
    }
  }

  console.log(brand.header('\n🏛  probe symposium'));
  console.log(chalk.hex(palette.dim)(`participants: ${guidebooks.length} guidebooks`));
  for (const g of guidebooks) {
    console.log(chalk.hex(palette.dim)(`  · ${g.runId}  (${g.text.length} chars)`));
  }
  console.log('');

  const system = await fs.readFile(agentPromptPath('symposium-convener'), 'utf8');

  // For the submission-scope scaffold: single Messages API call rather than
  // a full Managed Agents session. The Managed Agents version (with multi-
  // agent coordination) is in the V2 roadmap.
  const client = new Anthropic();

  const userMessage =
    `You are convening ${guidebooks.length} Probe-run position papers. ` +
    `Produce the convener report per your system prompt.\n\n` +
    guidebooks
      .map(
        (g, i) =>
          `### Participant ${i + 1}: runs/${g.runId}/PROBE_GUIDEBOOK.md\n\n${g.text}\n\n---\n`,
      )
      .join('\n') +
    `\n\nReturn the convener report as markdown. Every paragraph, bullet, and blockquote ends with exactly one provenance tag. Include at least one [HUMAN_REQUIRED] at the end.`;

  console.log(chalk.hex(palette.stage)('convening...'));
  const start = Date.now();
  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 8192,
    system,
    messages: [{ role: 'user', content: userMessage }],
  });
  const durationMs = Date.now() - start;

  const text = response.content
    .filter((c): c is Anthropic.Messages.TextBlock => c.type === 'text')
    .map((c) => c.text)
    .join('');

  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;
  const usd = (inputTokens / 1_000_000) * 5 + (outputTokens / 1_000_000) * 25;

  console.log(chalk.hex(palette.passed)(`✓ convener produced ${outputTokens} tokens  ·  $${usd.toFixed(4)}  ·  ${(durationMs / 1000).toFixed(1)}s`));

  // Lint the convener's output
  const provResult = checkProvenance(text);
  const voiceResult = checkForbiddenPhrases(text);
  const lintPassed = provResult.passed && voiceResult.passed;

  // Write output
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const reportPath = path.join(outputDir, `convener_report_${stamp}.md`);
  await fs.writeFile(reportPath, text);

  const manifest = {
    timestamp: new Date().toISOString(),
    participants: runIds,
    model: response.model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    usd,
    duration_ms: durationMs,
    lint_passed: lintPassed,
    provenance_violations: provResult.violations,
    voice_violations: voiceResult.violations,
    tag_counts: provResult.tagCounts,
  };
  await fs.writeFile(
    path.join(outputDir, `convener_manifest_${stamp}.json`),
    JSON.stringify(manifest, null, 2),
  );

  console.log(chalk.hex(palette.passed)(`✓ wrote ${reportPath}`));
  if (lintPassed) {
    console.log(chalk.hex(palette.passed)('✓ convener report passes both linters'));
  } else {
    console.log(chalk.hex(palette.revision)(`⚠  lint failed: ${provResult.violations.length} provenance, ${voiceResult.violations.length} voice`));
    for (const v of provResult.violations.slice(0, 5)) console.log(chalk.hex(palette.dim)(`    ${v}`));
    for (const v of voiceResult.violations.slice(0, 5)) console.log(chalk.hex(palette.dim)(`    ${v}`));
  }
}
