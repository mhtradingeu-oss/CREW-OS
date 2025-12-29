import { prisma } from "../core/prisma.js";
import { hashPassword } from "../core/security/password.js";
import type { PlanKey } from "../core/plans.js";
import { seedHairoticmen } from "../modules/brand/hairoticmen.seed.js";
import { seedAutomationRules } from "./automation.seed.js";
import type { Plan } from "@prisma/client";
import { runSeedCli } from "./run-seed-cli.js";

type SeedUserInput = {
  email: string;
  password: string;
  role: string;
  tenantId?: string;
  brandId?: string;
  roles?: string[];
};

async function seedUser(input: SeedUserInput) {
  const rolesJson = input.roles ?? [input.role];
  const hash = await hashPassword(input.password);
  await prisma.user.upsert({
    where: { email: input.email },
    update: {
      role: input.role,
      status: "ACTIVE",
      tenantId: input.tenantId,
      brandId: input.brandId,
      rolesJson,
    },
    create: {
      email: input.email,
      password: hash,
      role: input.role,
      status: "ACTIVE",
      tenantId: input.tenantId,
      brandId: input.brandId,
      rolesJson,
    },
  });
}

type DemoTenantConfig = {
  planKey: PlanKey;
  tenantSlug: string;
  tenantName: string;
  brandSlug: string;
  brandName: string;
  brandDescription: string;
  adminEmail: string;
};

export async function seedTenantsAndBrands() {
  const planKeys: PlanKey[] = ["superapp-core", "free", "starter", "pro", "enterprise"];
  const plans = await prisma.plan.findMany({
    where: {
      key: { in: planKeys },
    },
  });

  const planMap = new Map<string, Plan>(
    plans.map((plan: Plan) => [plan.key, plan])
  );

  const getPlanId = (key: PlanKey): string => {
    const plan = planMap.get(key);
    if (!plan) {
      throw new Error(`Plan record "${key}" not found. Run seed:core first.`);
    }
    return plan.id;
  };

  // Core dev tenant/brand used for local authentication and dashboard smoke tests.
  const devTenant = await prisma.tenant.upsert({
    where: { slug: "mh-dev-tenant" },
    update: {
      name: "MH Dev Tenant",
      status: "ACTIVE",
      planId: getPlanId("pro"),
      settingsJson: JSON.stringify({ env: "dev", note: "Local dev seed tenant" }),
    },
    create: {
      slug: "mh-dev-tenant",
      name: "MH Dev Tenant",
      status: "ACTIVE",
      planId: getPlanId("pro"),
      settingsJson: JSON.stringify({ env: "dev", note: "Local dev seed tenant" }),
    },
  });

  const devBrand = await prisma.brand.upsert({
    where: { slug: "mh-dev-brand" },
    update: {
      name: "MH Dev Brand",
      description: "Local development brand for MH-OS",
      tenantId: devTenant.id,
      settingsJson: JSON.stringify({ dev: true }),
    },
    create: {
      slug: "mh-dev-brand",
      name: "MH Dev Brand",
      description: "Local development brand for MH-OS",
      tenantId: devTenant.id,
      settingsJson: JSON.stringify({ dev: true }),
    },
  });

  await prisma.tenant.update({
    where: { id: devTenant.id },
    data: { defaultBrandId: devBrand.id },
  });

  const existingDevPlanChange = await prisma.tenantPlanChange.findFirst({
    where: { tenantId: devTenant.id, toPlanId: getPlanId("pro") },
  });
  if (!existingDevPlanChange) {
    await prisma.tenantPlanChange.create({
      data: {
        tenantId: devTenant.id,
        fromPlanId: null,
        toPlanId: getPlanId("pro"),
        metadataJson: { seed: "dev" },
      },
    });
  }

  const mhTenant = await prisma.tenant.upsert({
    where: { slug: "mh-trading" },
    update: {
      name: "MH Trading UG",
      status: "LIVE",
      planId: getPlanId("superapp-core"),
      settingsJson: JSON.stringify({
        aiPersona: "MH Trading OS operator",
        loyaltyPremium: true,
      }),
    },
    create: {
      slug: "mh-trading",
      name: "MH Trading UG",
      status: "LIVE",
      planId: getPlanId("superapp-core"),
      settingsJson: JSON.stringify({
        aiPersona: "MH Trading OS operator",
        loyaltyPremium: true,
      }),
    },
  });

  const brand = await seedHairoticmen({ tenantId: mhTenant.id });

  await prisma.tenant.update({
    where: { id: mhTenant.id },
    data: {
      defaultBrandId: brand.id,
    },
  });

  const demoTenants: DemoTenantConfig[] = [
    {
      planKey: "free",
      tenantSlug: "demo-free-co",
      tenantName: "Demo Free Co",
      brandSlug: "demo-free",
      brandName: "Demo Free Brand",
      brandDescription: "Sandbox brand with limited AI features.",
      adminEmail: "demo-free@demo.mh-os.app",
    },
    {
      planKey: "starter",
      tenantSlug: "demo-starter-co",
      tenantName: "Demo Starter Co",
      brandSlug: "demo-starter",
      brandName: "Demo Starter Brand",
      brandDescription: "Starter showcase with basic AI and automations.",
      adminEmail: "demo-starter@demo.mh-os.app",
    },
    {
      planKey: "pro",
      tenantSlug: "demo-pro-co",
      tenantName: "Demo Pro Co",
      brandSlug: "demo-pro",
      brandName: "Demo Pro Brand",
      brandDescription: "Pro level brand with CRM, POS, and limited white-label.",
      adminEmail: "demo-pro@demo.mh-os.app",
    },
    {
      planKey: "enterprise",
      tenantSlug: "demo-enterprise-co",
      tenantName: "Demo Enterprise Co",
      brandSlug: "demo-enterprise",
      brandName: "Demo Enterprise Brand",
      brandDescription: "Enterprise sandbox with full feature access.",
      adminEmail: "demo-enterprise@demo.mh-os.app",
    },
  ];

  for (const config of demoTenants) {
    const tenant = await prisma.tenant.upsert({
      where: { slug: config.tenantSlug },
      update: {
        name: config.tenantName,
        planId: getPlanId(config.planKey),
        status: "ACTIVE",
      },
      create: {
        slug: config.tenantSlug,
        name: config.tenantName,
        planId: getPlanId(config.planKey),
        status: "ACTIVE",
        settingsJson: JSON.stringify({ demoTier: config.planKey }),
      },
    });

    const demoBrand = await prisma.brand.upsert({
      where: { slug: config.brandSlug },
      update: {
        name: config.brandName,
        description: config.brandDescription,
        tenantId: tenant.id,
        settingsJson: JSON.stringify({ demo: true }),
      },
      create: {
        slug: config.brandSlug,
        name: config.brandName,
        description: config.brandDescription,
        tenantId: tenant.id,
        settingsJson: JSON.stringify({ demo: true }),
      },
    });

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { defaultBrandId: demoBrand.id },
    });

    await seedUser({
      email: config.adminEmail,
      password: "DemoTenant123!",
      role: "BRAND_ADMIN",
      tenantId: tenant.id,
      brandId: demoBrand.id,
    });
  }

  await seedAutomationRules();

  console.log("✅ Tenant and brand seeds completed");
}

if (process.argv[1]?.includes("tenants.seed")) {
  void runSeedCli("tenants and brands", seedTenantsAndBrands).then((code) => process.exit(code));
}
