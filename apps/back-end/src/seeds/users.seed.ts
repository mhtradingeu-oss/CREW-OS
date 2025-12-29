import { prisma } from "../core/prisma.js";
import { hashPassword } from "../core/security/password.js";
import { env } from "../core/config/env.js";
import { seedSuperAdmin } from "./admin.seed.js";
import { runSeedCli } from "./run-seed-cli.js";

const LOCAL_DEV_PASSWORD = env.ADMIN_PASSWORD; // Local/dev shared credential from env.

type SeedUserInput = {
  email: string;
  role: string;
  tenantId?: string;
  brandId?: string;
};

async function upsertUser(input: SeedUserInput) {
  const hashed = await hashPassword(LOCAL_DEV_PASSWORD);
  await prisma.user.upsert({
    where: { email: input.email },
    update: {
      role: input.role,
      status: "ACTIVE",
      tenantId: input.tenantId,
      brandId: input.brandId,
      rolesJson: [input.role],
      password: hashed,
    },
    create: {
      email: input.email,
      password: hashed,
      role: input.role,
      status: "ACTIVE",
      tenantId: input.tenantId,
      brandId: input.brandId,
      rolesJson: [input.role],
    },
  });
}

async function ensureOnboardingCompleted(userId: string, tenantId: string, planKey: string) {
  const existing = await prisma.tenantOnboardingProfile.findFirst({
    where: { tenantId, userId },
    orderBy: { createdAt: "desc" },
  });

  if (!existing) {
    await prisma.tenantOnboardingProfile.create({
      data: {
        tenantId,
        userId,
        persona: "RETAILER_DEALER",
        selectedPlanKey: planKey,
        status: "completed",
        completedAt: new Date(),
      },
    });
    return;
  }

  if (existing.status !== "completed") {
    await prisma.tenantOnboardingProfile.update({
      where: { id: existing.id },
      data: { status: "completed", completedAt: new Date() },
    });
  }
}

export async function seedUsers() {
  await seedSuperAdmin();

  const devTenant = await prisma.tenant.findUnique({
    where: { slug: "mh-dev-tenant" },
    select: { id: true },
  });
  if (!devTenant) {
    throw new Error("Tenant 'mh-dev-tenant' not found. Run tenant seeds first.");
  }

  const devBrand = await prisma.brand.findUnique({
    where: { slug: "mh-dev-brand" },
    select: { id: true },
  });
  if (!devBrand) {
    throw new Error("Brand 'mh-dev-brand' not found. Run tenant seeds first.");
  }

  await upsertUser({
    email: "dev.owner@example.com",
    role: "COMPANY_ADMIN",
    tenantId: devTenant.id,
    brandId: devBrand.id,
  });

  const owner = await prisma.user.findUnique({ where: { email: "dev.owner@example.com" }, select: { id: true } });
  if (owner) {
    await ensureOnboardingCompleted(owner.id, devTenant.id, "pro");
  }

  // Keep legacy admin for MH Trading demo data when present.
  const legacyTenant = await prisma.tenant.findUnique({ where: { slug: "mh-trading" }, select: { id: true } });
  const legacyBrand = await prisma.brand.findUnique({ where: { slug: "hairoticmen" }, select: { id: true } });
  if (legacyTenant && legacyBrand) {
    await upsertUser({
      email: "admin@mhtrading.de",
      role: "ADMIN",
      tenantId: legacyTenant.id,
      brandId: legacyBrand.id,
    });
  }

  console.log("✅ Seeded dev owner accounts (and legacy admin if available)");
}

if (process.argv[1]?.includes("users.seed")) {
  void runSeedCli("user seeds", seedUsers).then((code) => process.exit(code));
}
