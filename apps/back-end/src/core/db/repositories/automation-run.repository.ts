import { Prisma } from "@prisma/client";
import type {
  AutomationActionRunStatus as PrismaAutomationActionRunStatus,
  AutomationRunStatus as PrismaAutomationRunStatus,
} from "@prisma/client";
import { prisma } from "../../prisma.js";


export interface AutomationRunCreationArgs {
  ruleId: string;
  ruleVersionId: string;
  eventName: string;
  eventId?: string | null;
}

export async function createAutomationRun(args: AutomationRunCreationArgs) {
  // ruleVersionId is required for all AutomationRun creation in Phase 6
  if (!args.ruleVersionId) {
    throw new Error("ruleVersionId is required for AutomationRun creation");
  }
  return prisma.automationRun.create({
    data: {
      ruleId: args.ruleId,
      ruleVersionId: args.ruleVersionId,
      eventName: args.eventName,
      eventId: args.eventId ?? null,
      status: "PENDING",
    },
  });
}

export async function markRunRunning(runId: string) {
  await prisma.automationRun.update({
    where: { id: runId },
    data: { status: "RUNNING", startedAt: new Date() },
  });
}

export async function finalizeAutomationRun(params: {
  runId: string;
  status: PrismaAutomationRunStatus;
  summary: unknown;
  error?: unknown;
}) {
  await prisma.automationRun.update({
    where: { id: params.runId },
    data: {
      status: params.status,
      finishedAt: new Date(),
      summaryJson: jsonOrNull(params.summary),
      errorJson: jsonOrNull(params.error),
    },
  });
}

export async function createActionRun(params: {
  runId: string;
  actionIndex: number;
  actionType: string;
  dedupKey: string;
  actionConfig: unknown;
}) {
  return prisma.automationActionRun.create({
    data: {
      runId: params.runId,
      actionIndex: params.actionIndex,
      actionType: params.actionType,
      dedupKey: params.dedupKey,
      actionConfigJson: jsonOrNull(params.actionConfig),
    },
  });
}

export async function updateActionRun(
  actionRunId: string,
  data: {
    status?: PrismaAutomationActionRunStatus;
    actionIndex?: number;
    actionType?: string;
    dedupKey?: string;
    runId?: string;
    attemptCount?: number;
    nextAttemptAt?: Date | null;
    result?: unknown;
    error?: unknown;
    startedAt?: Date | null;
    finishedAt?: Date | null;
    actionConfig?: unknown;
  },
) {
  return prisma.automationActionRun.update({
    where: { id: actionRunId },
    data: {
      ...(typeof data.actionIndex === "number" ? { actionIndex: data.actionIndex } : {}),
      ...(typeof data.actionType === "string" ? { actionType: data.actionType } : {}),
      ...(typeof data.dedupKey === "string" ? { dedupKey: data.dedupKey } : {}),
      ...(typeof data.runId === "string" ? { runId: data.runId } : {}),
      ...(data.status ? { status: data.status } : {}),
      ...(typeof data.attemptCount === "number" ? { attemptCount: data.attemptCount } : {}),
      nextAttemptAt: data.nextAttemptAt ?? null,
      resultJson: jsonOrNull(data.result),
      errorJson: jsonOrNull(data.error),
      startedAt: data.startedAt ?? null,
      finishedAt: data.finishedAt ?? null,
      ...(data.actionConfig ? { actionConfigJson: data.actionConfig } : {}),
    },
  });
}

function jsonOrNull(value: unknown): Prisma.InputJsonValue {
  if (value === undefined) {
    return Prisma.JsonNull as unknown as Prisma.InputJsonValue;
  }
  return value as Prisma.InputJsonValue;
}

export async function findActionRunByDedupKey(dedupKey: string) {
  return prisma.automationActionRun.findUnique({ where: { dedupKey } });
}

export async function updateRuleLastRun(ruleId: string, status: PrismaAutomationRunStatus) {
  await prisma.automationRule.update({
    where: { id: ruleId },
    data: { lastRunAt: new Date(), lastRunStatus: status },
  });
}

export type AutomationActionRunStatus = PrismaAutomationActionRunStatus;
export type AutomationRunStatus = PrismaAutomationRunStatus;
