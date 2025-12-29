import { jest } from '@jest/globals';
import { classifyFailure, FailureCategory } from '../failure-classifier.js';

describe('classifyFailure', () => {
  it('classifies EXT_ errorCode as RETRYABLE_EXTERNAL', () => {
    expect(classifyFailure({ errorCode: 'EXT_TIMEOUT' })).toBe('RETRYABLE_EXTERNAL');
  });
  it('classifies VALIDATION_FAILED as VALIDATION_ERROR', () => {
    expect(classifyFailure({ errorCode: 'VALIDATION_FAILED' })).toBe('VALIDATION_ERROR');
    expect(classifyFailure({ errorMessage: 'validation failed' })).toBe('VALIDATION_ERROR');
  });
  it('classifies POLICY_BLOCKED or gateResult BLOCKED as POLICY_BLOCKED', () => {
    expect(classifyFailure({ errorCode: 'POLICY_BLOCKED' })).toBe('POLICY_BLOCKED');
    expect(classifyFailure({ gateResult: 'BLOCKED' })).toBe('POLICY_BLOCKED');
  });
  it('classifies RATE_LIMITED as RATE_LIMITED', () => {
    expect(classifyFailure({ errorCode: 'RATE_LIMITED' })).toBe('RATE_LIMITED');
  });
  it('classifies TIMEOUT or errorMessage containing timeout as ACTION_TIMEOUT', () => {
    expect(classifyFailure({ errorCode: 'TIMEOUT' })).toBe('ACTION_TIMEOUT');
    expect(classifyFailure({ errorMessage: 'operation timeout' })).toBe('ACTION_TIMEOUT');
  });
  it('returns UNKNOWN_INTERNAL for unknown errors', () => {
    expect(classifyFailure({ errorCode: 'SOMETHING_ELSE' })).toBe('UNKNOWN_INTERNAL');
    expect(classifyFailure({})).toBe('UNKNOWN_INTERNAL');
  });
});
