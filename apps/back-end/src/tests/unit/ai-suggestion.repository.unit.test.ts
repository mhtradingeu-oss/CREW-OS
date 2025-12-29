import { jest } from '@jest/globals';
import { AISuggestionRepository } from '../../core/db/repositories/ai-suggestions.repository.js';

const mockPrisma = {
  aISuggestion: {
    findMany: jest.fn(() => Promise.resolve([])),
    update: jest.fn((args: any) => Promise.resolve({ id: args.where?.id ?? 'mock-id', ...args.data })),
  },
};

describe('AISuggestionRepository (unit, prisma mocked)', () => {
  let repo: AISuggestionRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new AISuggestionRepository(mockPrisma as any);
  });

  it('calls prisma.aISuggestion.findMany and returns mock result', async () => {
    const result = await repo.listSuggestions();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([]);
    expect(mockPrisma.aISuggestion.findMany).toHaveBeenCalled();
  });

  it('updates suggestion executed via prisma mock', async () => {
    const output = { foo: 'bar' };
    const result = await repo.markSuggestionExecuted('s1', output);
    expect(result).toHaveProperty('status', 'executed');
    expect(mockPrisma.aISuggestion.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: expect.objectContaining({ status: 'executed' }),
    });
  });
});
