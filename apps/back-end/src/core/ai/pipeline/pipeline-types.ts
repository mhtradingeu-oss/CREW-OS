import type { AIMessage } from "../../ai-service/ai-client.js";
import type { AIAgentDefinition } from "../../../ai/schema/ai-agents-manifest.js";
import type { AutonomyDecision } from "../autonomy/autonomy-guard.js";

export type PipelineStage =
  | "contextLoad"
  | "safetyValidate"
  | "callLLM"
  | "parseResponse"
  | "persistAIOutput"
  | "autoApply"
  | "notifyHuman";

export type PipelineLogEntry = {
  stage: PipelineStage;
  at: string;
  detail?: string;
  meta?: Record<string, unknown>;
};

export type PipelineContextMap = Record<string, unknown>;

export type PipelineActor = {
  userId?: string;
  role?: string | null;
  permissions?: string[];
  brandId?: string | null;
  tenantId?: string | null;
};

export type RunAIPipelineParams = {
  agentId: string;
  task: {
    prompt?: string;
    message?: string;
    input?: Record<string, unknown>;
  };
  actor?: PipelineActor;
  brandId?: string;
  tenantId?: string;
  includeEmbeddings?: boolean;
  dryRun?: boolean;
  runId?: string;
  correlationId?: string;
  explain?: Record<string, unknown>;
};

export type PipelineResult<T = unknown> = {
  success: boolean;
  agent: AIAgentDefinition | null;
  output?: T;
  cached?: boolean;
  contexts?: PipelineContextMap;
  logs: PipelineLogEntry[];
  messages?: AIMessage[];
  promptPreview?: string;
  error?: string;
  status?: string;
  errors?: string[];
  runId?: string;
  autonomyDecision?: AutonomyDecision;
  explain?: Record<string, unknown>;
};
