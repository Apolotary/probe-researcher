/**
 * `probe import <paper.md>` — warm-start a run from an existing paper draft.
 *
 * Reads the paper, runs an Opus/Sonnet classifier that segments it into
 * Probe's schema buckets (premise / related_work / prototype / method /
 * rehearsal / findings / discussion / limitations), and writes:
 *
 *   runs/<run_id>/
 *     premise.md                     — verbatim paper premise
 *     premise_card.json              — synthetic Stage 1 output
 *     imported_manifest.json         — full section-level manifest
 *     branches/a/
 *       branch_card.json             — synthetic Stage 2/3 output, imported=true
 *       prototype_spec.{json,md}     — synthetic Stage 4 output from method bucket
 *       simulated_walkthrough.md     — synthetic Stage 5 output from rehearsal bucket
 *                                      (skipped with a [HUMAN_REQUIRED] note if
 *                                      the paper has real findings instead)
 *
 * After import, the researcher runs Stage 6-8 over the imported content:
 *
 *   probe run --run-id <id> --skip 1,2,3,4,5 "<paper's own premise>"
 *
 * The audit and reviewer panel then critique the draft, not a rehearsal.
 *
 * This is v1 — single branch, markdown input only. v2 will generate multiple
 * alternate-framing branches and accept LaTeX.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import { callClaude } from '../anthropic/client.js';
import { parseJsonFromModel, validateAgainst } from '../schema/validate.js';
import { ensureRunDir } from '../orchestrator/run_dir.js';
import { runDir, branchDir, projectRoot, agentPromptPath } from '../util/paths.js';
import { palette } from '../ui/theme.js';

interface ImportOptions {
  runId?: string;
}

interface ImportedSection {
  id: string;
  bucket:
    | 'premise'
    | 'related_work'
    | 'prototype'
    | 'method'
    | 'rehearsal'
    | 'findings'
    | 'discussion'
    | 'limitations'
    | 'other';
  heading: string;
  content: string;
  start_line: number;
  end_line: number;
  rationale?: string;
  confidence?: 'high' | 'medium' | 'low';
}

interface ImportedManifest {
  stage: '0_import';
  schema_version: '1.0.0';
  run_id: string;
  source_file: string;
  source_format: 'markdown' | 'latex' | 'text';
  source_word_count?: number;
  sections: ImportedSection[];
  inferred_premise_text: string;
  inferred_method_summary: string;
  contains_real_user_data?: boolean;
  provenance: {
    classifier_model: string;
    classifier_run_at: string;
  };
}

export async function importCommand(sourceFile: string, opts: ImportOptions): Promise<void> {
  const absSource = path.resolve(sourceFile);
  let raw: string;
  try {
    raw = await fs.readFile(absSource, 'utf8');
  } catch (e) {
    console.error(chalk.hex(palette.blocked)(`cannot read ${absSource}: ${String((e as Error).message)}`));
    process.exitCode = 2;
    return;
  }

  const sourceFormat: ImportedManifest['source_format'] = absSource.endsWith('.tex')
    ? 'latex'
    : absSource.endsWith('.md') || absSource.endsWith('.markdown')
      ? 'markdown'
      : 'text';

  const runId = opts.runId ?? generateImportRunId(absSource);
  await ensureRunDir(runId);

  console.log('');
  console.log(chalk.hex(palette.probe).bold(`📥 probe import · ${runId}`));
  console.log(chalk.hex(palette.dim)(`  source: ${path.relative(projectRoot(), absSource)}  (${raw.length} chars, ${raw.split(/\s+/).length} words)`));
  console.log(chalk.hex(palette.dim)(`  format: ${sourceFormat}`));
  console.log('');

  // Write the paper into the run directory so later stages can read it.
  await fs.writeFile(path.join(runDir(runId), 'premise.md'), buildSyntheticPremiseMd(raw));
  const importedSourcePath = path.join(runDir(runId), 'imported_source.md');
  await fs.writeFile(importedSourcePath, raw);

  console.log(chalk.hex(palette.stage)('  classifying sections...'));
  const manifest = await classifyDraft({ runId, rawText: raw, sourceFile: absSource, sourceFormat });
  const manifestPath = path.join(runDir(runId), 'imported_manifest.json');
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(chalk.hex(palette.passed)(`  ✓ wrote ${path.relative(projectRoot(), manifestPath)} (${manifest.sections.length} sections)`));

  // Summary of what was found.
  const buckets = new Map<string, number>();
  for (const s of manifest.sections) {
    buckets.set(s.bucket, (buckets.get(s.bucket) ?? 0) + 1);
  }
  console.log('');
  console.log(chalk.hex(palette.stage)('  section distribution'));
  for (const [bucket, count] of Array.from(buckets.entries()).sort()) {
    console.log(`    ${bucket.padEnd(16)} ${count}`);
  }
  if (manifest.contains_real_user_data) {
    console.log('');
    console.log(
      chalk.hex(palette.revision)(
        `  ⚠ paper contains real user-study data — audit will treat findings as evidence, not rehearsal`,
      ),
    );
  }

  // Generate stage-compatible artifacts so `probe run --skip 1,2,3,4,5` can
  // pick up from Stage 6 (audit) using this imported content.
  await writeSyntheticStageArtifacts(runId, manifest);

  console.log('');
  console.log(chalk.hex(palette.passed).bold(`✓ import complete — runs/${runId}/`));
  console.log('');
  console.log(chalk.hex(palette.dim)(`  next steps:`));
  console.log(
    chalk.hex(palette.dim)(
      `    probe stats ${runId}                              # dashboard view`,
    ),
  );
  console.log(
    chalk.hex(palette.dim)(
      `    probe run --run-id ${runId} --skip 1,2,3,4,5 "<premise>"  # audit + review the draft`,
    ),
  );
  console.log(
    chalk.hex(palette.dim)(
      `    probe audit-deep ${runId} a                       # managed-agent deep audit of the imported method`,
    ),
  );
  console.log('');
}

function generateImportRunId(sourceFile: string): string {
  const base = path.basename(sourceFile, path.extname(sourceFile));
  const slug = base.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 30);
  const d = new Date();
  const pad = (n: number): string => n.toString().padStart(2, '0');
  const stamp = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  const id = `import_${stamp}_${slug}`;
  return id.slice(0, 64);
}

function buildSyntheticPremiseMd(raw: string): string {
  // First ~300 chars of the raw paper, cleaned, as a fallback premise file.
  // The real premise will be in imported_manifest.json's inferred_premise_text
  // after the classifier runs.
  const trimmed = raw.replace(/^#[^\n]*\n+/, '').trim().slice(0, 600);
  return `# Research premise (imported)\n\nThis run was warm-started from an existing paper draft via \`probe import\`. See \`imported_manifest.json\` for the structured manifest and \`imported_source.md\` for the full draft.\n\nExtracted premise (first 600 chars of draft):\n\n${trimmed}\n`;
}

async function classifyDraft(args: {
  runId: string;
  rawText: string;
  sourceFile: string;
  sourceFormat: ImportedManifest['source_format'];
}): Promise<ImportedManifest> {
  const { runId, rawText, sourceFile, sourceFormat } = args;

  const system = await fs.readFile(agentPromptPath('import_classifier'), 'utf8');
  const userMessage = [
    `Classify this paper draft into Probe's pipeline schema. The paper is ${rawText.length} characters long (${rawText.split(/\s+/).length} words).`,
    '',
    'Return ONLY these top-level JSON fields: `sections`, `inferred_premise_text`, `inferred_method_summary`, `contains_real_user_data` (boolean).',
    'The CLI will backfill run_id, stage, schema_version, source_file, source_format, and provenance.',
    '',
    '--- PAPER START ---',
    rawText,
    '--- PAPER END ---',
  ].join('\n');

  // Two attempts — the second is a focused repair if schema validation fails
  // after backfilling. The backfill logic handles the fields that are
  // deterministic (run_id, stage, provenance), so the model only has to get
  // the `sections` array and the two inferred fields right.
  let lastError = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    const repairSuffix =
      attempt === 0
        ? ''
        : `\n\nYour previous output failed schema validation:\n${lastError}\n\nReturn only the corrected JSON. Pay attention to per-section field shapes: every section must have id (matching ^sec_[a-z0-9_]{1,32}$), bucket (from the enum), heading, content (verbatim substring), start_line, end_line.`;

    const response = await callClaude({
      stage: '0_import' as const,
      runId,
      model: 'sonnet',
      system,
      userMessage: userMessage + repairSuffix,
      maxTokens: 16384,
    });

    let parsed: Partial<ImportedManifest>;
    try {
      parsed = parseJsonFromModel(response.text) as Partial<ImportedManifest>;
    } catch (e) {
      lastError = `JSON parse error: ${String(e).slice(0, 300)}`;
      if (attempt === 1) throw new Error(`classifier: ${lastError}`);
      continue;
    }

    // Backfill deterministic fields.
    const patched: ImportedManifest = {
      stage: '0_import',
      schema_version: '1.0.0',
      run_id: runId,
      source_file: sourceFile,
      source_format: sourceFormat,
      source_word_count: rawText.split(/\s+/).filter(Boolean).length,
      sections: parsed.sections ?? [],
      inferred_premise_text: parsed.inferred_premise_text ?? '',
      inferred_method_summary: parsed.inferred_method_summary ?? '',
      contains_real_user_data: parsed.contains_real_user_data,
      provenance: {
        classifier_model: 'claude-sonnet-4-6',
        classifier_run_at: new Date().toISOString(),
      },
    };

    const schemaResult = await validateAgainst('imported_manifest', patched);
    if (schemaResult.valid) {
      return patched;
    }
    lastError = schemaResult.errors.slice(0, 6).join('\n');
    if (attempt === 1) {
      throw new Error(`classifier schema validation failed after repair:\n${lastError}`);
    }
  }
  throw new Error('unreachable');
}

async function writeSyntheticStageArtifacts(runId: string, manifest: ImportedManifest): Promise<void> {
  const rd = runDir(runId);
  const bd = branchDir(runId, 'a');
  await fs.mkdir(path.join(bd, 'reviews'), { recursive: true });

  // Stage 1 equivalent: premise_card.json.
  const premiseCard = {
    stage: '1_premise' as const,
    schema_version: '1.0.0',
    run_id: runId,
    original_premise: manifest.inferred_premise_text,
    sharpened_alternatives: [
      {
        alt_id: 'imported_as_is',
        one_sentence: manifest.inferred_premise_text.slice(0, 290),
        why_sharper: 'Imported verbatim from the researcher\'s draft; Probe is auditing rather than rewriting.',
        falsifiability_gain: 'n/a — this is the researcher\'s existing framing.',
      },
    ],
    provenance: {
      source: 'probe_import',
      imported_from: manifest.source_file,
      classifier_model: manifest.provenance.classifier_model,
    },
  };
  await fs.writeFile(path.join(rd, 'premise_card.json'), JSON.stringify(premiseCard, null, 2));

  // Stage 2 equivalent: branch_card.json (single branch 'a').
  const branchCard = {
    stage: '2_ideator' as const,
    schema_version: '1.0.0',
    run_id: runId,
    branch_id: 'a' as const,
    research_question: manifest.inferred_premise_text,
    intervention_primitive: extractByBucket(manifest, 'prototype').slice(0, 500) || 'see imported_manifest.json',
    human_system_relationship: 'Imported from paper draft — see imported_source.md for the researcher\'s own framing.',
    method_family: extractByBucket(manifest, 'method').slice(0, 300) || 'see imported_manifest.json',
    one_sentence_claim: manifest.inferred_premise_text.slice(0, 290),
    grounding: [],
    provenance: {
      source: 'probe_import',
      imported: true,
    },
  };
  await fs.writeFile(path.join(bd, 'branch_card.json'), JSON.stringify(branchCard, null, 2));

  // Stage 4 equivalent: prototype_spec.json + .md.
  const protoSpec = {
    stage: '4_prototype' as const,
    schema_version: '1.0.0',
    run_id: runId,
    branch_id: 'a' as const,
    title: (extractByBucket(manifest, 'prototype').slice(0, 80) || 'Imported prototype from paper draft').trim(),
    summary: extractByBucket(manifest, 'prototype') || 'See imported_source.md for the full prototype description.',
    wizard_controls: [],
    failure_cases: extractByBucket(manifest, 'limitations') || '',
    analysis_plan: manifest.inferred_method_summary,
    provenance: {
      source: 'probe_import',
      imported: true,
    },
  };
  await fs.writeFile(path.join(bd, 'prototype_spec.json'), JSON.stringify(protoSpec, null, 2));
  const protoMd = buildPrototypeMdFromManifest(manifest);
  await fs.writeFile(path.join(bd, 'prototype_spec.md'), protoMd);

  // Stage 5 equivalent: simulated_walkthrough.md.
  // - If the paper has rehearsal content, use that (tagged [IMPORTED_DRAFT:rehearsal]).
  // - If the paper has real findings, emit a [HUMAN_REQUIRED] note explaining
  //   that rehearsal is inappropriate here — the audit should treat findings
  //   as evidence, not rehearse over them.
  const rehearsalContent = extractByBucket(manifest, 'rehearsal');
  const findingsContent = extractByBucket(manifest, 'findings');
  const walkthrough = buildWalkthroughFromManifest(rehearsalContent, findingsContent, manifest);
  await fs.writeFile(path.join(bd, 'simulated_walkthrough.md'), walkthrough);
}

function extractByBucket(manifest: ImportedManifest, bucket: ImportedSection['bucket']): string {
  return manifest.sections
    .filter((s) => s.bucket === bucket)
    .map((s) => s.content.trim())
    .join('\n\n');
}

function buildPrototypeMdFromManifest(m: ImportedManifest): string {
  const lines: string[] = [];
  lines.push(`# Imported prototype spec — ${m.run_id}`);
  lines.push('');
  lines.push(`Imported from \`${m.source_file}\` via \`probe import\` on ${m.provenance.classifier_run_at}. [IMPORTED_DRAFT]`);
  lines.push('');
  lines.push('## Research question (imported)');
  lines.push('');
  lines.push(m.inferred_premise_text + ' [IMPORTED_DRAFT:premise]');
  lines.push('');
  const proto = extractByBucket(m, 'prototype');
  if (proto) {
    lines.push('## Prototype (imported verbatim)');
    lines.push('');
    lines.push(tagImportedBlock(proto, 'prototype'));
    lines.push('');
  }
  const method = extractByBucket(m, 'method');
  if (method) {
    lines.push('## Method (imported verbatim)');
    lines.push('');
    lines.push(tagImportedBlock(method, 'method'));
    lines.push('');
  }
  lines.push('## Method summary (classifier-generated)');
  lines.push('');
  lines.push(m.inferred_method_summary + ' [AGENT_INFERENCE]');
  lines.push('');
  lines.push('## Human handoff');
  lines.push('');
  lines.push(
    'The researcher should confirm that the classifier\'s section-to-bucket mapping in `imported_manifest.json` matches their intent before running the audit. [HUMAN_REQUIRED]',
  );
  return lines.join('\n') + '\n';
}

/**
 * Tag every content-bearing element in `text` with [IMPORTED_DRAFT:<section>].
 * Content-bearing = non-blank lines that are not markdown headings. Lines that
 * look like bullets (`- ` / `* ` / `N. `) and blockquote openers (`> `) each
 * need their own tag because the provenance linter walks them independently.
 */
