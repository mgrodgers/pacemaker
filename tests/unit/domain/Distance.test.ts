import { describe, expect, test } from 'vitest';
import { Distance } from '../../../src/domain/valueObjects/Distance';

describe('Distance.parse', () => {
  test('km input is stored verbatim', () => {
    expect(Distance.parse('5', 'km')?.km).toBe(5);
  });

  test('mi input converts to canonical km', () => {
    expect(Distance.parse('5', 'mi')?.km).toBeCloseTo(8.0467, 3);
  });

  test('rejects unparseable input', () => {
    expect(Distance.parse('abc', 'km')).toBeNull();
  });
});

describe('Distance.format', () => {
  test('formats in km unchanged', () => {
    expect(Distance.ofKm(5).format('km')).toBe('5');
  });

  test('formats in mi converted and rounded to 2dp', () => {
    expect(Distance.ofKm(5).format('mi')).toBe('3.11');
  });

  test('rounds toUnitValue to 2 decimal places', () => {
    expect(Distance.ofKm(1.23456).toUnitValue('km')).toBe(1.23);
  });
});

describe('Distance.plus', () => {
  test('sums canonical km', () => {
    expect(Distance.ofKm(2).plus(Distance.ofKm(3)).km).toBe(5);
  });
});
