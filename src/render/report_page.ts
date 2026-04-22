/**
 * `probe report-page <run_id>` — single-file HTML run report in the
 * stanfordhci.github.io/Bloom template shape: single-column long-scroll,
 * top-nav anchors, title block, teaser figure, text/figure rhythm,
 * Safety section (mapped to capture-risk audit), participant-quote-style
 * short blockquotes (mapped to [SIMULATION_REHEARSAL] paragraphs),
 * BibTeX footer. Self-contained: one HTML file, no external JS/CSS.
 *
 * Complementary to `probe render` which bundles everything into a PDF.
 * report-page is the shareable web-native artifact — paste the URL into
 * a message, it renders on mobile. Zero API cost.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import { runDir, branchDir, projectRoot } from '../util/paths.js';
import { palette } from '../ui/theme.js';

interface AuditFinding {
  pattern_id: string;
  axis: string;
  fired: boolean;
  score: number;
  evidence_span?: { source?: string; quote?: string };
  rationale?: string;
}

interface AuditJson {
  verdict?: string;
  findings?: AuditFinding[];
}

interface MetaReviewJson {
  verdict?: string;
  disagreement_classification?: string;
  verdict_rationale?: string;
  disagreement_matrix?: Array<{
    reviewer: string;
    recommendation: string;
    decisive_weakness: string;
  }>;
}

interface RunSummaryJson {
  run_id: string;
  branches: Array<{
    branchId: string;
    status: string;
    stage?: string;
    reason?: string;
    blockingFinding?: string | null;
  }>;
}

interface ReportPageOptions {
  runId: string;
  outputPath?: string;
}

export async function renderReportPage(opts: ReportPageOptions): Promise<void> {
  const { runId } = opts;
  const rd = runDir(runId);

  const premiseText = await readOrEmpty(path.join(rd, 'premise.md'));
  const guidebook = await readOrEmpty(path.join(rd, 'PROBE_GUIDEBOOK.md'));
  const runSummary = (await readJsonOrNull(path.join(rd, 'run_summary.json'))) as RunSummaryJson | null;
  const cost = (await readJsonOrNull(path.join(rd, 'cost.json'))) as
    | { totals?: { usd?: number; input_tokens?: number; output_tokens?: number }; stages?: Array<{ duration_ms?: number }> }
    | null;

  // Find the surviving branch (first in the summary whose status is
  // 'surviving' or 'completed'). Fall back to branch a if the summary
  // doesn't say.
  const surviving = runSummary?.branches.find(
    (b) => b.status === 'surviving' || b.status === 'completed' || b.status === 'in_progress',
  );
  const survivingBranchId = surviving?.branchId ?? 'a';

  const audit = (await readJsonOrNull(
    path.join(branchDir(runId, survivingBranchId), 'audit.json'),
  )) as AuditJson | null;
  const metaReview = (await readJsonOrNull(
    path.join(branchDir(runId, survivingBranchId), 'meta_review.json'),
  )) as MetaReviewJson | null;

  // The rehearsal-quote cards are the [SIMULATION_REHEARSAL] paragraphs
  // of the guidebook, surfaced as short blockquotes in the "What the
  // rehearsal surfaced" section.
  const rehearsalQuotes = extractRehearsalQuotes(guidebook);

  // Fired capture-risk patterns across ALL branches (not just surviving)
  // for the Safety section — show what the audit caught, including on
  // the blocked branches.
  const allFired = await collectFiredPatterns(runId, runSummary);

  const premiseFirst = extractPremiseFirstSentence(premiseText) ?? extractFirstLineAfterHeading(guidebook) ?? runId;

  const totalUsd = cost?.totals?.usd ?? 0;
  const durationMs = (cost?.stages ?? []).reduce((a, s) => a + (s.duration_ms ?? 0), 0);
  const generatedAt = new Date().toISOString();

  const html = buildHtml({
    runId,
    premiseFirst,
    guidebook,
    rehearsalQuotes,
    allFired,
    audit,
    metaReview,
    runSummary,
    survivingBranchId,
    totalUsd,
    durationMs,
    generatedAt,
  });

  const out = opts.outputPath ?? path.join(rd, 'PROBE_REPORT_PAGE.html');
  await fs.writeFile(out, html);
  console.log(chalk.hex(palette.passed)(`✓ wrote ${path.relative(projectRoot(), out)} (${(html.length / 1024).toFixed(1)} KB)`));
  console.log(chalk.hex(palette.dim)(`  open ${out}`));
}

// ─── artifact extraction helpers ────────────────────────────────────────────

async function readOrEmpty(p: string): Promise<string> {
  try {
    return await fs.readFile(p, 'utf8');
  } catch {
    return '';
  }
}

async function readJsonOrNull(p: string): Promise<unknown> {
  try {
    const raw = await fs.readFile(p, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function extractPremiseFirstSentence(md: string): string | null {
  const lines = md.split('\n').filter((l) => l.trim() && !l.startsWith('#'));
  if (lines.length === 0) return null;
  const first = lines[0].trim();
  // Strip any trailing provenance tag if present.
  return first.replace(/\s*\[[A-Z_]+(:[a-z0-9_-]+)?\]\s*$/, '').trim() || null;
}

function extractFirstLineAfterHeading(md: string): string | null {
  const lines = md.split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i].startsWith('##')) {
      for (let j = i + 1; j < lines.length; j++) {
        const trimmed = lines[j].trim();
        if (trimmed) return trimmed.replace(/\s*\[[A-Z_]+(:[a-z0-9_-]+)?\]\s*$/, '').trim();
      }
    }
  }
  return null;
}

function extractRehearsalQuotes(guidebook: string): string[] {
  const paragraphs = guidebook.split(/\n\n+/);
  const rehearsals: string[] = [];
  for (const para of paragraphs) {
    const t = para.trim();
    if (!t) continue;
    if (!/\[SIMULATION_REHEARSAL\]\s*$/.test(t)) continue;
    const stripped = t.replace(/\s*\[SIMULATION_REHEARSAL\]\s*$/, '').trim();
    // Keep short quotes; long paragraphs become wall-of-text cards.
    if (stripped.length > 300) {
      rehearsals.push(stripped.slice(0, 280).trimEnd() + '…');
    } else {
      rehearsals.push(stripped);
    }
  }
  return rehearsals.slice(0, 6); // cap at 6 cards — Bloom uses a similar handful
}

async function collectFiredPatterns(
  runId: string,
  summary: RunSummaryJson | null,
): Promise<Array<{ branchId: string; finding: AuditFinding }>> {
  const result: Array<{ branchId: string; finding: AuditFinding }> = [];
  const branches = summary?.branches.map((b) => b.branchId) ?? ['a', 'b', 'c'];
  for (const b of branches) {
    const audit = (await readJsonOrNull(path.join(branchDir(runId, b), 'audit.json'))) as AuditJson | null;
    for (const f of audit?.findings ?? []) {
      if (f.fired) {
        result.push({ branchId: b, finding: f });
      }
    }
  }
  // Sort most severe first.
  result.sort((a, b) => (a.finding.score ?? 0) - (b.finding.score ?? 0));
  return result;
}

// ─── HTML rendering ─────────────────────────────────────────────────────────

interface BuildArgs {
  runId: string;
  premiseFirst: string;
  guidebook: string;
  rehearsalQuotes: string[];
  allFired: Array<{ branchId: string; finding: AuditFinding }>;
  audit: AuditJson | null;
  metaReview: MetaReviewJson | null;
  runSummary: RunSummaryJson | null;
  survivingBranchId: string;
  totalUsd: number;
  durationMs: number;
  generatedAt: string;
}

function buildHtml(a: BuildArgs): string {
  const guidebookSections = parseGuidebookSections(a.guidebook);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Probe report — ${escapeHtml(a.runId)}</title>
<style>${REPORT_CSS}</style>
</head>
<body>

<nav class="topnav">
  <div class="topnav-inner">
    <a href="#premise" class="topnav-brand">Probe</a>
    <div class="topnav-links">
      <a href="#premise">Premise</a>
      <a href="#method">Method</a>
      <a href="#rehearsal">Rehearsal</a>
      <a href="#safety">Capture-risk</a>
      <a href="#panel">Reviewer panel</a>
      <a href="#handoff">Humans must decide</a>
    </div>
  </div>
</nav>

<header class="hero">
  <div class="hero-eyebrow">A Probe simulation run · ${escapeHtml(shortDate(a.generatedAt))}</div>
  <h1>${escapeHtml(a.premiseFirst)}</h1>
  <div class="hero-meta">
    <span class="run-id">${escapeHtml(a.runId)}</span>
    <span class="dot">·</span>
    <span>branch ${escapeHtml(a.survivingBranchId.toUpperCase())} surviving</span>
    <span class="dot">·</span>
    <span>${a.totalUsd > 0 ? '$' + a.totalUsd.toFixed(2) : '—'}</span>
    <span class="dot">·</span>
    <span>${fmtDuration(a.durationMs)} wall</span>
  </div>
  <p class="hero-tagline">Rehearsal stage for research. The performance still needs humans.</p>
</header>

<main>

<section id="teaser">
  <figure class="teaser">
    ${renderTeaserFigure(a.runSummary)}
    <figcaption>
      Figure 1. Pipeline outcome for this run. Eight stages, three branches, one guidebook. Branch
      ${escapeHtml(a.survivingBranchId.toUpperCase())} survived capture-risk audit and adversarial review; other
      branches stopped at the named stage. Verdicts below each branch were produced by the orchestrator from
      the audit and meta-review outputs — not self-reported by the agents.
    </figcaption>
  </figure>
</section>

<section id="premise">
  <h2>Premise</h2>
  ${renderGuidebookSection(guidebookSections, 'Premise')}
</section>

<section id="background">
  <h2>Background</h2>
  ${renderGuidebookSection(guidebookSections, 'Background')}
</section>

<section id="method">
  <h2>Method</h2>
  <p class="section-lede">
    Probe does not run a study. It writes one, rehearses it, and audits the rehearsal. This section restates
    the prototype specification — the artifact a different researcher could build from without asking
    clarifying questions — and the study protocol.
  </p>
  ${renderGuidebookSection(guidebookSections, 'Prototype')}
  ${renderGuidebookSection(guidebookSections, 'Study protocol')}
</section>

<section id="rehearsal">
  <h2>What the rehearsal surfaced</h2>
  <p class="section-lede">
    These are <strong>not participant quotes</strong>. They are the simulator's rehearsed observations, each
    tagged <code>[SIMULATION_REHEARSAL]</code> in the underlying guidebook. They are priors to test, not
    evidence the study has produced.
  </p>
  ${renderRehearsalCards(a.rehearsalQuotes)}
  ${renderGuidebookSection(guidebookSections, 'Failure hypotheses to test')}
</section>

<section id="safety">
  <h2>Capture-risk audit</h2>
  <p class="section-lede">
    Probe fires sixteen named patterns across four axes — Capacity, Agency, Exit, Legibility — against every
    branch's prototype spec and simulated walkthrough. A pattern is only reported when the auditor can quote
    an evidence span from the rehearsed artifact; patterns that cannot be grounded in a specific passage are
    not reported. A <code>-2</code> score blocks the branch.
  </p>
  ${renderCaptureFindings(a.allFired)}
</section>

<section id="panel">
  <h2>Reviewer panel</h2>
  <p class="section-lede">
    Three Opus 4.7 agents review the surviving branch in sequence — a methodologist, an accessibility
    advocate, and (optionally) a novelty hawk. A meta-reviewer reads their outputs and classifies the
    disagreement without collapsing it to consensus.
  </p>
  ${renderMetaReview(a.metaReview)}
  <p class="section-lede">
    The interactive side-by-side panel is rendered separately — see
    <code>runs/${escapeHtml(a.runId)}/branches/${escapeHtml(a.survivingBranchId)}/REVIEWER_PANEL.html</code>
    (generate with <code>probe panel ${escapeHtml(a.runId)} ${escapeHtml(a.survivingBranchId)}</code>).
  </p>
</section>

<section id="handoff">
  <h2>What humans must decide</h2>
  <p class="section-lede">
    Every Probe guidebook ends with a <code>[HUMAN_REQUIRED]</code> block. This is not a closing
    pleasantry — it is the set of decisions the pipeline is not authorized to make on the researcher's
    behalf.
  </p>
  ${renderGuidebookSection(guidebookSections, 'Next steps') ||
    renderGuidebookSection(guidebookSections, 'Risks and failure modes')}
</section>

<section id="provenance">
  <h2>Provenance legend</h2>
  <p>Every content-bearing element in the underlying guidebook ends with exactly one of these tags. A markdown-AST linter fails the build if any element is untagged.</p>
  <dl class="provenance-legend">
    <dt>[RESEARCHER_INPUT]</dt><dd>The researcher's original premise, verbatim or lightly restated.</dd>
    <dt>[SOURCE_CARD:&lt;id&gt;]</dt><dd>Grounded in a specific hand-curated source card. The id resolves to a file in <code>corpus/source_cards/</code>.</dd>
    <dt>[SIMULATION_REHEARSAL]</dt><dd>Content from the rehearsal. <strong>Not evidence.</strong> Required to use hedged language.</dd>
    <dt>[AGENT_INFERENCE]</dt><dd>Reasoning by an agent, not grounded in a source or simulation.</dd>
    <dt>[UNCITED_ADJACENT]</dt><dd>Adjacent literature a reviewer named; the researcher must verify before grounding.</dd>
    <dt>[TOOL_VERIFIED]</dt><dd>Measured by a Managed Agents tool-equipped session (bash/grep/file ops).</dd>
    <dt>[IMPORTED_DRAFT]</dt><dd>Researcher's own text lifted verbatim from an imported paper draft (via <code>probe import</code>).</dd>
    <dt>[HUMAN_REQUIRED]</dt><dd>Explicit handoff. Every guidebook must have at least one.</dd>
    <dt>[DO_NOT_CLAIM]</dt><dd>Content the guidebook explicitly flags as unclaimable.</dd>
  </dl>
</section>

<footer class="footer">
  <h3>Cite</h3>
  <p class="footer-intro">If you use Probe in research or teaching, please cite the arXiv paper:</p>
  <pre class="bibtex"><code>${escapeHtml(BIBTEX)}</code></pre>
  <p class="footer-links">
    <a href="https://github.com/Apolotary/probe-researcher">Source code</a> ·
    <a href="paper/probe.pdf">Paper PDF</a> ·
    <a href="DEMO_WALKTHROUGH.md">Demo walkthrough</a>
  </p>
  <p class="footer-tagline">Built at the Cerebral Valley Claude Opus 4.7 hackathon, April 2026.</p>
</footer>

</main>
</body>
</html>`;
}

// ─── HTML fragment builders ────────────────────────────────────────────────

function renderTeaserFigure(summary: RunSummaryJson | null): string {
  const branches = summary?.branches ?? [];
  const glyph = (status: string): { class: string; label: string } => {
    if (status === 'surviving' || status === 'completed') return { class: 'glyph-survived', label: 'SURVIVED' };
    if (status === 'blocked') return { class: 'glyph-blocked', label: 'BLOCKED' };
    if (status === 'failed') return { class: 'glyph-failed', label: 'FAILED' };
    return { class: 'glyph-unknown', label: status.toUpperCase() };
  };

  const branchRows = branches
    .map((b) => {
      const g = glyph(b.status);
      const detail =
        b.status === 'blocked'
          ? b.blockingFinding || ''
          : b.status === 'failed'
            ? b.stage || ''
            : '';
      return `<div class="pipeline-branch">
        <div class="pipeline-branch-label">Branch ${escapeHtml(b.branchId.toUpperCase())}</div>
        <div class="pipeline-verdict ${g.class}">${g.label}</div>
        ${detail ? `<div class="pipeline-detail"><code>${escapeHtml(detail)}</code></div>` : ''}
      </div>`;
    })
    .join('\n');

  const stagesRow = [
    'premise',
    'ideation',
    'literature',
    'prototype',
    'simulator',
    'audit',
    'review',
    'guidebook',
  ]
    .map((s, i) => `<span class="pipeline-stage">${i + 1}. ${s}</span>`)
    .join('<span class="arrow">→</span>');

  return `<div class="pipeline-figure">
  <div class="pipeline-stages">${stagesRow}</div>
  <div class="pipeline-branches">${branchRows || '<div class="pipeline-detail">run_summary.json not found</div>'}</div>
</div>`;
}

function renderGuidebookSection(sections: Map<string, string>, heading: string): string {
  const body = sections.get(heading);
  if (!body) return `<p class="missing-section">No <code>${escapeHtml(heading)}</code> section in this run's guidebook.</p>`;
  return markdownToBloomHtml(body);
}

function renderRehearsalCards(quotes: string[]): string {
  if (quotes.length === 0) {
    return `<p class="missing-section">No <code>[SIMULATION_REHEARSAL]</code> paragraphs surfaced for this run.</p>`;
  }
  return `<div class="rehearsal-cards">
  ${quotes
    .map(
      (q) => `<blockquote class="rehearsal-card">
      <div class="card-tag">[SIMULATION_REHEARSAL]</div>
      <p>${escapeHtml(q)}</p>
    </blockquote>`,
    )
    .join('\n')}
</div>`;
}

function renderCaptureFindings(fired: Array<{ branchId: string; finding: AuditFinding }>): string {
  if (fired.length === 0) {
    return `<p class="missing-section">No fired capture-risk patterns in this run.</p>`;
  }
  return `<div class="capture-findings">
  ${fired
    .map(({ branchId, finding }) => {
      const scoreClass = finding.score <= -2 ? 'finding-blocker' : finding.score === -1 ? 'finding-drift' : 'finding-info';
      return `<div class="capture-finding ${scoreClass}">
      <div class="finding-header">
        <span class="finding-pattern"><code>${escapeHtml(finding.pattern_id)}</code></span>
        <span class="finding-axis">${escapeHtml(finding.axis)}</span>
        <span class="finding-score">score ${finding.score}</span>
        <span class="finding-branch">branch ${escapeHtml(branchId.toUpperCase())}</span>
      </div>
      ${
        finding.evidence_span?.quote
          ? `<blockquote class="finding-evidence">
          <div class="evidence-source">source: ${escapeHtml(finding.evidence_span.source ?? 'unknown')}</div>
          ${escapeHtml(finding.evidence_span.quote)}
        </blockquote>`
          : ''
      }
      ${
        finding.rationale
          ? `<p class="finding-rationale">${escapeHtml(finding.rationale)}</p>`
          : ''
      }
    </div>`;
    })
    .join('\n')}
</div>`;
}

function renderMetaReview(m: MetaReviewJson | null): string {
  if (!m) {
    return `<p class="missing-section">No meta-review on file for this run.</p>`;
  }
  const verdict = m.verdict ?? 'unknown';
  const classification = m.disagreement_classification ?? 'unclassified';
  return `<div class="meta-review">
  <div class="meta-verdict">
    <span class="meta-verdict-label">Meta-reviewer verdict:</span>
    <span class="meta-verdict-value"><code>${escapeHtml(verdict)}</code></span>
    <span class="meta-class">(<code>${escapeHtml(classification)}</code>)</span>
  </div>
  ${m.verdict_rationale ? `<p class="meta-rationale">${escapeHtml(m.verdict_rationale)}</p>` : ''}
  ${
    m.disagreement_matrix && m.disagreement_matrix.length > 0
      ? `<table class="mx-table">
          <thead><tr><th>Reviewer</th><th>Recommendation</th><th>Decisive weakness</th></tr></thead>
          <tbody>
            ${m.disagreement_matrix
              .map(
                (row) =>
                  `<tr>
                    <td>${escapeHtml(row.reviewer)}</td>
                    <td><code>${escapeHtml(row.recommendation)}</code></td>
                    <td>${escapeHtml(row.decisive_weakness)}</td>
                  </tr>`,
              )
              .join('')}
          </tbody>
        </table>`
      : ''
  }
</div>`;
}

// ─── markdown helpers ───────────────────────────────────────────────────────

function parseGuidebookSections(md: string): Map<string, string> {
  const sections = new Map<string, string>();
  const lines = md.split('\n');
  let currentHeading: string | null = null;
  let buf: string[] = [];
  const flush = (): void => {
    if (currentHeading) sections.set(currentHeading, buf.join('\n').trim());
    buf = [];
  };
  for (const line of lines) {
    const match = line.match(/^#{2,3}\s+(.+?)\s*$/);
    if (match) {
      flush();
      currentHeading = match[1].trim();
      continue;
    }
    buf.push(line);
  }
  flush();
  return sections;
}

/**
 * Tiny markdown → HTML pass tuned for the guidebook's shape.
 * Handles: paragraphs, bullets, blockquotes, inline code, H3 sub-headings.
 * Strips trailing provenance tags from each content block and preserves
 * them as small badges at the end of the rendered element.
 */
