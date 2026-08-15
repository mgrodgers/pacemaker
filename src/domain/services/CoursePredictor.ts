import { Grade } from '../valueObjects/Grade';
import type { TrackPoint } from './ElevationResampler';
import { resample } from './ElevationResampler';
import { actualPaceSecPerKm } from './GapPredictor';

const BUCKET_SIZE_M = 50;
const KM_M = 1000;

export interface CourseSplit {
  readonly km: number;
  readonly distanceM: number;
  readonly avgGrade: Grade;
  readonly paceSecPerKm: number;
  readonly timeSec: number;
}

export interface CoursePrediction {
  readonly totalTimeSec: number;
  readonly splits: readonly CourseSplit[];
}

/** Predicts a hilly course's time at the same effort as `targetFlatPaceSecPerKm`
 * on flat ground, by inverting GAP over fixed-distance grade buckets and
 * aggregating the result into per-kilometre splits. */
export function predictCourseTime(
  points: readonly TrackPoint[],
  targetFlatPaceSecPerKm: number,
): CoursePrediction {
  const buckets = resample(points, BUCKET_SIZE_M);

  const splitsByKm = new Map<number, { distanceM: number; riseM: number; timeSec: number }>();
  for (const bucket of buckets) {
    const kmIndex = Math.floor(bucket.startM / KM_M) + 1;
    const bucketDistanceM = bucket.endM - bucket.startM;
    const bucketPace = actualPaceSecPerKm(targetFlatPaceSecPerKm, bucket.grade);
    const bucketTimeSec = bucketPace * (bucketDistanceM / KM_M);
    const riseM = bucket.grade.decimal * bucketDistanceM;

    const existing = splitsByKm.get(kmIndex) ?? { distanceM: 0, riseM: 0, timeSec: 0 };
    splitsByKm.set(kmIndex, {
      distanceM: existing.distanceM + bucketDistanceM,
      riseM: existing.riseM + riseM,
      timeSec: existing.timeSec + bucketTimeSec,
    });
  }

  const splits: CourseSplit[] = [...splitsByKm.entries()]
    .sort(([a], [b]) => a - b)
    .map(([km, agg]) => ({
      km,
      distanceM: agg.distanceM,
      avgGrade: Grade.fromRiseAndRun(agg.riseM, agg.distanceM),
      paceSecPerKm: agg.timeSec / (agg.distanceM / KM_M),
      timeSec: agg.timeSec,
    }));

  const totalTimeSec = splits.reduce((sum, s) => sum + s.timeSec, 0);

  return { totalTimeSec, splits };
}
