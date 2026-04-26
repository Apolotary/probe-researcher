/* global React */
const { useState, useEffect } = React;

// Stage 7 — Review
// Simulates a peer-review pass on the report from stage 6.
// AC + 3 reviewers, per-reviewer recommendation in 5 buckets, plus a meta-review.
// Each reviewer carries a specialization profile (field · affiliation · topic confidence)
// so the panel can be tuned to the kind of scrutiny the author actually wants.
//
// Author can: incorporate feedback (queues a report rerun with the chosen issues),
// dismiss the review, or export the rebuttal letter.
//
// Exports:
//   window.ReviewBody                 — the main pane body for the stage
//   window.makeInitialReviewState()  — the seeded run shape
//   window.reviewRerunPlaceholder()  — used by RerunDock
//   window.synthesizeReviewSummary() — used by RerunDock when a rerun lands

const palette = window.__probePalette;
const kbdStyle = window.__probeKbd;
const chipStyle = window.__probeChip;

// Recommendation buckets — five-bucket ladder used at most major venues.
//   A    accept (rare)
//   ARR  accept with revisions required (1AC verifies)
//   RR   revise & resubmit (next cycle)
//   RRX  revise & resubmit, but conditional on a major rethink
//   X    reject
const REC = {
  A:   { label: 'accept',                short: 'A',   color: '#7fb069', desc: 'ready as-is' },
  ARR: { label: 'accept w/ revisions',   short: 'ARR', color: '#a8c777', desc: '1AC verifies fixes' },
  RR:  { label: 'revise & resubmit',     short: 'RR',  color: '#d9a548', desc: 'next cycle' },
  RRX: { label: 'major revision',        short: 'RRX', color: '#c87838', desc: 'rethink core argument' },
  X:   { label: 'reject',                short: 'X',   color: '#e26e6e', desc: 'venue mismatch or fatal flaw' },
};

// Reviewer specialization tokens.
// `field`         — research area the reviewer claims expertise in
// `affiliation`   — where they sit; shapes the kind of critique they bring
// `topicConfidence` — how close the paper is to their actual reading list
const AFFIL = {
  academic:    { label: 'academic',    short: 'AC', color: '#a89bd8', desc: 'university lab · publishes regularly' },
  industry:    { label: 'industry',    short: 'IN', color: '#7dcfff', desc: 'practitioner · ships product' },
  independent: { label: 'independent', short: 'IX', color: '#c5c8d4', desc: 'consultant · no affiliation' },
};
const TOPIC_CONF = {
  expert:     { label: 'topic expert',  color: '#7fb069', desc: 'this is their subfield' },
  confident:  { label: 'confident',     color: '#a8c777', desc: 'reads adjacent work regularly' },
  tentative:  { label: 'tentative',     color: '#d9a548', desc: 'general competence; will defer on specifics' },
  outsider:   { label: 'outsider',      color: '#c87838', desc: 'reads as a smart non-specialist' },
};

const VERDICT = {
  accept:        { label: 'accept',           color: '#7fb069', glyph: '✓' },
  minor:         { label: 'minor revisions',  color: '#a8c777', glyph: '✓' },
  major:         { label: 'major revisions',  color: '#d9a548', glyph: '~' },
  reject:        { label: 'reject',           color: '#e26e6e', glyph: '✗' },
};

function makeInitialReviewState() {
  const seed = seededReview();
  return {
    status: 'fresh',
    lastRun: '3d ago',
    currentRunId: seed.id,
    runs: [seed],
    seed,
  };
}

function seededReview() {
  return {
    id: 'r1',
    when: '3d ago',
    label: 'simulated · 1AC + 3 reviewers',
    summary: 'verdict · major revisions · 2× RR / 1× RRX / 1× ARR',
    verdict: 'major',
    venue: 'simulated panel · 1AC + 3',
    paperTitle: 'Threading the Day: Within-Day Fatigue in Remote Knowledge Work',
    submittedAt: 'just now',
    reviewerCount: 3,
    chairs: 1,
    reviewers: [
      {
        id: 'R1', role: 'reviewer',
        field: 'attention & cognitive ergonomics',
        affiliation: 'academic',
        topicConfidence: 'expert',
        rec: 'RR',
        oneLine: 'Strong wedge, under-powered pilot, somatic-first finding feels overclaimed.',
        strengths: [
          'The framing of agenda-presence as a tractable lever is novel and well-positioned against the ZEFS literature.',
          'Calendar-aware ESM trigger is a real methodological contribution — most prior work samples once per day.',
          'Member-checked exit interviews lend the qualitative arm credibility that pure thematic analysis would not.',
        ],
        weaknesses: [
          'N=18 with d ≥ 0.5 is borderline for the ritual sub-study; authors acknowledge this but a power simulation is missing.',
          'The "somatic-first vocabulary" claim rests on a single coding pass by one analyst. No inter-rater reliability reported.',
          'Threats-to-validity section is brief — novelty effect of the ESM agent itself is plausibly large in week 1.',
        ],
        toAuthors:
          'I enjoyed reading this and think it has a clear contribution shape. My main concern is the qualitative arm: the "somatic-first" finding is the most exciting in the paper, and it is exactly the one that needs the most methodological care. Please report inter-rater reliability for the body-mapping codes (or run a second pass with an outside coder), and consider tempering the abstract claim. I would also like to see a power simulation for the ritual sub-study before recommending acceptance — the current N feels generous but unverified.',
        toChairs:
          'Borderline RR. If authors can address the IRR + power concerns in a revision, I would lean ARR. The wedge is real.',
      },
      {
        id: 'R2', role: 'reviewer',
        field: 'qualitative methods · CSCW',
        affiliation: 'academic',
        topicConfidence: 'confident',
        rec: 'ARR',
        oneLine: 'Methodologically clean, well-written. Some reviewer-2 nitpicks on positioning.',
        strengths: [
          'The mixed-methods design is the right choice and the authors justify it cleanly.',
          'The qualitative findings are vivid; the somatic-first language is a contribution in itself.',
          'Open-source agent + replication kit is exactly what this subfield needs.',
        ],
        weaknesses: [
          'Related work over-emphasizes ZEFS at the expense of the broader recovery / micro-break literature. Sonnentag et al. deserve more than one citation.',
          'The discussion paragraph on agenda-presence is the strongest in the paper but is buried behind two paragraphs of caveats. Move it up.',
          'Figure 3 is unreadable in grayscale.',
        ],
        toAuthors:
          'Recommending ARR. The paper is in good shape and the contribution is clear. Please broaden the related work to include the recovery literature beyond ZEFS, restructure the discussion so agenda-presence leads, and re-do Figure 3 with patterns rather than colors. None of these should require new data.',
        toChairs:
          'Easy ARR for me. Issues are presentational and one mid-sized restructuring of related work.',
      },
      {
        id: 'R3', role: 'reviewer',
        field: 'organizational behavior · remote work',
        affiliation: 'industry',
        topicConfidence: 'tentative',
        rec: 'RRX',
        oneLine: 'Interesting but I am not convinced the simulated pilot is a sound scaffold for the claims made.',
        strengths: [
          'Clear writing, strong figures (mostly).',
          'The audience-facing artifacts (DIARY_KIT, PROTOCOL) are unusually thoughtful for a methods-heavy paper.',
        ],
        weaknesses: [
          'A 4-week simulated pilot with synthetic participants cannot answer the within-subjects ritual question; this needs a real deployment.',
          'The framing positions this as field work but it is closer to a study-design proposal. Be honest about what the contribution is.',
          'Several claims in the discussion ("dominant framing of meeting-fatigue as load-driven holds") are not actually supported by the data presented — they are inherited from the literature review.',
        ],
        toAuthors:
          'I think there is a real paper here but it is not the paper currently submitted. Either reframe as a study-design contribution (with the IRB-ready protocol as the deliverable) and submit to a methods venue, or run the actual deployment and resubmit with real data. As written, the gap between the methods and the findings claims is too wide for me to recommend.',
        toChairs:
          'RRX. I would be open to a rewritten methods-paper version, but the current framing oversells a simulated pilot.',
      },
    ],
    // The 1AC's meta-review pulls the three reviews together and proposes the verdict.
    meta: {
      ac: 'AC',
      verdict: 'major',
      summary:
        'Three reviewers, three different verdicts (RR, ARR, RRX). All agree the framing and methodological scaffolding are strong. All three flag concerns about the gap between the simulated pilot and the discussion-level claims, though they vary in severity. R1\'s IRR concern and R3\'s "this is a methods paper" critique converge on the same underlying issue: the qualitative findings need either more methodological rigor or a more modest framing.',
      proposed:
        'Major revisions. The authors should (a) report inter-rater reliability for the body-mapping codes or run a second pass, (b) include a power simulation for the ritual sub-study, (c) temper claims that exceed what a simulated pilot can support, and (d) restructure related work + the discussion as R2 suggests. If executed, this becomes a strong contribution.',
      consensusPoints: [
        { tag: 'all-3', text: 'discussion claims overreach what a simulated pilot can support', priority: 'high' },
        { tag: '2-of-3', text: 'methodological reporting gaps — IRR for qualitative codes, power simulation for ritual', priority: 'high' },
        { tag: '2-of-3', text: 'related work under-cites the recovery / micro-break literature', priority: 'medium' },
        { tag: '1-of-3', text: 'figure 3 needs grayscale-safe patterns', priority: 'low' },
      ],
    },
  };
}

