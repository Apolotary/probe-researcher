# Runs summary

Generated 2026-04-22T07:39:23.435Z via `probe stats --all`.

| run_id | verdicts (a / b / c) | cost | wall | repairs | lint |
| --- | --- | --- | --- | --- | --- |
| `backlog_browser_agents` | a=FAILED:5_simulator<br>b=BLOCKED:agency.auto_decides_consequential_step<br>c=BLOCKED:exit.data_lock_in | $1.93 | 30m38s | 4 | no guidebook |
| `backlog_claude_artifacts` | a=BLOCKED:legibility.no_rationale_at_point_of_action<br>b=BLOCKED:capacity.substitutes_for_practice<br>c=BLOCKED:agency.hides_options_before_review | $2.30 | 34m30s | 6 | no guidebook |
| `backlog_divination_ui` | a=FAILED:5_simulator<br>b=FAILED:5_simulator<br>c=BLOCKED | $1.68 | 26m47s | 5 | no guidebook |
| `backlog_e2ee_ai` | a=UNKNOWN | $0.07 | 57s | 1 | no guidebook |
| `backlog_live_coding` | a=BLOCKED:agency.hides_options_before_review<br>b=BLOCKED:agency.auto_decides_consequential_step<br>c=FAILED:5_simulator | $2.20 | 32m15s | 7 | no guidebook |
| `backlog_llm_codereview` | a=UNKNOWN | $0.04 | 41s | 0 | no guidebook |
| `backlog_mochi_proactive` | a=SURVIVED (REVISION_REQUIRED) [human_judgment_required]<br>b=SURVIVED (REVISION_REQUIRED)<br>c=BLOCKED:legibility.no_failure_signal | $3.76 | 27m36s | 2 | prov=✓ voice=✓ |
| `backlog_polymarket_drift` | a=SURVIVED (REVISION_REQUIRED) [human_judgment_required]<br>b=BLOCKED:legibility.no_failure_signal<br>c=SURVIVED (REVISION_REQUIRED) [human_judgment_required] | $3.43 | 27m58s | 2 | prov=✓ voice=✓ |
| `backlog_rag_attribution` | a=FAILED:5_simulator<br>b=BLOCKED:agency.hides_options_before_review<br>c=BLOCKED:capacity.substitutes_for_practice | $1.94 | 29m12s | 4 | no guidebook |
| `backlog_screenreader_llm` | a=FAILED:5_simulator<br>b=BLOCKED:capacity.substitutes_for_practice<br>c=FAILED:5_simulator | $1.46 | 23m29s | 4 | no guidebook |
| `backlog_torso_s4_ios` | a=BLOCKED:legibility.no_failure_signal<br>b=SURVIVED (REVISION_REQUIRED)<br>c=SURVIVED (REVISION_REQUIRED) [human_judgment_required] | $4.56 | 34m07s | 8 | prov=✓ voice=✓ |
| `backlog_voice_agents` | a=UNKNOWN | $0.07 | 1m06s | 1 | no guidebook |
| `benchmark_code_review` | a=BLOCKED:legibility.no_failure_signal<br>b=BLOCKED:legibility.no_failure_signal<br>c=FAILED:7_review | $2.43 | 19m26s | 2 | no guidebook |
| `benchmark_creativity_support` | a=SURVIVED (REVISION_REQUIRED)<br>b=SURVIVED (REVISION_REQUIRED)<br>c=SURVIVED (REVISION_REQUIRED) [human_judgment_required] | $6.65 | 44m48s | 13 | prov=✓ voice=✓ |
| `demo_run` | a=BLOCKED:legibility.no_failure_signal<br>b=SURVIVED (REVISION_REQUIRED) [human_judgment_required]<br>c=BLOCKED:legibility.no_failure_signal | $5.93 | 54m50s | 23 | prov=✓ voice=✓ |
| `import_test_sample` | a=UNKNOWN | $0.07 | 44s | 1 | no guidebook |

