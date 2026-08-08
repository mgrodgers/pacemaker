import { useCallback, useState } from 'react';
import { usePlanningService } from './usePlanningService';
import type { PlanId, SegmentId, StepId } from '../../../../domain/valueObjects/Ids';
import type { Units } from '../../../../domain/valueObjects/Units';
import type { FieldMode, SegmentField } from '../../../../domain/valueObjects/FieldMode';
import type { SegmentType } from '../../../../domain/valueObjects/SegmentType';

/** Drives a single plan's builder/results screen. Same revision-bump
 * pattern as usePlansController, scoped to one plan id. */
export function usePlanController(planId: PlanId) {
  const service = usePlanningService();
  const [, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((r) => r + 1), []);

  const run = useCallback(
    <Args extends unknown[], R>(fn: (...args: Args) => R) =>
      (...args: Args): R => {
        const result = fn(...args);
        refresh();
        return result;
      },
    [refresh]
  );

  return {
    plan: service.getPlan(planId),
    totals: service.getTotals(planId),
    bestEfforts: service.getBestEfforts(planId),

    setUnits: run((units: Units) => service.setUnits(planId, units)),
    renamePlan: run((name: string) => service.renamePlan(planId, name)),

    addSegment: run((type: SegmentType) => service.addSegment(planId, type)),
    removeSegment: run((segmentId: SegmentId) => service.removeSegment(planId, segmentId)),
    reorderSegments: run((orderedSegmentIds: readonly SegmentId[]) =>
      service.reorderSegments(planId, orderedSegmentIds)
    ),
    setSegmentMode: run((segmentId: SegmentId, mode: FieldMode) => service.setSegmentMode(planId, segmentId, mode)),
    setSegmentField: run((segmentId: SegmentId, field: SegmentField, raw: string) =>
      service.setSegmentField(planId, segmentId, field, raw)
    ),
    setReps: run((segmentId: SegmentId, delta: number) => service.setReps(planId, segmentId, delta)),
    toggleRest: run((segmentId: SegmentId) => service.toggleRest(planId, segmentId)),
    setRestMode: run((segmentId: SegmentId, mode: FieldMode) => service.setRestMode(planId, segmentId, mode)),
    setRestField: run((segmentId: SegmentId, field: SegmentField, raw: string) =>
      service.setRestField(planId, segmentId, field, raw)
    ),

    addIntervalStep: run((segmentId: SegmentId) => service.addIntervalStep(planId, segmentId)),
    removeIntervalStep: run((segmentId: SegmentId, stepId: StepId) =>
      service.removeIntervalStep(planId, segmentId, stepId)
    ),
    setStepMode: run((segmentId: SegmentId, stepId: StepId, mode: FieldMode) =>
      service.setStepMode(planId, segmentId, stepId, mode)
    ),
    setStepField: run((segmentId: SegmentId, stepId: StepId, field: SegmentField, raw: string) =>
      service.setStepField(planId, segmentId, stepId, field, raw)
    ),
  };
}
