import { ActivityLogRepository } from '../../../core/db/repositories/activity-log.repository.js';

describe('ActivityLogRepository (append-only audit log)', () => {
  it('should only create (append) new audit records, never update or delete', async () => {
    // Spy on prisma create, update, delete
    const prisma = require('../../../core/prisma.js').prisma;
    const createSpy = jest.spyOn(prisma.activityLog, 'create');
    const updateSpy = jest.spyOn(prisma.activityLog, 'update');
    const deleteSpy = jest.spyOn(prisma.activityLog, 'delete');

    // Append a new activity log
    await ActivityLogRepository.appendActivity({
      name: 'test.event',
      payload: { entityType: 'TestEntity', entityId: 'E1', action: 'test', metadata: { foo: 'bar' } },
      context: {},
      occurredAt: new Date(),
    });

    expect(createSpy).toHaveBeenCalled();
    expect(updateSpy).not.toHaveBeenCalled();
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('should retrieve audit records deterministically by entity', async () => {
    // Insert two records for the same entity
    await ActivityLogRepository.appendActivity({
      name: 'test.event',
      payload: { entityType: 'TestEntity', entityId: 'E2', action: 'test1' },
      context: {},
      occurredAt: new Date(),
    });
    await ActivityLogRepository.appendActivity({
      name: 'test.event',
      payload: { entityType: 'TestEntity', entityId: 'E2', action: 'test2' },
      context: {},
      occurredAt: new Date(),
    });
    const records = await ActivityLogRepository.getActivityByEntity('TestEntity', 'E2');
    expect(records.length).toBeGreaterThanOrEqual(2);
    expect(records[0].meta?.entityId).toBe('E2');
    expect(records[0].meta?.entityType).toBe('TestEntity');
  });
});
