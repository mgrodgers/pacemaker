import type { Units } from './Units';

export const KM_PER_MI = 1.60934;

/** A length, canonically stored in kilometres regardless of the units the
 * plan is currently displayed in. */
export class Distance {
  private constructor(readonly km: number) {}

  static readonly zero = new Distance(0);

  static ofKm(km: number): Distance {
    return new Distance(Number.isFinite(km) ? km : 0);
  }

  static parse(raw: string | null | undefined, units: Units): Distance | null {
    if (raw == null) return null;
    const value = Number.parseFloat(String(raw));
    if (Number.isNaN(value)) return null;
    return new Distance(units === 'mi' ? value * KM_PER_MI : value);
  }

  toUnitValue(units: Units): number {
    const v = units === 'mi' ? this.km / KM_PER_MI : this.km;
    return Math.round(v * 100) / 100;
  }

  format(units: Units): string {
    if (!Number.isFinite(this.km)) return '—';
    return this.toUnitValue(units).toString();
  }

  plus(other: Distance): Distance {
    return new Distance(this.km + other.km);
  }
}
