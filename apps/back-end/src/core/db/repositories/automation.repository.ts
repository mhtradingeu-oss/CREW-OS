// Atomic update + log method for rule version (example, adjust as needed)
import type { Prisma, PrismaPromise } from "@prisma/client";
import { prisma } from "../../prisma.js";

export async function updateRuleVersionWithLog(
  ruleVersionId: string,
  data: any,
  logData: any
) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.automationRuleVersion.update({
      where: { id: ruleVersionId },
      data,
    });
    await tx.automationExecutionLog.create({ data: logData });
    return updated;
  });
}

const automationRunWithActionRunsSelect: Prisma.AutomationRunSelect = {
  id: true,
  status: true,
  startedAt: true,
  finishedAt: true,
  ruleVersionId: true,
  actionRuns: {
    select: {
      id: true,
      status: true,
      startedAt: true,
      finishedAt: true,
      actionType: true,
      actionIndex: true,
      errorJson: true,
      resultJson: true,
    },
  },
};

type AutomationRunFilter = {
  brandId?: string;
  ruleVersionId?: string;
  from?: Date;
  to?: Date;
};

function buildAutomationRunWhere(filter: AutomationRunFilter): Prisma.AutomationRunWhereInput {
  const where: Prisma.AutomationRunWhereInput = {};
  if (filter.ruleVersionId) {
    where.ruleVersionId = filter.ruleVersionId;
  }
  if (filter.brandId) {
    where.ruleVersion = {
      rule: {
        brandId: filter.brandId,
      },
    };
  }
  if (filter.from || filter.to) {
    const createdAt: Prisma.DateTimeFilter = {};
    if (filter.from) createdAt.gte = filter.from;
    if (filter.to) createdAt.lte = filter.to;
    where.createdAt = createdAt;
  }
  return where;
}

export async function findAutomationRuleVersions<
  T extends Prisma.AutomationRuleVersionFindManyArgs,
>(args: Prisma.SelectSubset<T, Prisma.AutomationRuleVersionFindManyArgs>) {
  return prisma.automationRuleVersion.findMany(args);
}

export async function findLatestAutomationRuleVersion(
  ruleId: string,
  select?: Prisma.AutomationRuleVersionSelect,
) {
  const args: Prisma.AutomationRuleVersionFindFirstArgs = {
    where: { ruleId },
    orderBy: { versionNumber: "desc" },
  };
  if (select) args.select = select;
  return prisma.automationRuleVersion.findFirst(args);
}

type AutomationRuleVersionQueryArgs<
  T extends Prisma.AutomationRuleVersionArgs = Prisma.AutomationRuleVersionArgs,
> = Omit<T, "where">;

export function findAutomationRuleVersionById<
  T extends Prisma.AutomationRuleVersionArgs = Prisma.AutomationRuleVersionArgs,
>(
  ruleVersionId: string,
  args?: AutomationRuleVersionQueryArgs<T>,
): PrismaPromise<Prisma.AutomationRuleVersionGetPayload<T> | null> {
  const query: Prisma.AutomationRuleVersionFindUniqueArgs = {
    where: { id: ruleVersionId },
  };
  if (args?.select) query.select = args.select;
  if (args?.include) query.include = args.include;
  return prisma.automationRuleVersion.findUnique(query) as PrismaPromise<
    Prisma.AutomationRuleVersionGetPayload<T> | null
  >;
}

export async function createAutomationRuleVersion(data: Prisma.AutomationRuleVersionCreateInput) {
  return prisma.automationRuleVersion.create({ data });
}

export async function updateAutomationRuleVersion(
  ruleVersionId: string,
  data: Prisma.AutomationRuleVersionUpdateInput,
) {
  return prisma.automationRuleVersion.update({
    where: { id: ruleVersionId },
    data,
  });
}

export async function findAutomationRunsWithActionRuns(filter: AutomationRunFilter = {}) {
  return prisma.automationRun.findMany({
    where: buildAutomationRunWhere(filter),
    select: automationRunWithActionRunsSelect,
  });
}

export async function findAutomationRunWithDetails(runId: string) {
  return prisma.automationRun.findUnique({
    where: { id: runId },
    select: {
      id: true,
      status: true,
      errorJson: true,
      startedAt: true,
      finishedAt: true,
      summaryJson: true,
      conditionsJson: true,
      actionsJson: true,
      triggerEventJson: true,
      ruleVersion: {
        select: {
          id: true,
          rule: {
            select: {
              brandId: true,
            },
          },
        },
      },
      actionRuns: {
        select: {
          id: true,
          status: true,
          errorJson: true,
          startedAt: true,
          finishedAt: true,
        },
      },
    },
  });
}

export async function findAutomationActionRunWithContext(actionRunId: string) {
  return prisma.automationActionRun.findUnique({
    where: { id: actionRunId },
    select: {
      id: true,
      status: true,
      errorJson: true,
      startedAt: true,
      finishedAt: true,
      actionType: true,
      run: {
        select: {
          id: true,
          ruleVersion: {
            select: {
              id: true,
              rule: {
                select: {
                  brandId: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

export type JsonValue = Prisma.JsonValue;