## Per-run detail

### `backlog_browser_agents`

**Premise:** Design a study to understand how users form trust in browser-use agents when the agent makes cons...

| branch | verdict | Cap | Agc | Exit | Leg | disagreement |
| --- | --- | --- | --- | --- | --- | --- |
| a | FAILED:5_simulator | 0 | 0 | 0 | 0 | — |
| b | BLOCKED:agency.auto_decides_consequential_step | 0 | 1 | 0 | 3 | legitimate_normative_split |
| c | BLOCKED:exit.data_lock_in | 0 | 0 | 2 | 1 | legitimate_methodological_split |

**Cost:** $1.93 · **Wall:** 30m38s · **Tokens:** 246K in / 80K out · **Repair passes:** 4

**Anomalies:**
- repair pass on 2_ideator
- repair pass on 5_simulator [branch b]
- repair pass on 5_simulator [branch a]
- repair pass on 5_simulator [branch c]
- branch a: missing simulated_walkthrough.md (status=failed)
- branch a: missing audit.json (status=failed)

### `backlog_claude_artifacts`

**Premise:** Design a study to understand how developers reason about AI-generated single-file HTML artifacts ...

| branch | verdict | Cap | Agc | Exit | Leg | disagreement |
| --- | --- | --- | --- | --- | --- | --- |
| a | BLOCKED:legibility.no_rationale_at_point_of_action | 1 | 0 | 0 | 2 | legitimate_methodological_split |
| b | BLOCKED:capacity.substitutes_for_practice | 3 | 1 | 0 | 4 | single_reviewer_outlier |
| c | BLOCKED:agency.hides_options_before_review | 0 | 1 | 1 | 3 | legitimate_methodological_split |

**Cost:** $2.30 · **Wall:** 34m30s · **Tokens:** 304K in / 92K out · **Repair passes:** 6

**Anomalies:**
- repair pass on 2_ideator
- repair pass on 4_prototype [branch a]
- repair pass on 5_simulator [branch a]
- repair pass on 5_simulator [branch b]
- repair pass on 5_simulator [branch c]
- repair pass on 7b_accessibility [branch a]

### `backlog_divination_ui`

**Premise:** Design a study to understand how users interpret probabilistic/ambiguous outputs in decision-supp...

| branch | verdict | Cap | Agc | Exit | Leg | disagreement |
| --- | --- | --- | --- | --- | --- | --- |
| a | FAILED:5_simulator | 0 | 0 | 0 | 0 | — |
| b | FAILED:5_simulator | 0 | 0 | 0 | 0 | — |
| c | BLOCKED | 1 | 1 | 0 | 2 | legitimate_methodological_split |

**Cost:** $1.68 · **Wall:** 26m47s · **Tokens:** 206K in / 70K out · **Repair passes:** 5

**Anomalies:**
- repair pass on 2_ideator
- repair pass on 5_simulator [branch a]
- repair pass on 5_simulator [branch b]
- repair pass on 5_simulator [branch c]
- repair pass on 7b_accessibility [branch c]
- branch a: missing simulated_walkthrough.md (status=failed)
- branch a: missing audit.json (status=failed)
- branch b: missing simulated_walkthrough.md (status=failed)
- branch b: missing audit.json (status=failed)

### `backlog_e2ee_ai`

**Premise:** Design a study to understand user mental models of AI features running on end-to-end encrypted me...

| branch | verdict | Cap | Agc | Exit | Leg | disagreement |
| --- | --- | --- | --- | --- | --- | --- |
| a | UNKNOWN | 0 | 0 | 0 | 0 | — |

**Cost:** $0.07 · **Wall:** 57s · **Tokens:** 6K in / 3K out · **Repair passes:** 1

