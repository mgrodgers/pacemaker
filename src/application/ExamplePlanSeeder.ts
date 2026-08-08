import type { PlanRepository } from './ports/out/PlanRepository';
import type { IdGenerator } from './ports/out/IdGenerator';
import { makeStep, newSegment } from '../domain/services/SegmentCalculator';
import type { Segment } from '../domain/entities/Segment';

/** Seeds a demo "Track ladder" plan the first time a repository is empty,
 * so a new user lands on something instructive rather than a blank list. */
export function seedExamplePlanIfEmpty(repository: PlanRepository, idGenerator: IdGenerator): void {
  if (repository.findAll().length > 0) return;

  const warmup = newSegment(idGenerator.newSegmentId(), 'warmup');

  const intervalStepIds = [idGenerator.newStepId(), idGenerator.newStepId(), idGenerator.newStepId()] as const;
  const interval: Segment = {
    ...newSegment(idGenerator.newSegmentId(), 'interval', intervalStepIds),
    reps: 2,
    restEnabled: true,
    restTimeSec: 90,
    steps: [
      makeStep(intervalStepIds[0], { distanceKm: 0.4, paceSecPerKm: 330 }),
      makeStep(intervalStepIds[1], { distanceKm: 0.4, paceSecPerKm: 315 }),
      makeStep(intervalStepIds[2], { distanceKm: 0.4, paceSecPerKm: 300 }),
    ],
  };

  const rest: Segment = { ...newSegment(idGenerator.newSegmentId(), 'rest'), timeSec: 180 };
  const cooldown = newSegment(idGenerator.newSegmentId(), 'cooldown');

  repository.save({
    id: idGenerator.newPlanId(),
    name: 'Track ladder',
    units: 'km',
    segments: [warmup, interval, rest, cooldown],
  });
}
