import { describe, expect, test } from 'vitest';
import { bestWindow, findBestEfforts } from '../../../src/domain/services/BestEffortFinder';
import { buildProfile, expandInstances } from '../../../src/domain/services/PlanProfileBuilder';
import { segmentId } from '../../../src/domain/valueObjects/Ids';
import type { Segment } from '../../../src/domain/entities/Segment';

function uniformSegment(id: string, distanceKm: number, paceSecPerKm: number): Segment {
  return {
    id: segmentId(id),
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

describe('bestWindow', () => {
  test('a plan shorter than the requested distance has no best effort', () => {
    const profile = buildProfile(expandInstances([uniformSegment('s1', 3, 270)]));
    expect(bestWindow(profile, profile.totalDistanceKm, 5)).toBeNull();
  });

  test('a plan exactly matching the requested distance uses the whole plan', () => {
    const profile = buildProfile(expandInstances([uniformSegment('s1', 5, 270)]));
    expect(bestWindow(profile, profile.totalDistanceKm, 5)).toBe(1350);
  });

  test('any sub-window of a uniform-pace plan takes distance times pace', () => {
    const profile = buildProfile(expandInstances([uniformSegment('s1', 5, 270)]));
    expect(bestWindow(profile, profile.totalDistanceKm, 1)).toBe(270);
  });

  test('picks the fastest window, not the plan average', () => {
    const profile = buildProfile(
      expandInstances([uniformSegment('fast', 2, 200), uniformSegment('slow', 2, 300)])
    );
    // whole-plan average pace is 250/km, but the best 2km is the fast segment alone: 400s.
    expect(bestWindow(profile, profile.totalDistanceKm, 2)).toBe(400);
  });

  test('a window can straddle a segment boundary and still find the fastest slice', () => {
    // fast(1km@200) + slow(3km@300): the fastest 2km is 1km fast + 1km slow = 200+300=500,
    // beating any 2km fully inside the slow segment (600).
    const profile = buildProfile(
      expandInstances([uniformSegment('fast', 1, 200), uniformSegment('slow', 3, 300)])
    );
    expect(bestWindow(profile, profile.totalDistanceKm, 2)).toBe(500);
  });
});

describe('findBestEfforts', () => {
  test('reports null for every standard distance the plan does not cover', () => {
    const profile = buildProfile(expandInstances([uniformSegment('s1', 5, 270)]));
    const efforts = findBestEfforts(profile, profile.totalDistanceKm);
    const byKey = Object.fromEntries(efforts.map((e) => [e.key, e]));
    expect(byKey['1k']!.timeSec).toBe(270);
    expect(byKey['5k']!.timeSec).toBe(1350);
    expect(byKey['10k']!.timeSec).toBeNull();
    expect(byKey['15k']!.timeSec).toBeNull();
    expect(byKey['hm']!.timeSec).toBeNull();
  });

  test('pace is time divided by the standard distance', () => {
    const profile = buildProfile(expandInstances([uniformSegment('s1', 5, 270)]));
    const oneK = findBestEfforts(profile, profile.totalDistanceKm).find((e) => e.key === '1k')!;
    expect(oneK.paceSecPerKm).toBeCloseTo(270, 5);
  });
});
