import type { SegmentType } from './SegmentType';
import type { Units } from './Units';

/** User-configured default pace per segment type, plus the units the
 * settings page itself is entered in. Storage is always sec/km, canonical
 * like `Pace`/`Distance` — `units` only affects how the settings page
 * displays/parses values, not how they're stored. An unconfigured type is
 * simply absent from `paceSecPerKm`; callers fall back to their own
 * built-in preset when a type's entry is missing. */
export interface PaceDefaults {
  readonly units: Units;
  readonly paceSecPerKm: Partial<Record<SegmentType, number>>;
}

export const EMPTY_PACE_DEFAULTS: PaceDefaults = { units: 'km', paceSecPerKm: {} };
