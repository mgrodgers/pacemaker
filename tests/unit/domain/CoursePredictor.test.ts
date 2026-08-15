import { describe, expect, test } from 'vitest';
import { predictCourseTime } from '../../../src/domain/services/CoursePredictor';

function flatTrack(distanceM: number): { distanceM: number; elevationM: number }[] {
  return [
    { distanceM: 0, elevationM: 50 },
    { distanceM: distanceM, elevationM: 50 },
  ];
}

describe('predictCourseTime', () => {
  const targetFlatPace = 300; // 5:00/km

  test('a flat course predicts the same total time as the target flat pace times the course distance', () => {
    const prediction = predictCourseTime(flatTrack(3000), targetFlatPace);
    expect(prediction.totalTimeSec).toBeCloseTo(300 * 3, 1);
  });

  test('a hilly course produces a per-kilometre split for each kilometre covered', () => {
    const hilly = [
      { distanceM: 0, elevationM: 0 },
      { distanceM: 1000, elevationM: 50 }, // 5% climb
      { distanceM: 2000, elevationM: 0 }, // 5% descent
    ];
    const prediction = predictCourseTime(hilly, targetFlatPace);
    expect(prediction.splits).toHaveLength(2);
    expect(prediction.splits[0].km).toBe(1);
    expect(prediction.splits[1].km).toBe(2);
  });

  test('each split reports its own grade and pace, distinct for climbing vs descending kilometres', () => {
    const hilly = [
      { distanceM: 0, elevationM: 0 },
      { distanceM: 1000, elevationM: 50 },
      { distanceM: 2000, elevationM: 0 },
    ];
    const prediction = predictCourseTime(hilly, targetFlatPace);
    expect(prediction.splits[0].paceSecPerKm).toBeGreaterThan(targetFlatPace); // uphill km, slower
    expect(prediction.splits[1].paceSecPerKm).toBeLessThan(targetFlatPace); // downhill km, faster
  });

  test('the sum of per-kilometre split times equals the reported total predicted time', () => {
    const hilly = [
      { distanceM: 0, elevationM: 0 },
      { distanceM: 1500, elevationM: 80 },
      { distanceM: 3200, elevationM: 10 },
    ];
    const prediction = predictCourseTime(hilly, targetFlatPace);
    const summedSplits = prediction.splits.reduce((sum, s) => sum + s.timeSec, 0);
    expect(summedSplits).toBeCloseTo(prediction.totalTimeSec, 6);
  });
});
