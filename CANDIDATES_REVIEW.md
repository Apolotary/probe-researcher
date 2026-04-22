# Candidate source cards — Task 8 review

Wrote **2 candidate source cards** for your corpus review. Both are in `corpus/candidates/` and NOT in `corpus/source_cards/` — that decision is yours, per the overnight brief.

## Written and verified

### `zheng_2023_mt_bench.yaml`

- **Paper**: Zheng et al. 2023, "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena", NeurIPS 2023 Datasets and Benchmarks Track
- **arXiv**: 2306.05685
- **Why it strengthens the corpus**: Probe uses LLMs as judges at multiple stages (auditor, reviewers, meta-reviewer). Zheng et al. quantify the agreement between LLM judges and human preferences at >80% — directly relevant to Probe's claim that its reviewer-panel output is a legitimate review-like artifact. Also characterizes the specific biases (position, verbosity, self-enhancement) that Probe should be aware of in its own reviewer architecture.
- **Verification**: abstract fetched verbatim from arXiv; 4 `claims_allowed` entries are exact substrings of the abstract.

### `chiang_lee_2023_llm_alt_eval.yaml`

- **Paper**: Chiang & Lee 2023, "Can Large Language Models Be an Alternative to Human Evaluations?", ACL 2023
- **arXiv**: 2305.01937
- **Why it strengthens the corpus**: Positions Probe's use of LLMs-as-reviewers against the existing literature that asks whether LLMs can substitute for human evaluation at all. Adjacent to `jin2024agentreview` already in the corpus but has a different angle (individual evaluations vs. multi-agent peer review).
- **Verification**: title, authors, venue confirmed via arXiv. Only 2 `claims_allowed` were extractable as verbatim abstract quotes — the fetcher rendered the rest of the abstract in summary form. The card's `verification_notes` flags this explicitly and recommends a human cross-check before grounding output against this source.

## Wanted to write but couldn't verify

Per the overnight brief's strict rule — "Do not paraphrase the abstract from memory. If you can't access the abstract, flag that in the card and don't write claims_allowed" — I did not produce cards for papers whose content I could not verify tonight. The following papers were on the seed list and would be worth writing when you can manually pull the abstracts:

### Bainbridge 1983, "Ironies of Automation"

- Automatica Vol 19 Issue 6, 775–779, DOI 10.1016/0005-1098(83)90046-8
- Foundational work on automation-bias and skill-degradation. Directly relevant to Probe's `capacity.substitutes_for_practice` pattern.
- Elsevier/ScienceDirect blocked the WebFetch. A copy sits on multiple course-reading-lists; PDF verification should be straightforward from your browser.

### Parasuraman & Manzey 2010, "Complacency and Bias in Human Use of Automation: An Attentional Integration"

- Human Factors 52(3):381–410, DOI 10.1177/0018720810376055
- Empirical follow-up on Bainbridge. Directly relevant to `legibility.no_failure_signal` and the audit's whole framing.
- Sage blocked the WebFetch (403). Again, should be readable in your browser.

### Mankoff, Hayes, Kasnitz 2010, "Disability Studies as a Source of Critical Inquiry for the Field of Assistive Technology"

- ASSETS 2010, pp. 3–10, DOI 10.1145/1878803.1878807
- Strengthens the accessibility-advocate reviewer persona. The `kafer_2013` card in the corpus is theoretical/political; this one is methodological.
- ACM Digital Library blocked the WebFetch (403).

### Spiel, Brulé, Frauenberger, Bailly, Fitzpatrick 2020, "In the Details: The Micro-Ethics of Negotiations and In-Situ Judgements in Participatory Design with Marginalised Children"

- CoDesign 16(1), DOI 10.1080/15710882.2020.1722174 (or similar — the 3372300 DOI I tried was wrong)
- Codesign-with-disabled-participants methodology. Also strengthens the accessibility-advocate reviewer.
- Not fetched — need to verify the correct DOI first.

### Bennett & Rosner 2019, "The Promise of Empathy: Design, Disability, and Knowing the 'Other'"

- CHI 2019, DOI 10.1145/3290605.3300528
- Critiques empathy-framed disability design. Adjacent to `kafer_2013`.
- Not attempted tonight.

## Rules followed

Per the overnight brief:

- ✓ All verification via WebFetch (free) — zero API spend on Task 8.
- ✓ No paraphrase from training memory. `claims_allowed` entries are only verbatim substrings from what the fetcher actually rendered.
- ✓ `provenance` / `verification_notes` field on each card names the URL, date, and what was confirmed.
- ✓ Cards written to `corpus/candidates/`, not `corpus/source_cards/`. Adopting a card is your call.
- ✓ Max 8 cards (wrote 2; quality over quantity).
- ✓ No edits to `src/lint/forbidden.ts`, `patterns/*.yaml`, or `corpus/source_cards/` directly.

## Recommendation

If you review and approve these two cards, they're a clean drop-in to `corpus/source_cards/` — no edits needed. For the five flagged-but-unverified papers, the fastest path is: open the linked DOI in your browser on your second monitor, paste the abstract into a new candidate YAML, and the `verification_notes` field writes itself ("Fetched <URL> on <date>; abstract quoted verbatim below.").

The two verified cards provide paper-citation-level support for Probe's `jin_agentreview_2024` claim about LLM peer review. The three automation-bias cards, once verified, would give the audit library's capacity/legibility axes empirical grounding they currently lack (the buijsman_carter_bermudez card is theoretical; Bainbridge + Parasuraman-Manzey would provide the empirical leg).
