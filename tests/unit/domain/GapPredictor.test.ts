import { describe, expect, test } from 'vitest';
import { Grade } from '../../../src/domain/valueObjects/Grade';
import { metabolicCost, actualPaceSecPerKm } from '../../../src/domain/services/GapPredictor';

describe('metabolicCost', () => {
  test('flat ground has the baseline Minetti cost of 3.6 J/kg/m', () => {
    expect(metabolicCost(Grade.flat)).toBeCloseTo(3.6, 6);
  });

  test('cost rises with uphill grade', () => {
    expect(metabolicCost(Grade.fromRiseAndRun(10, 100))).toBeGreaterThan(3.6);
  });

  test('cost falls for a moderate downhill grade', () => {
    expect(metabolicCost(Grade.fromRiseAndRun(-10, 100))).toBeLessThan(3.6);
  });

  test('cost falls further as downhill grade steepens toward the economy minimum', () => {
    const moderate = metabolicCost(Grade.fromRiseAndRun(-10, 100));
    const steeper = metabolicCost(Grade.fromRiseAndRun(-20, 100));
    expect(steeper).toBeLessThan(moderate);
  });

  test('cost rises again beyond the economy-minimum grade (very steep downhill)', () => {
    const nearMinimum = metabolicCost(Grade.fromRiseAndRun(-20, 100));
    const verySteep = metabolicCost(Grade.fromRiseAndRun(-30, 100));
    expect(verySteep).toBeGreaterThan(nearMinimum);
  });
});

describe('actualPaceSecPerKm', () => {
  const targetFlatPace = 341; // 5:41/km

  test('a flat course predicts the same actual pace as the target flat pace', () => {
    expect(actualPaceSecPerKm(targetFlatPace, Grade.flat)).toBeCloseTo(targetFlatPace, 6);
  });

  test('a sustained uphill grade predicts a slower actual pace (larger sec/km)', () => {
    expect(actualPaceSecPerKm(targetFlatPace, Grade.fromRiseAndRun(10, 100))).toBeGreaterThan(targetFlatPace);
  });

  test('a moderate sustained downhill grade predicts a faster actual pace (smaller sec/km)', () => {
    expect(actualPaceSecPerKm(targetFlatPace, Grade.fromRiseAndRun(-10, 100))).toBeLessThan(targetFlatPace);
  });

  test('a very steep downhill grade predicts pace slowing back down relative to the economy-minimum grade', () => {
    const nearMinimum = actualPaceSecPerKm(targetFlatPace, Grade.fromRiseAndRun(-20, 100));
    const verySteep = actualPaceSecPerKm(targetFlatPace, Grade.fromRiseAndRun(-30, 100));
    expect(verySteep).toBeGreaterThan(nearMinimum);
  });

  test('equal-magnitude uphill and downhill legs do not cancel out — net time exceeds the flat-pace time', () => {
    const grade = Grade.fromRiseAndRun(10, 100);
    const negGrade = Grade.fromRiseAndRun(-10, 100);
    const upPace = actualPaceSecPerKm(targetFlatPace, grade);
    const downPace = actualPaceSecPerKm(targetFlatPace, negGrade);
    // same 1km distance on each leg, so total time is just the pace sum
    expect(upPace + downPace).toBeGreaterThan(targetFlatPace * 2);
  });
});
