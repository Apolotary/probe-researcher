#!/usr/bin/env tsx
/**
 * Regenerate the disagreement audit through Sonnet 4.6 instead of
 * Opus 4.7, keeping every other input identical, so the UI can show
 * a side-by-side comparison.
 *
 * Why this exists: round-N evaluator feedback flagged that the
 * "smaller models would fail" claim is asserted but not shown. The
 * convergent recommendation was: run the same audit through Sonnet,
 * save the result, and surface both side-by-side. If Sonnet
 * collapses the contrast (empty falseDisagreements, padded
 * realDisagreements, missing whatWouldBeLostIfAveraged) the demo
 * has its own proof. If Sonnet handles it fine, the README retreats
 * to "Opus does it more elegantly" — also honest, less load-bearing.
 *
 * Output: assets/demos/focus-rituals-sonnet-audit.json
 *
 * Run with:
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/regen_audit_sonnet.ts
 *
 * Cost: ~$0.05 (one Sonnet call).
 */

import fs from 'node:fs';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { projectRoot } from '../src/util/paths.js';
import { SONNET } from '../src/config/probe_toml.js';

interface AuditInput {
  paperTitle: string;
  premise: string;
  reviewers: Array<{
    id: string; rec: string; field?: string;
    affiliation?: string; topicConfidence?: string;
    oneLine?: string; strengths?: string[]; weaknesses?: string[];
  }>;
  meta: { ac?: string; verdict?: string; summary?: string; proposed?: string };
  discussion?: string;
}

// Same prompt used by probe_calls.disagreementAudit, copied verbatim
// so the only variable changing across the comparison is the model.
function buildPrompt(input: AuditInput) {
  const system =
    `You are an area-chair disagreement auditor for an HCI peer-review rehearsal tool.

Your job is NOT to summarize the reviewers politely. Your job is to identify
where they truly disagree, where they only appear to disagree, and what a
human researcher should do next.

Hard rules:
- Do not invent empirical evidence. Treat all simulated content as rehearsal.
- Preserve reviewer disagreement where it is legitimate.
- Do not collapse conflicting judgments into a bland consensus.
- Explicitly name at least one disagreement that should NOT be averaged away.
- If all reviewers are making the same objection in different language, say so
  in falseDisagreements (don't pad realDisagreements).
- Use the axis labels (novelty/methodology/ethics/contribution/validity/scope/feasibility)
  consistently — multiple disagreements on the same axis are fine.
- For EACH realDisagreement, you must populate:
  · whatWouldBeLostIfAveraged — the specific signal the AC erases by
    splitting the difference (1–2 sentences, concrete, naming the
    reviewer position that gets erased).
  · epistemicRiskScore — integer 1–10 estimating the likelihood this
    single conflict alone would result in desk reject if the rebuttal
    failed. 1 = cosmetic; 5 = standard major-revision territory;
    10 = the conflict the paper would die on.
- For each falseDisagreement, populate whyOnlyApparent — the actual
  shared concern in different language.
- Strict JSON only.`;

  const user =
    `Paper: ${input.paperTitle}
Premise: ${input.premise}

REVIEWERS:
${input.reviewers.map((r) => `
  [${r.id}] rec=${r.rec} · ${r.field ?? '?'} · ${r.affiliation ?? '?'} · ${r.topicConfidence ?? '?'}
  one-line: ${r.oneLine ?? ''}
  strengths: ${(r.strengths ?? []).join(' | ')}
  weaknesses: ${(r.weaknesses ?? []).join(' | ')}
`).join('\n')}

AREA CHAIR ${input.meta.ac ?? 'AC'} (verdict: ${input.meta.verdict ?? '—'}):
${input.meta.summary ?? ''}
proposed action: ${input.meta.proposed ?? ''}

Return JSON:
\`\`\`json
{
  "summary": "1-2 sentence overview of where the disagreement actually is",
  "realDisagreements": [
    {
      "axis": "methodology",
      "reviewerPositions": [
        {"reviewer": "R1", "position": "…", "evidence": "quotes weakness #2"},
        {"reviewer": "R2", "position": "…", "evidence": "…"}
      ],
      "whyItMatters": "…",
      "doNotAverageBecause": "…",
      "whatWouldBeLostIfAveraged": "…",
      "epistemicRiskScore": 7
    }
  ],
  "falseDisagreements": [
    {"axis": "scope", "explanation": "...", "whyOnlyApparent": "..."}
  ],
  "strongestReviewer": {"reviewer": "R2", "reason": "…"},
  "acDecision": {
    "recommendation": "major revisions",
    "rationale": "…",
    "requiredRevisions": ["…", "…"]
  }
}
\`\`\``;
  return { system, user };
}