**Anomalies:**
- repair pass on 2_ideator
- branch a: missing branch_card.json (status=unknown)
- branch a: missing prototype_spec.json (status=unknown)
- branch a: missing simulated_walkthrough.md (status=unknown)
- branch a: missing audit.json (status=unknown)

### `backlog_live_coding`

**Premise:** Design a study to evaluate pair-programming dynamics between a human and an AI coding assistant i...

| branch | verdict | Cap | Agc | Exit | Leg | disagreement |
| --- | --- | --- | --- | --- | --- | --- |
| a | BLOCKED:agency.hides_options_before_review | 1 | 1 | 0 | 2 | legitimate_methodological_split |
| b | BLOCKED:agency.auto_decides_consequential_step | 0 | 2 | 1 | 2 | legitimate_methodological_split |
| c | FAILED:5_simulator | 0 | 0 | 0 | 0 | — |

**Cost:** $2.20 · **Wall:** 32m15s · **Tokens:** 304K in / 86K out · **Repair passes:** 7

**Anomalies:**
- repair pass on 2_ideator
- repair pass on 5_simulator [branch c]
- repair pass on 5_simulator [branch a]
- repair pass on 5_simulator [branch b]
- repair pass on 7a_methodologist [branch b]
- repair pass on 7b_accessibility [branch a]
- repair pass on 7b_accessibility [branch b]
- branch c: missing simulated_walkthrough.md (status=failed)
- branch c: missing audit.json (status=failed)

### `backlog_llm_codereview`

**Premise:** Design a study to evaluate whether LLM code review comments change reviewer behavior in cases whe...

| branch | verdict | Cap | Agc | Exit | Leg | disagreement |
| --- | --- | --- | --- | --- | --- | --- |
| a | UNKNOWN | 0 | 0 | 0 | 0 | — |

**Cost:** $0.04 · **Wall:** 41s · **Tokens:** 3K in / 2K out · **Repair passes:** 0

**Anomalies:**
- branch a: missing branch_card.json (status=unknown)
- branch a: missing prototype_spec.json (status=unknown)
- branch a: missing simulated_walkthrough.md (status=unknown)
- branch a: missing audit.json (status=unknown)

### `backlog_mochi_proactive`

**Premise:** Design a study to understand when an AI assistant's proactive reminders feel supportive vs. pater...

| branch | verdict | Cap | Agc | Exit | Leg | disagreement |
| --- | --- | --- | --- | --- | --- | --- |
| a | SURVIVED (REVISION_REQUIRED) [human_judgment_required] | 1 | 2 | 0 | 1 | legitimate_methodological_split |
| b | SURVIVED (REVISION_REQUIRED) | 1 | 0 | 0 | 2 | consensus |
| c | BLOCKED:legibility.no_failure_signal | 1 | 2 | 1 | 3 | — |

**Cost:** $3.76 · **Wall:** 27m36s · **Tokens:** 363K in / 90K out · **Repair passes:** 2

**Anomalies:**
- repair pass on 6_audit [branch b]
- repair pass on 8_guidebook

### `backlog_polymarket_drift`

**Premise:** Design a study to understand how semi-automated trading agents should surface execution drift to ...

| branch | verdict | Cap | Agc | Exit | Leg | disagreement |
| --- | --- | --- | --- | --- | --- | --- |
| a | SURVIVED (REVISION_REQUIRED) [human_judgment_required] | 1 | 1 | 0 | 3 | legitimate_methodological_split |
| b | BLOCKED:legibility.no_failure_signal | 1 | 1 | 0 | 2 | — |
| c | SURVIVED (REVISION_REQUIRED) [human_judgment_required] | 1 | 1 | 2 | 2 | legitimate_methodological_split |

**Cost:** $3.43 · **Wall:** 27m58s · **Tokens:** 318K in / 89K out · **Repair passes:** 2

**Anomalies:**
- repair pass on 2_ideator
- repair pass on 4_prototype [branch b]

### `backlog_rag_attribution`

