import { prisma } from "../core/prisma.js";
import { planDefinitions } from "../core/plans.js";
import type { Prisma } from "@prisma/client";
import { runSeedCli } from "./run-seed-cli.js";

export async function seedPlans() {
  const plans = Object.values(planDefinitions) as Array<{
    key: string;
    name: string;
    description?: string | null;
    features?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  }>;

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { key: plan.key },
      update: {
        name: plan.name,
        description: plan.description,
        featuresJson: plan.features,
      },
      create: {
        key: plan.key,
        name: plan.name,
        description: plan.description,
        featuresJson: plan.features,
      },
    });
  }
}

if (process.argv[1]?.includes("plans.seed")) {
  void runSeedCli("plan catalog", seedPlans).then((code) => process.exit(code));
}
