function pad2(n: number): string {
  return String(Math.round(n)).padStart(2, '0');
}

/** A span of time, canonically stored in seconds. Parsing treats a bare
 * number (no colon) as minutes, matching how runners write "8" for 8:00. */
export class Duration {
  private constructor(readonly seconds: number) {}

  static readonly zero = new Duration(0);

  static ofSeconds(seconds: number): Duration {
    return new Duration(Number.isFinite(seconds) ? seconds : 0);
  }

  static parse(raw: string | null | undefined): Duration | null {
    if (raw == null) return null;
    const str = String(raw).trim();
    if (str === '') return null;
    if (str.includes(':')) {
      const parts = str.split(':').map((p) => Number.parseFloat(p));
      if (parts.some((p) => Number.isNaN(p))) return null;
      let sec = 0;
      for (const p of parts) sec = sec * 60 + p;
      return new Duration(sec);
    }
    const value = Number.parseFloat(str);
    if (Number.isNaN(value)) return null;
    return new Duration(value * 60);
  }

  format(): string {
    if (!Number.isFinite(this.seconds)) return '—';
    const total = Math.max(0, Math.round(this.seconds));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return h > 0 ? `${h}:${pad2(m)}:${pad2(s)}` : `${m}:${pad2(s)}`;
  }

  plus(other: Duration): Duration {
    return new Duration(this.seconds + other.seconds);
  }

  scale(factor: number): Duration {
    return new Duration(this.seconds * factor);
  }
}
