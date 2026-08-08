import type { Units } from './Units';
import { KM_PER_MI } from './Distance';
import { Duration } from './Duration';

/** A running speed, canonically stored as seconds-per-kilometre. `null`
 * means "no pace" (e.g. a rest segment with no distance covered). */
export class Pace {
  private constructor(readonly secPerKm: number | null) {}

  static readonly none = new Pace(null);

  static ofSecPerKm(secPerKm: number | null | undefined): Pace {
    return new Pace(secPerKm == null ? null : secPerKm);
  }

  static parse(raw: string | null | undefined, units: Units): Pace | null {
    const duration = Duration.parse(raw);
    if (duration == null) return null;
    const secPerKm = units === 'mi' ? duration.seconds / KM_PER_MI : duration.seconds;
    return new Pace(secPerKm);
  }

  get isKnown(): boolean {
    return this.secPerKm != null && this.secPerKm > 0;
  }

  format(units: Units): string {
    if (!this.isKnown) return '—';
    const perUnit = units === 'mi' ? this.secPerKm! * KM_PER_MI : this.secPerKm!;
    return Duration.ofSeconds(perUnit).format();
  }
}
