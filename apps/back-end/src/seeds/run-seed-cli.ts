import { prisma } from "../core/prisma.js";

export async function runSeedCli(
  description: string,
  action: () => Promise<unknown>,
): Promise<number> {
  try {
    await action();
    console.log(`✅ ${description} seed completed`);
    return 0;
  } catch (error) {
    console.error(`❌ ${description} seed failed`, error);
    return 1;
  } finally {
    await prisma.$disconnect();
  }
}