function markdownToBloomHtml(md: string): string {
  const lines = md.split('\n');
  const out: string[] = [];
  let inList = false;
  let paraBuf: string[] = [];

  const flushPara = (): void => {
    if (paraBuf.length === 0) return;
    const joined = paraBuf.join(' ').trim();
    if (!joined) {
      paraBuf = [];
      return;
    }
    const { text, tag } = splitTrailingTag(joined);
    out.push(`<p>${inlineMd(escapeHtml(text))}${renderTagBadge(tag)}</p>`);
    paraBuf = [];
  };

  for (const line of lines) {
    const stripped = line.trim();

    if (stripped === '') {
      flushPara();
      if (inList) {
        out.push('</ul>');
        inList = false;
      }
      continue;
    }

    // H3 sub-heading (guidebook uses ### for sub-sections)
    const h3 = stripped.match(/^###\s+(.+?)\s*$/);
    if (h3) {
      flushPara();
      if (inList) { out.push('</ul>'); inList = false; }
      out.push(`<h3>${escapeHtml(h3[1])}</h3>`);
      continue;
    }

    // Bullet
    const bullet = stripped.match(/^-\s+(.+)$/);
    if (bullet) {
      flushPara();
      if (!inList) {
        out.push('<ul>');
        inList = true;
      }
      const { text, tag } = splitTrailingTag(bullet[1]);
      out.push(`<li>${inlineMd(escapeHtml(text))}${renderTagBadge(tag)}</li>`);
      continue;
    }

    // Blockquote
    const quote = stripped.match(/^>\s+(.+)$/);
    if (quote) {
      flushPara();
      if (inList) { out.push('</ul>'); inList = false; }
      const { text, tag } = splitTrailingTag(quote[1]);
      out.push(`<blockquote>${inlineMd(escapeHtml(text))}${renderTagBadge(tag)}</blockquote>`);
      continue;
    }

    // Regular paragraph line — accumulate
    paraBuf.push(stripped);
  }
  flushPara();
  if (inList) out.push('</ul>');

  return out.join('\n');
}

function splitTrailingTag(text: string): { text: string; tag: string | null } {
  const m = text.match(/^(.*?)\s*(\[[A-Z_]+(:[a-z0-9_-]+)?\])\s*$/);
  if (!m) return { text, tag: null };
  return { text: m[1].trim(), tag: m[2] };
}

function renderTagBadge(tag: string | null): string {
  if (!tag) return '';
  const cls = 'tag-' + tag.replace(/[\[\]]/g, '').toLowerCase().replace(/:.*$/, '');
  return ` <span class="provtag ${cls}">${escapeHtml(tag)}</span>`;
}

function inlineMd(text: string): string {
  // Inline code `foo`
  let t = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Bold **foo**
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Italic *foo*  (conservative — only when surrounded by spaces or boundaries)
  t = t.replace(/(^|\s)\*([^*]+)\*(\s|$|[.,;:])/g, '$1<em>$2</em>$3');
  return t;
}

// ─── small utilities ────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function fmtDuration(ms: number): string {
  if (ms === 0) return '—';
  const sec = ms / 1000;
  if (sec < 60) return `${sec.toFixed(0)}s`;
  const min = Math.floor(sec / 60);
  const s = Math.round(sec - min * 60);
  return `${min}m${String(s).padStart(2, '0')}s`;
}

