import { describe, expect, test } from 'vitest';
import { InMemoryFixedWindowRateLimiter, isHoneypotTripped } from './feedbackAbuseGuard.js';

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

describe('InMemoryFixedWindowRateLimiter', () => {
  test('allows up to maxPerWindow submissions per key', () => {
    const limiter = new InMemoryFixedWindowRateLimiter(2, 1000);
    expect(limiter.tryConsume('1.2.3.4')).toBe(true);
    expect(limiter.tryConsume('1.2.3.4')).toBe(true);
  });

  test('rejects the (maxPerWindow + 1)th submission within the window', () => {
    const limiter = new InMemoryFixedWindowRateLimiter(2, 1000);
    limiter.tryConsume('1.2.3.4');
    limiter.tryConsume('1.2.3.4');
    expect(limiter.tryConsume('1.2.3.4')).toBe(false);
  });

  test('allows a submission again once the window has passed, via an injectable clock', () => {
    let now = 0;
    const limiter = new InMemoryFixedWindowRateLimiter(1, 1000, () => now);
    expect(limiter.tryConsume('1.2.3.4')).toBe(true);
    expect(limiter.tryConsume('1.2.3.4')).toBe(false);
    now += 1001;
    expect(limiter.tryConsume('1.2.3.4')).toBe(true);
  });

  test('tracks separate keys independently', () => {
    const limiter = new InMemoryFixedWindowRateLimiter(1, 1000);
    expect(limiter.tryConsume('a')).toBe(true);
    expect(limiter.tryConsume('b')).toBe(true);
  });
});
