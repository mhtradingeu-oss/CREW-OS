import { aiOrchestrator } from "../../core/ai/orchestrator.js";
import { notFound } from "../../core/http/errors.js";
import { prisma } from "../../core/prisma.js";
import type { EventEnvelope } from "../../core/events/event-bus.js";
import { activityLogService } from "../activity-log/activity-log.service.js";
import { notificationService } from "../notification/notification.service.js";
import {
  DepartmentAgentProfile,
  DepartmentRecommendation,
  DepartmentScope,
  MeetingActionItem,
  MeetingAgendaItem,
  VirtualOfficeMeetingRequest,
  VirtualOfficeMeetingSummary,
} from "./ai-brain.types.js";
import { VirtualOfficeMeetingDto } from "./virtual-office.validators.js";

const DEPARTMENT_AGENTS: DepartmentAgentProfile[] = [
  {
    key: "marketing",
    name: "Marketing Director",
    charter: "Demand generation and channel orchestration",
    defaultFocus: "Paid + social mix",
  },
  {
    key: "sales",
    name: "Sales Director",
    charter: "Revenue execution and pipeline pace",
    defaultFocus: "Territories + conversion",
  },
  {
    key: "crm",
    name: "CRM Lead",
    charter: "Lifecycle engagement, lead health, and routing",
    defaultFocus: "Segmentation + scoring",
  },
  {
    key: "loyalty",
    name: "Loyalty Lead",
    charter: "Retention, rewards, and VIP motion",
    defaultFocus: "Points burn/earn balance",
  },
  {
    key: "finance",
    name: "Finance Lead",
    charter: "Margin health and cash discipline",
    defaultFocus: "Net revenue and runway",
  },
  {
    key: "inventory",
    name: "Inventory Lead",
    charter: "Stock reliability and replenishment",
    defaultFocus: "Avoid stockouts + dead stock",
  },
  {
    key: "brand",
    name: "Brand Director",
    charter: "Identity, messaging, and promise consistency",
    defaultFocus: "Narrative + positioning",
  },
];

function dedupeDepartments(departments: DepartmentScope[]): DepartmentScope[] {
  return Array.from(new Set(departments));
}

function normalizeAgenda(agenda?: string[]): MeetingAgendaItem[] {
  if (!agenda?.length) return [];
  return agenda.map((title) => ({
    title,
    desiredOutcome: "Clear next action",
  }));
}

function ensureActionItems(
  recommendations: DepartmentRecommendation[],
  departments: DepartmentScope[],
): MeetingActionItem[] {
  const items = recommendations.flatMap((rec) => rec.actionItems ?? []);
  if (items.length) return items;
  return departments.map((dept) => ({
    department: dept,
    task: `Publish the next ${dept} update to keep the loop moving`,
    owner: "AI Coordinator",
    impact: "Maintains execution cadence",
    dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
  }));
}

async function persistActionItems(
  brandId: string | undefined,
  meetingId: string,
  items: MeetingActionItem[],
) {
  for (const action of items) {
    const created = await prisma.virtualOfficeActionItem.create({
      data: {
        brandId: brandId ?? null,
        meetingId,
        department: action.department,
        task: action.task,
        owner: action.owner ?? null,
        dueDate: action.dueDate ? new Date(action.dueDate) : null,
        impact: action.impact ?? null,
      },
    });

    await notificationService.createNotification({
      brandId,
      type: "virtual-office",
      title: `Action item: ${action.department}`,
      message: `${action.task}`,
      data: { actionItemId: created.id },
    });
  }
}

