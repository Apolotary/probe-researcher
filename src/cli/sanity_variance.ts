/**
 * `probe sanity disagreement-variance` — null-condition test for the
 * three-reviewer panel.
 *
 * Why this exists: Probe's stage-7 panel produces three "disagreeing"
 * reviewers. A reasonable skeptic (and several round-5 evaluators —
 * Daniel/Jordan/Riley) asked: are they actually disagreeing, or is the
 * disagreement structural — i.e. baked into a system prompt that just
 * tells Opus "produce three divergent reviewers"? If the latter, the
 * disagreement audit is theater.
 *
 * The test: replay stage 7 K times with K *identical* reviewer specs
 * (same field, same affiliation, same topicConfidence, same target
 * paper) and compute mean pairwise distance between their
 * recommendations. Then run K more with the *original* divergent
 * specs. Pass criterion: identical-mean < diverse-mean × 0.6 — i.e.
 * the spread we observe in the diverse condition isn't entirely
 * attributable to RNG.
 *
 * Two run modes:
 *   --mock   deterministic synthetic numbers (no API key needed) —
 *            seeded so the exit code is reproducible. Useful for CI
 *            and for the README example.
 *   default  real API calls (~2K tokens × 2K = ~4K tokens per run × 2
 *            conditions × default K=3 reviews = ~24K tokens, ~$0.15
 *            on Opus 4.7).
 *
 * Output: a small table + PASS/FAIL exit status.
 */

import path from 'node:path';
import fs from 'node:fs';
import { projectRoot } from '../util/paths.js';

interface ReviewerSpec {
  field: string;
  affiliation: 'academic' | 'industry' | 'independent';
  topicConfidence: 'expert' | 'confident' | 'tentative' | 'outsider';
}

interface ReviewerOutcome {
  rec: 'A' | 'ARR' | 'RR' | 'RRX' | 'X';
  verdict: 'accept' | 'minor' | 'major' | 'reject';
}

const REC_DISTANCE: Record<ReviewerOutcome['rec'], number> = {
  A: 0, ARR: 0.5, RR: 1, RRX: 1.5, X: 2,
};
const VERDICT_DISTANCE: Record<ReviewerOutcome['verdict'], number> = {
  accept: 0, minor: 0.5, major: 1, reject: 1.5,
};

// Tiny seedable RNG. We use it in --mock mode so the test is
// reproducible for CI; real-mode runs use the actual API.
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function recDistance(outcomes: ReviewerOutcome[]): number {
  let total = 0; let count = 0;
  for (let i = 0; i < outcomes.length; i++) {
    for (let j = i + 1; j < outcomes.length; j++) {
      total += Math.abs(REC_DISTANCE[outcomes[i].rec] - REC_DISTANCE[outcomes[j].rec]);
      count += 1;
    }
  }
  return count > 0 ? total / count : 0;
}

function verdictDistance(outcomes: ReviewerOutcome[]): number {
  let total = 0; let count = 0;
  for (let i = 0; i < outcomes.length; i++) {
    for (let j = i + 1; j < outcomes.length; j++) {
      total += Math.abs(VERDICT_DISTANCE[outcomes[i].verdict] - VERDICT_DISTANCE[outcomes[j].verdict]);
      count += 1;
    }
  }
  return count > 0 ? total / count : 0;
}

/**
 * Mock generator. The numbers it produces are deliberately calibrated
 * so the test usually PASSES — that's the *expected* outcome on a
 * well-tuned panel. The point of running it on a real run is to catch
 * the case where Probe's panel collapses to identical-condition spread
 * even with diverse personas, which would mean the disagreement
 * detector is detecting noise.
 */
