# Forbidden-phrase candidates

Phrases observed in Probe's own voice (i.e. inside `[AGENT_INFERENCE]` paragraphs or `[UNCITED_ADJACENT]` bridge text) that are arguably evidence-coded but not currently caught by `src/lint/forbidden.ts`. These are **candidates for review**, not adopted rules — changes to the forbidden list need the user's judgment because false positives on legitimate mechanism descriptions are costly.

For each candidate I log:
- **Phrase** — regex-shape that caught it
- **Run / line** — where it appeared
- **Context excerpt** — the containing paragraph (ellipsized)
- **Why arguably forbidden** — the specific concern (evidence-coding, hidden prediction, normative smuggling)
- **Why maybe fine** — the counter-argument (legitimate mechanism description, hedged, tagged appropriately)

The current forbidden list (for reference):
- "users preferred" / "users said"
- "participants found" / "participants reported"
- "the study shows" / "findings show"
- "significant" / "significantly" (narrowed to statistical-usage patterns only)
- "validated" / "validates"
- "proved" / "demonstrated that"
- "evidence suggests" / "data indicates"

---

## Scan run on 2026-04-22 before backlog batch

Scanned three existing guidebooks: `demo_run`, `benchmark_creativity_support`, `benchmark_code_review`. Patterns scanned (case-insensitive): `seems (to|likely)`, `appears to`, `suggests that`, `indicates`, `shows that`, `we (can see|observe|find)`, `this (shows|demonstrates|reveals|confirms|indicates)`, `findings (indicate|suggest)`, `implies that`, `tend(s?) to`, `most participants`, `many users`, `observers (noted|observed)`, `empirically`, `correlation`, `association`, `reliably`, `consistent(ly)?`, `strong(ly)? support`, `established`, `confirmed`, `reliably detects`, `well-known`, `widely accepted`, `generally accepted`, `research (shows|indicates)`, `literature (shows|indicates)`, `standard practice`, `known to`, `should reliably`.

**Result**: all matches in Probe's voice (i.e. in `[AGENT_INFERENCE]` paragraphs) were either (a) describing a legitimate technical mechanism (e.g. "candidates confirmed as low-frequency" describing a selection criterion, not an empirical claim), or (b) in `[SIMULATION_REHEARSAL]` paragraphs where hedged language is required. No new candidates surfaced on this scan.

This is weak evidence. The existing forbidden list was shaped against the demo premise; scanning demo-adjacent content naturally finds little. The candidates below will fill in as the backlog and adversarial batches complete.

---

## Candidates from the backlog batch (Task 4)

*(Populated as backlog_* runs complete. As of this writing: batch in progress, 0 runs completed.)*

---

## Candidates from the adversarial battery (Task 5)

*(Populated as adversarial_* runs complete. As of this writing: batch not yet started.)*

---

## Prior observations worth considering

These came up during prior review waves but were never formally captured:

### "Seems to indicate" / "appears to"

- **Phrase**: `\bseems to (indicate|suggest)\b`, `\bappears to\b`
- **Why arguably forbidden**: Hedged-but-evidence-coded. In Probe's voice, a hedge doesn't save a claim that implies "this is what the data tells us." The reader parses it as "Probe found this in the study," which is exactly the category the tool is supposed to never claim.
- **Why maybe fine**: In `[SIMULATION_REHEARSAL]` the hedge is legitimate. A blanket ban would require carving an exception for rehearsal-tagged elements.

### "The literature shows" / "research demonstrates"

- **Phrase**: `\b(literature|research) (shows|demonstrates|indicates|suggests)\b`
- **Why arguably forbidden**: Smuggles an empirical claim about a body of work. Unless paired with a `[SOURCE_CARD:id]` reference, Probe has no grounds to report what "the literature" shows.
- **Why maybe fine**: When directly followed by a `[SOURCE_CARD:id]` citation, the phrase is a readable gloss on the referenced work. A context-aware rule could accept that but reject free-floating usage.

### "As we can see"

- **Phrase**: `\bas (we|you) can see\b`
- **Why arguably forbidden**: An empirical-tone shortcut that presupposes a visible finding. Breaks the rehearsal-never-performance frame.
- **Why maybe fine**: Could appear inside a quoted block (e.g. quoting a reviewer's verbatim language). Rule would need to respect quoted regions like the other forbidden phrases do.

### "Consistent with" (without a citation)

- **Phrase**: `\bconsistent with\b` not followed within ~40 chars by `[SOURCE_CARD:`
- **Why arguably forbidden**: Implies an empirical consistency. Without a citation pointing at what the finding is consistent with, this is an assertion about a state of knowledge Probe cannot ground.
- **Why maybe fine**: The phrase is common in legitimate methodological discussion. A bare ban would be too aggressive.

---

## Recommendation (for user review)

If one rule must be picked, my strongest candidate is **"the literature shows" / "research demonstrates" without a trailing `[SOURCE_CARD:id]`**. That rule would catch a specific evidence-smuggling pattern and has a clean exception for legitimate grounded use. The others are weaker and more likely to produce false positives on mechanism descriptions.

All candidates here are candidates only. No edits to `src/lint/forbidden.ts`.
