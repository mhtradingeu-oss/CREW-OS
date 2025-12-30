// Unified AI input base type for all orchestrator inputs
export interface AiBaseInput {
  brandId?: string;
  agentName?: string;
  locale?: string;
  traceId?: string;
}

// Specialized context required whenever orchestrator inputs need brand-level targeting
export interface AiExecutionContext extends AiBaseInput {
  brandId: string;
  agentName?: string;
}
