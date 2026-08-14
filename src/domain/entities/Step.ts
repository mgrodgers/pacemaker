import type { StepId } from '../valueObjects/Ids';
import type { FieldMode } from '../valueObjects/FieldMode';
import type { StepKind } from '../valueObjects/StepKind';

/** One rung of an interval segment's ladder. Fields are canonical
 * (seconds, kilometres, seconds-per-kilometre) regardless of display units.
 * `kind` distinguishes a work step from a rest placed between steps. */
export interface Step {
  readonly id: StepId;
  readonly kind: StepKind;
  readonly mode: FieldMode;
  readonly timeSec: number;
  readonly distanceKm: number;
  readonly paceSecPerKm: number | null;
}
