import { describe, expect, test } from 'vitest';
import { resample } from '../../../src/domain/services/ElevationResampler';

describe('resample', () => {
  test('a flat, evenly-spaced track resamples into buckets of zero grade', () => {
    const points = [
      { distanceM: 0, elevationM: 100 },
      { distanceM: 50, elevationM: 100 },
      { distanceM: 100, elevationM: 100 },
    ];
    const buckets = resample(points, 50);
    expect(buckets.every((b) => b.grade.decimal === 0)).toBe(true);
  });

  test('unevenly spaced points are resampled into consistent fixed-distance buckets', () => {
    const points = [
      { distanceM: 0, elevationM: 100 },
      { distanceM: 5, elevationM: 100.5 },
      { distanceM: 12, elevationM: 101.2 },
      { distanceM: 90, elevationM: 105 },
      { distanceM: 200, elevationM: 110 },
    ];
    const buckets = resample(points, 50);
    expect(buckets.every((b) => b.endM - b.startM === 50)).toBe(true);
    expect(buckets.map((b) => b.startM)).toEqual([0, 50, 100, 150]);
  });

  test('noisy elevation within a single bucket is smoothed by averaging, not passed through raw', () => {
    const noisy = [
      { distanceM: 0, elevationM: 100 },
      { distanceM: 10, elevationM: 130 },
      { distanceM: 20, elevationM: 70 },
      { distanceM: 30, elevationM: 130 },
      { distanceM: 40, elevationM: 70 },
      { distanceM: 50, elevationM: 100 },
      { distanceM: 100, elevationM: 100 },
    ];
    const buckets = resample(noisy, 50);
    // averaging within the first bucket should pull its representative
    // elevation back toward ~100, not track the raw +/-30m swings
    expect(buckets[0].grade.decimal).toBeCloseTo(0, 3);
  });
});
