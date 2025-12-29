import { logger } from "../../logger.js";
import type { PipelineContextMap, PipelineLogEntry, PipelineStage } from "./pipeline-types.js";

export function mergeContexts(contexts: Record<string, unknown>): PipelineContextMap {
  return Object.fromEntries(
    Object.entries(contexts).filter(([, value]) => value !== undefined && value !== null),
  );
}

export function safeTruncate(value: unknown, max = 8000): string {
  const str = typeof value === "string" ? value : JSON.stringify(value ?? "", null, 2);
  if (str.length <= max) return str;
  return `${str.slice(0, max)}... [truncated ${str.length - max} chars]`;
}

export function logStage(stage: PipelineStage, meta?: Record<string, unknown>): PipelineLogEntry {
  const entry: PipelineLogEntry = { stage, at: new Date().toISOString(), meta };
  logger.debug?.("ai.pipeline.stage", entry);
  return entry;
}

export function buildPromptFromContexts(
  agentName: string,
  task: Record<string, unknown>,
  contexts: PipelineContextMap,
  expectedShape?: Record<string, unknown>,
): string {
  const payload = {
    agent: agentName,
    task,
    contexts,
    expected: expectedShape,
  };
  return safeTruncate(payload, 12000);
}
