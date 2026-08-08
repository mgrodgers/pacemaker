import type { PlanId } from '../valueObjects/Ids';
import type { Units } from '../valueObjects/Units';
import type { Segment } from './Segment';

/** The aggregate root: a named, ordered list of segments displayed in a
 * chosen unit system. Segment order is the plan's own run order. */
export interface Plan {
  readonly id: PlanId;
  readonly name: string;
  readonly units: Units;
  readonly segments: readonly Segment[];
}
