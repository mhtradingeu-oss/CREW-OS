
import { PrismaClient } from "@prisma/client";
import { logger } from "./logger.js";
import { getNormalizedDatabaseUrl, checkEnvSafety } from "./config/env-guard.js";
import { enforceReadOnlyMutation } from "./prisma-read-only-guard.js";

type PrismaClientWithCrmTask = PrismaClient & {
  readonly crmTask: PrismaClient["cRMTask"];
};

declare global {
  var prisma: PrismaClientWithCrmTask | undefined;
}



// Strict environment guard for DB safety
// Throws immediately if NODE_ENV/DATABASE_URL combination is forbidden
if (process.env.NODE_ENV !== 'test') {
  checkEnvSafety();
}

const prismaClientOptions: ConstructorParameters<typeof PrismaClient>[0] = {
  log: ["query", "info", "warn", "error"],
  datasources: {
    db: {
      url: getNormalizedDatabaseUrl(),
    },
  },
};

const basePrisma = global.prisma ?? new PrismaClient(prismaClientOptions);
export const prisma = basePrisma as PrismaClientWithCrmTask;
ensureCrmTaskAlias(prisma);

if (process.env.NODE_ENV !== "test") {
  prisma.$use(async (params, next) => {
    enforceReadOnlyMutation(params.action);
    const start = Date.now();
    try {
      const result = await next(params);
      const duration = Date.now() - start;
      if (duration >= 25) {
        logger.debug(`[db] ${params.model ?? "raw"}.${params.action} (${duration}ms)`);
      }
      return result;
    } catch (error) {
      logger.warn(`[db] ${params.model ?? "raw"}.${params.action} failed`, { error });
      throw error;
    }
  });
}

// Prevent multiple instances in dev
if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

function ensureCrmTaskAlias(instance: PrismaClientWithCrmTask) {
  if (Object.getOwnPropertyDescriptor(instance, "crmTask")) {
    return;
  }
  Object.defineProperty(instance, "crmTask", {
    configurable: true,
    enumerable: false,
    get() {
      return instance.cRMTask;
    },
  });
}

export type PrismaArgs<T extends (...args: any) => any> = NonNullable<Parameters<T>[0]>;
export type PrismaSelect<T extends (...args: any) => any> = PrismaArgs<T>["select"];
export type PrismaWhere<T extends (...args: any) => any> = PrismaArgs<T>["where"];
export type PrismaData<T extends (...args: any) => any> = PrismaArgs<T>["data"];
