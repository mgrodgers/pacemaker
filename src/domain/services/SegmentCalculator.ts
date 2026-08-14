import type { FieldMode } from '../valueObjects/FieldMode';
import type { Segment } from '../entities/Segment';
import type { Step } from '../entities/Step';
import type { SegmentId, StepId } from '../valueObjects/Ids';
import type { SegmentType } from '../valueObjects/SegmentType';
import type { StepKind } from '../valueObjects/StepKind';
import { EMPTY_PACE_DEFAULTS, type PaceDefaults } from '../valueObjects/PaceDefaults';

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
  readonly kind?: StepKind;
  readonly mode?: FieldMode;
  readonly timeSec?: number;
  readonly distanceKm?: number;
  readonly paceSecPerKm?: number | null;
}

interface StepKindDefaults {
  readonly mode: FieldMode;
  readonly timeSec: number;
  readonly distanceKm: number;
  readonly paceSecPerKm: number;
}

const STEP_KIND_DEFAULTS: Readonly<Record<StepKind, StepKindDefaults>> = {
  work: { mode: 'distance-pace', timeSec: 0, distanceKm: 0.4, paceSecPerKm: 300 },
  // Recovery jog, not a paceless stop — time+pace so distance derives.
  rest: { mode: 'time-pace', timeSec: 90, distanceKm: 0, paceSecPerKm: 420 },
};

/** The built-in fallback rest pace, shared by every "rest" concept in the
 * app (standalone rest segments, interval rest steps, interval
 * rest-between-reps) so they stay in sync when none has a configured
 * default. */
export function restDefaultPace(paceDefaults: PaceDefaults): number {
  return paceDefaults.paceSecPerKm.rest ?? STEP_KIND_DEFAULTS.rest.paceSecPerKm;
}

/** Resolves the pace a newly appended interval work step should start
 * with: the pace of the last existing non-rest step (so edits to a step's
 * pace propagate forward to steps added after it), or the configured/
 * built-in `interval` default if there is no such step yet. */
export function nextWorkStepPace(existingSteps: readonly Step[], paceDefaults: PaceDefaults): number {
  for (let i = existingSteps.length - 1; i >= 0; i--) {
    const step = existingSteps[i]!;
    if (step.kind !== 'rest' && step.paceSecPerKm != null) return step.paceSecPerKm;
  }
  return paceDefaults.paceSecPerKm.interval ?? STEP_KIND_DEFAULTS.work.paceSecPerKm;
}

export function makeStep(id: StepId, overrides: StepOverrides = {}): Step {
  const kind = overrides.kind ?? 'work';
  const defaults = STEP_KIND_DEFAULTS[kind];
  const mode = overrides.mode ?? defaults.mode;
  const timeSec = overrides.timeSec ?? defaults.timeSec;
  const distanceKm = overrides.distanceKm ?? defaults.distanceKm;
  const paceSecPerKm = overrides.paceSecPerKm ?? defaults.paceSecPerKm;
  return { id, kind, mode, ...computeDerived(mode, timeSec, distanceKm, paceSecPerKm) };
}

interface SegmentPreset {
  readonly mode: FieldMode;
  readonly timeSec: number;
  readonly distanceKm: number;
  readonly paceSecPerKm: number;
  readonly reps?: number;
}

const SEGMENT_PRESETS: Readonly<Record<SegmentType, SegmentPreset>> = {
  warmup: { mode: 'time-pace', timeSec: 600, distanceKm: 0, paceSecPerKm: 390 },
  tempo: { mode: 'distance-pace', timeSec: 0, distanceKm: 2, paceSecPerKm: 330 },
  interval: { mode: 'distance-pace', timeSec: 0, distanceKm: 0.4, paceSecPerKm: 300, reps: 4 },
  // time-pace, not time-distance: pace is a real, directly-settable field
  // here (like every other type), matching interval rest steps.
  rest: { mode: 'time-pace', timeSec: 90, distanceKm: 0, paceSecPerKm: STEP_KIND_DEFAULTS.rest.paceSecPerKm },
  cooldown: { mode: 'time-pace', timeSec: 480, distanceKm: 0, paceSecPerKm: 420 },
  easy: { mode: 'distance-pace', timeSec: 0, distanceKm: 3, paceSecPerKm: 360 },
};

export interface NewSegmentOptions {
  readonly restDefault?: boolean;
}

/** Creates a segment pre-filled with sensible defaults for its type —
 * either the caller's configured `paceDefaults`, or the built-in preset
 * pace when a type has no configured default. The caller supplies `id`
 * and (for intervals) one `StepId` per starter step, since id generation
 * is an infrastructure concern, not a domain one. */
export function newSegment(
  id: SegmentId,
  type: SegmentType,
  stepIds: readonly StepId[] = [],
  opts: NewSegmentOptions = {},
  paceDefaults: PaceDefaults = EMPTY_PACE_DEFAULTS
): Segment {
  const preset = SEGMENT_PRESETS[type];
  const paceSecPerKm = paceDefaults.paceSecPerKm[type] ?? preset.paceSecPerKm;
  const restEnabled = type === 'interval' ? (opts.restDefault ?? true) : false;

  const steps: Step[] = [];
  if (type === 'interval') {
    for (const stepId_ of stepIds) {
      steps.push(
        makeStep(stepId_, {
          distanceKm: STEP_KIND_DEFAULTS.work.distanceKm,
          paceSecPerKm: nextWorkStepPace(steps, paceDefaults),
        })
      );
    }
  }

  const restPaceSecPerKm = restDefaultPace(paceDefaults);
  const restDerived = computeDerived('time-pace', 90, 0, restPaceSecPerKm);

  return {
    id,
    type,
    mode: preset.mode,
    ...computeDerived(preset.mode, preset.timeSec, preset.distanceKm, paceSecPerKm),
    reps: preset.reps ?? 1,
    restEnabled,
    restMode: 'time-pace',
    restTimeSec: restDerived.timeSec,
    restDistanceKm: restDerived.distanceKm,
    restPaceSecPerKm: restDerived.paceSecPerKm,
    steps,
  };
}
