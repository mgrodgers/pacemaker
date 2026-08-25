import type { PlanId } from '../valueObjects/Ids';
import type { Units } from '../valueObjects/Units';
import type { Segment } from './Segment';

export type PlanTimeSide = 'start' | 'end';

/** Which side of the start/end pair was directly set by the user — the
 * anchor. The other side is always freshly derived from the plan's
 * current total duration, never stored (see PlanViewMapper). */
export interface PlanTimeAnchor {
  readonly side: PlanTimeSide;
  readonly minutesSinceMidnight: number;
}

/** The aggregate root: a named, ordered list of segments displayed in a
 * chosen unit system. Segment order is the plan's own run order. */
export interface Plan {
  readonly id: PlanId;
  readonly name: string;
  readonly units: Units;
  readonly segments: readonly Segment[];
  readonly time: PlanTimeAnchor | null;
}
