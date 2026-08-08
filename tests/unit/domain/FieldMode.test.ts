import { describe, expect, test } from 'vitest';
import { isFieldEditable } from '../../../src/domain/valueObjects/FieldMode';

describe('isFieldEditable', () => {
  test('time-pace mode: time and pace are editable, distance is derived', () => {
    expect(isFieldEditable('time-pace', 'time')).toBe(true);
    expect(isFieldEditable('time-pace', 'pace')).toBe(true);
    expect(isFieldEditable('time-pace', 'distance')).toBe(false);
  });

  test('distance-pace mode: distance and pace are editable, time is derived', () => {
    expect(isFieldEditable('distance-pace', 'distance')).toBe(true);
    expect(isFieldEditable('distance-pace', 'pace')).toBe(true);
    expect(isFieldEditable('distance-pace', 'time')).toBe(false);
  });

  test('time-distance mode: time and distance are editable, pace is derived', () => {
    expect(isFieldEditable('time-distance', 'time')).toBe(true);
    expect(isFieldEditable('time-distance', 'distance')).toBe(true);
    expect(isFieldEditable('time-distance', 'pace')).toBe(false);
  });
});
