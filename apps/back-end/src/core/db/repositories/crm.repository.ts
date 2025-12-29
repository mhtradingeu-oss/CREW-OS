// CrmRepository: Move all prisma queries from crm.service.ts here
import { prisma, type PrismaArgs } from '../../prisma.js';
import type { Prisma } from "@prisma/client";

type LeadListArgs = PrismaArgs<typeof prisma.lead.findMany>;
type LeadFindArgs = PrismaArgs<typeof prisma.lead.findUnique>;
type LeadCreateArgs = PrismaArgs<typeof prisma.lead.create>;
type LeadUpdateArgs = PrismaArgs<typeof prisma.lead.update>;
type BaseLeadPayload = Awaited<ReturnType<typeof prisma.lead.findUnique>>;
type LeadSelectPayload<TSelect extends LeadListArgs["select"] | undefined> = TSelect extends LeadListArgs["select"]
  ? Prisma.LeadGetPayload<{ select: TSelect }>
  : BaseLeadPayload;
type LeadSelectMutationPayload<TSelect extends LeadListArgs["select"] | undefined> = TSelect extends LeadListArgs["select"]
  ? Prisma.LeadGetPayload<{ select: TSelect }>
  : Awaited<ReturnType<typeof prisma.lead.create>>;
type LeadForCustomerSummary = Prisma.LeadGetPayload<{
  select: {
    id: true;
    brandId: true;
    personId: true;
    companyId: true;
    ownerId: true;
  };
}>;
type SegmentCreateArgs = PrismaArgs<typeof prisma.cRMSegment.create>;
type SegmentFindArgs = PrismaArgs<typeof prisma.cRMSegment.findUnique>;
type SegmentListArgs = PrismaArgs<typeof prisma.cRMSegment.findMany>;
type ResolveSegmentLeadsArgs<S extends LeadListArgs["select"]> = {
  where: LeadListArgs["where"];
  take?: number;
  select: S;
};

export type CrmOrderSummary = Prisma.SalesOrderGetPayload<{ select: { id: true; brandId: true } }>;
export type CrmRevenueRecordSummary = Prisma.RevenueRecordGetPayload<{ select: { id: true; brandId: true } }>;

type ConvertLeadToCustomerArgs<
  L extends LeadListArgs["select"],
  C extends PrismaArgs<typeof prisma.crmCustomer.create>["select"],
> = {
  lead: LeadForCustomerSummary | null;
  order: CrmOrderSummary | null;
  revenueRecord: CrmRevenueRecordSummary | null;
  resolvedBrandId?: string | null;
  ownerId?: string | null;
  leadSelect: L;
  crmCustomerSelect: C;
};

type CRMInsightPayload = {
  score: number;
  probability: number;
  nextAction?: string;
};

