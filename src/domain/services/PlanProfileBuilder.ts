import type { Segment } from '../entities/Segment';
import type { SegmentId } from '../valueObjects/Ids';
import type { SegmentType } from '../valueObjects/SegmentType';
import type { StepKind } from '../valueObjects/StepKind';

export interface PlanInstance {
  readonly segmentId: SegmentId;
  readonly type: SegmentType | 'rest';
  readonly timeSec: number;
  readonly distanceKm: number;
  readonly paceSecPerKm: number | null;
  readonly isRest?: boolean;
}

export interface ProfilePoint {
  readonly distStart: number;
  readonly timeStart: number;
  readonly distEnd: number;
  readonly timeEnd: number;
  readonly instance: PlanInstance;
}

export interface PlanProfile {
  readonly points: readonly ProfilePoint[];
  readonly totalDistanceKm: number;
  readonly totalTimeSec: number;
}

type TimedFields = { timeSec: number; distanceKm: number; paceSecPerKm: number | null; kind?: StepKind };

function stepsOf(segment: Segment): readonly TimedFields[] {
  if (segment.type === 'interval' && segment.steps.length > 0) return segment.steps;
  return [segment];
}

/** Flattens segments into a run-order sequence of timed instances, expanding
 * interval reps (and the rest between them) into their own entries. */
export function expandInstances(segments: readonly Segment[]): PlanInstance[] {
  const out: PlanInstance[] = [];
  for (const segment of segments) {
    const reps = segment.reps > 1 ? segment.reps : 1;
    const steps = stepsOf(segment);
    for (let i = 0; i < reps; i++) {
      for (const step of steps) {
        const stepIsRest = step.kind === 'rest';
        out.push({
          segmentId: segment.id,
          type: stepIsRest ? 'rest' : segment.type,
          timeSec: step.timeSec || 0,
          distanceKm: step.distanceKm || 0,
          paceSecPerKm: step.paceSecPerKm,
          ...(stepIsRest ? { isRest: true } : {}),
        });
      }
      if (reps > 1 && segment.restEnabled && i < reps - 1) {
        out.push({
          segmentId: segment.id,
          type: 'rest',
          timeSec: segment.restTimeSec || 0,
          distanceKm: segment.restDistanceKm || 0,
          paceSecPerKm: segment.restPaceSecPerKm,
          isRest: true,
        });
      }
    }
  }
  return out;
}

export function buildProfile(instances: readonly PlanInstance[]): PlanProfile {
  const points: ProfilePoint[] = [];
  let cumulativeDistance = 0;
  let cumulativeTime = 0;
  for (const instance of instances) {
    const distStart = cumulativeDistance;
    const timeStart = cumulativeTime;
    cumulativeDistance += instance.distanceKm;
    cumulativeTime += instance.timeSec;
    points.push({ distStart, timeStart, distEnd: cumulativeDistance, timeEnd: cumulativeTime, instance });
  }
  return { points, totalDistanceKm: cumulativeDistance, totalTimeSec: cumulativeTime };
}

/** Interpolates elapsed time at a given cumulative distance along the
 * profile — the primitive `bestWindow` uses to score any candidate window. */
export function timeAtDistance(profile: PlanProfile, distanceKm: number): number {
  const points = profile.points;
  if (points.length === 0) return 0;
  if (distanceKm <= 0) return points[0]!.timeStart;
  for (const point of points) {
    if (distanceKm <= point.distEnd + 1e-9) {
      if (point.distEnd > point.distStart) {
        const frac = (distanceKm - point.distStart) / (point.distEnd - point.distStart);
        return point.timeStart + frac * (point.timeEnd - point.timeStart);
      }
      return point.timeEnd;
    }
  }
  return points[points.length - 1]!.timeEnd;
}
