import { prisma } from "../../core/prisma.js";
import { hashPassword } from "../../core/security/password.js";
import { env } from "../../core/config/env.js";
import { runSeedCli } from "../../seeds/run-seed-cli.js";

const basePermissionCodes = [
  "auth:me",
  "admin:create",
  "admin:read",
  "admin:update",
  "admin:delete",
  "activity:read",
  "ai:read",
  "ai:run",
  "ai:manage",
  "ai:context:read",
  "ai:context:automation",
  "ai:context:brand",
  "ai:context:crm",
  "ai:context:finance",
  "ai:context:insight",
  "ai:context:inventory",
  "ai:context:kb",
  "ai:context:knowledge",
  "ai:context:loyalty",
  "ai:context:marketing",
  "ai:context:media",
  "ai:context:notification",
  "ai:context:operations",
  "ai:context:partner",
  "ai:context:pricing",
  "ai:context:product",
  "ai:context:sales",
  "ai:context:support",
  "ai:context:voice",
  "ai:agents:run",
  "ai:pipeline:execute",
  "ai:insights:read",
  "ai:memory:read",
  "ai:config:read",
  "ai:config:update",
  "ai:autonomy:manage",
  "ai:kpi:read",
  "ai:insights",
  "ai:inventory",
  "ai:finance",
  "ai:product",
  "ai:pricing",
  "ai:marketing",
  "ai:crm",
  "ai:assistant",
  "ai:social-intelligence",
  "ai:virtual-office",
  "ai:monitoring:read",
  "ai:safety:read",
  "ai:safety:manage",
  "ai:media:view",
  "ai:media:run",
  "ai:white-label:run",
  "ai:crew:advisory",
  "ai:decision:write",
  "ai:execution:approve",
  "ai:execution:handoff",
  "affiliate:create",
  "affiliate:read",
  "affiliate:update",
  "affiliate:delete",
  "ai-brain:create",
  "ai-brain:read",
  "ai-brain:update",
  "ai-brain:delete",
  "automation:create",
  "automation:read",
  "automation:update",
  "automation:delete",
  "automation:run",
  "automation:kill",
  "incident:create",
  "incident:read",
  "rollback:approve",
  "rollback:execute",
  "brand:create",
  "brand:read",
  "brand:update",
  "brand:delete",
  "communication:create",
  "communication:read",
  "communication:update",
  "communication:delete",
  "communication:send",
  "competitor:read",
  "competitor:scan",
  "crm:create",
  "crm:read",
  "crm:update",
  "crm:delete",
  "crm:segments:read",
  "crm:segments:manage",
  "dealers:create",
  "dealers:manage",
  "dealers:stats",
  "dealers:read",
  "dealers:update",
  "dealers:delete",
  "finance:create",
  "finance:read",
  "finance:update",
  "finance:delete",
  "finance:manage",
  "inventory:create",
  "inventory:read",
  "inventory:update",
  "inventory:adjust",
  "inventory:delete",
  "knowledge-base:create",
  "knowledge-base:read",
  "knowledge-base:update",
  "knowledge-base:delete",
  "knowledge-base:summarize",
  "loyalty:create",
  "loyalty:read",
  "loyalty:update",
  "loyalty:delete",
  "marketing:create",
  "marketing:read",
  "marketing:update",
  "marketing:delete",
  "influencer:read",
  "influencer:manage",
  "operations:create",
  "operations:read",
  "operations:update",
  "operations:delete",
  "partners:create",
  "partners:read",
  "partners:update",
  "partners:delete",
  "pricing:create",
  "pricing:read",
  "pricing:update",
  "pricing:approve",
  "pricing:delete",
  "product:create",
  "product:read",
  "product:update",
  "product:export",
  "product:import",
  "product:delete",
  "sales-reps:create",
  "sales-reps:read",
  "sales-reps:update",
  "sales-reps:delete",
  "sales-rep:read",
  "sales-rep:manage",
  "sales-rep:kpi",
  "sales-rep:leads",
  "security-governance:create",
  "security-governance:read",
  "security-governance:update",
  "security-governance:delete",
  "social-intelligence:create",
  "social-intelligence:read",
  "social-intelligence:update",
  "social-intelligence:delete",
  "stand:create",
  "stand:read",
  "stand:update",
  "stand:delete",
  "pos:read",
  "pos:stats",
  "pos:manage",
  "pos:insights",
  "support:create",
  "support:read",
  "support:update",
  "support:delete",
  "support:assign",
  "users:create",
  "users:read",
  "users:update",
  "users:delete",
  "superadmin:tenants:view",
  "superadmin:users:read",
  "superadmin:users:manage",
  "superadmin:platform:view",
  "security:policies:read",
  "security:policies:manage",
  "security:rbac:view",
  "white-label:create",
  "white-label:read",
  "white-label:update",
  "white-label:delete",
  "white-label:manage",
  "notification:read",
  "notification:update",
  "ops:health",
  "ops:errors",
  "ops:jobs",
  "ops:security",
  "ops:audit",
];

const permissionCodes = Array.from(new Set(basePermissionCodes));

const baseRoles = [
  {
    name: "SUPER_ADMIN",
    description: "Full platform control",
    permissions: permissionCodes,
  },
  {
    name: "ADMIN",
    description: "Administrative access across modules",
    permissions: permissionCodes,
  },
  {
    name: "COMPANY_ADMIN",
    description: "Tenant administrator with company-wide permissions",
    permissions: permissionCodes,
  },
  {
    name: "BRAND_ADMIN",
    description: "Brand administration and operations",
    permissions: permissionCodes,
  },
  {
    name: "USER",
    description: "Standard user with self-service scope",
    permissions: ["auth:me"],
  },
];

export async function seedRBAC() {
  const permissions = await Promise.all(
    permissionCodes.map((code) =>
      prisma.permission.upsert({
        where: { code },
        update: {},
        create: { code, description: code },
      }),
    ),
  );

  const permissionMap = new Map(permissions.map((p) => [p.code, p.id]));

  for (const role of baseRoles) {
    const roleRecord = await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: { name: role.name, description: role.description },
    });

    for (const code of role.permissions) {
      const permissionId = permissionMap.get(code);
      if (!permissionId) continue;

      const existing = await prisma.rolePermission.findFirst({
        where: { roleId: roleRecord.id, permissionId },
      });

      if (!existing) {
        await prisma.rolePermission.create({
          data: { roleId: roleRecord.id, permissionId },
        });
      }
    }
  }

  await ensureAdminUser();
}

async function ensureAdminUser() {
  const adminEmail = env.ADMIN_EMAIL;
  const adminPassword = env.ADMIN_PASSWORD;

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    if (existing.role !== "SUPER_ADMIN" || existing.status !== "ACTIVE") {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: "SUPER_ADMIN", status: "ACTIVE" },
      });
    }
    return;
  }

  const passwordHash = await hashPassword(adminPassword);
  await prisma.user.create({
    data: {
      email: adminEmail,
      password: passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
  });
}

if (process.argv[1]?.match(/rbac\.seed\.(ts|js)$/)) {
  void runSeedCli("RBAC", seedRBAC).then((code) => process.exit(code));
}
