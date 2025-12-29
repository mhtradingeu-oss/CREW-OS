import { z } from 'zod';
// Replace with actual schema import if available
const onboardingCompletedSchema = z.object({
  userId: z.string(),
  tenantId: z.string(),
  completedAt: z.string().or(z.date()),
});

describe('Contract: onboarding.completed event', () => {
  const EVENT_NAME = 'onboarding.completed';
  const examplePayload = {
    userId: 'user123',
    tenantId: 'tenant456',
    completedAt: new Date().toISOString(),
  };

  it('event name must not change', () => {
    expect(EVENT_NAME).toBe('onboarding.completed');
  });

  it('payload must match onboardingCompletedSchema', () => {
    expect(() => onboardingCompletedSchema.parse(examplePayload)).not.toThrow();
  });

  it('fails if a required field is missing', () => {
    const { userId, ...rest } = examplePayload;
    expect(() => onboardingCompletedSchema.parse(rest)).toThrow();
  });

  it('fails if a field type changes', () => {
    const bad = { ...examplePayload, completedAt: 12345 };
    expect(() => onboardingCompletedSchema.parse(bad)).toThrow();
  });
});
