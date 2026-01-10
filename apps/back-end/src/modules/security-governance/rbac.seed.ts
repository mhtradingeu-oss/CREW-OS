import { prisma } from "../../core/prisma.js";
import { hashPassword } from "../../core/security/password.js";
import { env } from "../../core/config/env.js";
import { runSeedCli } from "../../seeds/run-seed-cli.js";
import { ALL_PERMISSION_CODES } from "../../core/security/permission-registry.js";

// Use canonical registry for all permission codes
const permissionCodes = Array.from(new Set(ALL_PERMISSION_CODES));

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
