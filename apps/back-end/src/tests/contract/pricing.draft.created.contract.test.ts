import { z } from 'zod';
import { pricingDraftSchema } from '@mh-os/shared';

describe('Contract: pricing.draft.created event', () => {
  const EVENT_NAME = 'pricing.draft.created';
  const examplePayload = {
    id: 'draft1',
    brandId: 'brand1',
    channel: 'online',
    oldNet: 100,
    newNet: 120,
    status: 'PENDING',
    statusReason: 'Initial',
    createdById: 'user1',
    approvedById: 'user2',
    createdAt: new Date().toISOString(),
  };

  it('event name must not change', () => {
    expect(EVENT_NAME).toBe('pricing.draft.created');
  });

  it('payload must match pricingDraftSchema', () => {
    expect(() => pricingDraftSchema.parse(examplePayload)).not.toThrow();
  });

  it('fails if a required field is missing', () => {
    const { id, ...rest } = examplePayload;
    expect(() => pricingDraftSchema.parse(rest)).toThrow();
  });

  it('fails if a field type changes', () => {
    const bad = { ...examplePayload, oldNet: 'not-a-number' };
    expect(() => pricingDraftSchema.parse(bad)).toThrow();
  });
});
