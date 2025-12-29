import crypto from "crypto";
import { prisma } from "../src/core/prisma.js";
import { registerAutomationEngineSubscriber } from "../src/core/automation/engine/subscriber.js";
import { emitAuthLoginSuccess } from "../src/core/events/domain/examples/auth-login-success.event.js";

const SMOKE_RULE_NAME = "phase5-smoke-auth-login";

async function createSmokeRule() {
  await prisma.automationRule.deleteMany({ where: { name: SMOKE_RULE_NAME } });

  return prisma.automationRule.create({
    data: {
      name: SMOKE_RULE_NAME,
      triggerType: "event",
      triggerEvent: "auth.login.success",
      enabled: true,
      conditionConfigJson: JSON.stringify({
        all: [
          {
            path: "payload.role",
            op: "equals",
            value: "SUPER_ADMIN",
          },
        ],
      }),
      actionsConfigJson: JSON.stringify({ actions: [] }),
    },
  });
}

async function main() {
  registerAutomationEngineSubscriber();
  const rule = await createSmokeRule();
  const traceId = crypto.randomUUID();

  console.info("[smoke] created rule", rule.id);

  await emitAuthLoginSuccess(
    {
      userId: traceId,
      email: "phase5-smoke@example.com",
      role: "SUPER_ADMIN",
    },
    { source: "system", module: "automation-smoke" },
  );

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const run = await prisma.automationRun.findFirst({
    where: { ruleId: rule.id },
    orderBy: { createdAt: "desc" },
  });

  console.info("[smoke] automation run recorded", run);
}

main()
  .catch((err) => {
    console.error("[smoke] failed", err);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
