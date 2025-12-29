import dotenv from "dotenv";
import { existsSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { logger } from "../logger.js";

const envFilePath = resolveEnvFilePath();
if (envFilePath) {
  dotenv.config({ path: envFilePath });
}

const DEFAULT_JWT_SECRET = "a200ac2cf9b4454f49a6216bb0a5ad69ae6ac47697edb576bb8919dee72821e";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]),
  PORT: z.coerce.number().int().positive().default(4000),
  SERVER_HOST: z.string().optional(),
  DATABASE_URL: z.string().min(1, "DATABASE_URL=postgresql://mhos_user:mhos_password@localhost:5432/mhos_dev?schema=public"),
  JWT_SECRET: z.string().min(8).default(DEFAULT_JWT_SECRET),
  ADMIN_EMAIL: z.string().email().default("root@mhos.local"),
  ADMIN_PASSWORD: z.string().min(8, "ADMIN_PASSWORD must be at least 8 characters").default("MhOs!2025"),
  ALLOWED_ORIGINS: z.string().optional(),
  API_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  API_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  API_RATE_LIMIT_STRICT_WINDOW_MS: z.coerce.number().int().positive().default(10 * 60 * 1000),
  API_RATE_LIMIT_STRICT_MAX: z.coerce.number().int().positive().default(120),
  DB_MIGRATION_ALLOW_STAGING: z.coerce.boolean().default(false),
  DB_MIGRATION_ALLOW_PRODUCTION: z.coerce.boolean().default(false),
  AUTOMATION_EXECUTION_ENABLED: z.coerce.boolean().default(false),
  AUTOMATION_GLOBAL_DISABLED: z.coerce.boolean().default(false),
  AUTOMATION_ROLLBACK_WINDOW_MINUTES: z.coerce.number().int().positive().default(60),
  AI_SUGGESTIONS_ENABLED: z.coerce.boolean().default(false),
  AI_SUGGESTIONS_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  AI_SUGGESTIONS_CACHE_TTL_MS: z.coerce.number().int().positive().default(60_000),
});

export type RuntimeEnv = z.infer<typeof envSchema>;

let cachedEnv: RuntimeEnv | null = null;


export function loadEnv(): RuntimeEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    logger.error("❌ Invalid environment configuration", { error: parsed.error.flatten().fieldErrors });
    throw new Error("Invalid environment configuration");
  }

  const validated = validateEnvironment(parsed.data);
  process.env.NODE_ENV = validated.NODE_ENV;
  cachedEnv = validated;
  return validated;
}

export function resetEnvCache() {
  cachedEnv = null;
}

function validateEnvironment(envData: RuntimeEnv): RuntimeEnv {
  if (envData.NODE_ENV === "production" || envData.NODE_ENV === "staging") {
    if (!envData.ALLOWED_ORIGINS?.trim()) {
      throw new Error("ALLOWED_ORIGINS must be configured when running in production or staging");
    }
    if (envData.JWT_SECRET === DEFAULT_JWT_SECRET) {
      throw new Error("JWT_SECRET must be overridden in production/staging environments");
    }
  }
  if (envData.AUTOMATION_ROLLBACK_WINDOW_MINUTES <= 0) {
    throw new Error("AUTOMATION_ROLLBACK_WINDOW_MINUTES must be greater than zero");
  }
  return envData;
}

function resolveEnvFilePath() {
  const cwd = process.cwd();
  const candidateRoot = path.join(cwd, "apps/back-end");
  const backendRoot = existsSync(path.join(candidateRoot, "package.json")) ? candidateRoot : cwd;

  const explicit = process.env.MHOS_BACKEND_ENV_PATH;
  if (explicit) {
    const explicitPath = path.isAbsolute(explicit) ? explicit : path.join(backendRoot, explicit);
    if (existsSync(explicitPath)) {
      return explicitPath;
    }
  }

  const baseCandidates = [".env", ".env.local", ".env.docker", ".env.example", ".env.sample"];
  const candidates =
    process.env.NODE_ENV === "test"
      ? [".env.test", ".env.test.local", ...baseCandidates]
      : baseCandidates;

  for (const candidate of candidates) {
    const candidatePath = path.join(backendRoot, candidate);
    if (existsSync(candidatePath)) {
      return candidatePath;
    }
  }

  return undefined;
}
