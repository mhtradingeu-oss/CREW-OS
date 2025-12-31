import { z } from "zod";
import { registerRunner } from "../registry.js";
import type { ActionContext, ActionResult } from "../types.js";
import { ActionMetadata } from "../metadata.js";
import { NonRetryableActionError } from "../types.js";
import { prisma } from "../../../prisma.js";
import type { DomainEventPayloadMap } from "../../../events/domain/types.js";
import { MarketingDomainEvents } from "../../../../modules/marketing/marketing.events.js";

type MarketingExecutionPayload = DomainEventPayloadMap["marketing.campaign.execution.recorded"];

const schema = z.object({
  titleTemplate: z.string().min(1).optional(),
  status: z.string().optional(),
  assignedToId: z.string().optional(),
  dueInMinutes: z.number().int().min(0).optional(),
});

const metadata: ActionMetadata = {
  risk: "MEDIUM",
  sideEffect: "REVERSIBLE",
  description: "Create a CRM task when a marketing execution completes so sales can act",
  version: "1.0",
  approvalHints: {
    requiresApprovalInProd: false,
    requiresApprovalInStaging: false,
  },
};

const crmTaskRunner = {
  type: "CRM_TASK_FROM_MARKETING_EXECUTION" as const,
  schema,
  metadata,
  async execute(context: ActionContext<z.infer<typeof schema>>): Promise<ActionResult> {
    if (context.event.type !== MarketingDomainEvents.CAMPAIGN_EXECUTION_RECORDED) {
      throw new NonRetryableActionError(
        `CRM task runner only supports ${MarketingDomainEvents.CAMPAIGN_EXECUTION_RECORDED}`,
      );
    }

    const payload = context.event.payload as MarketingExecutionPayload;
    const title = buildTitle(context.actionConfig.titleTemplate, payload);
    const status = context.actionConfig.status ?? "pending";
    const dueDate = context.actionConfig.dueInMinutes
      ? new Date(context.event.occurredAt.getTime() + context.actionConfig.dueInMinutes * 60000)
      : undefined;
    const brandId = context.event.meta?.brandId ?? payload.brandId ?? null;

    const task = await prisma.crmTask.create({
      data: {
        brandId,
        title,
        status,
        dueDate,
        assignedToId: context.actionConfig.assignedToId ?? null,
      },
    });

    return { data: { taskId: task.id } };
  },
};

function buildTitle(template: string | undefined, payload: MarketingExecutionPayload): string {
  if (template) {
    const rendered = renderTemplate(template, payload).trim();
    if (rendered) {
      return rendered;
    }
  }
  const fallbackName = payload.campaignName ?? payload.campaignId;
  return `Follow up on marketing execution for ${fallbackName}`;
}

function renderTemplate(template: string, payload: MarketingExecutionPayload): string {
  const metrics = payload.metrics ?? {};
  const placeholders: Record<string, string> = {
    campaignId: payload.campaignId,
    campaignName: payload.campaignName ?? payload.campaignId,
    action: payload.action,
    executedAt: payload.executedAt,
    impressions: metrics.impressions != null ? String(metrics.impressions) : "",
    clicks: metrics.clicks != null ? String(metrics.clicks) : "",
    conversions: metrics.conversions != null ? String(metrics.conversions) : "",
    spend: metrics.spend != null ? String(metrics.spend) : "",
    revenue: metrics.revenue != null ? String(metrics.revenue) : "",
  };
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => placeholders[key] ?? "");
}

registerRunner(crmTaskRunner);
