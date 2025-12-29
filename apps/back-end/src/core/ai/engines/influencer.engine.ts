import { badRequest } from "../../http/errors.js";
import { runAIPipeline } from "../pipeline/pipeline-runner.js";
import type { PipelineResult } from "../pipeline/pipeline-types.js";
import { getDbGateway } from "../../../bootstrap/db.js";
import { buildBrandContext, buildMarketingContext, type ContextBuilderOptions } from "../../../ai/context/context-builders.js";
import type { EngineRunOptions } from "./engine-types.js";

const AGENT_ID = "AI_INFLUENCER_MANAGER";

export type InfluencerCandidate = {
  influencerId: string;
  handle: string;
  platform: string;
  followers?: number | null;
  engagementRate?: number | null;
  fakeFollowerRisk?: number | null;
  marketFitScore?: number | null;
  authenticityScore?: number | null;
  category?: string | null;
  country?: string | null;
};

export type InfluencerEngineInput = {
  brandId: string;
  goal?: string;
  audience?: string;
  category?: string;
  budgetHint?: number;
  candidates: InfluencerCandidate[];
};

export type InfluencerEngineOutput = {
  rankings: {
    influencerId: string;
    score: number;
    reason: string;
    predictedSalesImpact?: number;
  }[];
  negotiation: {
    influencerId: string;
    suggestions: string[];
    tone: string;
  }[];
  outreachDrafts: {
    influencerId: string;
    subject: string;
    body: string;
  }[];
  pipeline: PipelineResult;
  contexts: Record<string, unknown>;
};

function buildContextOptions(input: InfluencerEngineInput, options?: EngineRunOptions): ContextBuilderOptions {
  return {
    brandId: options?.brandId ?? input.brandId,
    permissions: options?.actor?.permissions,
    role: options?.actor?.role ?? undefined,
    includeEmbeddings: options?.includeEmbeddings,
  };
}

function normalizeOutput(raw: unknown, fallback: InfluencerEngineOutput): InfluencerEngineOutput {
  if (!raw || typeof raw !== "object") return fallback;
  const data = raw as Record<string, unknown>;

  const rankings: InfluencerEngineOutput["rankings"] = [];
  if (Array.isArray(data.rankings)) {
    for (const row of data.rankings) {
      if (!row || typeof row !== "object") continue;
      const item = row as Record<string, unknown>;
      const influencerId = typeof item.influencerId === "string" ? item.influencerId : null;
      const score = typeof item.score === "number" ? item.score : null;
      const reason = typeof item.reason === "string" ? item.reason : fallback.rankings[0]?.reason ?? "";
      const predictedSalesImpact =
        typeof item.predictedSalesImpact === "number" ? item.predictedSalesImpact : undefined;
      if (influencerId && score !== null) {
        rankings.push({ influencerId, score, reason, predictedSalesImpact });
      }
    }
  }

  const negotiation: InfluencerEngineOutput["negotiation"] = [];
  if (Array.isArray(data.negotiation)) {
    for (const row of data.negotiation) {
      if (!row || typeof row !== "object") continue;
      const item = row as Record<string, unknown>;
      const influencerId = typeof item.influencerId === "string" ? item.influencerId : null;
      const suggestions = Array.isArray(item.suggestions)
        ? item.suggestions.filter((s): s is string => typeof s === "string")
        : [];
      const tone = typeof item.tone === "string" ? item.tone : "friendly";
      if (influencerId) {
        negotiation.push({ influencerId, suggestions, tone });
      }
    }
  }

  const outreachDrafts: InfluencerEngineOutput["outreachDrafts"] = [];
  if (Array.isArray(data.outreachDrafts)) {
    for (const row of data.outreachDrafts) {
      if (!row || typeof row !== "object") continue;
      const item = row as Record<string, unknown>;
      const influencerId = typeof item.influencerId === "string" ? item.influencerId : null;
      const subject = typeof item.subject === "string" ? item.subject : "Partnership idea";
      const body = typeof item.body === "string" ? item.body : "";
      if (influencerId) {
        outreachDrafts.push({ influencerId, subject, body });
      }
    }
  }

  return {
    rankings: rankings.length ? rankings : fallback.rankings,
    negotiation: negotiation.length ? negotiation : fallback.negotiation,
    outreachDrafts: outreachDrafts.length ? outreachDrafts : fallback.outreachDrafts,
    pipeline: fallback.pipeline,
    contexts: fallback.contexts,
  };
}

function fallbackOutput(input: InfluencerEngineInput, pipeline: PipelineResult): InfluencerEngineOutput {
  const rankings = input.candidates
    .map((candidate) => {
      const engagement = candidate.engagementRate ?? 0;
      const marketFit = candidate.marketFitScore ?? 0;
      const authenticity = candidate.authenticityScore ?? 0.5;
      const fakeRisk = candidate.fakeFollowerRisk ?? 0.1;
      const score = Number(
        (0.35 * marketFit + 0.3 * engagement + 0.2 * authenticity + 0.15 * (1 - fakeRisk)) * 100,
      );
      return {
        influencerId: candidate.influencerId,
        score: Math.round(Math.max(0, Math.min(100, score))),
        reason: "Fallback score based on engagement, market fit, and authenticity",
        predictedSalesImpact: Math.max(0, Math.round((candidate.followers ?? 0) * 0.02)),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return {
    rankings,
    negotiation: rankings.map((r) => ({
      influencerId: r.influencerId,
      suggestions: ["Lead with value", "Offer tiered incentives", "Share clear deliverables"],
      tone: "warm",
    })),
    outreachDrafts: rankings.map((r) => ({
      influencerId: r.influencerId,
      subject: "Partnership opportunity",
      body: "We love your audience and want to co-create an authentic story together.",
    })),
    pipeline,
    contexts: {},
  };
}

export async function runInfluencerEngine(
  input: InfluencerEngineInput,
  options?: EngineRunOptions,
): Promise<InfluencerEngineOutput> {
  if (!input.brandId) {
    throw badRequest("brandId is required for influencer engine");
  }
  if (!input.candidates?.length) {
    throw badRequest("At least one influencer candidate is required");
  }

  const contextOptions = buildContextOptions(input, options);
  const dbGateway = getDbGateway();
  const brandCtx = await buildBrandContext(dbGateway, contextOptions.brandId ?? input.brandId, contextOptions);
  const marketingCtx = await buildMarketingContext(
    dbGateway,
    contextOptions.brandId ?? input.brandId,
    contextOptions,
  );

  const pipeline = await runAIPipeline({
    agentId: options?.agentIdOverride ?? AGENT_ID,
    task: {
      input: { ...input },
      message: options?.task ?? "INFLUENCER_MATCHMAKING",
    },
    actor: options?.actor,
    brandId: contextOptions.brandId ?? input.brandId,
    tenantId: options?.tenantId,
    includeEmbeddings: options?.includeEmbeddings,
    dryRun: options?.dryRun,
  });

  const fallback = fallbackOutput(input, pipeline);
  const normalized = normalizeOutput(pipeline.output, fallback);

  return {
    ...normalized,
    pipeline,
    contexts: pipeline.contexts ?? {
      brand: brandCtx,
      marketing: marketingCtx,
      influencers: input.candidates,
    },
  };
}