function tagImportedBlock(text: string, section: string): string {
  const tag = ` [IMPORTED_DRAFT:${section}]`;
  return text
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed === '') return line;
      if (trimmed.startsWith('#')) return line; // markdown heading — not provenance-bearing
      if (trimmed.endsWith(']') && /\[[A-Z_]+(:[a-z0-9_-]+)?\]$/.test(trimmed)) {
        return line; // already tagged
      }
      return line + tag;
    })
    .join('\n');
}

function buildWalkthroughFromManifest(
  rehearsal: string,
  findings: string,
  m: ImportedManifest,
): string {
  const lines: string[] = [];
  lines.push(`# Imported walkthrough — ${m.run_id}`);
  lines.push('');
  if (findings || m.contains_real_user_data) {
    lines.push(
      'The imported paper contains real user-study data or participant observations. Probe does NOT rehearse over real findings — the downstream audit should critique the method that produced the findings, not the findings themselves. [HUMAN_REQUIRED]',
    );
    lines.push('');
    if (findings) {
      lines.push('## Imported findings (verbatim; NOT rehearsal)');
      lines.push('');
      lines.push(tagImportedBlock(findings, 'findings'));
      lines.push('');
    }
  }
  if (rehearsal) {
    lines.push('## Imported rehearsal / scenario content');
    lines.push('');
    lines.push(tagImportedBlock(rehearsal, 'rehearsal'));
    lines.push('');
  }
  if (!rehearsal && !findings) {
    lines.push(
      'The imported paper contains no explicit rehearsal content or real findings. If the researcher wants a Stage 5 rehearsal, they can generate one separately via the standard pipeline on the imported run id. [HUMAN_REQUIRED]',
    );
    lines.push('');
  }
  // Every walkthrough must end with a HUMAN_REQUIRED handoff — this is a
  // linter invariant applied across the document, not just the no-content
  // case above. The handoff tells the researcher what to verify before
  // Probe's downstream stages critique this content.
  lines.push('## Handoff');
  lines.push('');
  lines.push(
    'Before running Stage 6 audit or Stage 7 reviewer panel against this imported run, the researcher should confirm: (a) the classifier\'s bucket assignment in `imported_manifest.json` is correct; (b) any `[IMPORTED_DRAFT:findings]` sections are actual completed data the audit should not rehearse over; (c) the inferred premise and method summary faithfully represent the draft\'s intent. [HUMAN_REQUIRED]',
  );
  return lines.join('\n') + '\n';
}
