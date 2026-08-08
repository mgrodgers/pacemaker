import type { PlanProfile } from './PlanProfileBuilder';
import { timeAtDistance } from './PlanProfileBuilder';

export interface BestEffort {
  readonly key: string;
  readonly label: string;
  readonly km: number;
  readonly timeSec: number | null;
  readonly paceSecPerKm: number | null;
}

export const BEST_DISTANCES: ReadonlyArray<{ key: string; label: string; km: number }> = [
  { key: '1k', label: '1 km', km: 1 },
  { key: '5k', label: '5 km', km: 5 },
  { key: '10k', label: '10 km', km: 10 },
  { key: '15k', label: '15 km', km: 15 },
  { key: 'hm', label: 'Half marathon', km: 21.0975 },
];

/** The fastest time to cover `distanceKm` anywhere inside the plan — the
 * best contiguous window, not necessarily aligned to segment boundaries.
 * `null` when the plan doesn't cover that distance at all. Candidate window
 * starts are restricted to segment boundaries and boundary-minus-distanceKm
 * points, which is sufficient because elapsed time is piecewise-linear
 * between boundaries, so the windowed sum can only extremize there. */
export function bestWindow(profile: PlanProfile, totalDistanceKm: number, distanceKm: number): number | null {
  if (totalDistanceKm < distanceKm - 1e-9) return null;
  const candidateStarts = new Set<number>([0, totalDistanceKm - distanceKm]);
  for (const point of profile.points) {
    candidateStarts.add(point.distStart);
    candidateStarts.add(point.distStart - distanceKm);
    candidateStarts.add(point.distEnd);
    candidateStarts.add(point.distEnd - distanceKm);
  }
  let best = Infinity;
  for (const start of candidateStarts) {
    if (start < -1e-9 || start > totalDistanceKm - distanceKm + 1e-9) continue;
    const clampedStart = Math.max(0, Math.min(start, totalDistanceKm - distanceKm));
    const end = clampedStart + distanceKm;
    const time = timeAtDistance(profile, end) - timeAtDistance(profile, clampedStart);
    if (time < best) best = time;
  }
  return Number.isFinite(best) ? best : null;
}

export function findBestEfforts(profile: PlanProfile, totalDistanceKm: number): BestEffort[] {
  return BEST_DISTANCES.map((bd) => {
    const timeSec = bestWindow(profile, totalDistanceKm, bd.km);
    return {
      key: bd.key,
      label: bd.label,
      km: bd.km,
      timeSec,
      paceSecPerKm: timeSec != null ? timeSec / bd.km : null,
    };
  });
}
