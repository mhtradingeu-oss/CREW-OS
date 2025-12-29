import { jest } from '@jest/globals';
import { computeLatencyMetrics, computeSuccessRate } from '../metrics.js';

describe('computeLatencyMetrics', () => {
  it('returns zeros for empty input', () => {
    expect(computeLatencyMetrics([])).toEqual({ avg: 0, p50: 0, p95: 0 });
  });
  it('computes avg, p50, p95 for single value', () => {
    expect(computeLatencyMetrics([100])).toEqual({ avg: 100, p50: 100, p95: 100 });
  });
  it('computes correct metrics for multiple values', () => {
    const metrics = computeLatencyMetrics([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
    expect(metrics.avg).toBe(55);
    expect(metrics.p50).toBe(60); // 10 values, 0.5*10=5, index 5 (0-based) = 60
    expect(metrics.p95).toBe(100); // 0.95*10=9.5, index 9 = 100
  });
});

describe('computeSuccessRate', () => {
  it('returns 0 for total=0', () => {
    expect(computeSuccessRate(0, 0)).toBe(0);
    expect(computeSuccessRate(5, 0)).toBe(0);
  });
  it('returns correct rate for successes/total', () => {
    expect(computeSuccessRate(5, 10)).toBe(0.5);
    expect(computeSuccessRate(10, 10)).toBe(1);
    expect(computeSuccessRate(0, 10)).toBe(0);
  });
});