async function persistMeetingData(meeting: VirtualOfficeMeetingSummary, brandId?: string) {
  const record = await prisma.virtualOfficeMeeting.create({
    data: {
      brandId: brandId ?? null,
      topic: meeting.topic,
      scope: meeting.scope ?? null,
      summary: meeting.summary ?? null,
      details: meeting.details ?? null,
      departmentsJson: JSON.stringify(meeting.departments ?? []),
      agendaJson: JSON.stringify(meeting.agenda ?? []),
      actionItemsJson: JSON.stringify(meeting.actionItems ?? []),
      risksJson: JSON.stringify(meeting.risks ?? []),
    },
  });

  await persistActionItems(brandId, record.id, meeting.actionItems ?? []);

  const automationResult = JSON.stringify({
    summary: meeting.summary,
    actionItems: meeting.actionItems,
  });
  await prisma.automationLog.create({
    data: {
      brandId: brandId ?? null,
      eventName: "virtual-office.meeting",
      result: automationResult,
      detailsJson: automationResult,
    },
  });

  await activityLogService.record({
    name: "virtual-office.meeting",
    payload: { topic: meeting.topic, departments: meeting.departments },
    context: { brandId, module: "virtual-office", source: "ai" },
  } as EventEnvelope);

  const insight = await prisma.aIInsight.create({
    data: {
      brandId: brandId ?? null,
      os: "virtual-office",
      entityType: "meeting",
      entityId: record.id,
      summary: meeting.summary ?? "Virtual office update",
      details: JSON.stringify({
        topic: meeting.topic,
        departments: meeting.departments,
        actionItems: meeting.actionItems,
      }),
    },
  });

  await prisma.aILearningJournal.create({
    data: {
      brandId: brandId ?? null,
      source: "virtual-office",
      eventType: "meeting",
      inputSnapshotJson: JSON.stringify({ topic: meeting.topic, departments: meeting.departments }),
      outputSnapshotJson: JSON.stringify({ summaryId: insight.id, actionItems: meeting.actionItems }),
    },
  });

  return record;
}

export const virtualOfficeService = {
  listDepartments() {
    return DEPARTMENT_AGENTS;
  },

  async runMeeting(input: VirtualOfficeMeetingDto): Promise<VirtualOfficeMeetingSummary> {
    const departments = dedupeDepartments(input.departments);
    const brand = input.brandId
      ? await prisma.brand.findUnique({ where: { id: input.brandId } })
      : null;
    if (input.brandId && !brand) {
      throw notFound("Brand not found");
    }

    const aiResponse = await aiOrchestrator.runVirtualOfficeMeeting({
      ...(input as VirtualOfficeMeetingRequest),
      departments,
    });

    const meeting: VirtualOfficeMeetingSummary = {
      ...aiResponse.result,
      topic: aiResponse.result.topic ?? input.topic,
      scope: aiResponse.result.scope ?? input.scope,
      departments: aiResponse.result.departments?.length
        ? aiResponse.result.departments
        : departments,
      agenda: aiResponse.result.agenda?.length
        ? aiResponse.result.agenda
        : normalizeAgenda(input.agenda),
      recommendations: aiResponse.result.recommendations ?? [],
      risks: aiResponse.result.risks ?? [],
      actionItems: [],
      brand:
        aiResponse.result.brand ??
        (brand ? { id: brand.id, name: brand.name, slug: brand.slug } : undefined),
    };

    meeting.actionItems = ensureActionItems(meeting.recommendations, meeting.departments);

    if (!meeting.recommendations.length) {
      meeting.recommendations = meeting.departments.map((dept) => ({
        department: dept,
        headline: `${dept.toUpperCase()} directive`,
        summary: `Keep ${dept} aligned on ${input.topic}`,
        actionItems: meeting.actionItems.filter((item) => item.department === dept),
      }));
    }

    if (!meeting.risks?.length) {
      meeting.risks = ["No explicit risks captured; monitor execution and data quality."];
    }

    await persistMeetingData(meeting, brand?.id ?? undefined);

    return meeting;
  },

  async listActionItems(brandId?: string) {
    return prisma.virtualOfficeActionItem.findMany({
      where: brandId ? { brandId } : undefined,
      orderBy: { createdAt: "desc" },
    });
  },
};
