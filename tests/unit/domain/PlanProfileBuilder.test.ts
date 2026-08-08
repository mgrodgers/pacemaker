import { describe, expect, test } from 'vitest';
import { buildProfile, expandInstances, timeAtDistance } from '../../../src/domain/services/PlanProfileBuilder';
import { segmentId, stepId } from '../../../src/domain/valueObjects/Ids';
import type { Segment } from '../../../src/domain/entities/Segment';

function simpleSegment(overrides: Partial<Segment> = {}): Segment {
  return {
    id: segmentId('s1'),
    type: 'easy',
    mode: 'distance-pace',
    timeSec: 300,
    distanceKm: 1,
    paceSecPerKm: 300,
    reps: 1,
    restEnabled: false,
    restMode: 'time-distance',
    restTimeSec: 0,
    restDistanceKm: 0,
    restPaceSecPerKm: null,
    steps: [],
    ...overrides,
  };
}

function intervalSegment(overrides: Partial<Segment> = {}): Segment {
  return simpleSegment({
    id: segmentId('interval'),
    type: 'interval',
    reps: 2,
    restEnabled: true,
    restTimeSec: 90,
    restDistanceKm: 0,
    restPaceSecPerKm: null,
    steps: [
      { id: stepId('st1'), mode: 'distance-pace', timeSec: 120, distanceKm: 0.4, paceSecPerKm: 300 },
      { id: stepId('st2'), mode: 'distance-pace', timeSec: 126, distanceKm: 0.4, paceSecPerKm: 315 },
    ],
    ...overrides,
  });
}

describe('expandInstances', () => {
  test('non-interval segments produce exactly one instance each', () => {
    const instances = expandInstances([simpleSegment(), simpleSegment({ id: segmentId('s2') })]);
    expect(instances).toHaveLength(2);
  });

  test('interval reps repeat every step in the ladder', () => {
    const instances = expandInstances([intervalSegment({ restEnabled: false })]);
    expect(instances).toHaveLength(4); // 2 steps x 2 reps, no rest
    expect(instances.map((i) => i.paceSecPerKm)).toEqual([300, 315, 300, 315]);
  });

  test('rest between reps is inserted after every rep except the last', () => {
    const instances = expandInstances([intervalSegment()]);
    // step, step, rest, step, step — no trailing rest after the final rep
    expect(instances.map((i) => i.isRest ?? false)).toEqual([false, false, true, false, false]);
  });

  test('rest between reps is skipped entirely when reps is 1', () => {
    const instances = expandInstances([intervalSegment({ reps: 1 })]);
    expect(instances.some((i) => i.isRest)).toBe(false);
  });
});

describe('buildProfile', () => {
  test('accumulates distance and time across instances', () => {
    const { totalDistanceKm, totalTimeSec, points } = buildProfile(
      expandInstances([simpleSegment({ distanceKm: 1, timeSec: 300 }), simpleSegment({ id: segmentId('s2'), distanceKm: 2, timeSec: 600 })])
    );
    expect(totalDistanceKm).toBe(3);
    expect(totalTimeSec).toBe(900);
    expect(points[0]!.distStart).toBe(0);
    expect(points[0]!.distEnd).toBe(1);
    expect(points[1]!.distStart).toBe(1);
    expect(points[1]!.distEnd).toBe(3);
  });

  test('an empty plan has zero totals and no points', () => {
    const profile = buildProfile(expandInstances([]));
    expect(profile.totalDistanceKm).toBe(0);
    expect(profile.totalTimeSec).toBe(0);
    expect(profile.points).toEqual([]);
  });
});

describe('timeAtDistance', () => {
  test('interpolates linearly within a single instance', () => {
    const profile = buildProfile(expandInstances([simpleSegment({ distanceKm: 2, timeSec: 600 })]));
    expect(timeAtDistance(profile, 1)).toBe(300); // halfway through a uniform-pace km
  });

  test('is exact at instance boundaries', () => {
    const profile = buildProfile(
      expandInstances([simpleSegment({ distanceKm: 1, timeSec: 300 }), simpleSegment({ id: segmentId('s2'), distanceKm: 1, timeSec: 400 })])
    );
    expect(timeAtDistance(profile, 1)).toBe(300);
    expect(timeAtDistance(profile, 2)).toBe(700);
  });

  test('clamps to the start for distances at or before zero', () => {
    const profile = buildProfile(expandInstances([simpleSegment()]));
    expect(timeAtDistance(profile, 0)).toBe(0);
    expect(timeAtDistance(profile, -5)).toBe(0);
  });

  test('clamps to the total for distances beyond the plan', () => {
    const profile = buildProfile(expandInstances([simpleSegment({ distanceKm: 1, timeSec: 300 })]));
    expect(timeAtDistance(profile, 999)).toBe(300);
  });

  test('an empty profile returns zero everywhere', () => {
    const profile = buildProfile(expandInstances([]));
    expect(timeAtDistance(profile, 5)).toBe(0);
  });
});
