import type { ActionConfig } from "../modules/automation/automation.types.js";
import { prisma } from "../core/prisma.js";

type AutomationSeedDefinition = {
  name: string;
  description: string;
  triggerEvent: string;
  actions: ActionConfig[];
};

const AUTOMATION_SEEDS: AutomationSeedDefinition[] = [
  {
    name: "Notify sales when new lead arrives",
    description: "Ping the owner/sales team whenever a CRM lead is created.",
    triggerEvent: "crm.lead.created",
    actions: [
      {
        type: "notification",
        params: {
          type: "crm",
          title: "New lead captured",
          message: "Lead {{payload.leadId}} created for owner {{payload.ownerId}}",
          userId: "{{payload.ownerId}}",
        },
      },
    ],
  },
  {
    name: "Notify finance and owner on customer conversion",
    description:
      "Let finance and the owning rep know when a lead converts to a customer (order & revenue attached).",
    triggerEvent: "crm.lead.customer.created",
    actions: [
      {
        type: "notification",
        params: {
          type: "crm",
          title: "Lead became customer",
          message:
            "Customer {{payload.customerId}} created (order {{payload.orderId}}, revenue {{payload.revenueRecordId}})",
          userId: "{{payload.ownerId}}",
        },
      },
      {
        type: "notification",
        params: {
          type: "finance",
          title: "New customer conversion",
          message:
            "Customer {{payload.customerId}} converted with order {{payload.orderId}} and revenue {{payload.revenueRecordId}}",
        },
      },
    ],
  },
  {
    name: "Alert inventory on low stock",
    description: "Notify the operations team when an inventory item crosses the low-stock threshold.",
    triggerEvent: "inventory.stock.low",
    actions: [
      {
        type: "notification",
        params: {
          type: "inventory",
          title: "Inventory stock low",
          message:
            "Stock low for product {{payload.productId}} ({{payload.currentStock}} / threshold {{payload.threshold}})",
        },
      },
    ],
  },
  {
    name: "Notify finance and customer when invoice is created",
    description: "Keep finance and the customer informed whenever a new invoice is generated.",
    triggerEvent: "finance.invoice.created",
    actions: [
      {
        type: "notification",
        params: {
          type: "finance",
          title: "Invoice created",
          message:
            "Invoice {{payload.invoiceId}} created for {{payload.brandId}} ({{payload.amount}} {{payload.currency}})",
        },
      },
      {
        type: "notification",
        params: {
          type: "customer",
          title: "Invoice ready",
          message:
            "Invoice {{payload.invoiceId}} for {{payload.brandId}} ({{payload.amount}} {{payload.currency}}) is ready for review.",
        },
      },
    ],
  },
  {
    name: "Notify marketing on campaign interaction",
    description: "Summarize marketing campaign interactions for the ops/marketing inbox.",
    triggerEvent: "marketing.campaign.interaction.logged",
    actions: [
      {
        type: "notification",
        params: {
          type: "marketing",
          title: "Campaign interaction logged",
          message: "Campaign {{payload.campaignId}} captured interaction {{payload.type}}",
        },
      },
    ],
  },
];

export async function seedAutomationRules() {
  for (const seed of AUTOMATION_SEEDS) {
    const payload = {
      brandId: null,
      name: seed.name,
      description: seed.description,
      triggerType: "event",
      triggerEvent: seed.triggerEvent,
      triggerConfigJson: null,
      conditionConfigJson: null,
      actionsConfigJson: JSON.stringify({ actions: seed.actions }),
      enabled: true,
      createdById: null,
      updatedById: null,
    };

    const existing = await prisma.automationRule.findFirst({
      where: { name: seed.name, brandId: null },
    });

    if (existing) {
      await prisma.automationRule.update({
        where: { id: existing.id },
        data: payload,
      });
    } else {
      await prisma.automationRule.create({ data: payload });
    }
  }
}
