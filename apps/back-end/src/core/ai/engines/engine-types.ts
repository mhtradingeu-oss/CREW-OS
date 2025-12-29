import type { PipelineActor, PipelineResult } from "../pipeline/pipeline-types.js";

export type EngineRunOptions = {
  actor?: PipelineActor;
  brandId?: string;
  tenantId?: string;
  task?: string;
  includeEmbeddings?: boolean;
  dryRun?: boolean;
  agentIdOverride?: string;
};

export type EngineRunResponse<TOutput> = {
  output: TOutput;
  pipeline: PipelineResult;
  contexts?: Record<string, unknown>;
  insightId?: string;
};
