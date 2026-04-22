# Runs summary

Generated 2026-04-22T04:25:11.794Z via `probe stats --all`.

| run_id | verdicts (a / b / c) | cost | wall | repairs | lint |
| --- | --- | --- | --- | --- | --- |
| `benchmark_code_review` | a=BLOCKED:legibility.no_failure_signal<br>b=BLOCKED:legibility.no_failure_signal<br>c=FAILED:7_review | $2.43 | 19m26s | 2 | no guidebook |
| `benchmark_creativity_support` | a=SURVIVED (REVISION_REQUIRED)<br>b=SURVIVED (REVISION_REQUIRED)<br>c=SURVIVED (REVISION_REQUIRED) [human_judgment_required] | $6.65 | 44m48s | 13 | prov=✓ voice=✓ |
| `demo_run` | a=BLOCKED:legibility.no_failure_signal<br>b=SURVIVED (REVISION_REQUIRED) [human_judgment_required]<br>c=BLOCKED:legibility.no_failure_signal | $5.93 | 54m50s | 23 | prov=✓ voice=✓ |

## Per-run detail

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

