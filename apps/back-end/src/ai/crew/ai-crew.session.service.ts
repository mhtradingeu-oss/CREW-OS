// ai-crew.session.service.ts
// Implements AICrewSessionService for advisory session composition (v2)

import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import {
  AdvisorySessionInput,
  AdvisorySessionOutput,
  AdvisorySessionMemoryStore,
  AdvisorySessionMemoryRecord,
  ADVISORY_SESSION_TTL_MS,
  AdvisorySessionPerQuestionResult,
  AdvisorySessionConflict,
  AdvisorySessionExplainability,
} from './ai-crew.session.types.js';
import { AICrewService } from './ai-crew.service.js';
import type { DbGateway } from '../../core/db/db-gateway.js';
import type { AdvisoryRecommendation } from './ai-crew.types.js';

// In-memory session store (safe metadata only)
const sessionStore: AdvisorySessionMemoryStore = new Map();

function hashQuestion(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function now(): number {
  return Date.now();
}

function pruneExpiredSessions() {
  const cutoff = now() - ADVISORY_SESSION_TTL_MS;
  for (const [sid, rec] of sessionStore.entries()) {
    if (rec.createdAt < cutoff) sessionStore.delete(sid);
  }
}

export class AICrewSessionService {
  static getSession(sessionId: string): AdvisorySessionMemoryRecord | undefined {
    pruneExpiredSessions();
    return sessionStore.get(sessionId);
  }

  static async runAdvisorySession(input: AdvisorySessionInput, dbGateway?: DbGateway): Promise<AdvisorySessionOutput> {
    pruneExpiredSessions();
    if (!input.questions || input.questions.length < 1 || input.questions.length > 10) {
      throw new Error('Must provide 1-10 questions');
    }
    const sessionId = input.sessionId || uuidv4();
    const perQuestion: AdvisorySessionPerQuestionResult[] = [];
    const questionHashes: Array<{ hash: string; length: number }> = [];
    const agentsUsedSet = new Set<string>();
    const contextsUsedSet = new Set<string>();
    const assumptionsSet = new Set<string>();
    const risksSet = new Set<string>();
    let totalConfidence = 0;
    // Sequential execution
    for (let i = 0; i < input.questions.length; ++i) {
      const q = input.questions[i];
      if (!q) throw new Error('Invalid question');
      if (!q.scopes || q.scopes.length < 1 || q.scopes.length > 3) throw new Error('Each question must have 1-3 scopes');
      if (q.agentNames && q.agentNames.length > 3) throw new Error('Max 3 agents per question');
      if (!q.question || q.question.length < 10 || q.question.length > 2000) throw new Error('Question length 10-2000 chars');
      const result = await (AICrewService as any).runAdvisory({
        scopes: q.scopes,
        agentNames: q.agentNames,
        question: q.question,
        contextRefs: q.contextRefs,
        requestedBy: input.requestedBy,
      }, dbGateway);
      const sessionResult = {
        ...result,
        recommendations: (result.recommendations ?? []).map((rec: AdvisoryRecommendation) => rec.recommendation),
      };
      perQuestion.push({ index: i, question: q.question, result: sessionResult });
      questionHashes.push({ hash: hashQuestion(q.question), length: q.question.length });
      (result.agents ?? []).forEach((a: string) => agentsUsedSet.add(a));
      (result.contexts ?? []).forEach((c: string) => contextsUsedSet.add(c));
      (result.assumptions ?? []).forEach((a: string) => assumptionsSet.add(a));
      (result.risks ?? []).forEach((r: string) => risksSet.add(r));
      totalConfidence += result.confidence;
    }
    // Cross-insights merge
    const allRecs: string[] = perQuestion.flatMap((q) => q.result.recommendations ?? []);
    const norm = (s: unknown) => String(s ?? '').toLowerCase().replace(/[.,!?;:]/g, '').trim().slice(0, 120);
    const recMap = new Map<string, string>();
    for (const rec of allRecs) {
      const k = norm(rec);
      if (!recMap.has(k)) recMap.set(k, rec);
    }
    const crossInsights = Array.from(recMap.values()).slice(0, 10);
    // Conflict detection
    const conflicts: AdvisorySessionConflict[] = [];
    // Heuristic: look for opposite verbs for same noun phrase
    const opposites = [
      ['increase', 'decrease'],
      ['do ', 'avoid '],
      ['enable', 'disable'],
      ['allow', 'prevent'],
      ['raise', 'lower'],
    ];
    for (const [a, b] of opposites) {
      const topics = new Map<string, { agents: Set<string>; notes: string[] }>();
      perQuestion.forEach(q => {
        (q.result.recommendations ?? []).forEach((rec: string) => {
          const recNorm = norm(rec ?? '');
          for (const [verb1, verb2] of [[a, b], [b, a]]) {
            if ((recNorm ?? '').startsWith(verb1 ?? '')) {
              const topic = ((recNorm ?? '').replace(verb1 ?? '', '') ?? '').trim();
              if (!topics.has(topic)) topics.set(topic, { agents: new Set(), notes: [] });
              const agentLabel =
                (q.result.agents && q.result.agents[0])
                ?? (q.result.agentsUsed && q.result.agentsUsed[0])
                ?? 'unknown';
              topics.get(topic)!.agents.add(agentLabel);
              topics.get(topic)!.notes.push(rec);
            }
          }
        });
      });
      for (const [topic, { agents, notes }] of topics.entries()) {
        if (agents.size > 1) {
          conflicts.push({ topic, agents: Array.from(agents), notes: notes.join(' | ') });
        }
      }
    }
    // Confidence scoring
    let confidence = totalConfidence / perQuestion.length;
    confidence = Math.max(0.1, Math.min(0.9, confidence - 0.05 * conflicts.length));
    // Boost if >=2 questions share a rec
    if (crossInsights.length < allRecs.length) confidence = Math.min(0.9, confidence + 0.05);
    // Executive summary
    const sessionSummary =
      `Advisory session processed ${perQuestion.length} question(s).\n` +
      `Key insights: ${crossInsights.slice(0, 3).join('; ')}.\n` +
      `Conflicts detected: ${conflicts.length}.\n` +
      `Final confidence: ${(confidence * 100).toFixed(1)}%.`;
    // Explainability
    const explainability: AdvisorySessionExplainability = {
      compositionRationale: 'Sequential, deterministic merge of advisory results with conflict and consensus analysis.',
      questionsProcessed: perQuestion.length,
      agentsUsedUnion: Array.from(agentsUsedSet),
      contextsUsedUnion: Array.from(contextsUsedSet),
      assumptionsUnion: Array.from(assumptionsSet),
      risksUnion: Array.from(risksSet),
    };
    // Store session metadata (no raw text)
    sessionStore.set(sessionId, {
      sessionId,
      createdAt: now(),
      questionHashes,
      agentsUsed: Array.from(agentsUsedSet),
      confidence,
      summary: sessionSummary,
    });
    return {
      sessionId,
      sessionSummary,
      perQuestion,
      crossInsights,
      conflicts,
      confidence,
      explainability,
    };
  }
}
