# Related-work survey (raw material, for your judgment)

Generated 2026-04-22 during overnight work. This is **source material, not framing**. The paper's related-work section stays yours — this doc summarizes what actually exists in the adjacent space so you can decide what belongs where.

Each entry: verified via WebFetch on 2026-04-22. Architecture descriptions are from the project's own README / live docs, not from memory.

---

## Projects in the same general space

### `karpathy/autoresearch`

**What it is**: Autonomous overnight hyperparameter + architecture search for neural-network training. An LLM agent (Claude or similar) reads `program.md` for directives, modifies `train.py`, runs 5-minute training experiments, evaluates val_bpb, decides keep/discard, repeats. ~100 experiments overnight.

**Architecture**:
- `prepare.py` — untouched infrastructure (data, tokenizer, utilities)
- `train.py` — the sole file the agent edits (model arch, optimizer, training loop)
- `program.md` — markdown directives + constraints

**Inputs / Outputs**: training data → experimental logs + modified `train.py` + val_bpb progression + improved model weights.

**Overlap with Probe**:
- **Directive file as contract** — Probe's `PROBE.md` serves the same role as autoresearch's `program.md`. Both pin execution behavior in markdown. Karpathy named his; Probe's was influenced by his pattern (already credited in `PROBE.md` preamble).
- **Modify-evaluate-keep/discard loop** — the pattern that autonovel also borrows. Probe doesn't have this explicitly at the pipeline level, but its schema-validate + repair-pass loop at each stage is the same shape at finer granularity.

**Distinct from Probe**:
- autoresearch targets **neural-net training**, not research-design triage
- No adversarial review, no capture-risk audit, no provenance discipline
- Single-loop pipeline; Probe has 8 stages with 3 parallel branches
- Outputs are model weights; Probe's outputs are paper-like artifacts with tagged provenance

---

### `stanford-oval/STORM`

**What it is**: Automated Wikipedia-style article generation. Input: a topic. Output: a full-length article with citations and hierarchical structure.

**Architecture** (two stages):
- **Pre-writing (Research)**: perspective-guided question asking + simulated conversation between Wikipedia writer and topic expert
- **Writing**: article drafting with citations against collected information

**Key innovation** (in their own words): "automatically coming up with good questions to ask."

**Co-STORM extension**: human collaboration via shared "mind map" that organizes information hierarchically.

**Overlap with Probe**:
- **Conversation-as-research** pattern — STORM's simulated writer/expert dialogue is structurally similar to Probe's reviewer-panel (methodologist + accessibility advocate + novelty hawk). Both use role-played multi-agent conversation to surface what the single-voice draft missed.
- **Perspective-guided generation** — STORM identifies perspectives from similar articles; Probe's Stage 2 ideator requires three branches differing on four axes. Both reject single-path generation for principled divergence.
- **Source-grounded output** — STORM cites; Probe's `[SOURCE_CARD:id]` tag enforces the same commitment with linter enforcement.

