import { describe, expect, test } from 'vitest';
import { Duration } from '../../../src/domain/valueObjects/Duration';

describe('Duration.parse', () => {
  test('treats a bare number as minutes', () => {
    expect(Duration.parse('8')?.seconds).toBe(480);
  });

  test('parses mm:ss', () => {
    expect(Duration.parse('8:30')?.seconds).toBe(510);
  });

  test('parses h:mm:ss', () => {
    expect(Duration.parse('1:02:03')?.seconds).toBe(3723);
  });

  test('rejects unparseable input', () => {
    expect(Duration.parse('abc')).toBeNull();
    expect(Duration.parse('1:ab')).toBeNull();
  });

  test('rejects empty and null input', () => {
    expect(Duration.parse('')).toBeNull();
    expect(Duration.parse('   ')).toBeNull();
    expect(Duration.parse(null)).toBeNull();
    expect(Duration.parse(undefined)).toBeNull();
  });
});

describe('Duration.format', () => {
  test('formats under an hour as m:ss', () => {
    expect(Duration.ofSeconds(510).format()).toBe('8:30');
  });

  test('formats an hour or more as h:mm:ss', () => {
    expect(Duration.ofSeconds(3723).format()).toBe('1:02:03');
  });

  test('rounds to the nearest second', () => {
    expect(Duration.ofSeconds(89.6).format()).toBe('1:30');
  });

  test('zero formats as 0:00', () => {
    expect(Duration.zero.format()).toBe('0:00');
  });
});

describe('Duration arithmetic', () => {
  test('plus adds seconds', () => {
    expect(Duration.ofSeconds(90).plus(Duration.ofSeconds(30)).seconds).toBe(120);
  });

  test('scale multiplies seconds', () => {
    expect(Duration.ofSeconds(90).scale(3).seconds).toBe(270);
  });
});
