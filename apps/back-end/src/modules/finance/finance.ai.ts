import type { Prisma } from "@prisma/client";
import { createFinanceAIInsight, createFinanceAILearningJournal } from "../../core/db/repositories/finance-ai.repository.js";
import { aiOrchestrator } from "../../core/ai/orchestrator.js";
import type { FinanceRunwaySummary } from "../ai-brain/ai-brain.types.js";

const insightSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AIInsightSelect;

export interface FinanceRunwayInsightDTO extends FinanceRunwaySummary {
  insightId: string;
}

export async function summarizeFinanceRunway(brandId?: string): Promise<FinanceRunwayInsightDTO> {
  const response = await aiOrchestrator.summaryFinanceRunway({
    brandId,
  });

  const summary = response?.result?.summary ?? "Finance runway insights unavailable";
  const details = response?.result?.details ?? "AI could not generate runway details.";
  const runwayMonths = response?.result?.runwayMonths ?? null;
  const cashBalance = response?.result?.cashBalance ?? null;
  const burnRate = response?.result?.burnRate ?? null;

  const insight = await createFinanceAIInsight({
    brandId: brandId ?? null,
    os: "finance",
    entityType: "finance-runway",
    entityId: brandId ?? "global-runway",
    summary,
    details: JSON.stringify({
      details,
      runwayMonths,
      cashBalance,
      burnRate,
    }),
  });

  await createFinanceAILearningJournal({
    brandId: brandId ?? null,
    source: "finance-runway",
    eventType: "summary",
    inputSnapshotJson: JSON.stringify({ brandId }),
    outputSnapshotJson: JSON.stringify({ summary, details, runwayMonths, cashBalance, burnRate }),
  });

  return {
    insightId: insight.id,
    summary,
    details,
    runwayMonths,
    cashBalance,
    burnRate,
  };
}
