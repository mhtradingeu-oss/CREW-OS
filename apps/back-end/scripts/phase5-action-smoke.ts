import { setTimeout } from "node:timers/promises";
import { initEventHub } from "../dist/core/events/register.js";
import { emitSecurityEvent } from "../dist/core/security/security-events.js";

const EVENT_TYPE = "AUTH_LOGIN_SUCCESS";

const MOCK_RULES = [
  {
    id: "mock-rule",
    name: "Login log rule",
    triggerEvent: EVENT_TYPE,
    conditionConfig: { all: [] },
    actions: [
      {
        type: "INTERNAL_LOG",
        params: {
          level: "info",
          message: "Smoke user login detected",
          meta: {
            from: "phase5-action-smoke",
          },
        },
      },
    ],
  },
];

async function main() {
  process.env.AUTOMATION_ENGINE_MOCK_RULES = JSON.stringify(MOCK_RULES);
  process.env.AUTOMATION_ENGINE_DRY_RUN = "1";

  initEventHub();

  emitSecurityEvent({
    type: EVENT_TYPE,
    userId: "smoke-user",
    tenantId: "smoke-tenant",
    ip: "127.0.0.1",
    ua: "phase5-action-smoke/1.0",
    time: new Date().toISOString(),
  });

  console.info(`[smoke] published ${EVENT_TYPE}`);
  await setTimeout(2000);
}

main().catch((err) => {
  console.error("[smoke] failed", err);
  process.exit(1);
});
