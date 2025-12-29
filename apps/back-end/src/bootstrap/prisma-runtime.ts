import { logger } from "../core/logger.js";
import { prisma } from "../core/prisma.js";

let prismaInitialized = false;

export async function initPrisma() {
  if (prismaInitialized) return;
  try {
    await prisma.$connect();
    prismaInitialized = true;
    logger.info("Prisma connected");
  } catch (error) {
    logger.error("Failed to connect Prisma", { error });
    throw error;
  }
}

export async function shutdownPrisma() {
  if (!prismaInitialized) return;
  try {
    await prisma.$disconnect();
    logger.info("Prisma disconnected");
  } catch (error) {
    logger.error("Failed to disconnect Prisma", { error });
    throw error;
  } finally {
    prismaInitialized = false;
  }
}
