import { describe, it, test, expect } from "@jest/globals";
import { ActivityLogRepository } from '../../core/db/repositories/activity-log.repository.js';

/**
 * This is a UNIT test.
 * We do NOT import the real Prisma client.
 * We mock only the activityLog delegate used by the repository.
 */

const mockPrisma = {
  activityLog: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
};

beforeAll(() => {
  // Patch the repository's internal prisma reference
  jest
    .spyOn(ActivityLogRepository as any, 'prisma', 'get')
    .mockReturnValue(mockPrisma);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('ActivityLogRepository (append-only audit log)', () => {
  it('should only create (append) new audit records, never update or delete', async () => {
    await ActivityLogRepository.appendActivity({
      name: 'test.event',
      payload: {
        entityType: 'TestEntity',
        entityId: 'E1',
        action: 'test',
        metadata: { foo: 'bar' },
      },
      context: {},
      occurredAt: new Date(),
    });

    expect(mockPrisma.activityLog.create).toHaveBeenCalled();
    expect(mockPrisma.activityLog.update).not.toHaveBeenCalled();
    expect(mockPrisma.activityLog.delete).not.toHaveBeenCalled();
  });

  it('should retrieve audit records deterministically by entity', async () => {
    mockPrisma.activityLog.findMany.mockResolvedValue([
      {
        meta: { entityType: 'TestEntity', entityId: 'E2' },
      },
      {
        meta: { entityType: 'TestEntity', entityId: 'E2' },
      },
    ]);

    const records = await ActivityLogRepository.getActivityByEntity(
      'TestEntity',
      'E2',
    );

    expect(records.length).toBeGreaterThanOrEqual(2);
    expect(records[0].meta?.entityId).toBe('E2');
    expect(records[0].meta?.entityType).toBe('TestEntity');
  });
});
