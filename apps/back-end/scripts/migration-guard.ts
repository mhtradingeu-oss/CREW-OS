import { env, isProdLikeEnv, isProductionEnv, isStagingEnv } from "../src/core/config/env.js";

function ensureMigrationFlag() {
  if (isProductionEnv && !env.DB_MIGRATION_ALLOW_PRODUCTION) {
    throw new Error("Production migrations are blocked (set DB_MIGRATION_ALLOW_PRODUCTION=true to confirm).");
  }

  if (isStagingEnv && !env.DB_MIGRATION_ALLOW_STAGING) {
    throw new Error("Staging migrations are blocked (set DB_MIGRATION_ALLOW_STAGING=true to confirm).");
  }

  if (isProdLikeEnv) {
    console.log(`[mh-os] Database migrations allowed for ${env.NODE_ENV} (${new Date().toISOString()})`);
  }
}

ensureMigrationFlag();
