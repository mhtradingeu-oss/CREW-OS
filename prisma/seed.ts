import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const prisma = new PrismaClient();

function loadBackendEnv() {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(currentDir, "..");
  const backendEnvHint = process.env.MHOS_BACKEND_ENV_PATH;

  const candidatePaths = [
    backendEnvHint,
    path.join(repoRoot, "apps/back-end/.env"),
    path.join(repoRoot, "apps/back-end/.env.local"),
  ].filter(Boolean) as string[];

  for (const candidate of candidatePaths) {
    const resolved = path.isAbsolute(candidate) ? candidate : path.join(repoRoot, candidate);
    if (existsSync(resolved)) {
      dotenv.config({ path: resolved });
      return;
    }
  }
}

loadBackendEnv();

async function cleanupUsers(adminEmail: string) {
  await prisma.user.deleteMany({
    where: {
      OR: [{ email: "" }, { password: "" }],
    },
  });

  const duplicates = await prisma.user.groupBy({
    by: ["email"],
    _count: { email: true },
    having: {
      email: {
        _count: { gt: 1 },
      },
    },
  });

  for (const dup of duplicates) {
    const users = await prisma.user.findMany({
      where: { email: dup.email },
      orderBy: { createdAt: "asc" },
    });

    const [, ...duplicatesToRemove] = users;
    if (duplicatesToRemove.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: duplicatesToRemove.map((user) => user.id) } },
      });
    }
  }

  // Ensure there is only one admin email record
  await prisma.user.deleteMany({
    where: {
      email: adminEmail,
      NOT: { role: "SUPER_ADMIN" },
    },
  });
}

async function ensureAdminUser(email: string, password: string) {
  const hashed = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: {
      password: hashed,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      rolesJson: ["SUPER_ADMIN"],
    },
    create: {
      email,
      password: hashed,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      rolesJson: ["SUPER_ADMIN"],
    },
  });
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set before running prisma db seed");
  }

  await cleanupUsers(adminEmail);
  const admin = await ensureAdminUser(adminEmail, adminPassword);

  console.log(`✅ Admin user ready (${admin.email})`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error("❌ Prisma seed failed", err);
    await prisma.$disconnect();
    process.exit(1);
  });
