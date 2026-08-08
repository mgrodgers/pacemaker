import { describe, expect, test } from 'vitest';
import { summarizePlan } from '../../../src/domain/services/PlanSummaryCalculator';
import { segmentId } from '../../../src/domain/valueObjects/Ids';
import type { Segment } from '../../../src/domain/entities/Segment';

function uniformSegment(distanceKm: number, paceSecPerKm: number): Segment {
  return {
    id: segmentId('s1'),
    type: 'easy',
    mode: 'distance-pace',
    timeSec: distanceKm * paceSecPerKm,
    distanceKm,
    paceSecPerKm,
    reps: 1,
    restEnabled: false,
    restMode: 'time-distance',
    restTimeSec: 0,
    restDistanceKm: 0,
    restPaceSecPerKm: null,
    steps: [],
  };
}

describe('summarizePlan', () => {
  test('an empty plan has zero totals, no average pace, and no best efforts', () => {
    const summary = summarizePlan([]);
    expect(summary.totalDistanceKm).toBe(0);
    expect(summary.totalTimeSec).toBe(0);
    expect(summary.avgPaceSecPerKm).toBeNull();
    expect(summary.bestEfforts.every((e) => e.timeSec === null)).toBe(true);
  });

  test('average pace is total time over total distance', () => {
    const summary = summarizePlan([uniformSegment(5, 270)]);
    expect(summary.avgPaceSecPerKm).toBeCloseTo(270, 5);
  });

  test('a plan covering exactly 1km has a 1k best effort equal to its total time', () => {
    const summary = summarizePlan([uniformSegment(1, 300)]);
    const oneK = summary.bestEfforts.find((e) => e.key === '1k')!;
    expect(oneK.timeSec).toBe(300);
  });
});