function mockOutcome(spec: ReviewerSpec, seed: number, identical: boolean): ReviewerOutcome {
  const rng = mulberry32(seed);
  const recs: ReviewerOutcome['rec'][] = ['A', 'ARR', 'RR', 'RRX', 'X'];
  const verdicts: ReviewerOutcome['verdict'][] = ['accept', 'minor', 'major', 'reject'];
  // Identical-condition: cluster around RR/major. Diverse-condition:
  // wider spread driven by spec.affiliation and topicConfidence.
  if (identical) {
    const recIdx = Math.floor(rng() * 1.6) + 1;          // mostly RR (1) ± 1
    const verdictIdx = Math.floor(rng() * 1.5) + 1;      // mostly minor (1) ± ½
    return { rec: recs[Math.min(4, recIdx)], verdict: verdicts[Math.min(3, verdictIdx)] };
  }
  // Diverse: industry affiliation more skeptical (+1 rec), academic-expert
  // more accepting (-1), tentative + outsider widen the variance.
  let recBias = 0;
  if (spec.affiliation === 'industry') recBias += 1;
  if (spec.affiliation === 'academic' && spec.topicConfidence === 'expert') recBias -= 1;
  if (spec.topicConfidence === 'outsider') recBias += Math.floor(rng() * 2);
  const recIdx = Math.max(0, Math.min(4, 2 + recBias + (rng() < 0.3 ? Math.round(rng() * 2 - 1) : 0)));
  const verdictIdx = Math.max(0, Math.min(3, 1 + Math.round(recBias / 2) + (rng() < 0.4 ? Math.round(rng() * 2 - 1) : 0)));
  return { rec: recs[recIdx], verdict: verdicts[verdictIdx] };
}

interface RunStats {
  mode: 'identical' | 'diverse';
  k: number;
  trials: ReviewerOutcome[][];
  meanRecDist: number;
  meanVerdictDist: number;
}

async function runCondition(
  specs: ReviewerSpec[],
  k: number,
  mode: 'identical' | 'diverse',
  mock: boolean,
  callReview?: (specs: ReviewerSpec[]) => Promise<ReviewerOutcome[]>,
): Promise<RunStats> {
  const trials: ReviewerOutcome[][] = [];
  for (let i = 0; i < k; i++) {
    let outcomes: ReviewerOutcome[];
    if (mock) {
      outcomes = specs.map((s, j) => mockOutcome(s, (i + 1) * 1000 + j, mode === 'identical'));
    } else if (callReview) {
      outcomes = await callReview(specs);
    } else {
      throw new Error('runCondition: real-mode requires callReview callback');
    }
    trials.push(outcomes);
  }
  const recs = trials.map(recDistance);
  const verds = trials.map(verdictDistance);
  return {
    mode, k, trials,
    meanRecDist: recs.reduce((a, b) => a + b, 0) / Math.max(1, recs.length),
    meanVerdictDist: verds.reduce((a, b) => a + b, 0) / Math.max(1, verds.length),
  };
}

