import { logger } from '../../core/logger.js';

describe('logger stable metadata', () => {
  const originalEnv = process.env.NODE_ENV;
  let infoSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env.NODE_ENV = originalEnv;
  });

  it('always emits JSON with the required stable fields', () => {
    logger.info('payload', {
      correlationId: 'cid-123',
      route: '/api/v1/foo',
      status: 201,
      durationMs: 42,
    });

    const entry = JSON.parse(infoSpy.mock.calls[0][0]);
    expect(entry).toMatchObject({
      timestamp: expect.any(String),
      level: 'info',
      service: process.env.SERVICE_NAME ?? 'crewos-back-end',
      env: originalEnv ?? 'development',
      correlationId: 'cid-123',
      route: '/api/v1/foo',
      status: 201,
      durationMs: 42,
    });
  });

  it('omits stack traces for error logs in production', () => {
    process.env.NODE_ENV = 'production';
    const err = new Error('boom');
    logger.error('boom', { correlationId: 'cid-err', error: err });
    const entry = JSON.parse(errorSpy.mock.calls[0][0]);
    expect(entry.error).toMatchObject({ name: 'Error', message: 'boom' });
    expect(entry.env).toBe('production');
    expect(entry.error.stack).toBeUndefined();
  });

  it('includes stack traces outside production', () => {
    process.env.NODE_ENV = 'development';
    const err = new Error('boom2');
    logger.error('boom2', { correlationId: 'cid-err', error: err });
    const entry = JSON.parse(errorSpy.mock.calls[0][0]);
    expect(entry.error).toMatchObject({ name: 'Error', message: 'boom2' });
    expect(entry.error.stack).toBeDefined();
  });
});
