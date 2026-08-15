import { describe, expect, test } from 'vitest';
import { Grade } from '../../../src/domain/valueObjects/Grade';

describe('Grade.fromRiseAndRun', () => {
  test('a flat run has zero grade', () => {
    expect(Grade.fromRiseAndRun(0, 100).decimal).toBe(0);
  });

  test('a 10m rise over 100m run is a 10% (0.10) grade', () => {
    expect(Grade.fromRiseAndRun(10, 100).decimal).toBeCloseTo(0.1, 6);
  });

  test('a descent is a negative grade', () => {
    expect(Grade.fromRiseAndRun(-10, 100).decimal).toBeCloseTo(-0.1, 6);
  });

  test('zero run distance is treated as flat rather than dividing by zero', () => {
    expect(Grade.fromRiseAndRun(5, 0).decimal).toBe(0);
  });
});

describe('Grade.percent', () => {
  test('reports the grade as a whole-number percent for display', () => {
    expect(Grade.fromRiseAndRun(10, 100).percent).toBe(10);
    expect(Grade.fromRiseAndRun(-2.5, 100).percent).toBe(-2.5);
  });
});