**Distinct from Probe**:
- STORM targets **factual article generation** from public information; Probe targets **study-design triage** for planned-but-not-yet-conducted research
- No capture-risk audit (there's no design-to-be-critiqued — only text-to-be-written)
- No rehearsal/evidence distinction (STORM's output is encyclopedic fact, not research in planning)
- No provenance-tag linter in the "this element's origin" sense — just citations

**Paper value**: STORM is probably the closest published system to Probe's perspective-guided generation pattern. Worth citing in the ideation-stage discussion.

---

### `NousResearch/autonovel`

**What it is**: Autonomous fiction-writing agent. Generates complete novels (prose, revision, cover art, audiobook, landing page) from a seed concept without human intervention.

**Architecture** (four phases):
1. **Foundation**: world-building, character registry, outline, voice guidelines
2. **First Draft**: sequential chapter writing with pass/fail thresholds
3. **Automated Revision**: adversarial editing cycles + Claude Opus dual-persona literary review (critic + fiction professor)
4. **Export**: LaTeX typesetting, vector art, multi-voice audiobook, landing page

**Key pattern**: "modify-evaluate-keep/discard feedback loop borrowed from research automation, applied to fiction."

**Overlap with Probe**:
- **Adversarial review via multiple personas** — autonovel's dual-persona literary review is structurally identical to Probe's methodologist + accessibility-advocate panel. Both use role-split reviewers against the same artifact.
- **Pass/fail gates between stages** — autonovel's chapter thresholds are Probe's capture-risk audit and meta-review in a different domain.
- **Adversarial editing cycles** — feedback loops that discard and rewrite. Probe's repair-pass is the micro version; autonovel's cycle-level revision is the macro version.

**Distinct from Probe**:
- autonovel's content is **fiction** (no evidence-vs-rehearsal distinction possible — it's all invention)
- No capture-risk audit (the analog would be: "does this character arc exhibit narrative capture" which is a different question)
- Output is a commercial artifact (printable, sellable); Probe's output is a study guidebook to be implemented or discarded

**Paper value**: citeable for the "adversarial review pattern works across domains" claim. Fiction-writing provides a distant-but-real contrast.

---

### `getcompanion-ai/feynman`

**What it is**: Open-source AI research agent. Handles literature review, paper analysis, empirical research replication, peer review simulation.

**Architecture** (4-agent ensemble):
- **Researcher** — evidence gathering
- **Reviewer** — quality assessment
- **Writer** — structured drafting
- **Verifier** — citation validation and dead-link cleanup

Plus: skills as markdown instruction files, data sources via AlphaXiv + Gemini/Perplexity web search, local + cloud compute (LM Studio, Ollama, Modal, RunPod), session indexing.

**Outputs**: source-grounded research briefs, literature matrices, experiment replications, peer reviews. Every claim links to papers/docs/repos with direct URLs.

**Overlap with Probe**:
- **Multi-agent role-split pipeline** — Feynman's researcher/reviewer/writer/verifier maps onto Probe's ideator/reviewer-panel/guidebook-assembler. Closest architectural sibling of the projects surveyed.
- **Skills as markdown** — Feynman's `~/.feynman/agent/skills/` pattern matches Probe's `agents/*.md`. Both pin agent behavior in markdown files edited outside the runtime.
- **Source-grounding commitment** — Feynman's "every output is source-grounded" matches Probe's provenance-tag discipline. Same principle, different enforcement mechanisms (Feynman uses URL validation, Probe uses AST linter).
- **Peer-review simulation** — Feynman has a "severity-graded feedback" peer-review mode. Probe's reviewer panel + meta-review is the domain-specific version.

**Distinct from Probe**:
- Feynman is **general-purpose** research agent; Probe is scoped to screen-based interactive HCI study design
- Feynman's outputs include actual replications (running code on GPUs); Probe's outputs stop at "here's what the study should look like, now go build it"
- No capture-risk audit, no Wizard-of-Oz rehearsal, no evidence-vs-rehearsal distinction
- Probe's reviewer personas are domain-specific (accessibility advocate, novelty hawk); Feynman's are general quality assessors

**Paper value**: Feynman is the **closest existing system** Probe needs to distinguish itself from. The paper's related-work section should handle this carefully: Feynman is a general research agent; Probe is a domain-specific triage tool with capture-risk norms. The distinction lives in the scope and the audit library, not in the agentic architecture (which is similar).

---

### `hzwer/WritingAIPaper`

Already consulted earlier this session — paper-writing handbook, not a system. Move framework + contribution categories now in `agents/premise.md` and `agents/guidebook.md` respectively. Credited there.

---

## Gaps in Probe's current bibliography

Papers or projects worth adding to the related-work section when you have time:

**Peer-review automation** (already in bibliography — `jin2024agentreview`, `darcy2024marg`, `zhu2025deepreview`, `bougie2025gar`):
- Mostly covered. Consider adding Chiang & Lee 2023 (ACL) on LLM vs human eval (candidate card now in `corpus/candidates/`).

**LLM-as-judge evaluation**:
- Zheng et al. 2023 MT-Bench (candidate card written tonight). Directly strengthens Probe's claim that its reviewer output is a legitimate review-like artifact.

**Research-workflow agents** (this survey's focus):
- STORM (Stanford OVAL) — perspective-guided research generation. Not in current bibliography. Would go in ideation/divergence discussion.
- karpathy/autoresearch — autonomous research loop pattern. Already conceptually credited in PROBE.md; should be cited if the paper discusses the `modify-evaluate-keep` pattern.
- getcompanion-ai/feynman — general research agent. **Closest living sibling** to Probe. The paper needs to engage with it explicitly.
- NousResearch/autonovel — cross-domain confirmation of the adversarial-review pattern.

**Code-writing agents with multi-agent review** (already in bibliography — `hong2024metagpt`, `wu2024autogen`, `li2023camel`):
- Covered.

**Capture / autonomy literature** (already in corpus — `buijsman_carter_bermudez_2025`, `illich1973conviviality`):
- Adding empirical grounding would help. `corpus/candidates/` lists Bainbridge 1983 + Parasuraman & Manzey 2010 as flagged-but-unverified candidates that would fill this gap. Both need manual-browser verification because Elsevier/Sage 403-block WebFetch.

---

## Suggested positioning for the paper

Three paragraphs of related-work text to consider. Write your own; these are skeletons.

### Paragraph: research-workflow agents

A handful of recent systems automate portions of the research workflow at different scopes. STORM \citep{stanford_storm} generates Wikipedia-style articles via perspective-guided question asking and simulated expert dialogue; it shares Probe's commitment to principled divergence in generation but produces factual prose rather than study designs. karpathy's `autoresearch` \citep{karpathy_autoresearch} automates neural-net hyperparameter search with a modify-evaluate-keep loop; Probe adopts a similar loop at stage-boundary granularity via schema validation and repair, but our domain is study design rather than training optimization. Feynman \citep{companion2025feynman}, closest in architecture, packages a researcher/reviewer/writer/verifier ensemble into a general-purpose research agent; Probe's divergence from Feynman lives not in the agentic pattern but in the scope (screen-based interactive HCI studies specifically) and in the capture-risk audit, which Feynman does not include. Autonovel \citep{nousresearch2025autonovel} provides cross-domain evidence that adversarial review via role-split agents produces better output than single-voice generation.

### Paragraph: peer-review automation

Existing LLM-based peer-review systems \citep{jin2024agentreview, darcy2024marg, zhu2025deepreview, bougie2025gar} mostly operate on completed papers — input a paper, output a review. Probe reverses the order: input a rough study premise, output a set of reviewer objections the researcher can address BEFORE the study runs. Zheng et al.'s MT-Bench \citep{zheng2023mtbench} quantified LLM-judge agreement with human preferences at >80%; that result bounds what Probe's reviewer panel can honestly claim (a legitimate review-like artifact, not a substitute for human review), which the paper's framing respects.

### Paragraph: capture-risk literature

The audit's four axes — Capacity, Agency, Exit, Legibility — are grounded in Buijsman, Carter, and Bermúdez's autonomy-by-design framing \citep{buijsman2025autonomy} and Illich's distinction between convivial and industrial tools \citep{illich1973conviviality}. The empirical automation-bias literature — Bainbridge's foundational "Ironies of Automation" \citep{bainbridge1983ironies} and Parasuraman & Manzey's later attentional-integration synthesis \citep{parasuraman2010complacency} — provides ground-truth for the pattern library's capacity-axis claims. These aren't yet in the bibliography; adding them would strengthen the audit library's claim to reflect 40 years of operator-automation research rather than being Probe-internal.

---

## What this survey suggests for the paper's strongest claim

Of Probe's infrastructure commitments, three are genuinely novel against the sibling systems:

1. **Capture-risk audit with named patterns + evidence spans + -2/-1/0/+1/+2 scale** — none of the surveyed agents have this. Feynman has peer-review simulation with severity grades, but no pattern library grounded in autonomy literature.

2. **Provenance-tag linter at paragraph/bullet/table-row granularity** — source-grounded output is a shared commitment across STORM and Feynman, but the markdown-AST linter that FAILS the build on a missing tag is unique to Probe.

3. **Rehearsal-not-evidence discipline** — the `[SIMULATION_REHEARSAL]` tag, the forbidden-phrase list that rejects "users preferred" in Probe's voice, the linter check that `[SIMULATION_REHEARSAL]` paragraphs use hedged language — all of these are Probe-specific. No surveyed system enforces this distinction.

Everything else (multi-agent ensemble, adversarial review, directive-markdown files, repair loops) Probe shares with at least one sibling. The paper's contribution claim should center on (1), (2), (3) — not on the agentic architecture, which is table stakes in this space by 2026.

*End of survey.*
