import type { Segment } from '../entities/Segment';
import { buildProfile, expandInstances } from './PlanProfileBuilder';
import { findBestEfforts, type BestEffort } from './BestEffortFinder';

export interface PlanSummary {
  readonly totalDistanceKm: number;
  readonly totalTimeSec: number;
  readonly avgPaceSecPerKm: number | null;
  readonly bestEfforts: readonly BestEffort[];
}

export function summarizePlan(segments: readonly Segment[]): PlanSummary {
  const profile = buildProfile(expandInstances(segments));
  const avgPaceSecPerKm = profile.totalDistanceKm > 0 ? profile.totalTimeSec / profile.totalDistanceKm : null;
  return {
    totalDistanceKm: profile.totalDistanceKm,
    totalTimeSec: profile.totalTimeSec,
    avgPaceSecPerKm,
    bestEfforts: findBestEfforts(profile, profile.totalDistanceKm),
  };
}
