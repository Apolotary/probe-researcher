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
import { modelForStage, type UiStage } from '../config/probe_toml.js';
import type {
  SubRQ, LiteratureBlock, CandidateDesign, StudyPlan, Artifact,
  Persona, Friction,
} from '../cli/ui_state.js';

let anthropicClient: Anthropic | null = null;
function anthropic(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');
    anthropicClient = new Anthropic({ apiKey });
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
  const provider = detectProvider();
  if (!provider.canCallApi) throw new NoApiKeysError();
  if (provider.name !== 'anthropic') {
    // For now we only wire Anthropic — OpenAI fallback could be added
    // by mirroring the dispatch logic in src/anthropic/client.ts. The
    // UI surface degrades gracefully to canned content in that case.
    throw new Error(`probe_calls: only the anthropic provider is wired; got ${provider.name}`);
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

/** Whether at least one provider has a usable API key right now. */
export function hasApiKey(): boolean {
  return detectProvider().canCallApi;
}
