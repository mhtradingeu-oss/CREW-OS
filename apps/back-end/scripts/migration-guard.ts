import { env, isProdLikeEnv } from "../src/core/config/env.js";

function ensureMigrationFlag(): void {
  const nodeEnv = env.NODE_ENV;

  if (nodeEnv === "production" && !env.DB_MIGRATION_ALLOW_PRODUCTION) {
    console.error(
      "[MIGRATION GUARD] Production migrations are blocked. " +
        "Set DB_MIGRATION_ALLOW_PRODUCTION=true to proceed."
    );
    process.exit(1);
  }

  if (nodeEnv === "staging" && !env.DB_MIGRATION_ALLOW_STAGING) {
    console.error(
      "[MIGRATION GUARD] Staging migrations are blocked. " +
        "Set DB_MIGRATION_ALLOW_STAGING=true to proceed."
    );
    process.exit(1);
  }

  if (isProdLikeEnv) {
    console.log(
      `[MIGRATION GUARD] Database migrations allowed for ${nodeEnv} ` +
        `at ${new Date().toISOString()}`
    );
  }
}

ensureMigrationFlag();