function extractJSON(text: string): unknown {
  const fence = text.match(/```(?:json)?\s*([\s\S]+?)```/);
  const candidate = (fence ? fence[1] : text).trim();
  // Always dump the raw model output for debug — Sonnet's JSON
  // foibles are part of what this comparison is testing.
  fs.writeFileSync('/tmp/probe-sonnet-audit-raw.txt', candidate);
  const tryParse = (s: string) => {
    try { return JSON.parse(s); } catch { return undefined; }
  };
  let r = tryParse(candidate);
  if (r !== undefined) return r;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start >= 0 && end > start) {
    const sliced = candidate.slice(start, end + 1);
    r = tryParse(sliced);
    if (r !== undefined) return r;
    const fixed = sliced
      .replace(/,\s*([}\]])/g, '$1')          // trailing commas
      .replace(/[‘’]/g, "'")                  // smart single quotes
      .replace(/[“”]/g, '"')                  // smart double quotes
      // Missing commas between adjacent array items / object properties.
      // Sonnet forgot these on the first run AND on the second.
      .replace(/}\s*\n\s*{/g, '},\n{')
      .replace(/]\s*\n\s*\[/g, '],\n[')
      .replace(/}\s*\n\s*"/g, '},\n"')
      .replace(/]\s*\n\s*"/g, '],\n"')
      .replace(/(true|false|null|"\w?")\s*\n\s*"/g, '$1,\n"');
    r = tryParse(fixed);
    if (r !== undefined) return r;
  }
  console.error('--- raw model output (saved to /tmp/probe-sonnet-audit-raw.txt) ---');
  console.error(candidate.slice(0, 600));
  console.error('---');
  throw new Error('JSON parse failed; raw written to /tmp/probe-sonnet-audit-raw.txt');
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ERROR: ANTHROPIC_API_KEY environment variable not set.');
    process.exit(1);
  }

  const demoPath = path.join(projectRoot(), 'assets', 'demos', 'focus-rituals.json');
  const demo = JSON.parse(fs.readFileSync(demoPath, 'utf8'));
  const s = demo.state;

  if (!s.reviewSession?.reviewers || !s.reviewSession.meta) {
    console.error('Demo missing reviewSession.reviewers or .meta — cannot regen audit.');
    process.exit(1);
  }

  const input: AuditInput = {
    paperTitle: s.paperTitle || s.reviewSession.paperTitle || 'Untitled',
    premise: s.premise || '',
    reviewers: s.reviewSession.reviewers,
    meta: s.reviewSession.meta,
    discussion: s.discussion || '',
  };

  const { system, user } = buildPrompt(input);

  console.log('Regenerating disagreement audit through Sonnet 4.6…');
  console.log('  paperTitle:', input.paperTitle);
  console.log('  reviewers:', input.reviewers.map((r) => `${r.id}:${r.rec}`).join(' | '));
  console.log('  model:', SONNET);
  console.log();

  const client = new Anthropic({ apiKey });
  const t0 = Date.now();
  // 6000 tokens — Sonnet's first attempts at this schema ran past 3k
  // and got truncated. Opus consistently completes in ~2.8k. The
  // higher cap is itself a contrast point worth noting in the audit
  // comparison: Sonnet needs more room to land the same schema.
  const resp = await client.messages.create({
    model: SONNET,
    max_tokens: 6000,
    system,
    messages: [{ role: 'user', content: user }],
  });
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  const text = resp.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { text: string }).text)
    .join('');

  const parsed = extractJSON(text) as {
    summary?: string;
    realDisagreements?: unknown[];
    falseDisagreements?: unknown[];
    strongestReviewer?: { reviewer?: string; reason?: string };
    acDecision?: { recommendation?: string; rationale?: string; requiredRevisions?: string[] };
  };

  const result = {
    summary: parsed.summary ?? '',
    realDisagreements: Array.isArray(parsed.realDisagreements) ? parsed.realDisagreements : [],
    falseDisagreements: Array.isArray(parsed.falseDisagreements) ? parsed.falseDisagreements : [],
    strongestReviewer: parsed.strongestReviewer ?? { reviewer: '', reason: '' },
    acDecision: parsed.acDecision ?? { recommendation: '', rationale: '', requiredRevisions: [] },
  };

  const out = {
    generatedAt: new Date().toISOString(),
    model: SONNET,
    elapsedSec: parseFloat(elapsed),
    inputUsage: resp.usage,
    audit: result,
    note:
      'Generated by scripts/regen_audit_sonnet.ts to enable a side-by-side ' +
      'comparison with the Opus 4.7 audit in focus-rituals.json. The two ' +
      'inputs are byte-identical; only the model varies.',
  };

  const outPath = path.join(projectRoot(), 'assets', 'demos', 'focus-rituals-sonnet-audit.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`✓ Wrote ${outPath}`);
  console.log(`  elapsed:           ${elapsed}s`);
  console.log(`  realDisagreements: ${result.realDisagreements.length}`);
  console.log(`  falseDisagreements: ${result.falseDisagreements.length}`);
  console.log(`  strongest:         ${result.strongestReviewer.reviewer || '(empty)'}`);

  // Quick contrast sanity-check the README can cite. If Sonnet
  // populated zero falseDisagreements and the Opus cache has them,
  // the contrast collapse is the visible win.
  const opusReal = (s.disagreementAudit?.realDisagreements ?? []).length;
  const opusFalse = (s.disagreementAudit?.falseDisagreements ?? []).length;
  const sonnetReal = result.realDisagreements.length;
  const sonnetFalse = result.falseDisagreements.length;
  console.log();
  console.log('Contrast sanity:');
  console.log(`  Opus    real=${opusReal}  false=${opusFalse}`);
  console.log(`  Sonnet  real=${sonnetReal}  false=${sonnetFalse}`);
  if (sonnetFalse === 0 && opusFalse > 0) {
    console.log('  → Sonnet collapsed the contrast (zero false disagreements).');
  } else if (Math.abs(sonnetReal - opusReal) >= 2 || Math.abs(sonnetFalse - opusFalse) >= 2) {
    console.log('  → meaningful structural divergence.');
  } else {
    console.log('  → Sonnet handled the schema; load-bearing claim weakens.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
