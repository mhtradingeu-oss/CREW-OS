import { seedSuperAdmin } from "../src/seeds/admin.seed.js";
import { seedAutomationRules } from "../src/seeds/automation.seed.js";
import { prisma } from "../src/core/prisma.js";

async function main() {
  console.log("🚀 Running Prisma DB seed...");
  await seedSuperAdmin();
  await seedAutomationRules();
}

async function runSeed() {
  let exitCode = 0;
  try {
    await main();
  } catch (error) {
    console.error("❌ Prisma seed failed:", error);
    exitCode = 1;
  } finally {
    await prisma.$disconnect();
    console.log("🌱 Prisma seed completed.");
    process.exit(exitCode);
  }
}

void runSeed();