**Premise:** Design a study to evaluate whether inline citation attribution in RAG-based AI answers changes us...

| branch | verdict | Cap | Agc | Exit | Leg | disagreement |
| --- | --- | --- | --- | --- | --- | --- |
| a | FAILED:5_simulator | 0 | 0 | 0 | 0 | — |
| b | BLOCKED:agency.hides_options_before_review | 0 | 1 | 0 | 3 | legitimate_methodological_split |
| c | BLOCKED:capacity.substitutes_for_practice | 3 | 1 | 0 | 3 | legitimate_methodological_split |

**Cost:** $1.94 · **Wall:** 29m12s · **Tokens:** 257K in / 78K out · **Repair passes:** 4

**Anomalies:**
- repair pass on 5_simulator [branch a]
- repair pass on 5_simulator [branch c]
- repair pass on 5_simulator [branch b]
- repair pass on 7b_accessibility [branch b]
- branch a: missing simulated_walkthrough.md (status=failed)
- branch a: missing audit.json (status=failed)

### `backlog_screenreader_llm`

**Premise:** Design a study to evaluate whether LLM-generated image descriptions for screen-reader users impro...

| branch | verdict | Cap | Agc | Exit | Leg | disagreement |
| --- | --- | --- | --- | --- | --- | --- |
| a | FAILED:5_simulator | 0 | 0 | 0 | 0 | — |
| b | BLOCKED:capacity.substitutes_for_practice | 3 | 2 | 1 | 3 | legitimate_methodological_split |
| c | FAILED:5_simulator | 0 | 0 | 0 | 0 | — |

**Cost:** $1.46 · **Wall:** 23m29s · **Tokens:** 169K in / 63K out · **Repair passes:** 4

**Anomalies:**
- repair pass on 2_ideator
- repair pass on 5_simulator [branch c]
- repair pass on 5_simulator [branch a]
- repair pass on 5_simulator [branch b]
- branch a: missing simulated_walkthrough.md (status=failed)
- branch a: missing audit.json (status=failed)
- branch c: missing simulated_walkthrough.md (status=failed)
- branch c: missing audit.json (status=failed)

### `backlog_torso_s4_ios`

**Premise:** Design a study to evaluate a mobile recreation of a hardware MPC-style sampler interface, where t...

| branch | verdict | Cap | Agc | Exit | Leg | disagreement |
| --- | --- | --- | --- | --- | --- | --- |
| a | BLOCKED:legibility.no_failure_signal | 1 | 0 | 0 | 2 | single_reviewer_outlier |
| b | SURVIVED (REVISION_REQUIRED) | 1 | 1 | 0 | 2 | consensus |
| c | SURVIVED (REVISION_REQUIRED) [human_judgment_required] | 1 | 0 | 2 | 2 | legitimate_methodological_split |

**Cost:** $4.56 · **Wall:** 34m07s · **Tokens:** 472K in / 107K out · **Repair passes:** 8

**Anomalies:**
- repair pass on 2_ideator
- repair pass on 4_prototype [branch c]
- repair pass on 4_prototype [branch a]
- repair pass on 7a_methodologist [branch b]
- repair pass on 7b_accessibility [branch a]
- repair pass on 7b_accessibility [branch c]
- repair pass on 7b_accessibility [branch b]
- repair pass on 7d_meta [branch c]

### `backlog_voice_agents`

**Premise:** Design a study to understand failure modes of voice agents in multilingual households when codesw...

| branch | verdict | Cap | Agc | Exit | Leg | disagreement |
| --- | --- | --- | --- | --- | --- | --- |
| a | UNKNOWN | 0 | 0 | 0 | 0 | — |

**Cost:** $0.07 · **Wall:** 1m06s · **Tokens:** 6K in / 4K out · **Repair passes:** 1

