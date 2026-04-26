/**
 * LLM calls for the new Probe UI workflow. Each function takes a
 * structured input, drives Anthropic (or OpenAI fallback), and
 * returns JSON that matches the shapes the UI expects. If no API key
 * is available, callers should fall back to canned content from
 * src/cli/ui_state.ts.
 *
 * This is a thinner wrapper than src/anthropic/client.ts — no run
 * directory, no cost.json append, no stage tags. It exists so the
 * new UI surface (which is not a "run" in Probe's pipeline sense)
 * can call the LLM directly.
 *
 * Every function:
 *   1. Builds a system + user message pair geared toward JSON output
 *   2. Asks Claude to wrap output in a JSON code fence
 *   3. Parses the first JSON block out of the response
 *   4. Validates the shape with a soft type check
 *   5. Returns the parsed object
 *
 * On JSON parse failure we throw — callers catch and fall back to
 * canned content with the failure logged.
 */

import Anthropic from '@anthropic-ai/sdk';
import { detectProvider, NoApiKeysError } from './provider.js';
import { modelForStage, resolveKey, type UiStage } from '../config/probe_toml.js';
import type {
  SubRQ, LiteratureBlock, CandidateDesign, StudyPlan, Artifact,
  Persona, Friction,
} from '../cli/ui_state.js';

/**
 * Anthropic SDK client cached by the resolved key value. We re-cache on
 * key change so that editing `~/.config/probe/probe.toml` during a live
 * session takes effect on the next call without a server restart.
 */
let anthropicClient: Anthropic | null = null;
let cachedKeyValue = '';
function anthropic(): Anthropic {
  const resolved = resolveKey('anthropic');
  if (resolved.source === 'unset' || !resolved.value) {
    throw new Error('Anthropic key not set (env $ANTHROPIC_API_KEY or stored in ~/.config/probe/probe.toml)');
  }
  if (!anthropicClient || resolved.value !== cachedKeyValue) {
    anthropicClient = new Anthropic({ apiKey: resolved.value });
    cachedKeyValue = resolved.value;
  }
  return anthropicClient;
}

interface CallOpts {
  /** UI workflow stage this call belongs to — drives model selection. */
  stage: UiStage;
  system: string;
  user: string;
  maxTokens?: number;
}

async function callLLM({ stage, system, user, maxTokens = 2048 }: CallOpts): Promise<string> {
  // Live-web stage calls require Anthropic specifically. We don't fall
  // through to the env-promoted OpenAI provider here because the JSON-
  // fenced dispatch flow this module uses isn't wired for OpenAI yet —
  // see src/anthropic/client.ts for the offline equivalent. If the user
  // only has an OpenAI key, the frontend's stock-content fallback path
  // takes over (every stage component handles 500 → canned output).
  const anthropicKey = resolveKey('anthropic');
  if (anthropicKey.source === 'unset') {
    const provider = detectProvider();
    if (!provider.canCallApi) throw new NoApiKeysError();
    throw new Error(
      `probe_calls: live web stages require an Anthropic key; ` +
      `got '${provider.name}'. Set ANTHROPIC_API_KEY or store it in ~/.config/probe/probe.toml.`,
    );
  }
  // Per-stage model resolution from probe.toml. The user can flip the
  // whole pipeline with [models].mode = 'sonnet' | 'opus' | 'mixed',
  // or set per-stage IDs explicitly with mode = 'custom'.
  const modelId = modelForStage(stage);
  const response = await anthropic().messages.create({
    model: modelId,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
  });
  const text = response.content
    .filter((c): c is Anthropic.Messages.TextBlock => c.type === 'text')
    .map((c) => c.text)
    .join('');
  return text;
}