export const CrmRepository = {
  async listLeads<S extends LeadListArgs["select"]>(args: LeadListArgs & { select: S }) {
    const { where, skip, take, select } = args;
    const [total, rows] = await prisma.$transaction([
      prisma.lead.count({ where }),
      prisma.lead.findMany({ where, select, orderBy: { createdAt: "desc" }, skip, take }),
    ]);
    return { total, rows: rows as Prisma.LeadGetPayload<{ select: S }>[] };
  },
  async findLeadById<TSelect extends LeadListArgs["select"] | undefined = undefined>(
    id: string,
    select?: TSelect,
  ): Promise<LeadSelectPayload<TSelect>> {
    const result = await prisma.lead.findUnique({
      where: { id },
      select: select as LeadFindArgs["select"],
    });
    return result as LeadSelectPayload<TSelect>;
  },
  async findLeadForScore(id: string) {
    return prisma.lead.findUnique({
      where: { id },
      select: { brandId: true, person: { select: { firstName: true, lastName: true } } },
    });
  },
  async createLead<TSelect extends LeadListArgs["select"] | undefined = undefined>(
    args: LeadCreateArgs & { select?: TSelect },
  ): Promise<LeadSelectMutationPayload<TSelect>> {
    const result = await prisma.lead.create(args);
    return result as LeadSelectMutationPayload<TSelect>;
  },
  async updateLead<TSelect extends LeadListArgs["select"] | undefined = undefined>(
    args: LeadUpdateArgs & { select?: TSelect },
  ): Promise<LeadSelectMutationPayload<TSelect>> {
    const result = await prisma.lead.update(args);
    return result as LeadSelectMutationPayload<TSelect>;
  },
  async findLeadIdBrand(id: string) {
    return prisma.lead.findUnique({ where: { id }, select: { id: true, brandId: true } });
  },
  async deleteLead(id: string) {
    return prisma.lead.delete({ where: { id } });
  },
  async findLeadContact(id: string) {
    return prisma.lead.findUnique({ where: { id }, select: { id: true, brandId: true, ownerId: true } });
  },
  async findLeadForCustomer(id: string): Promise<LeadForCustomerSummary | null> {
    return prisma.lead.findUnique({
      where: { id },
      select: { id: true, brandId: true, personId: true, companyId: true, ownerId: true },
    });
  },
  async findOrderAndRevenue(
    orderId?: string,
    revenueRecordId?: string,
  ): Promise<[CrmOrderSummary | null, CrmRevenueRecordSummary | null]> {
    const [order, revenueRecord] = await Promise.all([
      orderId ? prisma.salesOrder.findUnique({ where: { id: orderId }, select: { id: true, brandId: true } }) : null,
      revenueRecordId ? prisma.revenueRecord.findUnique({ where: { id: revenueRecordId }, select: { id: true, brandId: true } }) : null,
    ]);
    return [order, revenueRecord];
  },
  async crmCustomerExists(leadId: string) {
    return prisma.crmCustomer.findFirst({ where: { leadId } });
  },
  async convertLeadToCustomer<
    L extends LeadListArgs["select"],
    C extends PrismaArgs<typeof prisma.crmCustomer.create>["select"],
  >(
    args: ConvertLeadToCustomerArgs<L, C>,
  ): Promise<{
    customer: Prisma.CrmCustomerGetPayload<{ select: C }>;
    updatedLead: Prisma.LeadGetPayload<{ select: L }>;
  }> {
    const { lead, order, revenueRecord, resolvedBrandId, ownerId, leadSelect, crmCustomerSelect } = args;
    if (!lead) {
      throw new Error("Lead is required for conversion");
    }
    return prisma.$transaction(async (tx) => {
      const created = await tx.crmCustomer.create({
        data: {
          leadId: lead.id,
          brandId: resolvedBrandId,
          personId: lead.personId ?? null,
          companyId: lead.companyId ?? null,
          firstOrderId: order?.id ?? null,
          firstRevenueRecordId: revenueRecord?.id ?? null,
        },
        select: crmCustomerSelect,
      });
      const updated = await tx.lead.update({
        where: { id: lead.id },
        data: {
          status: "customer",
          ownerId: ownerId ?? lead.ownerId ?? null,
          brandId: resolvedBrandId ?? lead.brandId ?? null,
        },
        select: leadSelect,
      });
      return {
        customer: created as Prisma.CrmCustomerGetPayload<{ select: C }>,
        updatedLead: updated as Prisma.LeadGetPayload<{ select: L }>,
      };
    });
  },
  async ensurePerson(input: { email?: string; name?: string; phone?: string; brandId?: string | null }, brandId?: string | null) {
    if (!input.email && !input.name && !input.phone) {
      throw new Error("Lead requires at least a name or email");
    }
    if (input.email) {
      const existing = await prisma.person.findUnique({ where: { email: input.email }, select: { id: true } });
      if (existing) return existing.id;
    }
    const [firstName, ...rest] = (input.name ?? "").split(" ");
    const lastName = rest.join(" ") || undefined;
    const person = await prisma.person.create({
      data: {
        brandId: input.brandId ?? brandId ?? null,
        firstName: firstName || null,
        lastName: lastName ?? null,
        email: input.email ?? null,
        phone: input.phone ?? null,
      },
    });
    return person.id;
  },
  async logCrmInsight({ leadId, brandId, payload }: { leadId: string; brandId?: string | null; payload: CRMInsightPayload }) {
    await prisma.aIInsight.create({
      data: {
        brandId: brandId ?? null,
        os: "crm",
        entityType: "lead-score",
        entityId: leadId,
        summary: `Lead score ${payload.score}`,
        details: JSON.stringify({
          payload,
          confidence: payload.probability,
          risk: payload.nextAction,
        }),
      },
    });
  },
  async createSegment(args: SegmentCreateArgs) {
    return prisma.cRMSegment.create(args);
  },
  async listSegments(args: SegmentListArgs) {
    const { where, skip, take, select } = args;
    const [total, rows] = await prisma.$transaction([
      prisma.cRMSegment.count({ where }),
      prisma.cRMSegment.findMany({ where, select, orderBy: { createdAt: "desc" }, skip, take }),
    ]);
    return { total, rows };
  },
  async findSegmentById(id: string, select?: SegmentFindArgs["select"]) {
    return prisma.cRMSegment.findUnique({ where: { id }, select });
  },
  async findSegmentsByIds(where: SegmentListArgs["where"], select?: SegmentListArgs["select"]) {
    return prisma.cRMSegment.findMany({ where, select });
  },

  async resolveSegmentLeads<S extends LeadListArgs["select"]>(args: ResolveSegmentLeadsArgs<S>) {
    const { where, take, select } = args;
    const [total, rows] = await prisma.$transaction([
      prisma.lead.count({ where }),
      prisma.lead.findMany({ where, select, orderBy: { createdAt: "desc" }, take }),
    ]);
    return { total, rows: rows as Prisma.LeadGetPayload<{ select: S }>[] };
  },
};
