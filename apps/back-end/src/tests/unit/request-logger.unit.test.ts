import type { Request, Response } from 'express';
import { requestLogger } from '../../core/http/middleware/request-logger.js';

describe('requestLogger middleware', () => {
  let infoSpy: jest.SpyInstance;

  beforeEach(() => {
    infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs sanitized metadata and never exposes body or secret headers', () => {
    const listeners: Record<string, Array<(...args: any[]) => void>> = {};
    const req: Partial<Request> & { context?: { correlationId?: string } } = {
      method: 'POST',
      originalUrl: '/api/v1/auth/login?next=/dashboard',
      headers: {
        authorization: 'Bearer secret-token',
        cookie: 'session=abc',
        'set-cookie': ['ok=secret'],
      },
      body: {
        password: 'hunter2',
      },
      context: {
        correlationId: 'cid-log',
      },
    };

    const res: Response & { triggerFinish: () => void } = {
      statusCode: 201,
      on: ((event: string, callback: (...args: any[]) => void) => {
        (listeners[event] ??= []).push(callback);
        return res;
      }) as Response['on'],
      triggerFinish() {
        (listeners.finish ?? []).forEach((listener) => listener());
      },
    } as Response & { triggerFinish: () => void };

    const next = jest.fn();

    requestLogger(req as Request, res, next);
    expect(next).toHaveBeenCalled();
    res.triggerFinish();

    expect(infoSpy).toHaveBeenCalledTimes(2);
    const logs = infoSpy.mock.calls.map((call) => JSON.parse(call[0]));
    expect(logs[0]).toHaveProperty('route', '/api/v1/auth/*');
    expect(logs[1]).toHaveProperty('route', '/api/v1/auth/*');
    expect(logs[1]).toHaveProperty('status', 201);
    expect(logs[1]).toHaveProperty('durationMs');

    const combined = logs.map((entry) => JSON.stringify(entry)).join(' ');
    expect(combined).not.toContain('secret-token');
    expect(combined).not.toContain('hunter2');
    expect(combined.toLowerCase()).not.toContain('authorization');
    expect(combined.toLowerCase()).not.toContain('cookie');
    expect(combined.toLowerCase()).not.toContain('set-cookie');
  });
});
