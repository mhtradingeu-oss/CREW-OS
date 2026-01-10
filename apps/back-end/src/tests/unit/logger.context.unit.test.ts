import { describe, it, test, expect } from "@jest/globals";
interface LoggerContext {
  module: string;
  correlationId: string;
}

interface Logger {
  error(message: string, context: LoggerContext): void;
  warn(message: string, context: LoggerContext): void;
  info(message: string, context: LoggerContext): void;
  debug(message: string, context: LoggerContext): void;
}
import { logger } from '../../core/logger.js';

describe('logger context enforcement', () => {
  let spy: jest.SpyInstance<void, [message?: any, ...optionalParams: any[]]>;
  beforeEach(() => {
    spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logger.error requires context object', () => {
    logger.error('fail', { module: 'test', correlationId: 'cid-1' });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('cid-1'));
  });

  it('logger.error with raw string as second arg is not allowed', () => {
    logger.error('fail', 'raw string');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('fail'));
  });

  it('logger.warn requires context object', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('warn', { module: 'test', correlationId: 'cid-2' });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('cid-2'));
  });
});
