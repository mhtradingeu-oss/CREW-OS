import type { Prisma } from "@prisma/client";
import { prisma, type PrismaArgs } from "../../prisma.js";

type MonitoringEventFindManyArgs = PrismaArgs<typeof prisma.aIMonitoringEvent.findMany>;
type ExecutionLogFindManyArgs = PrismaArgs<typeof prisma.aIExecutionLog.findMany>;
type ExecutionLogCreateArgs = PrismaArgs<typeof prisma.aIExecutionLog.create>;
type MonitoringEventCreateArgs = PrismaArgs<typeof prisma.aIMonitoringEvent.create>;
type SafetyEventCreateArgs = PrismaArgs<typeof prisma.aISafetyEvent.create>;
type ExecutionLogAggregateArgs = PrismaArgs<typeof prisma.aIExecutionLog.aggregate>;
type AgentBudgetFindManyArgs = PrismaArgs<typeof prisma.aIAgentBudget.findMany>;
type MonitoringEventCategory = Prisma.AIMonitoringEventWhereInput["category"];

type MetricValue = MonitoringEventCreateArgs["data"]["metric"];
export type InputJsonValue = MetricValue;

async function findMonitoringEventsByCategory(category: MonitoringEventCategory, limit: number) {
  return prisma.aIMonitoringEvent.findMany({
    where: { category },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

async function findExecutionLogs(limit: number) {
  return prisma.aIExecutionLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

async function findExecutionLogsSince(startOfMonth: Date) {
  return prisma.aIExecutionLog.findMany({
    where: { createdAt: { gte: startOfMonth } },
    select: { agentName: true, totalTokens: true, costUsd: true, createdAt: true },
  });
}

async function findRecentExecutionLogs(limit: number) {
  return prisma.aIExecutionLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

async function findSafetyEvents(limit: number) {
  return prisma.aISafetyEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export type SystemAlertPayload = {
  status: string;
  metric?: MetricValue;
  agentName?: string;
  engine?: string;
  namespace?: string;
  riskLevel?: MonitoringEventCreateArgs["data"]["riskLevel"];
};

async function createSystemAlert(payload: SystemAlertPayload) {
  return prisma.aIMonitoringEvent.create({
    data: {
      category: "SYSTEM_ALERT",
      status: payload.status,
      metric: payload.metric,
      agentName: payload.agentName,
      engine: payload.engine,
      namespace: payload.namespace,
      riskLevel: payload.riskLevel,
    },
  });
}

async function createExecutionLog(data: ExecutionLogCreateArgs["data"]) {
  return prisma.aIExecutionLog.create({ data });
}

async function createMonitoringEvent(data: MonitoringEventCreateArgs["data"]) {
  return prisma.aIMonitoringEvent.create({ data });
}

async function createSafetyEvent(data: SafetyEventCreateArgs["data"]) {
  return prisma.aISafetyEvent.create({ data });
}

async function findActiveAgentBudgets(params: {
  agentName?: string | null;
  brandId?: string | null;
  tenantId?: string | null;
}) {
  return prisma.aIAgentBudget.findMany({
    where: {
      agentName: params.agentName ?? undefined,
      brandId: params.brandId ?? undefined,
      tenantId: params.tenantId ?? undefined,
      active: true,
    },
    take: 1,
  });
}

async function aggregateExecutionCosts(where: ExecutionLogAggregateArgs["where"]) {
  return prisma.aIExecutionLog.aggregate({
    _sum: { costUsd: true, totalTokens: true },
    where,
  });
}

export {
  findMonitoringEventsByCategory,
  findExecutionLogs,
  findExecutionLogsSince,
  findRecentExecutionLogs,
  findSafetyEvents,
  createSystemAlert,
  createExecutionLog,
  createMonitoringEvent,
  createSafetyEvent,
  findActiveAgentBudgets,
  aggregateExecutionCosts,
};
