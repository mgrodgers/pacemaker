import { describe, expect, test } from 'vitest';
import { Pace } from '../../../src/domain/valueObjects/Pace';

describe('Pace.parse', () => {
  test('km pace is stored verbatim as seconds-per-km', () => {
    expect(Pace.parse('4:30', 'km')?.secPerKm).toBe(270);
  });

  test('mi pace converts to canonical seconds-per-km', () => {
    expect(Pace.parse('4:30', 'mi')?.secPerKm).toBeCloseTo(167.78, 1);
  });

  test('rejects unparseable input', () => {
    expect(Pace.parse('abc', 'km')).toBeNull();
  });
});

describe('Pace.format', () => {
  test('formats a known pace with units suffix omitted (caller appends it)', () => {
    expect(Pace.ofSecPerKm(270).format('km')).toBe('4:30');
  });

  test('converts canonical seconds-per-km to seconds-per-mile for display', () => {
    expect(Pace.ofSecPerKm(270).format('mi')).toBe('7:15');
  });

  test('unknown pace formats as an em dash', () => {
    expect(Pace.none.format('km')).toBe('—');
    expect(Pace.ofSecPerKm(0).format('km')).toBe('—');
  });
});

describe('Pace.isKnown', () => {
  test('is false for null or non-positive pace', () => {
    expect(Pace.none.isKnown).toBe(false);
    expect(Pace.ofSecPerKm(0).isKnown).toBe(false);
  });

  test('is true for a positive pace', () => {
    expect(Pace.ofSecPerKm(270).isKnown).toBe(true);
  });
});
