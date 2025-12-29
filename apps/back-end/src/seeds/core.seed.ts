import { prisma } from "../core/prisma.js";
import { seedRBAC } from "../modules/security-governance/rbac.seed.js";
import { seedPlans } from "./plans.seed.js";
import { seedTenantsAndBrands } from "./tenants.seed.js";
import { seedUsers } from "./users.seed.js";
import { seedPricing } from "./pricing.seed.js";
import { runSeedCli } from "./run-seed-cli.js";

// Seeded accounts (plain text "MhOs!2025" for local/dev use only):
// - root@mhos.local (SUPER_ADMIN)
// - admin@mhtrading.de (ADMIN for MH Trading UG / Hairoticmen)
export async function seedCore() {
  await seedPlans();
  await seedRBAC();
  await seedTenantsAndBrands();
  await seedUsers();
  await seedPricing();
}

if (process.argv[1]?.includes("core.seed")) {
  void runSeedCli("core seeds", seedCore).then((code) => process.exit(code));
}
