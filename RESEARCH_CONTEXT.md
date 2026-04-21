# Research context

Probe's design sits on top of a small body of theoretical and empirical work. This file is the public bibliography with verified references. Every citation in a generated guidebook must resolve to a card in [`corpus/source_cards/`](./corpus/source_cards/).

## Theoretical grounding

### The probes framework (methodology)

Probes as a design research method come from Gaver, Dunne & Pacenti (1999), who introduced 'cultural probes' as packages of artefacts (maps, postcards, disposable cameras, diaries) to elicit inspirational fragments from participants, not to produce generalizable data.

Sanders & Stappers (2014) later mapped probes alongside generative toolkits and design prototypes as three distinct 'making' approaches in codesign, distinguishing them by mindset ('designing for' vs. 'designing with') and temporal focus (present / near future / speculative).

Probe inherits the 'rehearsal, not evidence' framing from both — simulation outputs are structured speculation, not findings.

- [`corpus/source_cards/gaver_dunne_pacenti_1999.yaml`](./corpus/source_cards/gaver_dunne_pacenti_1999.yaml)
- [`corpus/source_cards/sanders_stappers_2014.yaml`](./corpus/source_cards/sanders_stappers_2014.yaml)

### Autonomy-by-design (capture-risk framework)

Buijsman, Carter & Bermúdez (2025) analyze 'domain-specific autonomy' as comprising skilled competence and authentic value-formation within a domain of expertise. They argue that AI decision-support can erode domain-specific autonomy via absent failure indicators and unconscious value shifts, and propose design patterns to preserve user agency.

The four audit axes in `patterns/` — Capacity, Agency, Exit, Legibility — derive from this analysis. Each of the 16 named patterns specifies a quoted evidence template and grounds in the autonomy-by-design framing.

- [`corpus/source_cards/buijsman_carter_bermudez_2025.yaml`](./corpus/source_cards/buijsman_carter_bermudez_2025.yaml)

### Conviviality (capture-risk origin)

Illich (1973) introduced 'conviviality' as a criterion for tools that enhance autonomy, and 'radical monopoly' as a critique of dominant technologies that foreclose alternatives. The Exit axis in the capture-risk audit operationalizes this: does use of the intervention reduce the space of available action once you stop using it?

- [`corpus/source_cards/illich_1973.yaml`](./corpus/source_cards/illich_1973.yaml)

### Political/relational model of disability

Kafer (2013) rejects both the medical model of disability and the British social model, arguing for a political/relational model that treats disability as a politically constituted category rather than a deficit to correct. She critiques the 'curative imaginary' — the assumption that disabled futures must be futures without disability.

The `agency.paternalistic_default` pattern and the accessibility advocate reviewer persona draw on this work to flag extractive or curative framings in study designs.

- [`corpus/source_cards/kafer_2013.yaml`](./corpus/source_cards/kafer_2013.yaml)

## Empirical grounding

### LLMs in peer review

Jin et al. (EMNLP 2024) — 'AgentReview' — introduce an LLM-agent-based simulation of peer review modelling reviewer, author, and area-chair roles. They observe that simulated reviewer biases can account for up to ~37.1% variation in paper decisions. Probe's adversarial reviewer stage inherits the 'agents can hold role-specialized stances' observation and uses the forbidden-phrases guardrail to resist the flattery drift their simulation also surfaces.

- [`corpus/source_cards/jin_agentreview_2024.yaml`](./corpus/source_cards/jin_agentreview_2024.yaml)

### Usefulness of LLM feedback on scientific papers

Liang et al. (NEJM AI 2024) compare GPT-4-generated feedback on scientific manuscripts to human peer-review feedback across 3,096 Nature-family papers and 1,709 ICLR papers. They report 30.85% / 39.23% overlap of points raised (comparable to human-human overlap) and find that 57.4% of 308 researchers in a prospective user study rated the feedback helpful or very helpful. They conclude LLM feedback complements (not replaces) human review.

Probe inherits this complement-not-replace framing directly. The `[HUMAN_REQUIRED]` provenance tag and the guidebook's always-present human handoff section are the structural enforcement of it.

- [`corpus/source_cards/liang_nejm_ai_2024.yaml`](./corpus/source_cards/liang_nejm_ai_2024.yaml)

## Verification

All seven source cards were verified on 2026-04-22. Every DOI or publisher URL was fetched and confirmed to resolve to the correct paper. For monographs without DOIs (Kafer, Illich), ISBNs were verified against publisher pages. See each YAML file's `verification_notes` field.

## Constraints on citation

A generated guidebook may cite ONLY claims that appear in a source card's `allowed_claims` list. Citing a paper for something it does not support is a hallucination the linter is expected to catch. If Probe's agents want to say something not supported by the corpus, the correct behavior is to mark the paragraph `[AGENT_INFERENCE]` or `[HUMAN_REQUIRED]`, not to invent a citation.
