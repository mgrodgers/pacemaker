import type { StepId } from '../valueObjects/Ids';
import type { FieldMode } from '../valueObjects/FieldMode';

/** One rung of an interval segment's ladder. Fields are canonical
 * (seconds, kilometres, seconds-per-kilometre) regardless of display units. */
export interface Step {
  readonly id: StepId;
  readonly mode: FieldMode;
  readonly timeSec: number;
  readonly distanceKm: number;
  readonly paceSecPerKm: number | null;
}
