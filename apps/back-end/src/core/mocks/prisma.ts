import { jest } from "@jest/globals";

export const prisma = {
  aISuggestion: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  crmTask: {
    create: jest.fn(async ({ data }) => ({
      id: "mock-crm-task",
      ...data,
    })),
  },
} as const;
