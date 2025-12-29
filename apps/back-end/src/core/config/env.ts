
import { loadEnv, type RuntimeEnv } from "./env.runtime.js";
import { checkEnvSafety, getNormalizedDatabaseUrl } from "./env-guard.js";

export type Env = RuntimeEnv;
export { loadEnv, checkEnvSafety, getNormalizedDatabaseUrl };

export const env: Env = loadEnv();
export const isProdLikeEnv = env.NODE_ENV === "production" || env.NODE_ENV === "staging";

// Run safety guard at import time (before DB init)
checkEnvSafety();
