import { jest } from "@jest/globals";

export const prisma = {
  aISuggestion: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
} as const;
