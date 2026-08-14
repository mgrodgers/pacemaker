import type { PlanId, SegmentId, StepId } from '../../../domain/valueObjects/Ids';
import type { Units } from '../../../domain/valueObjects/Units';
import type { FieldMode, SegmentField } from '../../../domain/valueObjects/FieldMode';
import type { SegmentType } from '../../../domain/valueObjects/SegmentType';
import type { StepKind } from '../../../domain/valueObjects/StepKind';
import type { BestEffortView, PlanDetail, PlanListItem, TotalsView } from '../../dto/PlanViews';

/** Primary (driving) port: the one interface every driving adapter — the
 * React UI, the in-process test driver, and any future HTTP API — calls to
 * do anything. No driving adapter talks to the domain or a repository
 * directly. */
export interface PlanningService {
  listPlans(): PlanListItem[];
  getPlan(id: PlanId): PlanDetail;

  createPlan(name?: string): PlanId;
  renamePlan(id: PlanId, name: string): void;
  duplicatePlan(id: PlanId): PlanId;
  deletePlan(id: PlanId): void;
  setUnits(id: PlanId, units: Units): void;

  addSegment(planId: PlanId, type: SegmentType): SegmentId;
  removeSegment(planId: PlanId, segmentId: SegmentId): void;
  reorderSegments(planId: PlanId, orderedSegmentIds: readonly SegmentId[]): void;
  setSegmentMode(planId: PlanId, segmentId: SegmentId, mode: FieldMode): void;
  setSegmentField(planId: PlanId, segmentId: SegmentId, field: SegmentField, raw: string): void;
  setReps(planId: PlanId, segmentId: SegmentId, delta: number): void;
  toggleRest(planId: PlanId, segmentId: SegmentId): void;
  setRestMode(planId: PlanId, segmentId: SegmentId, mode: FieldMode): void;
  setRestField(planId: PlanId, segmentId: SegmentId, field: SegmentField, raw: string): void;

  addIntervalStep(planId: PlanId, segmentId: SegmentId, kind?: StepKind): StepId;
  removeIntervalStep(planId: PlanId, segmentId: SegmentId, stepId: StepId): void;
  setStepMode(planId: PlanId, segmentId: SegmentId, stepId: StepId, mode: FieldMode): void;
  setStepField(planId: PlanId, segmentId: SegmentId, stepId: StepId, field: SegmentField, raw: string): void;
  setStepKind(planId: PlanId, segmentId: SegmentId, stepId: StepId, kind: StepKind): void;

  getTotals(planId: PlanId): TotalsView;
  getBestEfforts(planId: PlanId): BestEffortView[];

  setPaceDefaultsUnits(units: Units): void;
  setPaceDefault(type: SegmentType, raw: string): void;
}
