import { describe, expect, test } from 'vitest';
import { isHoneypotTripped } from './feedbackAbuseGuard';

describe('isHoneypotTripped', () => {
  test('is false for an empty honeypot value', () => {
    expect(isHoneypotTripped('')).toBe(false);
  });

  test('is true when the honeypot field was filled in', () => {
    expect(isHoneypotTripped('www.spam.example')).toBe(true);
  });

  test('is false when the honeypot value is undefined', () => {
    expect(isHoneypotTripped(undefined)).toBe(false);
  });
});
