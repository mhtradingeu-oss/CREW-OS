import { describe, it, test, expect } from "@jest/globals";
import { publish, subscribe } from '../../core/events/event-bus.js';

describe('event-bus correlationId propagation', () => {
  it('attaches correlationId from context', async () => {
    const randomUUIDSpy = jest
      .spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValue('11111111-1111-1111-1111-111111111111');

    const loggerSpy = jest.spyOn(console, 'info').mockImplementation(() => {});

    await publish('test.event', { foo: 1 }, { correlationId: 'cid-123' });

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('cid-123'),
    );

    randomUUIDSpy.mockRestore();
    loggerSpy.mockRestore();
  });

  it('generates correlationId if missing', async () => {
    const loggerSpy = jest.spyOn(console, 'info').mockImplementation(() => {});

    await publish('test.event', { foo: 2 }, {});

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('event.emitted'),
    );

    loggerSpy.mockRestore();
  });

  it('emits audit event for automation.action.denied with correlationId and explain', async () => {
    let received: unknown;

    subscribe('automation.action.denied', (event) => {
      received = event;
    });

    await publish(
      'automation.action.denied',
      { reason: 'test-deny', explain: { summary: 'deny' } },
      { correlationId: 'cid-audit' },
    );

    expect(received).toBeDefined();
    if (!received) {
      throw new Error('Expected event to be received');
    }

    const captured = received as {
      context: { correlationId: string };
      payload: { reason: string; explain: unknown };
    };

    expect(captured.context.correlationId).toBe('cid-audit');
    expect(captured.payload.reason).toBe('test-deny');
    expect(captured.payload.explain).toBeDefined();
  });

  it('emits audit event for ai.autonomy.decision with correlationId and explain', async () => {
    let received: unknown;

    subscribe('ai.autonomy.decision', (event) => {
      received = event;
    });

    await publish(
      'ai.autonomy.decision',
      { status: 'deny', explain: { summary: 'autonomy denied' } },
      { correlationId: 'cid-auto' },
    );

    expect(received).toBeDefined();
    if (!received) {
      throw new Error('Expected event to be received');
    }

    const captured = received as {
      context: { correlationId: string };
      payload: { status: string; explain: unknown };
    };

    expect(captured.context.correlationId).toBe('cid-auto');
    expect(captured.payload.status).toBe('deny');
    expect(captured.payload.explain).toBeDefined();
  });
});
