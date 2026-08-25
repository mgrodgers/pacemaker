import type { Duration } from './Duration';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

const MINUTES_PER_DAY = 1440;

function wrapMinutes(totalMinutes: number): number {
  return ((totalMinutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

/** A wall-clock time of day, stored as minutes since midnight (0-1439), for
 * the plan-level start/end time calculator. Arithmetic against a Duration
 * always rounds to the nearest minute and reports how many days the
 * result rolled across. */
export class ClockTime {
  private constructor(readonly minutesSinceMidnight: number) {}

  static parse(raw: string | null | undefined): ClockTime | null {
    if (raw == null) return null;
    const str = String(raw).trim();
    if (str === '') return null;
    const match = /^(\d{1,2}):(\d{2})$/.exec(str);
    if (!match) return null;
    const hours = Number.parseInt(match[1]!, 10);
    const minutes = Number.parseInt(match[2]!, 10);
    if (hours > 23 || minutes > 59) return null;
    return new ClockTime(hours * 60 + minutes);
  }

  static ofMinutes(totalMinutes: number): ClockTime {
    return new ClockTime(wrapMinutes(Math.round(totalMinutes)));
  }

  format(): string {
    const hours = Math.floor(this.minutesSinceMidnight / 60);
    const minutes = this.minutesSinceMidnight % 60;
    return `${pad2(hours)}:${pad2(minutes)}`;
  }

  /** Adds a Duration, rounding to the nearest minute. `dayOffset` is how
   * many days forward the result rolled (0 if none). */
  plus(duration: Duration): { time: ClockTime; dayOffset: number } {
    return this.offsetBy(Math.round(duration.seconds / 60));
  }

  /** Subtracts a Duration, rounding to the nearest minute. `dayOffset` is
   * how many days backward the result rolled (0 if none, negative
   * otherwise). */
  minus(duration: Duration): { time: ClockTime; dayOffset: number } {
    return this.offsetBy(-Math.round(duration.seconds / 60));
  }

  private offsetBy(deltaMinutes: number): { time: ClockTime; dayOffset: number } {
    const totalMinutes = this.minutesSinceMidnight + deltaMinutes;
    return { time: ClockTime.ofMinutes(totalMinutes), dayOffset: Math.floor(totalMinutes / MINUTES_PER_DAY) };
  }
}
