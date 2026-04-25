# Probe — demo video script (3 min hard cap)

Out-point: **2:59:23** (24fps) — set this in your editor on day one.

Hard structure: **9 × 20-second pods**. Cut anything that doesn't earn its 20 seconds.

---

## Pod 0 (0:00 → 0:05) — HOOK

> *(black, silence, then the line.)*
>
> "An HCI PhD student spends six months designing a study before a single participant shows up.
> Probe runs that six months in five minutes — with Claude Opus 4.7."

**B-roll:** clean slow zoom from the Probe wordmark to the home page input.

---

## Pod 1 (0:05 → 0:25) — NAMED USER

> "Maya is a third-year PhD at CMU. She wants to study how remote workers stay focused on long video-call days. Tomorrow she has a meeting with her advisor — and she has nothing to show."

**Visual:** Maya types her premise into the home view. *"How do remote workers stay focused during long video-call days?"* Hits Enter.

---

## Pod 2 (0:25 → 0:45) — INTERROGATOR

> "Probe's first agent — the interrogator — sharpens the premise into three sub-research-questions, each a different angle on the same study."

**Visual:** brainstorm screen. Spinner with `claude-sonnet-4-6 · planning › sketching angles › drafting › verifying`. Three RQs stream in. Maya selects all three.

**On-screen call-out:** "Three facets of one study — not three studies."

---

## Pod 3 (0:45 → 1:05) — LITERATURE

> "Then the literature agent reads the relevant work and surfaces gaps. One agent per RQ, in parallel."

**Visual:** literature tabs (RQ A / B / C). Each tab shows state-of-the-art paragraph + similar papers + research gaps. Maya tabs through.

---

## Pod 4 (1:05 → 1:25) — METHODOLOGY (THE INTEGRATED STUDY)

> "Three integrated study designs. Probe doesn't propose three separate studies — it weaves the sub-RQs into one paper, with a coverage matrix showing what each method addresses."

**Visual:** three candidate cards. Maya picks "Mixed-methods longitudinal field study". Coverage matrix highlights. Plan drafts in.

---

## Pod 5 (1:25 → 1:45) — ARTIFACTS

> "Concrete deliverables. Implementation plan ready to hand to a coding agent. Validation protocol the IRB can read tomorrow. Recruitment email."

**Visual:** artifact cards expand. Markdown renders cleanly — headers, lists, code blocks. Maya copies the implementation plan.

---

## Pod 6 (1:45 → 2:05) — EVALUATION (SIMULATED PILOT)

> "Twelve synthetic participants. Probe runs them through the protocol, surfaces friction, recommends fixes. Every claim tagged `[SIMULATION_REHEARSAL]` — never confused with real evidence."

**Visual:** persona pool with diverse roles. Three findings: critical / medium / low. Each one has trigger / evidence / fix.

---

## Pod 7 (2:05 → 2:25) — REVIEW (THE WOW MOMENT)

> "And then the part Opus 4.7 makes possible: a simulated peer-review panel. Three reviewers from different fields, with different affiliations, who genuinely disagree."

**Visual:** three reviewer cards. R1 (academic, expert) says RR. R2 (academic, confident) says ARR. R3 (industry, tentative) says RRX. AC writes meta-review reconciling them.

**On-screen call-out:** "R1: revise & resubmit · R2: accept w/ revisions · R3: major revision — Opus 4.7 holds the disagreement."

---

## Pod 8 (2:25 → 2:45) — REPORT + EXPORT

> "Discussion. Conclusion. Markdown, LaTeX (arXiv-ready), PDF, or a Nerfies-style project page. Maya saves the run as a demo, walks into her advisor meeting tomorrow with a sharpened study design and a rebuttal letter already drafted."

**Visual:** export buttons firing. File downloads.

---

## Pod 9 (2:45 → 2:59) — CLOSE

> "Probe doesn't replace user research. It rehearses it — so PhD students can spend their six months on the study that survives the rehearsal."

**Final frame:** Probe wordmark. URL. GitHub link.

---

# Production notes

- **Voiceover:** clone your own voice (5min sample). Stock ElevenLabs voices read flat.
- **Generate 10 script variants** via Claude. Run them all through the cloned voice. Pick the 5-second clips that land.
- **B-roll:** record 10–15× the footage you need. The best 7 seconds of each stage is what matters.
- **Don't break 2:59:23.** Set the out-point on day one.
- **Music:** ambient piano under the voiceover, lifts only at Pod 7 (the disagreeing reviewers).
- **No live demo.** This is a pre-recorded video. The judges click through Probe themselves later.
