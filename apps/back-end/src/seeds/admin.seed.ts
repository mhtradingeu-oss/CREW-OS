import { prisma } from "../core/prisma.js";
import { env } from "../core/config/env.js";
import { hashPassword, verifyPassword } from "../core/security/password.js";
import type { Prisma } from "@prisma/client";
import { runSeedCli } from "./run-seed-cli.js";

const SUPER_ADMIN_ROLE = "SUPER_ADMIN";

export async function seedSuperAdmin() {
  const email = env.ADMIN_EMAIL;
  const password = env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be defined");
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      password: true,
      role: true,
      status: true,
      rolesJson: true,
    },
  });

  if (!existing) {
    const hashed = await hashPassword(password);
    await prisma.user.create({
      data: {
        email,
        password: hashed,
        role: SUPER_ADMIN_ROLE,
        status: "ACTIVE",
        rolesJson: [SUPER_ADMIN_ROLE],
      },
    });
    console.log(`✅ Created SUPER_ADMIN account for ${email}`);
    return;
  }

  const updates: Prisma.UserUpdateInput = {};

  const passwordMatches = await verifyPassword(password, existing.password);
  if (!passwordMatches) {
    updates.password = await hashPassword(password);
  }

  if (existing.role !== SUPER_ADMIN_ROLE) {
    updates.role = SUPER_ADMIN_ROLE;
  }

  if (existing.status !== "ACTIVE") {
    updates.status = "ACTIVE";
  }

  const normalizedRoles = ensureRoleList(existing.rolesJson);
  if (!normalizedRoles.includes(SUPER_ADMIN_ROLE)) {
    updates.rolesJson = [...normalizedRoles, SUPER_ADMIN_ROLE];
  }

  if (Object.keys(updates).length === 0) {
    console.log(`ℹ️ SUPER_ADMIN account ${email} already up to date`);
    return;
  }

  await prisma.user.update({
    where: { id: existing.id },
    data: updates,
  });
  console.log(`✅ Updated SUPER_ADMIN account for ${email}`);
}

function ensureRoleList(value: Prisma.JsonValue | null): string[] {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
    } catch {
      return [];
    }
  }
  return [];
}

if (process.argv[1]?.includes("admin.seed")) {
  void runSeedCli("SUPER_ADMIN account", seedSuperAdmin).then((code) => process.exit(code));
}
