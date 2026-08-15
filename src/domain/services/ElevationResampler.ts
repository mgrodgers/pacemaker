import { Grade } from '../valueObjects/Grade';

export interface TrackPoint {
  readonly distanceM: number;
  readonly elevationM: number;
}

export interface GradeSegment {
  readonly startM: number;
  readonly endM: number;
  readonly grade: Grade;
}

function elevationAt(points: readonly TrackPoint[], distanceM: number): number {
  const first = points[0];
  const last = points[points.length - 1];
  if (distanceM <= first.distanceM) return first.elevationM;
  if (distanceM >= last.distanceM) return last.elevationM;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (distanceM >= a.distanceM && distanceM <= b.distanceM) {
      if (b.distanceM === a.distanceM) return a.elevationM;
      const t = (distanceM - a.distanceM) / (b.distanceM - a.distanceM);
      return a.elevationM + t * (b.elevationM - a.elevationM);
    }
  }
  return last.elevationM;
}

/** Elevation at a bucket boundary, smoothed by averaging every raw point
 * within half a bucket of it (falling back to interpolation if the track
 * is too sparse to have any points in that window). This is what keeps a
 * noisy raw GPX elevation trace from producing jittery per-bucket grade. */
function boundaryElevation(points: readonly TrackPoint[], boundaryM: number, halfWindowM: number): number {
  const lo = boundaryM - halfWindowM;
  const hi = boundaryM + halfWindowM;
  const inWindow = points.filter((p) => p.distanceM >= lo && p.distanceM <= hi);
  if (inWindow.length === 0) return elevationAt(points, boundaryM);
  return inWindow.reduce((sum, p) => sum + p.elevationM, 0) / inWindow.length;
}

/** Buckets a raw (possibly noisy, unevenly-spaced) elevation trace into
 * fixed-distance grade segments, so downstream GAP calculation sees stable
 * per-bucket grades instead of raw point-to-point noise. Trailing distance
 * short of a full bucket is dropped. */
export function resample(points: readonly TrackPoint[], bucketSizeM: number): GradeSegment[] {
  if (points.length < 2) return [];
  const sorted = [...points].sort((a, b) => a.distanceM - b.distanceM);
  const maxDistM = sorted[sorted.length - 1].distanceM;
  const numBuckets = Math.floor(maxDistM / bucketSizeM);
  const halfWindowM = bucketSizeM / 2;

  const boundaries: number[] = [];
  for (let i = 0; i <= numBuckets; i++) boundaries.push(i * bucketSizeM);
  const elevations = boundaries.map((b) => boundaryElevation(sorted, b, halfWindowM));

  const segments: GradeSegment[] = [];
  for (let i = 0; i < numBuckets; i++) {
    const startM = boundaries[i];
    const endM = boundaries[i + 1];
    const grade = Grade.fromRiseAndRun(elevations[i + 1] - elevations[i], endM - startM);
    segments.push({ startM, endM, grade });
  }
  return segments;
}
