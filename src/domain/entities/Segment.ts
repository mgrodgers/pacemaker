import type { SegmentId } from '../valueObjects/Ids';
import type { FieldMode } from '../valueObjects/FieldMode';
import type { SegmentType } from '../valueObjects/SegmentType';
import type { Step } from './Step';

/** One block of a run plan (warmup, tempo, interval, ...). `steps` is only
 * populated for `type === 'interval'`, where one rep runs through every
 * step in order before `reps` and `restEnabled` repeat it. */
export interface Segment {
  readonly id: SegmentId;
  readonly type: SegmentType;
  readonly mode: FieldMode;
  readonly timeSec: number;
  readonly distanceKm: number;
  readonly paceSecPerKm: number | null;
  readonly reps: number;
  readonly restEnabled: boolean;
  readonly restMode: FieldMode;
  readonly restTimeSec: number;
  readonly restDistanceKm: number;
  readonly restPaceSecPerKm: number | null;
  readonly steps: readonly Step[];
}