// Entry placeholders / synthesizer used by the rerun dock when this stage is rerun.
function reviewRerunPlaceholder() {
  return 'e.g. simulate harsher reviewers · target a specific venue · weight methods over novelty';
}

function synthesizeReviewSummary(prompt) {
  const short = (prompt || '').slice(0, 80);
  return `re-simulated panel · 1AC + 3 reviewers · "${short}"`;
}

// ─── Main body ─────────────────────────────────────────────────────────────

function ReviewBody({ data, density }) {
  // Pick the run currently selected (or the seed if no run yet exists).
  const review =
    data.runs.find((r) => r.id === data.currentRunId) ||
    data.runs[data.runs.length - 1] ||
    data.seed;
  const isSeed = !data.runs.length;
  const [openId, setOpenId] = useState('AC'); // which reviewer's panel is expanded

  // v3.4: track rebuttals per-reviewer-id so the disagreement audit can
  // re-run when a rebuttal lands (its updated reviewer outcome flips
  // the meta-decision, possibly). The rebuttalNonce changes whenever a
  // rebuttal resolves; the audit card subscribes via prop.
  const [rebuttals, setRebuttals] = useState({});
  const handleRebuttalResolved = (reviewerId, data) => {
    setRebuttals((prev) => ({ ...prev, [reviewerId]: data }));
  };

  // Build an "effective" review: replace any reviewer for whom a rebuttal
  // has produced an updated stance. The original reviewer travels in
  // .original so the audit can still display the pre-rebuttal position.
  const effectiveReview = React.useMemo(() => {
    const reviewers = (review.reviewers || []).map((r) => {
      const reb = rebuttals[r.id];
      if (reb && reb.outcome === 'updated' && reb.updated) {
        return { ...reb.updated, _rebuttedFrom: r.rec, _rebuttalRationale: reb.rationale };
      }
      return r;
    });
    return { ...review, reviewers };
  }, [review, rebuttals]);

  if (isSeed && data.status === 'queued') {
    return <ReviewEmpty review={review} />;
  }

  return (
    <>
      <Section title="verdict" accent={VERDICT[review.verdict].color}>
        <VerdictHeader review={effectiveReview} />
      </Section>

      <Section title="meta-review · 1AC" accent="#d9a548">
        <MetaReviewCard meta={effectiveReview.meta} expanded={openId === 'AC'}
          onToggle={() => setOpenId(openId === 'AC' ? null : 'AC')} />
      </Section>

      <Section title={`reviews · ${effectiveReview.reviewers.length} reviewers`} accent="#7dcfff">
        <div style={{ color: palette.ink3, fontSize: 11.5, marginTop: 4, marginBottom: 8 }}>
          click a review to read it in full · recommendations span {summarizeRecs(effectiveReview.reviewers)}
          {Object.keys(rebuttals).length > 0 && (
            <span style={{ marginLeft: 10, color: '#7fb069' }}>
              · {Object.values(rebuttals).filter((r) => r.outcome === 'updated').length} rebuttal{Object.values(rebuttals).filter((r) => r.outcome === 'updated').length === 1 ? '' : 's'} accepted
            </span>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(review.reviewers || []).map((r) => (
            <ReviewerCard key={r.id} reviewer={r}
              expanded={openId === r.id}
              onToggle={() => setOpenId(openId === r.id ? null : r.id)}
              onRebuttalResolved={handleRebuttalResolved} />
          ))}
        </div>
      </Section>

      <Section title="opus 4.7 · disagreement audit" accent="#d9a548">
        <DisagreementAuditCard review={effectiveReview} />
      </Section>

      <Section title="what now" accent={palette.amber}>
        <ActionsRow review={review} />
      </Section>

      <Section title="panel composition · for next rerun" accent="#a89bd8">
        <PanelComposer reviewers={review.reviewers} />
      </Section>
    </>
  );
}

// ─── Disagreement Audit (Opus 4.7) ────────────────────────────────
// Renders the structured forced-contrast audit returned by
// /api/probe/disagreement-audit. The audit is the project's
// strongest Opus-specific moment: the model has to identify which
// reviewer disagreements are real vs. apparent, name what the AC
// must NOT average away, and pick the strongest reviewer.
//
// The schema (realDisagreements / falseDisagreements / strongestReviewer
// / acDecision) is forced-contrast: the model can't degenerate into
// polite consensus without explicitly violating the schema.
function DisagreementAuditCard({ review }) {
  const [audit, setAudit] = React.useState(null);
  const [running, setRunning] = React.useState(false);
  const [error, setError] = React.useState(null);

  // Auto-fire on mount — the cached payload is in the bundled demo,
  // and even on a live run the audit is the demo's headline Opus
  // moment, so it should appear without a click.
  React.useEffect(() => {
    if (!review?.reviewers?.length) return;
    setRunning(true);
    fetch('/api/probe/disagreement-audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paperTitle: review.paperTitle || 'Untitled',
        premise: review.premise || '',
        reviewers: review.reviewers,
        meta: review.meta || {},
        discussion: review.discussion || '',
      }),
    })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('audit ' + r.status)))
      .then((data) => {
        setAudit(data);
        setRunning(false);
      })
      .catch((e) => {
        setError(String(e.message || e));
        setRunning(false);
      });
  }, [review?.reviewers?.length]);

  if (running && !audit) {
    return (
      <div style={{
        padding: '14px 16px', background: palette.bg2,
        border: '1px solid rgba(217,165,72,0.3)', borderLeft: '3px solid #d9a548',
        borderRadius: 4, color: palette.ink3, fontSize: 12.5,
      }}>
        <span style={{ color: '#d9a548', fontWeight: 600 }}>claude-opus-4-7</span>
        <span style={{ marginLeft: 8 }}>· auditing disagreement across {review.reviewers.length} reviewers + AC…</span>
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div style={{ color: palette.ink3, fontSize: 12 }}>
        Audit unavailable {error ? `(${error})` : ''} — schema requires reviewer text + AC verdict.
      </div>
    );
  }

  // Lineage strip — addresses "why did this audit run, what input
  // did it use?" feedback from the persona evaluations. Surfaces
  // exactly what the audit reads from and what model produced it,
  // so the card doesn't feel magical or opaque.
  const reviewerIds = (review.reviewers || []).map((r) => r.id).join(' + ');
  const replayMode = window.__probeStageMode === 'mixed' ? 'live or replay' : window.__probeStageMode;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 10,
      padding: '14px 16px', background: palette.bg2,
      border: '1px solid rgba(217,165,72,0.4)', borderLeft: '3px solid #d9a548',
      borderRadius: 4,
    }}>
      <div style={{ color: '#d9a548', fontSize: 11, letterSpacing: '0.10em',
        textTransform: 'uppercase', fontWeight: 600 }}>
        forced-contrast schema · do-not-average policy
      </div>

      {/* Audit lineage — shows the user exactly what the model read,
          what schema it produced, and which model generated it. */}
      <div style={{
        color: palette.ink3, fontSize: 11, fontFamily: 'inherit',
        padding: '6px 8px', background: 'rgba(217,165,72,0.04)',
        border: '1px dashed rgba(217,165,72,0.25)', borderRadius: 3,
        lineHeight: 1.5,
      }}>
        <span style={{ color: palette.ink2 }}>generated from</span>{' '}
        <span style={{ color: palette.ink, fontFamily: 'inherit' }}>{reviewerIds || '?'} + AC meta-review</span>
        {' · '}
        <span style={{ color: palette.ink2 }}>schema</span>{' '}
        <span style={{ color: palette.ink, fontFamily: 'inherit' }}>realDisagreements / falseDisagreements / strongestReviewer / acDecision</span>
        {' · '}
        <span style={{ color: palette.ink2 }}>model</span>{' '}
        <span style={{ color: '#d9a548', fontWeight: 600, fontFamily: 'inherit' }}>claude-opus-4-7</span>
      </div>

      {/* v3.3 — "tuned to encourage spread" admission. The persona
          panel kept asking "is the disagreement real or just baked
          into the prompt?" — this disclosure shows the actual prompt
          fragment that nudges divergence and points the user to the
          variance sanity test for the null-condition baseline. */}
      <details style={{
        margin: 0, fontSize: 11.5, color: palette.ink3,
      }}>
        <summary style={{
          cursor: 'pointer', userSelect: 'none', listStyle: 'none',
          padding: '5px 8px',
          border: '1px dashed rgba(217,165,72,0.25)', borderRadius: 3,
          background: 'rgba(217,165,72,0.03)',
          color: palette.ink3,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>▸</span>
          <span>show prompt · why these reviewers disagree</span>
          <span style={{
            marginLeft: 'auto', color: palette.ink4, fontSize: 10,
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>tuned to encourage spread</span>
        </summary>
        <div style={{
          padding: '10px 12px', marginTop: 6,
          background: 'rgba(217,165,72,0.03)',
          border: '1px solid rgba(217,165,72,0.18)',
          borderRadius: 3, color: palette.ink2, fontSize: 11.5, lineHeight: 1.55,
        }}>
          <div style={{
            color: palette.ink3, fontSize: 10.5, letterSpacing: '0.08em',
            textTransform: 'uppercase', marginBottom: 4,
          }}>fragment from stage-7 system prompt</div>
          <pre style={{
            margin: '4px 0 8px', padding: '8px 10px',
            background: 'rgba(0,0,0,0.20)', borderRadius: 2,
            fontFamily: 'inherit', fontSize: 11, color: palette.cyan,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>{`Reviewers must DISAGREE meaningfully — assign distinct recommendations and distinct specialization profiles so the panel critiques the paper from different angles.`}</pre>
          <div style={{ color: palette.ink2, fontSize: 11.5, lineHeight: 1.6 }}>
            <strong style={{ color: palette.amber }}>Caveat.</strong> The reviewers
            were prompted to take divergent angles. The disagreements detected here
            are real differences in their generated outputs, but their initial
            divergence is structurally encouraged. To check that this
            audit isn't <em>only</em> picking up prompt bias, run the
            null-condition variance test:
            <code style={{
              display: 'inline-block', margin: '2px 0 0',
              padding: '1px 8px', background: 'rgba(0,0,0,0.20)',
              border: `1px solid ${palette.rule}`, borderRadius: 2,
              color: palette.cyan, fontSize: 10.5,
            }}>probe sanity disagreement-variance --mock</code>
            {' '}— it replays stage 7 with three identical reviewer specs and
            confirms the diverse condition produces meaningfully wider
            spread (see <code style={{ color: palette.cyan }}>V3_BACKLOG.md</code> §v3.2).
          </div>
        </div>
      </details>

      {audit.summary && (
        <div style={{ color: palette.ink, fontSize: 13, lineHeight: 1.55 }}>
          {audit.summary}
        </div>
      )}

      {Array.isArray(audit.realDisagreements) && audit.realDisagreements.length > 0 && (
        <div>
          <div style={{ color: palette.ink2, fontSize: 11, letterSpacing: '0.10em',
            textTransform: 'uppercase', marginBottom: 6 }}>
            real disagreements · {audit.realDisagreements.length} · do not average away
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {audit.realDisagreements.map((d, i) => (
              <div key={i} style={{
                padding: '10px 12px', background: 'rgba(217,165,72,0.05)',
                border: '1px solid rgba(217,165,72,0.2)',
                borderLeft: '2px solid #d9a548', borderRadius: 3,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{
                    color: '#d9a548', fontSize: 10.5, fontWeight: 600,
                    letterSpacing: '0.10em', textTransform: 'uppercase',
                    border: '1px solid #d9a548', padding: '1px 8px', borderRadius: 999,
                  }}>{d.axis}</span>
                  {Array.isArray(d.reviewerPositions) && d.reviewerPositions.length > 0 && (
                    <span style={{ color: palette.ink3, fontSize: 11 }}>
                      {d.reviewerPositions.map((p) => p.reviewer).join(' vs. ')}
                    </span>
                  )}
                </div>
                {Array.isArray(d.reviewerPositions) && d.reviewerPositions.map((p, j) => (
                  <div key={j} style={{ color: palette.ink2, fontSize: 12, marginBottom: 4, paddingLeft: 8 }}>
                    <span style={{ color: '#7dcfff', fontWeight: 600, marginRight: 6 }}>{p.reviewer}:</span>
                    {p.position}
                  </div>
                ))}
                {d.whyItMatters && (
                  <div style={{ color: palette.ink2, fontSize: 12, marginTop: 6, fontStyle: 'italic' }}>
                    why it matters: {d.whyItMatters}
                  </div>
                )}
                {d.doNotAverageBecause && (
                  <div style={{ color: '#e26e6e', fontSize: 12, marginTop: 4 }}>
                    ⚠ do not average: {d.doNotAverageBecause}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {Array.isArray(audit.falseDisagreements) && audit.falseDisagreements.length > 0 && (
        <div>
          <div style={{ color: palette.ink2, fontSize: 11, letterSpacing: '0.10em',
            textTransform: 'uppercase', marginBottom: 6 }}>
            apparent disagreements · {audit.falseDisagreements.length} · same objection, different language
          </div>
          {audit.falseDisagreements.map((d, i) => (
            <div key={i} style={{ color: palette.ink3, fontSize: 12, paddingLeft: 8, marginBottom: 4 }}>
              <span style={{ color: palette.ink2 }}>{d.axis}</span> — {d.explanation}
            </div>
          ))}
        </div>
      )}

      {audit.strongestReviewer?.reviewer && (
        <div style={{ color: palette.ink2, fontSize: 12, paddingTop: 6, borderTop: '1px solid rgba(217,165,72,0.15)' }}>
          <span style={{ color: '#7dcfff', fontWeight: 600 }}>strongest reviewer:</span>{' '}
          {audit.strongestReviewer.reviewer} — {audit.strongestReviewer.reason}
        </div>
      )}

      {audit.acDecision?.recommendation && (
        <div style={{
          padding: '10px 12px', background: 'rgba(125,207,255,0.06)',
          border: '1px solid rgba(125,207,255,0.3)', borderRadius: 3,
        }}>
          <div style={{ color: '#7dcfff', fontSize: 11, fontWeight: 600,
            letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 4 }}>
            ac decision · {audit.acDecision.recommendation}
          </div>
          {audit.acDecision.rationale && (
            <div style={{ color: palette.ink2, fontSize: 12, marginBottom: 6 }}>
              {audit.acDecision.rationale}
            </div>
          )}
          {Array.isArray(audit.acDecision.requiredRevisions) && audit.acDecision.requiredRevisions.length > 0 && (
            <ul style={{ margin: '4px 0 0 0', paddingLeft: 18, color: palette.ink2, fontSize: 12 }}>
              {audit.acDecision.requiredRevisions.map((rev, i) => (
                <li key={i} style={{ marginBottom: 2 }}>{rev}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Empty / queued state ──────────────────────────────────────────────────
function ReviewEmpty({ review }) {
  return (
    <div style={{ marginTop: 22 }}>
      <div style={{
        padding: '18px 20px',
        background: palette.bg2,
        border: `1px solid ${palette.rule}`,
        borderLeft: `3px solid ${palette.amber}`,
        borderRadius: 3,
      }}>
        <div style={{
          color: palette.amber, fontSize: 11, letterSpacing: '0.14em',
          textTransform: 'uppercase', fontWeight: 600, marginBottom: 6,
        }}>
          ─── ready to simulate review
        </div>
        <div style={{ color: palette.ink, fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>
          Probe will run a peer-review pass against the report from stage 6 — one
          1AC plus three reviewers, each with their own field, affiliation, and topic
          confidence. The 1AC rolls them up into a verdict.
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10, marginBottom: 14,
        }}>
          <PanelChip label="panel" value={review.venue} accent="#d9a548" />
          <PanelChip label="paper" value={review.paperTitle} accent="#c5c8d4" truncate />
          <PanelChip label="reviewers" value="3 + 1AC" accent="#7dcfff" />
          <PanelChip label="cost" value="≈ $0.85" accent="#7fb069" />
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', background: palette.bg, border: `1px solid ${palette.rule}`,
          borderRadius: 3, color: palette.ink3, fontSize: 12,
        }}>
          <span style={{ color: palette.amber }}>›</span>
          <span>use the rerun dock below to simulate the panel</span>
          <kbd style={{ ...kbdStyle, marginLeft: 'auto' }}>↵</kbd>
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        <div style={{ color: palette.ink3, fontSize: 11, letterSpacing: '0.14em',
          textTransform: 'uppercase', marginBottom: 6 }}>
          ─── recommendation buckets
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {Object.entries(REC).map(([k, v]) => (
            <div key={k} style={{
              padding: '6px 12px', borderRadius: 3,
              border: `1px solid ${palette.rule}`,
              borderLeft: `3px solid ${v.color}`,
              background: palette.bg2,
              fontSize: 12,
            }}>
              <span style={{ color: v.color, fontWeight: 700, marginRight: 8 }}>{v.short}</span>
              <span style={{ color: palette.ink }}>{v.label}</span>
              <span style={{ color: palette.ink3, marginLeft: 8 }}>· {v.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PanelChip({ label, value, accent, truncate }) {
  return (
    <div style={{
      padding: '8px 12px', background: palette.bg,
      border: `1px solid ${palette.rule}`, borderLeft: `3px solid ${accent}`,
      borderRadius: 3,
    }}>
      <div style={{ color: palette.ink3, fontSize: 10, letterSpacing: '0.12em',
        textTransform: 'uppercase' }}>{label}</div>
      <div style={{ color: palette.ink, fontSize: 13, marginTop: 2,
        whiteSpace: truncate ? 'nowrap' : 'normal',
        overflow: truncate ? 'hidden' : 'visible',
        textOverflow: truncate ? 'ellipsis' : 'clip' }}>{value}</div>
    </div>
  );
}

// ─── Verdict header ────────────────────────────────────────────────────────
function VerdictHeader({ review }) {
  const v = VERDICT[review.verdict];
  return (
    <div style={{
      marginTop: 6, padding: '14px 16px',
      background: palette.bg2,
      border: `1px solid ${palette.rule}`,
      borderLeft: `3px solid ${v.color}`,
      borderRadius: 3,
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: 16, alignItems: 'center',
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span
            title={`${v.label}: ${v.desc}`}
            style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, borderRadius: 3,
            background: v.color, color: palette.bg,
            fontSize: 16, fontWeight: 700, cursor: 'help',
          }}>{v.glyph}</span>
          <span
            title={`${v.label}: ${v.desc}`}
            style={{ color: v.color, fontSize: 18, fontWeight: 600,
            letterSpacing: '0.02em', cursor: 'help' }}>{v.label}</span>
          <span style={{ ...chipStyle, marginLeft: 4 }}>{review.venue}</span>
        </div>
        <div style={{ marginTop: 8, color: palette.ink, fontSize: 13.5, lineHeight: 1.55 }}>
          {review.paperTitle}
        </div>
        <div style={{ marginTop: 4, color: palette.ink3, fontSize: 11.5 }}>
          simulated {review.submittedAt} · {review.reviewerCount} reviewers + {review.chairs}AC
        </div>
      </div>
      <RecBreakdown reviewers={review.reviewers} />
    </div>
  );
}

function RecBreakdown({ reviewers }) {
  // Bar chart of recommendations across reviewers.
  const order = ['A', 'ARR', 'RR', 'RRX', 'X'];
  const counts = order.map((k) => reviewers.filter((r) => r.rec === k).length);
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end' }}>
      {order.map((k, i) => {
        const n = counts[i];
        return (
          <div key={k}
            title={`${REC[k].short} — ${REC[k].label} · ${REC[k].desc}`}
            style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            minWidth: 36, cursor: 'help',
          }}>
            <div style={{
              height: 36, width: 16,
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            }}>
              {[...Array(n)].map((_, j) => (
                <div key={j} style={{
                  height: 10, marginTop: 2, borderRadius: 1,
                  background: REC[k].color,
                }} />
              ))}
              {n === 0 && (
                <div style={{ height: 2, background: palette.rule, borderRadius: 1 }} />
              )}
            </div>
            <span style={{ color: n ? REC[k].color : palette.ink4,
              fontSize: 10, fontWeight: 700 }}>{REC[k].short}</span>
          </div>
        );
      })}
    </div>
  );
}

function summarizeRecs(reviewers) {
  const order = ['A', 'ARR', 'RR', 'RRX', 'X'];
  const counts = {};
  reviewers.forEach((r) => { counts[r.rec] = (counts[r.rec] || 0) + 1; });
  return order.filter((k) => counts[k]).map((k) => `${counts[k]}× ${k}`).join(' · ');
}

// ─── Meta-review ───────────────────────────────────────────────────────────
function MetaReviewCard({ meta, expanded, onToggle }) {
  const v = VERDICT[meta.verdict];
  return (
    <div style={{
      marginTop: 6,
      background: palette.bg2,
      border: `1px solid ${expanded ? '#d9a548' : palette.rule}`,
      borderLeft: `3px solid #d9a548`,
      borderRadius: 3,
      overflow: 'hidden',
      transition: 'border-color 120ms',
    }}>
      <button onClick={onToggle} style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        padding: '10px 12px', background: 'transparent', border: 'none',
        color: 'inherit', fontFamily: 'inherit', fontSize: 13,
        cursor: 'pointer', textAlign: 'left',
      }}>
        <span style={{
          display: 'inline-block', width: 10, color: '#d9a548',
          transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform 140ms',
        }}>›</span>
        <span style={{
          width: 22, height: 22, borderRadius: 2, display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center',
          background: '#d9a548', color: palette.bg, fontSize: 11, fontWeight: 700,
        }}>{meta.ac}</span>
        <span style={{ color: palette.ink, fontWeight: 600 }}>1AC meta-review</span>
        <span style={{ ...chipStyle, color: v.color, borderColor: v.color }}>
          proposes {v.label}
        </span>
        <span style={{ marginLeft: 'auto', color: palette.ink, fontSize: 12.5,
          fontStyle: 'italic', maxWidth: '50%',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {meta.summary.slice(0, 80)}…
        </span>
      </button>
      {expanded && (
        <div className="fade-in" style={{
          padding: '12px 16px 14px 35px',
          borderTop: `1px dashed ${palette.rule}`,
        }}>
          <DetailBlock label="summary" accent="#d9a548">
            {window.MarkdownText
              ? <window.MarkdownText text={meta.summary} />
              : meta.summary}
          </DetailBlock>
          <DetailBlock label="proposed decision" accent="#d9a548">
            {window.MarkdownText
              ? <window.MarkdownText text={meta.proposed} />
              : meta.proposed}
          </DetailBlock>
          <DetailBlock label={`consensus points · ${meta.consensusPoints.length}`} accent="#d9a548">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
              {meta.consensusPoints.map((c, i) => (
                <ConsensusRow key={i} c={c} />
              ))}
            </div>
          </DetailBlock>
        </div>
      )}
    </div>
  );
}

function ConsensusRow({ c }) {
  const priColor =
    c.priority === 'high' ? '#e26e6e' :
    c.priority === 'medium' ? '#d9a548' : '#7fb069';
  const tagColor =
    c.tag === 'all-3' ? '#e26e6e' :
    c.tag === '2-of-3' ? '#d9a548' : palette.ink3;
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '60px 60px 1fr',
      alignItems: 'center', gap: 10,
      padding: '7px 10px',
      background: palette.bg,
      border: `1px solid ${palette.rule}`,
      borderRadius: 3, fontSize: 12.5,
    }}>
      <span style={{
        display: 'inline-flex', justifyContent: 'center',
        padding: '1px 0', borderRadius: 2,
        border: `1px solid ${tagColor}`,
        color: tagColor,
        fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
      }}>{c.tag}</span>
      <span style={{
        display: 'inline-flex', justifyContent: 'center',
        padding: '1px 0', borderRadius: 2,
        background: priColor + '22',
        color: priColor,
        fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}>{c.priority}</span>
      <span style={{ color: palette.ink }}>{c.text}</span>
    </div>
  );
}

// ─── Reviewer card ─────────────────────────────────────────────────────────
function ReviewerCard({ reviewer: r, expanded, onToggle, onRebuttalResolved }) {
  // Local rebuttal state. v3.4 promotes this from "textbox that goes
  // nowhere" to a real interaction: the user can ask Probe to address
  // the rebuttal, which calls /api/probe/rebut and updates the
  // reviewer's recommendation + comments in place. The disagreement
  // audit re-runs upstream so the meta-decision can flip if the
  // rebuttal lands.
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [challengeText, setChallengeText] = useState('');
  const [resolution, setResolution] = useState(null);  // null | 'pending' | object
  const [error, setError] = useState(null);
  // The reviewer card optimistically uses the *resolved* fields when a
  // rebuttal has been addressed; falls back to the original review.
  const live = resolution && resolution.kind === 'updated' ? resolution.updated : r;
  const rec = REC[live.rec] || REC[r.rec];

  const askProbeToAddress = async () => {
    if (!challengeText.trim()) return;
    setResolution({ kind: 'pending' });
    setError(null);
    try {
      const resp = await fetch('/api/probe/rebut', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewer: r, rebuttal: challengeText }),
      });
      if (!resp.ok) throw new Error(`rebut ${resp.status}`);
      const data = await resp.json();
      setResolution({ kind: data.outcome || 'updated', updated: data.updated || r, rationale: data.rationale });
      // Tell the parent — it'll re-run the disagreement audit so the
      // meta-decision reflects the new reviewer stance.
      onRebuttalResolved && onRebuttalResolved(r.id, data);
    } catch (e) {
      setError(String(e.message || e));
      setResolution(null);
    }
  };

  return (
    <div style={{
      background: palette.bg2,
      border: `1px solid ${expanded ? rec.color : palette.rule}`,
      borderLeft: `3px solid ${rec.color}`,
      borderRadius: 3,
      overflow: 'hidden',
      transition: 'border-color 120ms',
    }}>
      <button onClick={onToggle} style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        padding: '10px 12px', background: 'transparent', border: 'none',
        color: 'inherit', fontFamily: 'inherit', fontSize: 13,
        cursor: 'pointer', textAlign: 'left',
      }}>
        <span style={{
          display: 'inline-block', width: 10, color: rec.color,
          transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform 140ms', flex: 'none',
        }}>›</span>
        <span style={{
          width: 22, height: 22, borderRadius: 2, display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center', flex: 'none',
          background: 'transparent', color: rec.color,
          border: `1px solid ${rec.color}`, fontSize: 10, fontWeight: 700,
        }}>{r.id}</span>
        <span
          title={`${rec.short} — ${rec.label} · ${rec.desc}`}
          style={{
          ...chipStyle, color: rec.color, borderColor: rec.color, flex: 'none',
          textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 10, fontWeight: 700,
          cursor: 'help',
        }}>{rec.short} · {rec.label}</span>
        <span style={{
          color: palette.ink, fontSize: 12.5, fontStyle: 'italic',
          flex: 1, minWidth: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{r.oneLine}</span>
        <SpecChips reviewer={r} />
      </button>
      {expanded && (
        <div className="fade-in" style={{
          padding: '12px 16px 14px 35px',
          borderTop: `1px dashed ${palette.rule}`,
        }}>
          <SpecHeader reviewer={r} />
          <DetailBlock label={`strengths · ${r.strengths.length}`} accent="#7fb069">
            <ul style={{
              margin: '4px 0 0', paddingLeft: 18, color: palette.ink, fontSize: 13,
              lineHeight: 1.6,
            }}>
              {r.strengths.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </DetailBlock>
          <DetailBlock label={`weaknesses · ${r.weaknesses.length}`} accent="#e26e6e">
            <ul style={{
              margin: '4px 0 0', paddingLeft: 18, color: palette.ink, fontSize: 13,
              lineHeight: 1.6,
            }}>
              {r.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </DetailBlock>
          <DetailBlock label="comments to authors" accent={rec.color}>
            <div style={{
              padding: '10px 12px', background: palette.bg,
              borderLeft: `2px solid ${rec.color}`,
              color: palette.ink, fontSize: 13, lineHeight: 1.65,
            }}>
              {window.MarkdownText
                ? <window.MarkdownText text={r.toAuthors} />
                : <span style={{ whiteSpace: 'pre-wrap' }}>{r.toAuthors}</span>}
            </div>
          </DetailBlock>
          <DetailBlock label="comments to chairs · confidential" accent={palette.ink3}>
            <div style={{
              padding: '10px 12px', background: palette.bg,
              border: `1px dashed ${palette.rule}`,
              color: palette.ink2, fontSize: 12.5, lineHeight: 1.6,
              fontStyle: 'italic',
            }}>
              {window.MarkdownText
                ? <window.MarkdownText text={r.toChairs} />
                : r.toChairs}
            </div>
          </DetailBlock>

          {/* Rebuttal affordance — lets the user disagree with the
              simulated reviewer in writing. Closes the asymmetry the
              persona evaluations flagged: previously the tool flowed
              one direction (reviewer says X, user accepts), and the
              simulated review acquired authority by being unanswerable.
              Now the user records their own counter-position next to
              the reviewer's text, so both voices travel together when
              the artifact is exported or shared. */}
          <DetailBlock label="your response (challenge or accept)" accent="#7dcfff">
            {!challengeOpen && !challengeText && !resolution && (
              <button
                onClick={() => setChallengeOpen(true)}
                style={{
                  background: 'transparent', border: '1px solid #7dcfff',
                  color: '#7dcfff', padding: '6px 12px', borderRadius: 3,
                  fontFamily: 'inherit', fontSize: 12, cursor: 'pointer',
                }}>
                challenge this reviewer →
              </button>
            )}
            {(challengeOpen || challengeText) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <textarea
                  value={challengeText}
                  onChange={(e) => setChallengeText(e.target.value)}
                  placeholder={`Why do you disagree with ${r.id}? What evidence or argument would you bring back?`}
                  rows={3}
                  disabled={resolution && resolution.kind === 'pending'}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: palette.bg, color: palette.ink,
                    border: '1px solid rgba(125,207,255,0.4)',
                    borderRadius: 3, padding: '8px 10px',
                    fontFamily: 'inherit', fontSize: 13, lineHeight: 1.55,
                    resize: 'vertical', outline: 'none',
                    caretColor: '#7dcfff',
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    onClick={askProbeToAddress}
                    disabled={!challengeText.trim() || (resolution && resolution.kind === 'pending')}
                    style={{
                      background: challengeText.trim() ? '#7dcfff' : 'transparent',
                      border: '1px solid #7dcfff',
                      color: challengeText.trim() ? '#0f1419' : '#7dcfff',
                      padding: '6px 12px', borderRadius: 3,
                      fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
                      cursor: challengeText.trim() ? 'pointer' : 'not-allowed',
                      opacity: challengeText.trim() ? 1 : 0.5,
                    }}>
                    {resolution && resolution.kind === 'pending'
                      ? 'asking Probe to address rebuttal…'
                      : 'ask Probe to address rebuttal'}
                  </button>
                  {resolution && resolution.kind !== 'pending' && (
                    <span style={{ color: palette.ink3, fontSize: 11 }}>
                      auditor will re-evaluate the panel with this rebuttal applied.
                    </span>
                  )}
                </div>
                {error && (
                  <div style={{ color: '#e26e6e', fontSize: 11.5 }}>
                    rebuttal failed: {error}
                  </div>
                )}
                {resolution && resolution.kind === 'updated' && (
                  <div style={{
                    padding: '10px 12px', background: 'rgba(127,176,105,0.08)',
                    border: '1px solid rgba(127,176,105,0.3)',
                    borderLeft: `3px solid #7fb069`, borderRadius: 3,
                    color: palette.ink2, fontSize: 12, lineHeight: 1.55,
                  }}>
                    <div style={{
                      color: '#7fb069', fontSize: 10.5, fontWeight: 600,
                      letterSpacing: '0.10em', textTransform: 'uppercase',
                      marginBottom: 6,
                    }}>rebuttal accepted · {r.id} updated · {r.rec} → {live.rec}</div>
                    <div>{resolution.rationale || 'Reviewer position revised in light of your rebuttal.'}</div>
                  </div>
                )}
                {resolution && resolution.kind === 'rejected' && (
                  <div style={{
                    padding: '10px 12px', background: 'rgba(226,110,110,0.06)',
                    border: '1px solid rgba(226,110,110,0.3)',
                    borderLeft: `3px solid #e26e6e`, borderRadius: 3,
                    color: palette.ink2, fontSize: 12, lineHeight: 1.55,
                  }}>
                    <div style={{
                      color: '#e26e6e', fontSize: 10.5, fontWeight: 600,
                      letterSpacing: '0.10em', textTransform: 'uppercase',
                      marginBottom: 6,
                    }}>rebuttal not accepted · {r.id} holds {r.rec}</div>
                    <div>{resolution.rationale || 'Reviewer maintains their position.'}</div>
                  </div>
                )}
              </div>
            )}
          </DetailBlock>
        </div>
      )}
    </div>
  );
}

// ─── Reviewer specialization chips ────────────────────────────────────────
function SpecChips({ reviewer: r }) {
  const a = AFFIL[r.affiliation];
  const t = TOPIC_CONF[r.topicConfidence];
  return (
    <span style={{ display: 'inline-flex', gap: 4, flex: 'none' }}>
      <span style={{
        ...chipStyle, color: a.color, borderColor: a.color,
        fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em',
        padding: '1px 6px',
      }}>{a.short}</span>
      <span style={{
        ...chipStyle, color: t.color, borderColor: t.color,
        fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em',
        padding: '1px 6px', textTransform: 'uppercase',
      }}>{r.topicConfidence === 'expert' ? 'expert'
         : r.topicConfidence === 'confident' ? 'confident'
         : r.topicConfidence === 'tentative' ? 'tentative'
         : 'outsider'}</span>
    </span>
  );
}

function SpecHeader({ reviewer: r }) {
  const a = AFFIL[r.affiliation];
  const t = TOPIC_CONF[r.topicConfidence];
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
      gap: 8, marginBottom: 14,
      padding: '10px 12px',
      background: palette.bg,
      border: `1px solid ${palette.rule}`,
      borderRadius: 3,
    }}>
      <SpecCell label="field" value={r.field} accent="#c5c8d4" />
      <SpecCell label="affiliation" value={a.label} accent={a.color} sub={a.desc} />
      <SpecCell label="topic confidence" value={t.label} accent={t.color} sub={t.desc} />
    </div>
  );
}

function SpecCell({ label, value, sub, accent }) {
  return (
    <div>
      <div style={{
        color: palette.ink3, fontSize: 9.5, letterSpacing: '0.14em',
        textTransform: 'uppercase', marginBottom: 2,
      }}>{label}</div>
      <div style={{ color: accent, fontSize: 12.5, fontWeight: 600 }}>{value}</div>
      {sub && (
        <div style={{ color: palette.ink4, fontSize: 10.5, marginTop: 2 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

// ─── What-now actions ──────────────────────────────────────────────────────
function ActionsRow({ review }) {
  const [flash, setFlash] = useState(null);
  const note = (msg, kind) => {
    setFlash({ msg, kind: kind || 'info' });
    setTimeout(() => setFlash(null), 4000);
  };

  const incorporateFeedback = () => {
    // Build a pre-loaded rerun prompt out of the medium+high priority
    // consensus points and surface it. The new-project flow doesn't
    // have a rerun dock yet, so we copy the prompt to the clipboard
    // and tell the user — they can paste it into the methodology /
    // report stage when they revisit it.
    const issues = (review.meta.consensusPoints || []).filter((c) => c.priority !== 'low');
    const prompt = [
      `Rerun the report with these ${issues.length} consensus issues addressed:`,
      '',
      ...issues.map((c, i) => `${i + 1}. [${c.tag} · ${c.priority}] ${c.text}`),
      '',
      `Verdict context: ${review.meta.summary || ''}`.trim(),
    ].filter(Boolean).join('\n');
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(prompt);
      note(`✓ ${issues.length} consensus issues copied to clipboard — paste into the report stage`, 'ok');
    } else {
      note(`built rerun prompt for ${issues.length} issues (clipboard unavailable)`, 'info');
    }
  };

  const exportRebuttal = () => {
    const lines = [
      `# Rebuttal · ${review.paperTitle || 'Untitled paper'}`,
      ``,
      `_Generated by Probe · responds point-by-point to the simulated panel._`,
      ``,
      `## Verdict`,
      `${review.meta.verdict || 'major'} revisions — ${review.meta.summary || ''}`,
      ``,
      `## Reviewer responses`,
      ``,
      ...(review.reviewers || []).flatMap((r) => [
        `### ${r.id} · ${r.rec} · ${r.field || ''}`,
        ``,
        `> ${r.oneLine || ''}`,
        ``,
        `**Strengths acknowledged.** ${(r.strengths || []).slice(0, 2).join(' ')}`,
        ``,
        `**Weaknesses we will address.**`,
        ...(r.weaknesses || []).map((w) => `- ${w}`),
        ``,
        `**Our response.** [Author: respond here, addressing each weakness above.]`,
        ``,
      ]),
      `## To the chairs`,
      ``,
      `[Author: summarize the major changes you will make in the revision.]`,
      ``,
    ];
    const md = lines.join('\n');
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rebuttal-${(review.paperTitle || 'paper').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    note(`✓ rebuttal saved as ${a.download}`, 'ok');
  };

  const dismissReview = () => {
    note('this review archived — report stays as written. (no-op for the demo; would clear the review state in production)', 'info');
  };

  return (
    <div style={{
      marginTop: 6,
      padding: '14px 16px',
      background: palette.bg2, border: `1px solid ${palette.rule}`, borderRadius: 3,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ color: palette.ink3, fontSize: 11.5 }}>
        Three ways forward · pick one or do nothing — Probe never overwrites the report without your say-so.
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <ActionTile
          label="incorporate feedback"
          hint={`copies a rerun prompt with ${review.meta.consensusPoints.filter((c) => c.priority !== 'low').length} consensus issues to clipboard`}
          accent="#7fb069"
          primary
          onClick={incorporateFeedback}
        />
        <ActionTile
          label="export rebuttal"
          hint=".md letter · responds point-by-point"
          accent="#7dcfff"
          onClick={exportRebuttal}
        />
        <ActionTile
          label="dismiss this review"
          hint="archive · keeps report frozen"
          accent={palette.ink3}
          onClick={dismissReview}
        />
      </div>
      {flash && (
        <div style={{
          fontSize: 12, padding: '8px 10px', borderRadius: 3,
          background: flash.kind === 'ok' ? 'rgba(127,176,105,0.10)' : 'rgba(125,207,255,0.08)',
          border: `1px solid ${flash.kind === 'ok' ? palette.moss : palette.cyan}`,
          color: flash.kind === 'ok' ? palette.moss : palette.cyan,
        }}>{flash.msg}</div>
      )}
    </div>
  );
}

// ─── Panel composer (specialization picker for next rerun) ────────────────
function PanelComposer({ reviewers }) {
  // Three slots; each can be tuned by field text + affiliation + topic confidence.
  // Default slots are seeded from the current panel so the user can see the shape.
  const seedSlots = reviewers.map((r) => ({
    field: r.field,
    affiliation: r.affiliation,
    topicConfidence: r.topicConfidence,
  }));
  const [slots, setSlots] = useState(seedSlots);

  const update = (i, key, val) => {
    setSlots((s) => s.map((slot, j) => j === i ? { ...slot, [key]: val } : slot));
  };

  return (
    <div style={{
      marginTop: 6,
      padding: '14px 16px',
      background: palette.bg2, border: `1px solid ${palette.rule}`,
      borderLeft: `3px solid #a89bd8`, borderRadius: 3,
    }}>
      <div style={{ color: palette.ink3, fontSize: 11.5, marginBottom: 10 }}>
        Tune who shows up next time. The 1AC will rebalance the meta-review around whatever panel you summon.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {slots.map((slot, i) => (
          <SlotRow key={i} idx={i} slot={slot}
            onChange={(k, v) => update(i, k, v)} />
        ))}
      </div>
      <div style={{
        marginTop: 12,
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px', background: palette.bg,
        border: `1px dashed ${palette.rule}`, borderRadius: 3,
        fontSize: 11.5, color: palette.ink3,
      }}>
        <span style={{ color: '#a89bd8' }}>›</span>
        <span>changes apply to the next rerun · current panel above is unchanged</span>
        <kbd style={{ ...kbdStyle, marginLeft: 'auto' }}>r</kbd>
        <span>rerun with this panel</span>
      </div>
    </div>
  );
}

function SlotRow({ idx, slot, onChange }) {
  const a = AFFIL[slot.affiliation];
  const t = TOPIC_CONF[slot.topicConfidence];
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '36px 1.4fr 1fr 1fr',
      gap: 10, alignItems: 'center',
      padding: '8px 10px',
      background: palette.bg,
      border: `1px solid ${palette.rule}`,
      borderRadius: 3,
    }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 26, height: 26, borderRadius: 2,
        border: `1px solid ${palette.rule}`,
        color: palette.ink2, fontSize: 11, fontWeight: 700,
      }}>R{idx + 1}</span>

      <FieldInput value={slot.field} onChange={(v) => onChange('field', v)} />

      <PillPicker
        label="affiliation"
        options={Object.entries(AFFIL).map(([k, v]) => ({ value: k, label: v.label, color: v.color }))}
        value={slot.affiliation}
        onChange={(v) => onChange('affiliation', v)}
      />

      <PillPicker
        label="confidence"
        options={Object.entries(TOPIC_CONF).map(([k, v]) => ({ value: k, label: v.label, color: v.color }))}
        value={slot.topicConfidence}
        onChange={(v) => onChange('topicConfidence', v)}
      />
    </div>
  );
}

function FieldInput({ value, onChange }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{
        color: palette.ink3, fontSize: 9.5, letterSpacing: '0.14em',
        textTransform: 'uppercase',
      }}>field</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: palette.bg2,
          border: `1px solid ${palette.rule}`,
          borderRadius: 2,
          color: palette.ink,
          fontFamily: 'inherit', fontSize: 12,
          padding: '4px 8px',
          outline: 'none',
        }}
        onFocus={(e) => e.target.style.borderColor = '#a89bd8'}
        onBlur={(e) => e.target.style.borderColor = palette.rule}
      />
    </label>
  );
}

function PillPicker({ label, options, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      <span style={{
        color: palette.ink3, fontSize: 9.5, letterSpacing: '0.14em',
        textTransform: 'uppercase',
      }}>{label}</span>
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              onClick={() => onChange(o.value)}
              style={{
                padding: '2px 7px', borderRadius: 2,
                background: active ? o.color : 'transparent',
                color: active ? palette.bg : o.color,
                border: `1px solid ${o.color}`,
                fontFamily: 'inherit', fontSize: 10.5, fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 100ms, color 100ms',
              }}>{o.label}</button>
          );
        })}
      </div>
    </div>
  );
}

function ActionTile({ label, hint, accent, primary, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        flex: '1 1 220px', minWidth: 220, padding: '10px 14px', textAlign: 'left',
        background: primary && hover ? accent : palette.bg,
        border: `1px solid ${hover ? accent : palette.rule}`,
        borderLeft: `3px solid ${accent}`, borderRadius: 3,
        color: primary && hover ? palette.bg : palette.ink,
        fontFamily: 'inherit', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', gap: 2,
        transition: 'background 120ms, border-color 120ms, color 120ms',
      }}>
      <span style={{
        color: primary && hover ? palette.bg : accent,
        fontSize: 13, fontWeight: 600, letterSpacing: '0.02em',
      }}>{label}</span>
      <span style={{
        color: primary && hover ? 'rgba(0,0,0,0.7)' : palette.ink3,
        fontSize: 11,
      }}>{hint}</span>
    </button>
  );
}

// ─── Shared helpers ────────────────────────────────────────────────────────
function DetailBlock({ label, accent, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        color: accent, fontSize: 11, fontWeight: 600,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        marginBottom: 4,
      }}>
        ─── {label}
      </div>
      <div style={{ color: palette.ink, fontSize: 13, lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  );
}

function Section({ title, accent, children }) {
  return (
    <div style={{ marginTop: 22 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6,
      }}>
        <span style={{ color: accent, fontSize: 11, letterSpacing: '0.14em',
          textTransform: 'uppercase' }}>
          ─── {title}
        </span>
      </div>
      <div style={{ color: palette.ink2, fontSize: 13.5, lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  );
}

window.ReviewBody = ReviewBody;
window.makeInitialReviewState = makeInitialReviewState;
window.reviewRerunPlaceholder = reviewRerunPlaceholder;
window.synthesizeReviewSummary = synthesizeReviewSummary;
window.PROBE_REVIEW_SEED = seededReview;

// ─── Review (new-project flow wrapper) ───────────────────────────────────────
// The base ReviewBody component expects a `data` prop with the seeded run.
// In the new-project flow we want the review session to be GENERATED for the
// current paper via /api/probe/review. This wrapper makes the call, then
// renders ReviewBody against the result. Falls back to seeded review on error.

const ghostBtnStyle2 = {
  background: 'transparent', border: 'none',
  color: palette.ink3, fontFamily: 'inherit',
  fontSize: 12, cursor: 'pointer',
};

function ReviewWrapper({ mainRq, selectedBranches, chosenDesign, plan, evalResult, onBack, onDone, goTo }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(makeInitialReviewState());
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch('/api/probe/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        premise: mainRq,
        rqs: selectedBranches || [],
        designName: (chosenDesign && chosenDesign.name) || 'integrated study',
        findings: (evalResult && evalResult.findings) || [],
        paperTitle: (evalResult && evalResult.paperTitle) || 'Untitled paper',
        discussion: (evalResult && evalResult.discussion) || '',
      }),
    })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('review ' + r.status)))
      .then((live) => {
        if (cancelled) return;
        setData({
          status: 'fresh',
          lastRun: 'just now',
          currentRunId: 'live',
          runs: [{
            id: 'live',
            when: 'just now',
            label: 'live · 1AC + 3 reviewers',
            summary: 'verdict · ' + live.meta.verdict + ' revisions',
            verdict: live.meta.verdict,
            tldr: (live.meta.summary || '').slice(0, 80) + '…',
            reviewers: live.reviewers,
            meta: live.meta,
            paperTitle: live.paperTitle,
            venue: 'simulated panel · 1AC + 3',
            submittedAt: 'just now',
            reviewerCount: 3,
            chairs: 1,
          }],
          seed: makeInitialReviewState().seed,
        });
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(String(e.message || e));
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [mainRq]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        borderBottom: `1px solid ${palette.rule}`,
        padding: '12px 22px', display: 'flex', alignItems: 'center', gap: 12,
        color: palette.ink3, fontSize: 12,
      }}>
        {[
          ['probe',       palette.amber, 'probe'],
          ['new project', palette.ink2,  'new project'],
          ['brainstorm',  palette.ink2,  'brainstorm'],
          ['literature',  palette.ink2,  'literature'],
          ['methodology', palette.ink2,  'methodology'],
          ['artifacts',   palette.ink2,  'artifacts'],
          ['evaluation',  palette.ink2,  'evaluation'],
          ['report',      palette.ink2,  'report'],
          ['review',      palette.ink,   'review'],
        ].map(([label, c, key], i, arr) => {
          const isLast = i === arr.length - 1;
          const clickable = !isLast && goTo;
          return (
            <React.Fragment key={i}>
              <span
                onClick={clickable ? () => goTo(key) : undefined}
                onMouseEnter={clickable ? (e) => { e.currentTarget.style.textDecoration = 'underline'; } : undefined}
                onMouseLeave={clickable ? (e) => { e.currentTarget.style.textDecoration = 'none'; } : undefined}
                style={{
                  color: c, cursor: clickable ? 'pointer' : 'default',
                  fontWeight: i === 0 ? 600 : 'inherit',
                }}
              >{label}</span>
              {i < arr.length - 1 && <span style={{ color: palette.ink4 }}>›</span>}
            </React.Fragment>
          );
        })}
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 14, alignItems: 'center' }}>
          <span style={{ color: palette.ink3 }}>stage 7 · review</span>
          <button onClick={onBack} style={ghostBtnStyle2}>
            <kbd style={kbdStyle}>esc</kbd> back
          </button>
        </span>
      </div>

      <div style={{ flex: 1, padding: '28px 32px 40px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        {loading && (
          <div style={{ padding: '14px 0', color: palette.ink3, fontSize: 13 }}>
            {window.ModelStatusLine ? (
              <window.ModelStatusLine
                stage="review"
                phase={window.PhaseDots ? (
                  <window.PhaseDots
                    phases={['planning', 'simulating panel', 'aggregating', 'verdict']}
                    activeIdx={2}
                    accent={palette.amber}
                    compact
                  />
                ) : null}
                accent={palette.amber}
                running
              />
            ) : <span>convening review panel…</span>}
          </div>
        )}
        {error && !loading && (
          <div style={{ padding: '12px 14px', marginBottom: 12, background: 'rgba(226,110,110,0.06)', border: `1px solid ${palette.rose}`, borderLeft: `3px solid ${palette.rose}`, color: palette.ink, fontSize: 12.5, borderRadius: 3 }}>
            <strong style={{ color: palette.rose }}>review API error: </strong>
            {error}. Showing seeded review instead.
          </div>
        )}
        <ReviewBody data={data} density="comfy" />

        <div style={{ marginTop: 28, paddingTop: 16, borderTop: `1px solid ${palette.rule}`,
          display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={onDone} style={{
            background: palette.amber, color: palette.bg, border: 'none',
            padding: '8px 16px', borderRadius: 3,
            fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>continue → done ›</button>
          <button onClick={onBack} style={ghostBtnStyle2}>
            <kbd style={kbdStyle}>esc</kbd> back to report
          </button>
          <span style={{ marginLeft: 'auto', color: palette.ink3, fontSize: 11.5 }}>
            stage 7 of 7 · review
          </span>
        </div>
      </div>
    </div>
  );
}

window.Review = ReviewWrapper;
