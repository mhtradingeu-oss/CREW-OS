// AI Crew Advisory Service for MH-OS SUPERAPP
// Phase: Advisory Mode Only
// Location: apps/back-end/src/ai/crew/ai-crew.service.ts


import { AI_AGENTS_MANIFEST, AIAgentDefinition } from '../schema/ai-agents-manifest.js';
import * as ContextBuilders from '../context/context-builders.js';
import { logger } from '../../core/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import type {
  AdvisoryRecommendation,
  AdvisoryEvidence,
  AdvisoryResponse,
} from './ai-crew.types.js';
import type { DbGateway } from '../../core/db/db-gateway.js';

export type RunAdvisoryInput = {
  scopes: string[];
  agentNames?: string[];
  question: string;
  contextRefs?: string[];
  requestedBy: {
    userId: string;
    role: string;
  };
};



export class AICrewService {
  constructor(private readonly dbGateway?: DbGateway) {}

  static async runAdvisory(input: RunAdvisoryInput, dbGateway?: DbGateway): Promise<AdvisoryResponse> {
    const service = new AICrewService(dbGateway);
    return service.runAdvisory(input);
  }

  /**
   * Run an advisory-only multi-agent analysis and recommendation.
   */
  async runAdvisory(input: RunAdvisoryInput): Promise<AdvisoryResponse> {
    // 1. Strict action gating: skip agents with forbidden actions
    // 2. Deterministic selection: sort by priority ASC, then name ASC, enforce max 3
    // 3. Context guard: wrap context builders, never throw
    // 4. Audit logging: no PII, hash question, log only safe fields

    // --- Agent selection ---
    let selectedAgents: AIAgentDefinition[] = [];
    if (input.agentNames && input.agentNames.length > 0) {
      // Validate existence, use only those names
      selectedAgents = AI_AGENTS_MANIFEST.filter((agent: AIAgentDefinition) => input.agentNames!.includes(agent.name));
    } else {
      // Select by scopes
      const agentsByScope: AIAgentDefinition[] = [];
      for (const scope of input.scopes) {
        const matches = AI_AGENTS_MANIFEST.filter((agent: AIAgentDefinition) => agent.scope === scope);
        for (const agent of matches) {
          if (!agentsByScope.find(a => a.name === agent.name)) {
            agentsByScope.push(agent);
          }
        }
      }
      selectedAgents = agentsByScope;
    }
    // Deterministic sort: priority ASC (if exists), then name ASC
    selectedAgents = selectedAgents
      .slice() // copy
      .sort((a, b) => {
        const pa = typeof a.priority === 'number' ? a.priority : 9999;
        const pb = typeof b.priority === 'number' ? b.priority : 9999;
        if (pa !== pb) return pa - pb;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 3); // enforce max 3

    if (selectedAgents.length === 0) {
      return {
        summary: 'No suitable advisory agents found for the requested scope(s) or agentNames.',
        recommendations: [],
        agentsUsed: [],
        evidence: [],
        confidence: 0.0,
      };
    }

    // --- Advisory agent execution ---
    const agentResults: Array<{
      agent: string;
      analysis: string;
      recommendations: string[];
      risks: string[];
      assumptions: string[];
      contextUsed: string[];
      allowedActions: string[];
      forbidden: boolean;
    }> = [];

    for (const agent of selectedAgents) {
      const allowed = (agent.allowedActions || []);
      // If any forbidden action, skip/flag agent
      const forbiddenActions = ["execute", "send", "run"];
      const hasForbidden = allowed.some((a: string) => forbiddenActions.includes(a.toLowerCase()));
      const safeActions = allowed.filter((a: string) => ["analyze","summarize","recommend","draft"].includes(a.toLowerCase()));
      if (hasForbidden || safeActions.length === 0) {
        agentResults.push({
          agent: agent.name,
          analysis: 'Agent not permitted for advisory-only actions.',
          recommendations: [],
          risks: ['No advisory actions allowed for this agent.'],
          assumptions: [],
          contextUsed: [],
          allowedActions: allowed,
          forbidden: true,
        });
        continue;
      }

      // --- Context guard ---
      const contextRefs = agent.inputContexts || [];
      const contextUsed: string[] = [];
      const builtContexts: Record<string, any> = {};
      for (const ctx of contextRefs) {
        const builderFn = (ContextBuilders as any)[ctx.builder];
        if (typeof builderFn === 'function') {
          if (!this.dbGateway) {
            contextUsed.push(ctx.name + ':unavailable');
            continue;
          }
          try {
            // For demo: use dummy IDs, in real use, map input.contextRefs or input data
            const arg = 'demo-id';
            const result = await builderFn(this.dbGateway, arg, { role: input.requestedBy.role });
            if (result) {
              builtContexts[ctx.name] = result;
              contextUsed.push(ctx.name);
            }
          } catch (err) {
            contextUsed.push(ctx.name + ':missing');
          }
        } else {
          contextUsed.push(ctx.name + ':unavailable');
        }
      }

      // --- Advisory-only stub ---
      agentResults.push({
        agent: agent.name,
        analysis: `Advisory analysis for agent ${agent.name} on question: "[REDACTED]"`,
        recommendations: [
          `Sample recommendation from ${agent.name} (advisory-only)`
        ],
        risks: [
          `Sample risk from ${agent.name}`
        ],
        assumptions: [
          `Assumption for ${agent.name}`
        ],
        contextUsed,
        allowedActions: safeActions,
        forbidden: false,
      });
    }

    // --- Merge recommendations ---
    const allRecs = agentResults.flatMap((r) => r.recommendations.map((rec) => ({ agent: r.agent, rec })));
    const recMap: Record<string, { agents: string[]; text: string }> = {};
    for (const { agent, rec } of allRecs) {
      const key = rec.toLowerCase();
      if (!recMap[key]) recMap[key] = { agents: [], text: rec };
      recMap[key].agents.push(agent);
    }
    const recommendations: AdvisoryRecommendation[] = Object.values(recMap).map((r) => ({
      agent: r.agents.join(','),
      recommendation: r.text,
      rationale: r.agents.length > 1 ? 'Consensus' : 'Divergence',
      risks: agentResults.filter((a) => r.agents.includes(a.agent)).flatMap((a) => a.risks),
      assumptions: agentResults.filter((a) => r.agents.includes(a.agent)).flatMap((a) => a.assumptions),
    }));

    // --- Evidence ---
    const evidence: AdvisoryEvidence[] = agentResults.map((r) => ({
      agent: r.agent,
      analysis: r.analysis,
      contextUsed: r.contextUsed,
      risks: r.risks,
      assumptions: r.assumptions,
    }));

    // --- Confidence ---
    let confidence = 0.7;
    if (recommendations.every(r => r.rationale === 'Consensus')) confidence = 1.0;
    else if (recommendations.every(r => r.rationale === 'Divergence')) confidence = 0.5;

    // --- Summary ---
    const summary = recommendations.length
      ? `Advisory result: ${recommendations.filter(r => r.rationale === 'Consensus').length} consensus, ${recommendations.filter(r => r.rationale === 'Divergence').length} divergent.`
      : 'No actionable recommendations.';

    // --- Explainability ---
    const explainability: string[] = [];
    explainability.push(`Agents used: ${selectedAgents.map(a => a.name).join(', ')}`);
    explainability.push(`Selection rationale: ${input.agentNames && input.agentNames.length > 0 ? 'Explicit agentNames provided' : 'Selected by scope'}`);
    explainability.push(`Contexts used: ${[...new Set(evidence.flatMap(e => e.contextUsed))].join(', ')}`);
    explainability.push(`Assumptions: ${[...new Set(evidence.flatMap(e => e.assumptions))].join('; ')}`);
    explainability.push(`Risks: ${[...new Set(evidence.flatMap(e => e.risks))].join('; ')}`);

    // --- Audit log (no PII, hash question) ---
    const questionHash = createHash('sha256').update(input.question).digest('hex');
    const questionLength = input.question.length;
    logger.info('[advisory.audit]', {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      userId: input.requestedBy.userId,
      scopes: input.scopes,
      agentsUsed: selectedAgents.map(a => a.name),
      questionHash,
      questionLength,
      confidence,
      summary,
    });

    // --- Final response ---
    return {
      summary: summary + ' | ' + explainability.join(' | '),
      recommendations,
      agentsUsed: selectedAgents.map(a => a.name),
      evidence,
      confidence,
    };
  }

  // Helper: get agent by name
  getAgentByName(name: string): AIAgentDefinition | undefined {
    return AI_AGENTS_MANIFEST.find((agent: AIAgentDefinition) => agent.name === name);
  }
}
