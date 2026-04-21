export interface RunOptions {
  runId: string;
  premise: string;
  skipStages: string[];
  branchCount: number;
}

export type StageId =
  | '1_premise'
  | '2_ideator'
  | '3_literature'
  | '4_prototype'
  | '5_simulator'
  | '6_audit'
  | '7a_methodologist'
  | '7b_accessibility'
  | '7c_novelty'
  | '7d_meta'
  | '8_guidebook';

export type PipelineStatus =
  | 'completed'
  | 'all_branches_blocked'
  | 'failed';

export interface PipelineResult {
  runId: string;
  status: PipelineStatus;
  failedStage?: StageId;
  survivingBranches: string[];
  blockedBranches: string[];
}

export interface StageCost {
  stage: StageId;
  branch_id?: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  usd: number;
  duration_ms: number;
}

export interface CostLog {
  run_id: string;
  stages: StageCost[];
  totals: { input_tokens: number; output_tokens: number; usd: number };
}
