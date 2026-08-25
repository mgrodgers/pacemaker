import { describe, expect, test } from 'vitest';
import { ClockTime } from '../../../src/domain/valueObjects/ClockTime';
import { Duration } from '../../../src/domain/valueObjects/Duration';

describe('ClockTime.parse', () => {
  test('parses HH:MM', () => {
    expect(ClockTime.parse('06:30')?.minutesSinceMidnight).toBe(390);
  });

  test('accepts an unpadded hour', () => {
    expect(ClockTime.parse('6:30')?.minutesSinceMidnight).toBe(390);
  });

  test('rejects an hour or minute out of range', () => {
    expect(ClockTime.parse('24:00')).toBeNull();
    expect(ClockTime.parse('06:60')).toBeNull();
  });

  test('rejects unparseable input', () => {
    expect(ClockTime.parse('abc')).toBeNull();
    expect(ClockTime.parse('06-30')).toBeNull();
  });

  test('rejects empty and null input', () => {
    expect(ClockTime.parse('')).toBeNull();
    expect(ClockTime.parse('   ')).toBeNull();
    expect(ClockTime.parse(null)).toBeNull();
    expect(ClockTime.parse(undefined)).toBeNull();
  });
});

describe('ClockTime.format', () => {
  test('zero-pads hours and minutes', () => {
    expect(ClockTime.ofMinutes(9 * 60 + 5).format()).toBe('09:05');
  });

  test('midnight formats as 00:00', () => {
    expect(ClockTime.ofMinutes(0).format()).toBe('00:00');
  });
});

describe('ClockTime.plus', () => {
  test('adds a duration within the same day', () => {
    const result = ClockTime.parse('06:00')!.plus(Duration.parse('45:00')!);
    expect(result.time.format()).toBe('06:45');
    expect(result.dayOffset).toBe(0);
  });

  test('rolls forward past midnight', () => {
    const result = ClockTime.parse('23:30')!.plus(Duration.parse('60:00')!);
    expect(result.time.format()).toBe('00:30');
    expect(result.dayOffset).toBe(1);
  });

  test('rolls forward multiple days for a very long duration', () => {
    const result = ClockTime.parse('06:00')!.plus(Duration.ofSeconds(50 * 3600));
    expect(result.time.format()).toBe('08:00');
    expect(result.dayOffset).toBe(2);
  });

  test('rounds to the nearest minute', () => {
    const result = ClockTime.parse('06:00')!.plus(Duration.ofSeconds(2733));
    expect(result.time.format()).toBe('06:46');
  });
});

describe('ClockTime.minus', () => {
  test('subtracts a duration within the same day', () => {
    const result = ClockTime.parse('06:45')!.minus(Duration.parse('45:00')!);
    expect(result.time.format()).toBe('06:00');
    expect(result.dayOffset).toBe(0);
  });

  test('rolls backward past midnight', () => {
    const result = ClockTime.parse('00:30')!.minus(Duration.parse('60:00')!);
    expect(result.time.format()).toBe('23:30');
    expect(result.dayOffset).toBe(-1);
  });
});
