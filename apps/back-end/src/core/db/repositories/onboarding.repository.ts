import type { OnboardingStatus, Prisma, TenantPersona } from "@prisma/client";
import { prisma } from "../../prisma.js";

const onboardingProfileTenantSelect = {
  id: true,
  planId: true,
} satisfies Prisma.TenantSelect;

const onboardingProfileInclude = {
  tenant: { select: onboardingProfileTenantSelect },
} satisfies Prisma.TenantOnboardingProfileInclude;

export type OnboardingProfile = Prisma.TenantOnboardingProfileGetPayload<{
  include: { tenant: { select: typeof onboardingProfileTenantSelect } };
}>;

type CreateOnboardingProfileInput = {
  persona: TenantPersona;
  selectedPlanKey: string;
  status: OnboardingStatus;
  userId: string;
  tenantId: string;
};

export type FinalizePlanSelectionInput = {
  tenantId: string;
  profileId: string;
  targetPlanId: string;
  targetPlanKey: string;
  currentPlanId?: string | null;
  modulesJson?: Prisma.InputJsonValue | null;
  changedByUserId: string;
};

export async function findUserWithTenant(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      tenantId: true,
      tenant: {
        select: {
          id: true,
          planId: true,
          plan: {
            select: {
              id: true,
              key: true,
            },
          },
        },
      },
    },
  });
}

export async function findLatestOnboardingProfile(userId: string): Promise<OnboardingProfile | null> {
  return prisma.tenantOnboardingProfile.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: onboardingProfileInclude,
  });
}

export async function createOnboardingProfile(data: CreateOnboardingProfileInput): Promise<OnboardingProfile> {
  return prisma.tenantOnboardingProfile.create({
    data: {
      tenantId: data.tenantId,
      userId: data.userId,
      persona: data.persona,
      selectedPlanKey: data.selectedPlanKey,
      status: data.status,
    },
    include: onboardingProfileInclude,
  });
}

export async function updateOnboardingProfile(
  profileId: string,
  data: Prisma.TenantOnboardingProfileUpdateInput,
): Promise<OnboardingProfile> {
  return prisma.tenantOnboardingProfile.update({
    where: { id: profileId },
    data,
    include: onboardingProfileInclude,
  });
}

export async function findPlanByKey(key: string) {
  return prisma.plan.findUnique({
    where: { key },
    select: { id: true, key: true },
  });
}

export async function finalizePlanSelection(input: FinalizePlanSelectionInput) {
  const { tenantId, targetPlanId, currentPlanId, modulesJson, changedByUserId, profileId, targetPlanKey } =
    input;
  const modulesJsonValue: Prisma.InputJsonValue | undefined = modulesJson ?? undefined;

  await prisma.$transaction(async (tx) => {
    await tx.tenant.update({
      where: { id: tenantId },
      data: {
        planId: targetPlanId,
        planOverridesJson: modulesJsonValue,
      },
    });

    await tx.tenantPlanChange.create({
      data: {
        tenantId,
        fromPlanId: currentPlanId ?? undefined,
        toPlanId: targetPlanId,
        changedByUserId,
        metadataJson: modulesJsonValue,
      },
    });

    await tx.tenantOnboardingProfile.update({
      where: { id: profileId },
      data: {
        selectedPlanKey: targetPlanKey,
        selectedModulesJson: modulesJsonValue,
        status: "completed",
        completedAt: new Date(),
      },
    });
  });
}
