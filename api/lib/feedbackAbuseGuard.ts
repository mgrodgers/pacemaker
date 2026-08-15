/** True when the anti-bot decoy field was filled in — genuine submitters
 * never see or fill it, since it's visually hidden and out of tab order. */
export function isHoneypotTripped(honeypot: string | undefined): boolean {
  return Boolean(honeypot);
}

export interface RateLimiter {
  tryConsume(key: string): boolean;
}

/** Best-effort per-key rate limiter: resets on cold start since state is
 * only kept in memory for the life of a warm serverless invocation.
 * Acceptable for a short pilot; a shared store (e.g. Upstash) would be
 * needed for real abuse resistance across instances. */
export class InMemoryFixedWindowRateLimiter implements RateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly maxPerWindow: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now
  ) {}

  tryConsume(key: string): boolean {
    const windowStart = this.now() - this.windowMs;
    const timestamps = (this.hits.get(key) ?? []).filter((timestamp) => timestamp > windowStart);

    if (timestamps.length >= this.maxPerWindow) {
      this.hits.set(key, timestamps);
      return false;
    }

    timestamps.push(this.now());
    this.hits.set(key, timestamps);
    return true;
  }
}