const BIBTEX = `@article{ryskeldiev2026probe,
  title   = {Probe: Rehearsal-Stage Triage for Screen-Based Interactive Research},
  author  = {Ryskeldiev, Bektur},
  year    = {2026},
  journal = {arXiv preprint},
  note    = {Built at the Cerebral Valley Claude Opus 4.7 hackathon}
}`;

const REPORT_CSS = `
:root {
  --bg: #f7f5ef;
  --bg-card: #ffffff;
  --bg-pre: #1a1d2c;
  --fg-pre: #e8e3d4;
  --fg: #1a1a1a;
  --fg-dim: #555;
  --fg-faint: #888;
  --border: #d0cbb8;
  --border-soft: #e8e3d4;
  --accent: #1B365D;
  --accent-warm: #9e2e22;
  --accent-amber: #b47b2a;
  --accent-green: #1f6b1e;
  --accent-plum: #7a2d5a;
  --code-bg: #ede9dc;
}

* { box-sizing: border-box; }

html, body { margin: 0; padding: 0; }

body {
  background: var(--bg);
  color: var(--fg);
  font-family: 'Newsreader', 'Source Serif 4', Georgia, serif;
  font-size: 18px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}

main {
  max-width: 760px;
  margin: 0 auto;
  padding: 0 24px 80px;
}

h1, h2, h3, .topnav-brand, .topnav-links a, .hero-eyebrow, .hero-meta, .provtag, .card-tag,
.pipeline-figure, .capture-findings, .meta-review, .footer-links, .footer-tagline {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
}

h1 {
  font-family: 'Newsreader', Georgia, serif;
  font-size: 36px;
  line-height: 1.15;
  font-weight: 600;
  margin: 0 0 16px;
  color: #10121e;
  letter-spacing: -0.01em;
}
h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 48px 0 16px;
  color: #10121e;
  letter-spacing: 0;
  border-bottom: 1px solid var(--border-soft);
  padding-bottom: 6px;
}
h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 28px 0 8px;
  color: #20232e;
}

p, li, blockquote { font-size: 17px; }
p { margin: 0 0 14px; }

/* Top nav */
.topnav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(247, 245, 239, 0.92);
  backdrop-filter: saturate(180%) blur(8px);
  -webkit-backdrop-filter: saturate(180%) blur(8px);
  border-bottom: 1px solid var(--border-soft);
}
.topnav-inner {
  max-width: 760px;
  margin: 0 auto;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.topnav-brand {
  font-weight: 700;
  font-size: 14px;
  color: var(--accent);
  text-decoration: none;
  letter-spacing: 0.02em;
}
.topnav-links {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.topnav-links a {
  color: var(--fg-dim);
  text-decoration: none;
  font-size: 13px;
}
.topnav-links a:hover { color: var(--accent); }

/* Hero */
.hero {
  max-width: 760px;
  margin: 0 auto;
  padding: 56px 24px 24px;
}
.hero-eyebrow {
  font-size: 13px;
  color: var(--fg-faint);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 14px;
}
.hero-meta {
  font-size: 13px;
  color: var(--fg-dim);
  margin-top: 10px;
}
.hero-meta .run-id {
  font-family: 'JetBrains Mono', 'SF Mono', Menlo, monospace;
  background: var(--code-bg);
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 12px;
}
.hero-meta .dot { margin: 0 8px; color: #bbb; }
.hero-tagline {
  font-style: italic;
  color: var(--fg-dim);
  font-size: 16px;
  margin-top: 24px;
}

/* Section lede */
.section-lede {
  font-size: 16px;
  color: var(--fg-dim);
  border-left: 3px solid var(--border);
  padding: 4px 0 4px 14px;
  margin: 0 0 20px;
}

/* Teaser figure */
.teaser {
  margin: 0 0 32px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 20px;
}
.teaser figcaption {
  font-size: 14px;
  color: var(--fg-dim);
  margin-top: 14px;
  line-height: 1.5;
}
.pipeline-figure {
  font-family: 'Inter', -apple-system, sans-serif;
}
.pipeline-stages {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  color: var(--fg-dim);
  padding-bottom: 16px;
  border-bottom: 1px dashed var(--border);
  margin-bottom: 16px;
}
.pipeline-stage {
  background: var(--code-bg);
  padding: 4px 10px;
  border-radius: 3px;
}
.pipeline-stages .arrow { color: var(--fg-faint); }
.pipeline-branches {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}
.pipeline-branch {
  background: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 3px;
  padding: 12px;
}
.pipeline-branch-label { font-size: 12px; color: var(--fg-dim); margin-bottom: 6px; }
.pipeline-verdict {
  display: inline-block;
  font-size: 13px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 3px;
  letter-spacing: 0.04em;
}
.glyph-survived { background: #dff5df; color: var(--accent-green); }
.glyph-blocked { background: #ffe3e0; color: var(--accent-warm); }
.glyph-failed { background: #f0e0e0; color: #555; }
.glyph-unknown { background: #e8e3d4; color: var(--fg-dim); }
.pipeline-detail {
  margin-top: 8px;
  font-size: 11px;
  color: var(--fg-dim);
}
.pipeline-detail code {
  background: transparent;
  font-family: 'JetBrains Mono', monospace;
}

/* Rehearsal cards */
.rehearsal-cards {
  display: grid;
  gap: 16px;
  margin: 24px 0;
}
.rehearsal-card {
  background: #faf7ee;
  border-left: 3px solid var(--accent-amber);
  margin: 0;
  padding: 14px 18px;
  border-radius: 0 3px 3px 0;
}
.rehearsal-card p { margin: 0; font-style: italic; color: #3a3a3a; }
.card-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--accent-amber);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 8px;
}

/* Capture findings */
.capture-findings {
  display: grid;
  gap: 16px;
  margin: 24px 0;
}
.capture-finding {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-left: 4px solid var(--accent-warm);
  border-radius: 3px;
  padding: 14px 18px;
}
.capture-finding.finding-drift { border-left-color: var(--accent-amber); }
.capture-finding.finding-info { border-left-color: var(--fg-faint); }
.finding-header {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: baseline;
  margin-bottom: 10px;
  font-size: 13px;
}
.finding-pattern code {
  font-family: 'JetBrains Mono', monospace;
  background: var(--code-bg);
  padding: 2px 7px;
  border-radius: 3px;
  font-weight: 600;
  color: #222;
}
.finding-axis {
  color: var(--fg-dim);
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.05em;
}
.finding-score {
  font-family: 'JetBrains Mono', monospace;
  color: var(--accent-warm);
  font-weight: 700;
}
.finding-branch {
  color: var(--fg-faint);
  font-size: 12px;
  margin-left: auto;
}
.finding-evidence {
  font-family: 'Newsreader', Georgia, serif;
  font-size: 15px;
  color: #2a2a2a;
  background: var(--code-bg);
  margin: 8px 0;
  padding: 10px 14px;
  border-left: 2px solid var(--accent-amber);
  border-radius: 0 3px 3px 0;
}
.evidence-source {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--fg-faint);
  margin-bottom: 4px;
  letter-spacing: 0.03em;
}
.finding-rationale {
  font-size: 14px;
  color: var(--fg-dim);
  line-height: 1.5;
  margin: 8px 0 0;
}

/* Meta review */
.meta-review {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 3px;
  padding: 18px 22px;
  margin: 20px 0;
}
.meta-verdict { font-size: 14px; margin-bottom: 12px; }
.meta-verdict-label { color: var(--fg-dim); }
.meta-verdict-value code {
  font-family: 'JetBrains Mono', monospace;
  background: #e1f5e0;
  color: var(--accent-green);
  padding: 2px 8px;
  border-radius: 3px;
  font-weight: 600;
}
.meta-class code {
  font-family: 'JetBrains Mono', monospace;
  background: var(--code-bg);
  color: var(--fg-dim);
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 12px;
}
.meta-rationale {
  font-size: 15px;
  color: #333;
  margin: 10px 0;
  line-height: 1.55;
}
.mx-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 14px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
}
.mx-table th, .mx-table td {
  text-align: left;
  padding: 8px 10px;
  border-bottom: 1px solid var(--border-soft);
  vertical-align: top;
}
.mx-table th { font-size: 11px; color: var(--fg-dim); letter-spacing: 0.05em; text-transform: uppercase; }
.mx-table code { font-family: 'JetBrains Mono', monospace; background: var(--code-bg); padding: 1px 6px; border-radius: 3px; font-size: 12px; }

/* Inline content */
code {
  font-family: 'JetBrains Mono', 'SF Mono', Menlo, monospace;
  background: var(--code-bg);
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 0.88em;
}
pre {
  background: var(--bg-pre);
  color: var(--fg-pre);
  padding: 16px 20px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.5;
}
pre code {
  background: transparent;
  padding: 0;
  font-size: inherit;
  color: inherit;
}

blockquote {
  margin: 14px 0;
  padding: 8px 16px;
  border-left: 3px solid var(--border);
  color: #2a2a2a;
}

ul { padding-left: 22px; }
li { margin: 4px 0; }

/* Provenance tag badges */
.provtag {
  display: inline-block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  padding: 1px 6px;
  margin-left: 6px;
  border-radius: 2px;
  background: var(--code-bg);
  color: var(--fg-faint);
  vertical-align: baseline;
  font-weight: 500;
  letter-spacing: 0.02em;
}
.provtag.tag-source_card { background: #dfeaff; color: #1B365D; }
.provtag.tag-simulation_rehearsal { background: #faf0dc; color: var(--accent-amber); }
.provtag.tag-agent_inference { background: #ede9dc; color: #5a5547; }
.provtag.tag-researcher_input { background: #dff5df; color: var(--accent-green); }
.provtag.tag-human_required { background: #dff5e6; color: #135a3b; }
.provtag.tag-do_not_claim { background: #ffe3e0; color: var(--accent-warm); }
.provtag.tag-uncited_adjacent { background: #f3e0ee; color: var(--accent-plum); }
.provtag.tag-tool_verified { background: #e1f5e0; color: var(--accent-green); }
.provtag.tag-imported_draft { background: #e6ecf5; color: #34456b; }

.provenance-legend dt {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--accent);
  margin: 14px 0 4px;
}
.provenance-legend dd {
  font-size: 15px;
  color: var(--fg-dim);
  margin: 0 0 8px;
}

/* Footer */
.footer {
  max-width: 760px;
  margin: 64px auto 0;
  padding: 24px;
  border-top: 1px solid var(--border);
  color: var(--fg-dim);
}
.footer h3 { font-family: 'Inter', sans-serif; font-size: 13px; letter-spacing: 0.05em; text-transform: uppercase; color: var(--fg-faint); margin: 0 0 12px; }
.footer-intro { font-size: 14px; margin-bottom: 10px; }
.bibtex { font-size: 12px; line-height: 1.5; padding: 14px 16px; }
.footer-links { font-size: 13px; margin-top: 16px; }
.footer-links a { color: var(--accent); text-decoration: none; margin-right: 4px; }
.footer-links a:hover { text-decoration: underline; }
.footer-tagline { font-size: 12px; color: var(--fg-faint); margin-top: 20px; font-style: italic; }

.missing-section {
  font-style: italic;
  color: var(--fg-faint);
  padding: 12px 16px;
  background: var(--code-bg);
  border-radius: 3px;
  font-size: 14px;
}

/* Mobile */
@media (max-width: 640px) {
  .topnav-inner { flex-direction: column; align-items: flex-start; gap: 8px; }
  .topnav-links { gap: 12px; }
  h1 { font-size: 28px; }
  .hero { padding: 36px 18px 12px; }
  main { padding: 0 18px 60px; }
}
`;