/** Pull the first JSON block out of an LLM response. Tolerates fences. */
function extractJSON(text: string): unknown {
  // Try fenced JSON first.
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text);
  const body = fenced ? fenced[1] : text;
  // Find the first { … } or [ … ] balanced block.
  const trimmed = body.trim();
  // Heuristic: take everything from first { or [ to the matching last } or ].
  const firstBrace = trimmed.search(/[{[]/);
  if (firstBrace < 0) throw new Error('no JSON found in LLM response');
  const opener = trimmed[firstBrace];
  const closer = opener === '{' ? '}' : ']';
  const lastClose = trimmed.lastIndexOf(closer);
  if (lastClose < firstBrace) throw new Error('mismatched JSON delimiters');
  const slice = trimmed.slice(firstBrace, lastClose + 1);
  return JSON.parse(slice);
}

/* ── brainstorm ─────────────────────────────────────────────────── */

export async function brainstorm(premise: string): Promise<SubRQ[]> {
  const system =
    `You are the interrogator stage of a research-design pipeline.
Given a researcher's main research question, propose three
sub-research-questions (RQ A, B, C) that are FACETS OF THE SAME
STUDY — not three separate studies. The three sub-RQs should be
combinable into a single integrated study that, when answered
together, addresses the main RQ.

The three sub-RQs must take DIFFERENT angles on the same topic so
they're complementary, not redundant:
  RQ A — mechanism-oriented (what underlies the phenomenon)
  RQ B — intervention-oriented (what shifts it in a measurable direction)
  RQ C — lived-experience-oriented (how practitioners experience it)

Each sub-RQ is a sharper version of the main RQ from one angle. The
methods you suggest should be layerable in ONE study (e.g., one
cohort, mixed-methods design) rather than three independent studies.
Strict JSON only.`;
  const user =
    `Main research question:\n${premise}\n\nReturn three sub-RQs that work as facets of one integrated study answering the main RQ. Return JSON:\n` +
    '```json\n' +
    `{
  "rqs": [
    {"letter":"A","rq":"<mechanism sub-RQ that sharpens the main RQ>","angle":"mechanism","method":"<method that contributes to a unified study>","n":"n≈18"},
    {"letter":"B","rq":"<intervention sub-RQ in the same study>","angle":"intervention","method":"<layered method>","n":"n≈24"},
    {"letter":"C","rq":"<lived-experience sub-RQ in the same study>","angle":"lived experience","method":"<layered method>","n":"n≈12"}
  ]
}` +
    '\n```';
  const text = await callLLM({ stage: 'brainstorm', system, user, maxTokens: 1024 });
  const parsed = extractJSON(text) as { rqs?: SubRQ[] };
  if (!parsed.rqs || !Array.isArray(parsed.rqs) || parsed.rqs.length === 0) {
    throw new Error('brainstorm: malformed response');
  }
  return parsed.rqs.slice(0, 3).map((r, i) => ({
    letter: r.letter ?? String.fromCharCode(65 + i),
    rq: r.rq ?? '',
    angle: r.angle ?? ['mechanism', 'intervention', 'lived experience'][i] ?? 'custom',
    method: r.method ?? 'tbd',
    n: r.n ?? 'tbd',
  }));
}

/* ── literature ─────────────────────────────────────────────────── */

export async function literature(rq: SubRQ): Promise<LiteratureBlock> {
  const system =
    `You are a literature-review agent in a research-design pipeline.
Given one sub-research-question with its angle, write a state-of-the-art
paragraph, list 4 most-similar published papers, and bullet 3-4
research gaps the user could exploit. Cite real venues (CHI, CSCW,
IMWUT, TOCHI, etc.) but you may use plausible author names; do not
fabricate DOIs. Strict JSON only.`;
  const user =
    `RQ ${rq.letter} · angle: ${rq.angle}\n${rq.rq}\n\n` +
    'Return JSON:\n```json\n' +
    `{
  "stateOfArt": "one paragraph (≤120 words)",
  "similar":   [{"cite":"Author Year","title":"…","venue":"…"}, …4 entries],
  "gaps":      ["bullet …", "bullet …", "bullet …"]
}` +
    '\n```';
  const text = await callLLM({ stage: 'literature', system, user, maxTokens: 1500 });
  const parsed = extractJSON(text) as Partial<LiteratureBlock>;
  return {
    letter: rq.letter,
    stateOfArt: parsed.stateOfArt ?? '',
    similar: Array.isArray(parsed.similar) ? parsed.similar.slice(0, 6) : [],
    gaps: Array.isArray(parsed.gaps) ? parsed.gaps.slice(0, 6) : [],
  };
}

/* ── methodology ────────────────────────────────────────────────── */

export async function methodology(
  premise: string,
  rqs: SubRQ[],
): Promise<CandidateDesign[]> {
  const letters = rqs.map((r) => r.letter).join(', ');
  const rqList = rqs.map((r) => `RQ ${r.letter} (${r.angle}): ${r.rq}`).join('\n');
  const coverageKeys = rqs.map((r) => `"${r.letter}": "core"|"partial"|"none"`).join(', ');
  const system =
    `You are the methodology-design agent. Given a main RQ and selected
sub-RQs, propose 3 INTEGRATED study designs — each a single paper's
worth of work that jointly answers the selected RQs through layered
methods. The 3 designs MUST be distinct in shape — different time
budget, different method mix — so the user has a real choice. For
each, fill an RQ-coverage matrix indicating which RQs the design
covers (core/partial/none). Strict JSON only.`;
  const user =
    `Main RQ: ${premise}\n\nSub-RQs:\n${rqList}\n\nReturn JSON:\n` +
    '```json\n' +
    `{
  "candidates": [
    {
      "id":"longi",
      "name":"Mixed-methods longitudinal field study",
      "weeks": 12,
      "arc":"one cohort · three lenses · one paper",
      "summary":"how the methods weave together (≤2 sentences)",
      "coverage": { ${coverageKeys} },
      "strengths":["…","…","…"],
      "tensions":["…","…"]
    }
    // 3 entries total — pick 3 distinct designs (e.g., a longitudinal
    // mixed-methods option, a tighter focused-intervention option, a
    // qualitative-core option). They must differ in time budget AND
    // in method mix so the user has a meaningful choice.
  ]
}` +
    '\n```' +
    `\nCoverage keys MUST be exactly: ${letters}.`;
  const text = await callLLM({ stage: 'methodology', system, user, maxTokens: 2500 });
  const parsed = extractJSON(text) as { candidates?: CandidateDesign[] };
  if (!parsed.candidates || !Array.isArray(parsed.candidates)) {
    throw new Error('methodology: malformed response');
  }
  return parsed.candidates.slice(0, 3);
}

/* ── plan ───────────────────────────────────────────────────────── */

export async function plan(
  design: CandidateDesign,
  premise: string,
): Promise<StudyPlan> {
  const system =
    `You are the planning agent. Given a chosen integrated study design
and the original premise, produce a phased plan with weeks, names,
detail, deliverables, recruitment, and risks. Strict JSON only.`;
  const user =
    `Premise: ${premise}\n\nChosen design: ${design.name} (${design.weeks}w)\nSummary: ${design.summary}\n\nReturn JSON:\n` +
    '```json\n' +
    `{
  "phases": [
    {"weeks": 1, "name":"…", "detail":"one sentence"},
    // 5-7 phases summing to roughly the design weeks
  ],
  "deliverables":["…","…","…"],
  "recruitment":"one-line description of who you'd recruit",
  "totalWeeks": 12,
  "risks":["…","…","…"]
}` +
    '\n```';
  const text = await callLLM({ stage: 'plan', system, user, maxTokens: 2000 });
  const parsed = extractJSON(text) as Partial<StudyPlan>;
  return {
    phases: Array.isArray(parsed.phases) ? parsed.phases : [],
    deliverables: Array.isArray(parsed.deliverables) ? parsed.deliverables : [],
    recruitment: parsed.recruitment ?? '',
    totalWeeks: parsed.totalWeeks ?? design.weeks,
    risks: Array.isArray(parsed.risks) ? parsed.risks : [],
  };
}

/* ── artifacts ──────────────────────────────────────────────────── */

export async function artifacts(
  design: CandidateDesign,
  studyPlan: StudyPlan,
): Promise<Artifact[]> {
  const system =
    `You are the artifacts agent. Given the chosen study design and its
plan, decide which handoff artifacts are needed (implementation spec
ONLY if there's a software component, validation protocol if any
human study, IRB-light memo, plus survey/diary kit only if relevant).
Draft each artifact's body in markdown. Strict JSON only.`;
  const user =
    `Design: ${design.name}\nSummary: ${design.summary}\nPhases:\n` +
    studyPlan.phases.map((p) => `  ${p.weeks}w · ${p.name}: ${p.detail}`).join('\n') +
    '\n\nReturn JSON:\n```json\n' +
    `{
  "artifacts": [
    {
      "id":"spec",
      "title":"Implementation plan (CLAUDE.md-style spec)",
      "kind":"spec",
      "body":"# title\\n\\n…full markdown content (≤80 lines)…"
    }
    // include only artifacts the design actually requires
    // valid kinds: spec | protocol | survey | irb | diary
  ]
}` +
    '\n```';
  const text = await callLLM({ stage: 'artifacts', system, user, maxTokens: 4000 });
  const parsed = extractJSON(text) as { artifacts?: Artifact[] };
  return Array.isArray(parsed.artifacts) ? parsed.artifacts.slice(0, 6) : [];
}

/* ── personas ───────────────────────────────────────────────────── */

export async function personas(n: number, premise: string): Promise<Persona[]> {
  const system =
    `You are the simulated-participant agent. Generate N synthetic
personas representing a diverse pool of plausible participants for
the given study. Each persona has: name, role, a one-line bias note
that colors their responses, and 2-3 short attribute chips
(workspace habits or relevant traits, e.g. "camera-off advocate",
"6 calls/day", "introvert"). Strict JSON only.`;
  const user =
    `Study premise: ${premise}\nN: ${n}\n\nReturn JSON:\n` +
    '```json\n' +
    `{
  "personas": [
    {
      "id":"1",
      "name":"Alex (32)",
      "role":"staff PM, US-CA",
      "bias":"high-trust, low IT friction, values quiet hours",
      "attrs":["camera-off advocate","6 calls/day","introvert"]
    }
    // n entries total — vary roles, regions, ages, biases, attrs
  ]
}` +
    '\n```';
  const text = await callLLM({ stage: 'personas', system, user, maxTokens: 2500 });
  const parsed = extractJSON(text) as { personas?: Persona[] };
  if (!Array.isArray(parsed.personas)) return [];
  return parsed.personas.slice(0, n).map((p, i) => ({
    id: p.id ?? String(i + 1),
    name: p.name ?? `Persona ${i + 1}`,
    role: p.role ?? '',
    bias: p.bias ?? '',
    attrs: Array.isArray(p.attrs) ? p.attrs.slice(0, 4) : [],
  }));
}

/* ── findings ───────────────────────────────────────────────────── */

export async function findings(
  studyPlan: StudyPlan,
  premise: string,
): Promise<Friction[]> {
  const system =
    `You are the simulated-walkthrough agent. Given a study plan, run a
mental pilot and surface 3 frictions: one critical, one medium, one
low-severity. Each friction has a trigger (what causes it), evidence
(what the simulated cohort showed), and a recommended fix. These are
[SIMULATION_REHEARSAL] — not real findings. Strict JSON only.`;
  const user =
    `Premise: ${premise}\nPhases:\n` +
    studyPlan.phases.map((p) => `  ${p.weeks}w · ${p.name}`).join('\n') +
    '\n\nReturn JSON:\n```json\n' +
    `{
  "findings":[
    {
      "id":"F1",
      "severity":"critical",
      "title":"short title",
      "trigger":"what causes it",
      "evidence":"what the simulated cohort showed",
      "fix":"recommended fix"
    },
    {"id":"F2","severity":"medium","title":"…","trigger":"…","evidence":"…","fix":"…"},
    {"id":"F3","severity":"low","title":"…","trigger":"…","evidence":"…","fix":"…"}
  ]
}` +
    '\n```';
  const text = await callLLM({ stage: 'findings', system, user, maxTokens: 1500 });
  const parsed = extractJSON(text) as { findings?: Friction[] };
  return Array.isArray(parsed.findings) ? parsed.findings : [];
}

/* ── report (titles + discussion + conclusion) ──────────────────── */

export async function report(input: {
  premise: string;
  rqs: SubRQ[];
  designName: string;
  findings: Friction[];
}): Promise<{ titleOptions: string[]; discussion: string; conclusion: string }> {
  const system =
    `You are the paper-writing agent. Given the premise, sub-RQs,
chosen study design, and surfaced frictions, produce 3 candidate
paper titles, a Discussion section (1 paragraph, ≤180 words), and a
Conclusion section (≤120 words). The Discussion MUST tag any
specific quantitative claim with [SIMULATION_REHEARSAL]. Strict JSON only.`;
  const user =
    `Premise: ${input.premise}
Sub-RQs:
${input.rqs.map((r) => `  RQ ${r.letter}: ${r.rq}`).join('\n')}
Design: ${input.designName}
Frictions surfaced:
${input.findings.map((f) => `  ${f.id} ${f.severity}: ${f.title} → fix: ${f.fix}`).join('\n')}

Return JSON:
\`\`\`json
{
  "titleOptions": ["…","…","…"],
  "discussion": "one paragraph ≤180 words",
  "conclusion": "one paragraph ≤120 words"
}
\`\`\``;
  const text = await callLLM({ stage: 'report', system, user, maxTokens: 2000 });
  const parsed = extractJSON(text) as {
    titleOptions?: string[];
    discussion?: string;
    conclusion?: string;
  };
  return {
    titleOptions: Array.isArray(parsed.titleOptions) ? parsed.titleOptions.slice(0, 3) : [],
    discussion: parsed.discussion ?? '',
    conclusion: parsed.conclusion ?? '',
  };
}

/* ── review (ARR-style peer review: 1AC + 3 reviewers) ───────────── */

export interface ReviewerCard {
  id: string;
  rec: 'A' | 'ARR' | 'RR' | 'RRX' | 'X';
  // Reviewer specialization (from probe-review.jsx v2 design):
  //   field           — claimed expertise area (free text)
  //   affiliation     — academic | industry | independent
  //   topicConfidence — expert | confident | tentative | outsider
  field: string;
  affiliation: 'academic' | 'industry' | 'independent';
  topicConfidence: 'expert' | 'confident' | 'tentative' | 'outsider';
  oneLine: string;
  strengths: string[];
  weaknesses: string[];
  toAuthors: string;
  toChairs: string;
}

export interface MetaReview {
  ac: string;
  verdict: 'accept' | 'minor' | 'major' | 'reject';
  summary: string;
  proposed: string;
  consensusPoints: Array<{ tag: 'all-3' | '2-of-3' | '1-of-3'; text: string; priority: 'high' | 'medium' | 'low' }>;
}

export interface ReviewSession {
  paperTitle: string;
  reviewers: ReviewerCard[];
  meta: MetaReview;
}

export async function review(input: {
  premise: string;
  rqs: SubRQ[];
  designName: string;
  findings: Friction[];
  paperTitle: string;
  discussion: string;
}): Promise<ReviewSession> {
  const system =
    `You are simulating a peer-review session for the user's research
paper. Produce ONE meta-review by the area chair (AC) and THREE
reviewer reports. Reviewers must DISAGREE meaningfully — assign
distinct recommendations and distinct specialization profiles so the
panel critiques the paper from different angles. Be specific, not
generic. Strict JSON only.

Recommendation buckets:
  A   = accept (rare)
  ARR = accept with revisions
  RR  = revise & resubmit
  RRX = major revision (rethink core argument)
  X   = reject

Verdict buckets: accept | minor | major | reject (the AC chooses).

Reviewer specialization (each reviewer must have ALL three):
  field           — short phrase naming their expertise area, e.g.
                    "attention & cognitive ergonomics", "qualitative
                    methods · CSCW", "organizational behavior".
  affiliation     — one of: academic | industry | independent
  topicConfidence — one of: expert | confident | tentative | outsider`;

  const user =
    `Paper title: ${input.paperTitle}
Premise: ${input.premise}
Sub-RQs:
${input.rqs.map((r) => `  RQ ${r.letter}: ${r.rq}`).join('\n')}
Chosen design: ${input.designName}
Frictions surfaced in evaluation:
${input.findings.map((f) => `  ${f.id} ${f.severity}: ${f.title}`).join('\n')}
Discussion (excerpt): ${input.discussion.slice(0, 600)}

Return JSON:
\`\`\`json
{
  "paperTitle": "${input.paperTitle.replace(/"/g, '\\"')}",
  "reviewers": [
    {
      "id": "R1",
      "rec": "RR",
      "field": "<short phrase>",
      "affiliation": "academic",
      "topicConfidence": "expert",
      "oneLine": "<≤16-word summary>",
      "strengths": ["…","…","…"],
      "weaknesses": ["…","…","…"],
      "toAuthors": "<paragraph addressed to authors, ≤140 words>",
      "toChairs": "<short note to chairs, ≤40 words>"
    },
    {"id":"R2", "rec":"ARR", "field":"<…>", "affiliation":"academic|industry|independent", "topicConfidence":"<…>", …},
    {"id":"R3", "rec":"RRX", "field":"<…>", "affiliation":"<…>", "topicConfidence":"<…>", …}
  ],
  "meta": {
    "ac": "AC",
    "verdict": "major",
    "summary": "<paragraph synthesizing the three reviews, ≤180 words>",
    "proposed": "<concrete revision plan, ≤140 words>",
    "consensusPoints": [
      {"tag":"all-3","text":"…","priority":"high"},
      {"tag":"2-of-3","text":"…","priority":"high"},
      {"tag":"2-of-3","text":"…","priority":"medium"},
      {"tag":"1-of-3","text":"…","priority":"low"}
    ]
  }
}
\`\`\``;

  const text = await callLLM({ stage: 'review', system, user, maxTokens: 4500 });
  const parsed = extractJSON(text) as Partial<ReviewSession>;

  // Defensive defaults so the UI never sees undefined critical fields.
  // The 3 reviewers default to a varied panel (academic/industry/independent
  // and a spread of topic confidence) when the LLM response misses fields.
  const FALLBACK_AFFIL: Array<ReviewerCard['affiliation']> = ['academic', 'academic', 'industry'];
  const FALLBACK_TC: Array<ReviewerCard['topicConfidence']> = ['expert', 'confident', 'tentative'];
  return {
    paperTitle: parsed.paperTitle ?? input.paperTitle,
    reviewers: Array.isArray(parsed.reviewers)
      ? parsed.reviewers.slice(0, 3).map((r, i) => ({
          id: r.id ?? `R${i + 1}`,
          rec: (r.rec ?? 'RR') as ReviewerCard['rec'],
          field: r.field ?? 'general HCI',
          affiliation: (['academic', 'industry', 'independent'] as const).includes(r.affiliation as ReviewerCard['affiliation'])
            ? r.affiliation as ReviewerCard['affiliation']
            : FALLBACK_AFFIL[i] ?? 'academic',
          topicConfidence: (['expert', 'confident', 'tentative', 'outsider'] as const).includes(r.topicConfidence as ReviewerCard['topicConfidence'])
            ? r.topicConfidence as ReviewerCard['topicConfidence']
            : FALLBACK_TC[i] ?? 'confident',
          oneLine: r.oneLine ?? '',
          strengths: Array.isArray(r.strengths) ? r.strengths : [],
          weaknesses: Array.isArray(r.weaknesses) ? r.weaknesses : [],
          toAuthors: r.toAuthors ?? '',
          toChairs: r.toChairs ?? '',
        }))
      : [],
    meta: {
      ac: parsed.meta?.ac ?? 'AC',
      verdict: (parsed.meta?.verdict ?? 'major') as MetaReview['verdict'],
      summary: parsed.meta?.summary ?? '',
      proposed: parsed.meta?.proposed ?? '',
      consensusPoints: Array.isArray(parsed.meta?.consensusPoints) ? parsed.meta!.consensusPoints : [],
    },
  };
}

/* ── boolean ops on research questions (Opus-only) ──────────────── */
//
// "Stolen" from Textoshop (arxiv 2409.17088): instead of treating the
// three brainstormed sub-RQs as fixed lanes, let the researcher
// compose them with set-style operations. Implemented as a single
// Opus call so the model holds both source RQs in context and writes
// the synthesized output as part of one judgment, not two prompts
// glued with string ops.
//
//   union  (A ∪ B): merge into one hybrid RQ that covers both angles
//   intersect (A ∩ B): extract the shared assumption / mechanism
//   subtract (A − B): keep A's framing minus B's confound
//
// Schema forces the model to emit a NEW SubRQ shape so downstream
// stages (literature, methodology) treat it like any other selected
// branch.

export type RqOp = 'union' | 'intersect' | 'subtract';

export async function rqBoolean(input: {
  premise: string;
  op: RqOp;
  a: SubRQ;
  b: SubRQ;
}): Promise<SubRQ & { rationale: string }> {
  const opNames: Record<RqOp, string> = {
    union:     'union (A ∪ B) — a hybrid RQ that covers both angles in one study',
    intersect: 'intersect (A ∩ B) — the shared assumption or mechanism that BOTH RQs depend on',
    subtract:  'subtract (A − B) — A\'s framing with B\'s confound or stance removed',
  };

  const system =
    `You are the RQ composition agent for an HCI rehearsal tool. The
researcher selected two sub-research-questions and wants to compose
them with a set-style operation. Your job is to produce ONE new
sub-RQ that genuinely synthesizes A and B according to the operation
— do not paraphrase one of them, do not produce a vague combination.

Be specific. The output rq should be a sharper, more directional
question than either input alone. Strict JSON only.`;

  const user =
    `Original premise: ${input.premise}

Operation: ${opNames[input.op]}

A:
  letter: ${input.a.letter}
  angle:  ${input.a.angle}
  rq:     ${input.a.rq}
  method: ${input.a.method}
  n:      ${input.a.n}

B:
  letter: ${input.b.letter}
  angle:  ${input.b.angle}
  rq:     ${input.b.rq}
  method: ${input.b.method}
  n:      ${input.b.n}

Return JSON:
\`\`\`json
{
  "letter": "X",
  "angle": "hybrid · short label",
  "rq": "the composed sub-RQ as a sharp question",
  "method": "method family that suits the composed RQ",
  "n": "rough N · short note",
  "rationale": "1-2 sentences explaining what this composition adds vs. picking either A or B alone"
}
\`\`\``;

  // Stage 'review' so mixed-mode routes this to Opus 4.7 — the
  // contrast/synthesis here is exactly the long-context judgment
  // Opus is best at, and the user's "creative Opus use" pitch
  // benefits from this being visibly Opus-routed.
  const text = await callLLM({ stage: 'review', system, user, maxTokens: 1024 });
  const parsed = extractJSON(text) as Partial<SubRQ & { rationale: string }>;
  return {
    letter:    parsed.letter ?? 'X',
    angle:     parsed.angle ?? `${input.op} · ${input.a.letter}+${input.b.letter}`,
    rq:        parsed.rq ?? `${input.a.rq} (${input.op}) ${input.b.rq}`,
    method:    parsed.method ?? input.a.method,
    n:         parsed.n ?? input.a.n,
    rationale: parsed.rationale ?? '',
  };
}

/* ── disagreement auditor (Opus-only meta-review of the panel) ───── */
//
// After the three reviewers have spoken, this Opus-only call ingests
// every reviewer block plus the AC's meta-review and produces a
// structured audit:
//   - axis-by-axis "real vs. apparent" disagreements
//   - which reviewer is most methodologically persuasive on each axis
//   - which disagreements the AC must NOT collapse into a bland average
//
// This is the demo's strongest Opus 4.7 anchor: long-context judgment
// across role-separated outputs, with a schema that forces contrast
// rather than allowing the model to generate polite consensus.

export interface DisagreementAudit {
  summary: string;
  realDisagreements: Array<{
    axis: 'novelty' | 'methodology' | 'ethics' | 'contribution' | 'validity' | 'scope' | 'feasibility';
    reviewerPositions: Array<{
      reviewer: string;
      position: string;
      evidence: string;
    }>;
    whyItMatters: string;
    doNotAverageBecause: string;
  }>;
  falseDisagreements: Array<{ axis: string; explanation: string }>;
  strongestReviewer: { reviewer: string; reason: string };
  acDecision: { recommendation: string; rationale: string; requiredRevisions: string[] };
}

export async function disagreementAudit(input: {
  paperTitle: string;
  premise: string;
  reviewers: Array<{
    id: string; rec: string; field?: string;
    affiliation?: string; topicConfidence?: string;
    oneLine?: string; strengths?: string[]; weaknesses?: string[];
  }>;
  meta: { ac?: string; verdict?: string; summary?: string; proposed?: string };
  discussion?: string;
}): Promise<DisagreementAudit> {
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
      "doNotAverageBecause": "…"
    }
  ],
  "falseDisagreements": [
    {"axis": "scope", "explanation": "all 3 raise it but in different language"}
  ],
  "strongestReviewer": {"reviewer": "R2", "reason": "…"},
  "acDecision": {
    "recommendation": "major revisions",
    "rationale": "…",
    "requiredRevisions": ["…", "…"]
  }
}
\`\`\``;

  const text = await callLLM({ stage: 'review', system, user, maxTokens: 3000 });
  const parsed = extractJSON(text) as Partial<DisagreementAudit>;
  return {
    summary: parsed.summary ?? '',
    realDisagreements: Array.isArray(parsed.realDisagreements) ? parsed.realDisagreements : [],
    falseDisagreements: Array.isArray(parsed.falseDisagreements) ? parsed.falseDisagreements : [],
    strongestReviewer: parsed.strongestReviewer ?? { reviewer: '', reason: '' },
    acDecision: parsed.acDecision ?? { recommendation: '', rationale: '', requiredRevisions: [] },
  };
}