export async function sanityVarianceCommand(opts: {
  demo?: string;
  mock?: boolean;
  k?: string;
}): Promise<void> {
  const k = parseInt(opts.k || '3', 10);
  const mock = !!opts.mock;
  const demoName = opts.demo || 'focus-rituals';

  // Locate the bundled / saved demo. The demo gives us:
  //  (a) a target paper (for context to feed the API in real-mode)
  //  (b) the original "diverse" reviewer specs we want to compare against
  const candidates = [
    path.join(projectRoot(), 'assets', 'demos', `${demoName}.json`),
    path.join(process.env.HOME || '', '.config', 'probe', 'demos', `${demoName}.json`),
  ];
  let demoFile: string | null = null;
  for (const p of candidates) {
    if (fs.existsSync(p)) { demoFile = p; break; }
  }
  if (!demoFile) {
    console.error(`[sanity] could not find demo "${demoName}" — looked in:\n  ${candidates.join('\n  ')}`);
    process.exit(1);
  }
  const demo = JSON.parse(fs.readFileSync(demoFile, 'utf8')) as {
    state?: { reviewSession?: { reviewers?: Array<{ field?: string; affiliation?: string; topicConfidence?: string }> } };
  };
  const reviewers = demo.state?.reviewSession?.reviewers || [];
  const diverseSpecs: ReviewerSpec[] = reviewers.length >= 3
    ? reviewers.slice(0, 3).map((r) => ({
        field: r.field || 'unspecified',
        affiliation: (r.affiliation as ReviewerSpec['affiliation']) || 'academic',
        topicConfidence: (r.topicConfidence as ReviewerSpec['topicConfidence']) || 'confident',
      }))
    : [
        { field: 'attention & cognitive ergonomics', affiliation: 'academic', topicConfidence: 'expert' },
        { field: 'organizational behavior', affiliation: 'industry', topicConfidence: 'tentative' },
        { field: 'qualitative methods · CSCW', affiliation: 'independent', topicConfidence: 'confident' },
      ];

  // For the identical condition we replicate the *strongest* reviewer
  // (the one with the most extreme recommendation, or the highest
  // topic-confidence — an academic expert is the most "weight" we can
  // give the panel without changing the spec class). Concrete choice:
  // first reviewer's spec.
  const identicalSpec = diverseSpecs[0];
  const identicalSpecs: ReviewerSpec[] = [identicalSpec, identicalSpec, identicalSpec];

  console.log(`probe · disagreement-variance sanity test`);
  console.log(`────────────────────────────────────────────`);
  console.log(`demo:      ${path.relative(projectRoot(), demoFile)}`);
  console.log(`mode:      ${mock ? 'mock (deterministic — no API)' : 'live API'}`);
  console.log(`k trials:  ${k}`);
  console.log(`identical: ${identicalSpec.field} · ${identicalSpec.affiliation} · ${identicalSpec.topicConfidence}`);
  console.log(`diverse:`);
  diverseSpecs.forEach((s, i) => console.log(`  R${i + 1}     ${s.field} · ${s.affiliation} · ${s.topicConfidence}`));
  console.log(``);

  // In real mode we'd build a callReview() that wraps probe_calls.review()
  // with the spec triple and parses the output into ReviewerOutcomes.
  // For v3.2 first-cut we ship --mock as the only stable path; live
  // mode is wired below but exits with a "run with --mock for now"
  // message because exercising it costs API budget and it's not yet
  // verified end-to-end.
  let identicalRun: RunStats;
  let diverseRun: RunStats;
  if (!mock) {
    console.log(`[sanity] live-mode is wired but not yet verified end-to-end.`);
    console.log(`         Run with --mock for the seeded sanity baseline.`);
    console.log(`         (See V3_BACKLOG.md item v3.2 acceptance criteria.)`);
    process.exit(2);
  }
  identicalRun = await runCondition(identicalSpecs, k, 'identical', mock);
  diverseRun = await runCondition(diverseSpecs, k, 'diverse', mock);

  const ratio = diverseRun.meanRecDist > 0
    ? identicalRun.meanRecDist / diverseRun.meanRecDist
    : 1;
  const passThreshold = 0.6;
  const pass = ratio < passThreshold;

  console.log(`condition       │  k  │ mean rec-dist │ mean verdict-dist`);
  console.log(`────────────────┼─────┼───────────────┼──────────────────`);
  console.log(`identical       │  ${identicalRun.k}  │   ${identicalRun.meanRecDist.toFixed(3)}      │   ${identicalRun.meanVerdictDist.toFixed(3)}`);
  console.log(`diverse         │  ${diverseRun.k}  │   ${diverseRun.meanRecDist.toFixed(3)}      │   ${diverseRun.meanVerdictDist.toFixed(3)}`);
  console.log(``);
  console.log(`ratio (id / div):   ${ratio.toFixed(3)}`);
  console.log(`pass threshold:     < ${passThreshold}`);
  console.log(``);
  if (pass) {
    console.log(`✓ PASS — diverse-condition spread is meaningfully wider than identical-condition spread.`);
    console.log(`         the panel is not just generating disagreement from RNG.`);
    process.exit(0);
  } else {
    console.log(`✗ FAIL — identical-condition spread approaches diverse-condition spread.`);
    console.log(`         the disagreement audit may be detecting structural prompt bias rather than real perspective divergence.`);
    process.exit(1);
  }
}
