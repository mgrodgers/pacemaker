import { describe, expect, test } from 'vitest';
import { computeDerived, makeStep, newSegment } from '../../../src/domain/services/SegmentCalculator';
import { segmentId, stepId } from '../../../src/domain/valueObjects/Ids';

describe('computeDerived', () => {
  test('time-pace derives distance from time and pace', () => {
    const derived = computeDerived('time-pace', 600, 0, 390);
    expect(derived.distanceKm).toBeCloseTo(600 / 390, 5);
    expect(derived.timeSec).toBe(600);
    expect(derived.paceSecPerKm).toBe(390);
  });

  test('time-pace with no pace derives zero distance', () => {
    expect(computeDerived('time-pace', 600, 0, 0).distanceKm).toBe(0);
    expect(computeDerived('time-pace', 600, 0, null).distanceKm).toBe(0);
  });

  test('distance-pace derives time from distance and pace', () => {
    const derived = computeDerived('distance-pace', 0, 2, 330);
    expect(derived.timeSec).toBe(660);
  });

  test('distance-pace with no pace derives zero time', () => {
    expect(computeDerived('distance-pace', 0, 2, null).timeSec).toBe(0);
  });

  test('time-distance derives pace from time and distance', () => {
    const derived = computeDerived('time-distance', 480, 1.2, null);
    expect(derived.paceSecPerKm).toBeCloseTo(400, 5);
  });

  test('time-distance with zero distance derives a null pace, not Infinity', () => {
    expect(computeDerived('time-distance', 480, 0, null).paceSecPerKm).toBeNull();
  });
});

describe('makeStep', () => {
  test('defaults to a 0.4km step at 5:00/km pace, deriving time', () => {
    const step = makeStep(stepId('st1'));
    expect(step.mode).toBe('distance-pace');
    expect(step.distanceKm).toBe(0.4);
    expect(step.paceSecPerKm).toBe(300);
    expect(step.timeSec).toBeCloseTo(120, 5);
  });

  test('overrides recompute the derived field', () => {
    const step = makeStep(stepId('st1'), { mode: 'time-pace', timeSec: 120, paceSecPerKm: 300 });
    expect(step.distanceKm).toBeCloseTo(0.4, 5);
  });
});

describe('newSegment', () => {
  test('warmup preset is a 10-minute time-pace segment at 6:30/km', () => {
    const segment = newSegment(segmentId('s1'), 'warmup');
    expect(segment.mode).toBe('time-pace');
    expect(segment.timeSec).toBe(600);
    expect(segment.paceSecPerKm).toBe(390);
    expect(segment.reps).toBe(1);
    expect(segment.restEnabled).toBe(false);
    expect(segment.steps).toEqual([]);
  });

  test('interval preset defaults to 4 reps with rest enabled', () => {
    const segment = newSegment(segmentId('s1'), 'interval', [stepId('st1')]);
    expect(segment.reps).toBe(4);
    expect(segment.restEnabled).toBe(true);
  });

  test('interval builds one step per supplied step id, cycling preset paces', () => {
    const ids = [stepId('st1'), stepId('st2'), stepId('st3')];
    const segment = newSegment(segmentId('s1'), 'interval', ids);
    expect(segment.steps.map((s) => s.id)).toEqual(ids);
    expect(segment.steps.map((s) => s.paceSecPerKm)).toEqual([300, 315, 330]);
  });

  test('restDefault: false suppresses the interval default rest', () => {
    const segment = newSegment(segmentId('s1'), 'interval', [stepId('st1')], { restDefault: false });
    expect(segment.restEnabled).toBe(false);
  });

  test('non-interval types never get a steps ladder', () => {
    expect(newSegment(segmentId('s1'), 'rest').steps).toEqual([]);
    expect(newSegment(segmentId('s1'), 'tempo').steps).toEqual([]);
  });
});
