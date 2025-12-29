import { prismaDbGateway } from "../infrastructure/db/prisma-db-gateway.js";
import type { DbGateway } from "../core/db/db-gateway.js";

let dbGatewayInstance: DbGateway | null = null;

export function getDbGateway(): DbGateway {
  if (!dbGatewayInstance) {
    dbGatewayInstance = prismaDbGateway;
  }
  return dbGatewayInstance;
}