**Anomalies:**
- repair pass on 2_ideator
- branch a: missing branch_card.json (status=unknown)
- branch a: missing prototype_spec.json (status=unknown)
- branch a: missing simulated_walkthrough.md (status=unknown)
- branch a: missing audit.json (status=unknown)

### `benchmark_code_review`

**Premise:** design a study to evaluate an AI-assisted code review tool for mid-level engineers working on leg...

| branch | verdict | Cap | Agc | Exit | Leg | disagreement |
| --- | --- | --- | --- | --- | --- | --- |
| a | BLOCKED:legibility.no_failure_signal | 1 | 0 | 0 | 3 | — |
| b | BLOCKED:legibility.no_failure_signal | 1 | 1 | 0 | 2 | — |
| c | FAILED:7_review | 1 | 1 | 1 | 3 | — |

**Cost:** $2.43 · **Wall:** 19m26s · **Tokens:** 237K in / 62K out · **Repair passes:** 2

**Anomalies:**
- repair pass on 2_ideator
- repair pass on 7b_accessibility [branch c]

### `benchmark_creativity_support`

**Premise:** design a study to evaluate a creativity-support tool that gives poets alternative line endings du...

| branch | verdict | Cap | Agc | Exit | Leg | disagreement |
| --- | --- | --- | --- | --- | --- | --- |
| a | SURVIVED (REVISION_REQUIRED) | 1 | 0 | 0 | 2 | spurious_surface_disagreement |
| b | SURVIVED (REVISION_REQUIRED) | 2 | 1 | 0 | 2 | consensus |
| c | SURVIVED (REVISION_REQUIRED) [human_judgment_required] | 1 | 2 | 1 | 1 | legitimate_methodological_split |

**Cost:** $6.65 · **Wall:** 44m48s · **Tokens:** 636K in / 150K out · **Repair passes:** 13

**Anomalies:**
- repair pass on 2_ideator
- repair pass on 5_simulator [branch c]
- repair pass on 6_audit [branch c]
- repair pass on 7a_methodologist [branch b]
- repair pass on 7d_meta [branch c]
- repair pass on 7b_accessibility [branch b]
- repair passes (7) on 8_guidebook

### `demo_run`

**Premise:** design a short study to understand how BLV screen-reader users interpret page hierarchy on AI-gen...

| branch | verdict | Cap | Agc | Exit | Leg | disagreement |
| --- | --- | --- | --- | --- | --- | --- |
| a | BLOCKED:legibility.no_failure_signal | 0 | 3 | 0 | 2 | — |
| b | SURVIVED (REVISION_REQUIRED) [human_judgment_required] | 1 | 1 | 0 | 3 | legitimate_methodological_split |
| c | BLOCKED:legibility.no_failure_signal | 2 | 3 | 1 | 3 | — |

**Cost:** $5.93 · **Wall:** 54m50s · **Tokens:** 502K in / 174K out · **Repair passes:** 23

**Anomalies:**
- repair pass on 2_ideator
- repair passes (4) on 4_prototype [branch b]
- repair passes (4) on 4_prototype [branch a]
- repair passes (4) on 4_prototype [branch c]
- repair pass on 5_simulator [branch c]
- repair passes (2) on 6_audit [branch b]
- repair passes (2) on 6_audit [branch a]
- repair pass on 6_audit [branch c]
- repair passes (2) on 7a_methodologist [branch b]
- repair pass on 7c_novelty [branch b]
- repair pass on 8_guidebook

### `import_test_sample`

**Premise:** # Research premise (imported)

This run was warm-started from an existing paper draft via `probe ...

| branch | verdict | Cap | Agc | Exit | Leg | disagreement |
| --- | --- | --- | --- | --- | --- | --- |
| a | UNKNOWN | 0 | 0 | 0 | 0 | — |

**Cost:** $0.07 · **Wall:** 44s · **Tokens:** 5K in / 4K out · **Repair passes:** 1

**Anomalies:**
- repair pass on 0_import
- branch a: missing audit.json (status=unknown)

