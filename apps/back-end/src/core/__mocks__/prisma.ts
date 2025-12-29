import type { PrismaPromise } from "@prisma/client";

type RealPrisma = typeof import("../prisma.js").prisma;
type TransactionCallback = ((prisma: RealPrisma) => Promise<unknown>) | PrismaPromise<unknown>[];

const mockPrisma = {
  aISuggestion: {
    deleteMany: jest.fn(() => Promise.resolve({ count: 0 })),
    create: jest.fn((args: Parameters<RealPrisma["aISuggestion"]["create"]>[0]) =>
      Promise.resolve({ id: "mock-id", ...args?.data }),
    ),
    findUnique: jest.fn(() => Promise.resolve(null)),
    update: jest.fn((args: Parameters<RealPrisma["aISuggestion"]["update"]>[0]) =>
      Promise.resolve({ ...args?.data, id: args?.where?.id ?? "mock-id" }),
    ),
  },
  $transaction: jest.fn(async (callback: TransactionCallback) => {
    if (typeof callback === "function") {
      return await callback(mockPrisma as RealPrisma);
    }
    if (Array.isArray(callback)) {
      return Promise.all(callback);
    }
    return Promise.resolve([]);
  }),
} as unknown as Partial<RealPrisma>;

export const prisma = mockPrisma;
