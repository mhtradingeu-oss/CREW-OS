// Types for AI Crew Advisory API (advisory-only)
// Location: apps/back-end/src/ai/crew/ai-crew.types.ts

import { z } from 'zod';

export const AdvisoryRequestSchema = z.object({
  scopes: z.array(z.string()).min(1).max(3),
  agentNames: z.array(z.string()).min(1).max(3).optional(),
  question: z.string().min(10).max(2000),
  contextRefs: z.array(z.string()).optional(),
});

export type AdvisoryRequest = z.infer<typeof AdvisoryRequestSchema>;

export interface AdvisoryRecommendation {
  agent: string;
  recommendation: string;
  rationale: string;
  risks: string[];
  assumptions: string[];
}

export interface AdvisoryEvidence {
  agent: string;
  analysis: string;
  contextUsed: string[];
  risks: string[];
  assumptions: string[];
}

export interface AdvisoryAuditLog {
  id: string;
  timestamp: string;
  userId: string;
  scopes: string[];
  agentsUsed: string[];
  questionHash: string;
  questionLength: number;
  confidence: number;
  summary: string;
}

export interface AdvisoryResponse {
  summary: string;
  recommendations: AdvisoryRecommendation[];
  agentsUsed: string[];
  evidence: AdvisoryEvidence[];
  confidence: number;
}
