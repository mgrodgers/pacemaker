import type { FieldMode } from '../valueObjects/FieldMode';
import type { Segment } from '../entities/Segment';
import type { Step } from '../entities/Step';
import type { SegmentId, StepId } from '../valueObjects/Ids';
import type { SegmentType } from '../valueObjects/SegmentType';

export interface DerivedFields {
  readonly timeSec: number;
  readonly distanceKm: number;
  readonly paceSecPerKm: number | null;
}

/** Given a mode and the raw canonical values, recompute whichever field the
 * mode treats as derived. The other two are trusted as entered. */
export function computeDerived(
  mode: FieldMode,
  timeSec: number,
  distanceKm: number,
  paceSecPerKm: number | null
): DerivedFields {
  let t = timeSec;
  let d = distanceKm;
  let p = paceSecPerKm;
  if (mode === 'time-pace') {
    d = p && p > 0 ? t / p : 0;
  } else if (mode === 'distance-pace') {
    t = d && p ? d * p : 0;
  } else if (mode === 'time-distance') {
    p = d && d > 0 ? t / d : null;
  }
  return { timeSec: t, distanceKm: d, paceSecPerKm: p };
}

export interface StepOverrides {
  readonly mode?: FieldMode;
  readonly timeSec?: number;
  readonly distanceKm?: number;
  readonly paceSecPerKm?: number | null;
}

export function makeStep(id: StepId, overrides: StepOverrides = {}): Step {
  const mode = overrides.mode ?? 'distance-pace';
  const timeSec = overrides.timeSec ?? 0;
  const distanceKm = overrides.distanceKm ?? 0.4;
  const paceSecPerKm = overrides.paceSecPerKm ?? 300;
  return { id, mode, ...computeDerived(mode, timeSec, distanceKm, paceSecPerKm) };
}

interface SegmentPreset {
  readonly mode: FieldMode;
  readonly timeSec: number;
  readonly distanceKm: number;
  readonly paceSecPerKm: number | null;
  readonly reps?: number;
}

const SEGMENT_PRESETS: Readonly<Record<SegmentType, SegmentPreset>> = {
  warmup: { mode: 'time-pace', timeSec: 600, distanceKm: 0, paceSecPerKm: 390 },
  tempo: { mode: 'distance-pace', timeSec: 0, distanceKm: 2, paceSecPerKm: 330 },
  interval: { mode: 'distance-pace', timeSec: 0, distanceKm: 0.4, paceSecPerKm: 300, reps: 4 },
  rest: { mode: 'time-distance', timeSec: 90, distanceKm: 0, paceSecPerKm: null },
  cooldown: { mode: 'time-pace', timeSec: 480, distanceKm: 0, paceSecPerKm: 420 },
  easy: { mode: 'distance-pace', timeSec: 0, distanceKm: 3, paceSecPerKm: 360 },
};

const INTERVAL_STEP_PACES = [300, 315, 330, 345, 360];

export interface NewSegmentOptions {
  readonly restDefault?: boolean;
}

/** Creates a segment pre-filled with sensible defaults for its type. The
 * caller supplies `id` and (for intervals) one `StepId` per starter step,
 * since id generation is an infrastructure concern, not a domain one. */
export function newSegment(
  id: SegmentId,
  type: SegmentType,
  stepIds: readonly StepId[] = [],
  opts: NewSegmentOptions = {}
): Segment {
  const preset = SEGMENT_PRESETS[type];
  const restEnabled = type === 'interval' ? (opts.restDefault ?? true) : false;
  const steps: Step[] =
    type === 'interval'
      ? stepIds.map((id_, i) =>
          makeStep(id_, {
            distanceKm: 0.4,
            paceSecPerKm: INTERVAL_STEP_PACES[i % INTERVAL_STEP_PACES.length],
          })
        )
      : [];
  return {
    id,
    type,
    mode: preset.mode,
    ...computeDerived(preset.mode, preset.timeSec, preset.distanceKm, preset.paceSecPerKm),
    reps: preset.reps ?? 1,
    restEnabled,
    restMode: 'time-distance',
    restTimeSec: 90,
    restDistanceKm: 0,
    restPaceSecPerKm: null,
    steps,
  };
}