/* ── teaser SVG (hero figure for the project page) ───────────────── */

export async function teaser(input: {
  premise: string;
  paperTitle: string;
  designName: string;
  rqs: SubRQ[];
}): Promise<{ svg: string; caption: string }> {
  const system =
    `You are an editorial illustrator. Generate a single inline SVG
that works as the HERO figure on a Nerfies-style academic project page.

Hard constraints:
- Output JSON containing one valid <svg>…</svg> string and a one-line caption.
- viewBox="0 0 880 360", no width/height attributes (CSS sizes it).
- No external assets; only inline shapes, text, gradients, masks.
- Palette: warm ivory paper #fbf8f1, navy ink #1a1f2c, vermilion accent #b04a3a, amber warm #d9a548. Stay close to these — the page CSS uses them.
- No raster <image>, no <foreignObject>, no animations.
- Keep it abstract / typographic / cartographic — schematic representation
  of the study's shape (sub-questions, methods, findings). Not a photo.
- ≤ 4 KB after minify.

Strict JSON only — no prose outside the JSON envelope.`;

  const user =
    `Paper: ${input.paperTitle}
Premise: ${input.premise}
Chosen design: ${input.designName}
Sub-RQs:
${input.rqs.map((r) => `  RQ ${r.letter} (${r.angle}): ${r.rq}`).join('\n')}

Return JSON:
\`\`\`json
{
  "svg": "<svg viewBox=\\"0 0 880 360\\" xmlns=\\"http://www.w3.org/2000/svg\\">…</svg>",
  "caption": "≤ 14 words, what the figure shows"
}
\`\`\``;

  const text = await callLLM({ stage: 'report', system, user, maxTokens: 4000 });
  const parsed = extractJSON(text) as { svg?: string; caption?: string };
  return {
    svg: parsed.svg ?? '',
    caption: parsed.caption ?? '',
  };
}

/** Whether at least one provider has a usable API key right now. */
export function hasApiKey(): boolean {
  return detectProvider().canCallApi;
}
