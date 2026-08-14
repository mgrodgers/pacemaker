import type { Plan } from '../domain/entities/Plan';
import type { Segment } from '../domain/entities/Segment';
import type { Step } from '../domain/entities/Step';
import type { PlanId, SegmentId, StepId } from '../domain/valueObjects/Ids';
import type { Units } from '../domain/valueObjects/Units';
import type { FieldMode, SegmentField } from '../domain/valueObjects/FieldMode';
import type { SegmentType } from '../domain/valueObjects/SegmentType';
import type { StepKind } from '../domain/valueObjects/StepKind';
import {
  computeDerived,
  makeStep,
  newSegment,
  nextWorkStepPace,
  restDefaultPace,
  type DerivedFields,
} from '../domain/services/SegmentCalculator';
import { Duration } from '../domain/valueObjects/Duration';
import { Distance } from '../domain/valueObjects/Distance';
import { Pace } from '../domain/valueObjects/Pace';
import { PlanNotFoundError, SegmentNotFoundError, StepNotFoundError } from '../domain/errors/DomainError';
import type { PlanningService } from './ports/in/PlanningService';
import type { PlanRepository } from './ports/out/PlanRepository';
import type { IdGenerator } from './ports/out/IdGenerator';
import type { PaceDefaultsRepository } from './ports/out/PaceDefaultsRepository';
import { toBestEffortViews, toPaceDefaultsView, toPlanDetail, toPlanListItem, toTotalsView } from './dto/PlanViewMapper';
import type { BestEffortView, PaceDefaultsView, PlanDetail, PlanListItem, TotalsView } from './dto/PlanViews';

const DEFAULT_INTERVAL_STEP_COUNT = 3;

export class PlanningServiceImpl implements PlanningService {
  constructor(
    private readonly repository: PlanRepository,
    private readonly idGenerator: IdGenerator,
    private readonly paceDefaultsRepository: PaceDefaultsRepository
  ) {}

  listPlans(): PlanListItem[] {
    return [...this.repository.findAll()].reverse().map(toPlanListItem);
  }

  getPlan(id: PlanId): PlanDetail {
    return toPlanDetail(this.loadPlan(id));
  }

  createPlan(name = 'New plan'): PlanId {
    const id = this.idGenerator.newPlanId();
    this.repository.save({ id, name, units: 'km', segments: [] });
    return id;
  }

  renamePlan(id: PlanId, name: string): void {
    const plan = this.loadPlan(id);
    const trimmed = name.trim();
    this.repository.save({ ...plan, name: trimmed || plan.name });
  }

  duplicatePlan(id: PlanId): PlanId {
    const source = this.loadPlan(id);
    const newId = this.idGenerator.newPlanId();
    this.repository.save({
      ...source,
      id: newId,
      name: `${source.name} copy`,
      segments: source.segments.map((segment) => ({
        ...segment,
        id: this.idGenerator.newSegmentId(),
        steps: segment.steps.map((step) => ({ ...step, id: this.idGenerator.newStepId() })),
      })),
    });
    return newId;
  }

  deletePlan(id: PlanId): void {
    this.repository.deleteById(id);
  }

  setUnits(id: PlanId, units: Units): void {
    const plan = this.loadPlan(id);
    this.repository.save({ ...plan, units });
  }

  addSegment(planId: PlanId, type: SegmentType): SegmentId {
    const segmentId = this.idGenerator.newSegmentId();
    const stepIds =
      type === 'interval'
        ? Array.from({ length: DEFAULT_INTERVAL_STEP_COUNT }, () => this.idGenerator.newStepId())
        : [];
    const segment = newSegment(segmentId, type, stepIds, {}, this.paceDefaultsRepository.load());
    this.updateSegments(planId, (segments) => [...segments, segment]);
    return segmentId;
  }

  removeSegment(planId: PlanId, segmentId: SegmentId): void {
    this.updateSegments(planId, (segments) => {
      this.findSegment(segments, segmentId);
      return segments.filter((segment) => segment.id !== segmentId);
    });
  }

  reorderSegments(planId: PlanId, orderedSegmentIds: readonly SegmentId[]): void {
    this.updateSegments(planId, (segments) => {
      const byId = new Map(segments.map((segment) => [segment.id, segment] as const));
      if (orderedSegmentIds.length !== segments.length) {
        throw new SegmentNotFoundError('reorder list does not match the plan’s segments');
      }
      return orderedSegmentIds.map((id) => {
        const segment = byId.get(id);
        if (!segment) throw new SegmentNotFoundError(id);
        return segment;
      });
    });
  }

  setSegmentMode(planId: PlanId, segmentId: SegmentId, mode: FieldMode): void {
    this.updateSegments(planId, (segments) =>
      this.mapSegment(segments, segmentId, (segment) => ({ ...segment, mode }))
    );
  }

  setSegmentField(planId: PlanId, segmentId: SegmentId, field: SegmentField, raw: string): void {
    this.updateSegments(planId, (segments, plan) =>
      this.mapSegment(segments, segmentId, (segment) => ({
        ...segment,
        ...this.applyFieldEdit(segment.mode, segment, field, raw, plan.units),
      }))
    );
  }

  setReps(planId: PlanId, segmentId: SegmentId, delta: number): void {
    this.updateSegments(planId, (segments) =>
      this.mapSegment(segments, segmentId, (segment) => ({
        ...segment,
        reps: Math.max(1, segment.reps + delta),
      }))
    );
  }

  toggleRest(planId: PlanId, segmentId: SegmentId): void {
    this.updateSegments(planId, (segments) =>
      this.mapSegment(segments, segmentId, (segment) => ({ ...segment, restEnabled: !segment.restEnabled }))
    );
  }

  setRestMode(planId: PlanId, segmentId: SegmentId, mode: FieldMode): void {
    this.updateSegments(planId, (segments) =>
      this.mapSegment(segments, segmentId, (segment) => ({ ...segment, restMode: mode }))
    );
  }

  setRestField(planId: PlanId, segmentId: SegmentId, field: SegmentField, raw: string): void {
    this.updateSegments(planId, (segments, plan) =>
      this.mapSegment(segments, segmentId, (segment) => {
        const derived = this.applyFieldEdit(
          segment.restMode,
          { timeSec: segment.restTimeSec, distanceKm: segment.restDistanceKm, paceSecPerKm: segment.restPaceSecPerKm },
          field,
          raw,
          plan.units
        );
        return {
          ...segment,
          restTimeSec: derived.timeSec,
          restDistanceKm: derived.distanceKm,
          restPaceSecPerKm: derived.paceSecPerKm,
        };
      })
    );
  }

  addIntervalStep(planId: PlanId, segmentId: SegmentId, kind: StepKind = 'work'): StepId {
    const stepId = this.idGenerator.newStepId();
    const paceDefaults = this.paceDefaultsRepository.load();
    this.updateSegments(planId, (segments) =>
      this.mapSegment(segments, segmentId, (segment) => {
        const paceSecPerKm =
          kind === 'work' ? nextWorkStepPace(segment.steps, paceDefaults) : restDefaultPace(paceDefaults);
        return { ...segment, steps: [...segment.steps, makeStep(stepId, { kind, paceSecPerKm })] };
      })
    );
    return stepId;
  }

  removeIntervalStep(planId: PlanId, segmentId: SegmentId, stepId: StepId): void {
    this.updateSegments(planId, (segments) =>
      this.mapSegment(segments, segmentId, (segment) => {
        const steps = segment.steps.filter((step) => step.id !== stepId);
        return { ...segment, steps: steps.length ? steps : segment.steps };
      })
    );
  }

  setStepMode(planId: PlanId, segmentId: SegmentId, stepId: StepId, mode: FieldMode): void {
    this.updateSegments(planId, (segments) =>
      this.mapSegment(segments, segmentId, (segment) => ({
        ...segment,
        steps: this.mapStep(segment.steps, stepId, (step) => ({ ...step, mode })),
      }))
    );
  }

  setStepField(planId: PlanId, segmentId: SegmentId, stepId: StepId, field: SegmentField, raw: string): void {
    this.updateSegments(planId, (segments, plan) =>
      this.mapSegment(segments, segmentId, (segment) => ({
        ...segment,
        steps: this.mapStep(segment.steps, stepId, (step) => ({
          ...step,
          ...this.applyFieldEdit(step.mode, step, field, raw, plan.units),
        })),
      }))
    );
  }

  setStepKind(planId: PlanId, segmentId: SegmentId, stepId: StepId, kind: StepKind): void {
    this.updateSegments(planId, (segments) =>
      this.mapSegment(segments, segmentId, (segment) => ({
        ...segment,
        steps: this.mapStep(segment.steps, stepId, (step) => ({ ...step, kind })),
      }))
    );
  }

  getPaceDefaults(): PaceDefaultsView {
    return toPaceDefaultsView(this.paceDefaultsRepository.load());
  }

  setPaceDefaultsUnits(units: Units): void {
    const current = this.paceDefaultsRepository.load();
    this.paceDefaultsRepository.save({ ...current, units });
  }

  setPaceDefault(type: SegmentType, raw: string): void {
    const current = this.paceDefaultsRepository.load();
    const parsed = Pace.parse(raw, current.units);
    if (!parsed || !parsed.isKnown) return;
    this.paceDefaultsRepository.save({
      ...current,
      paceSecPerKm: { ...current.paceSecPerKm, [type]: parsed.secPerKm },
    });
  }

  getTotals(planId: PlanId): TotalsView {
    return toTotalsView(this.loadPlan(planId));
  }

  getBestEfforts(planId: PlanId): BestEffortView[] {
    return toBestEffortViews(this.loadPlan(planId));
  }

  private loadPlan(id: PlanId): Plan {
    const plan = this.repository.findById(id);
    if (!plan) throw new PlanNotFoundError(id);
    return plan;
  }

  private updateSegments(
    planId: PlanId,
    updater: (segments: readonly Segment[], plan: Plan) => readonly Segment[]
  ): void {
    const plan = this.loadPlan(planId);
    this.repository.save({ ...plan, segments: updater(plan.segments, plan) });
  }

  private findSegment(segments: readonly Segment[], segmentId: SegmentId): Segment {
    const segment = segments.find((s) => s.id === segmentId);
    if (!segment) throw new SegmentNotFoundError(segmentId);
    return segment;
  }

  private mapSegment(
    segments: readonly Segment[],
    segmentId: SegmentId,
    fn: (segment: Segment) => Segment
  ): Segment[] {
    this.findSegment(segments, segmentId);
    return segments.map((segment) => (segment.id === segmentId ? fn(segment) : segment));
  }

  private mapStep(steps: readonly Step[], stepId: StepId, fn: (step: Step) => Step): Step[] {
    if (!steps.some((step) => step.id === stepId)) throw new StepNotFoundError(stepId);
    return steps.map((step) => (step.id === stepId ? fn(step) : step));
  }

  private applyFieldEdit(
    mode: FieldMode,
    current: { timeSec: number; distanceKm: number; paceSecPerKm: number | null },
    field: SegmentField,
    raw: string,
    units: Units
  ): DerivedFields {
    let { timeSec, distanceKm, paceSecPerKm } = current;
    if (field === 'time') timeSec = Duration.parse(raw)?.seconds ?? 0;
    if (field === 'distance') distanceKm = Distance.parse(raw, units)?.km ?? 0;
    if (field === 'pace') paceSecPerKm = Pace.parse(raw, units)?.secPerKm ?? null;
    return computeDerived(mode, timeSec, distanceKm, paceSecPerKm);
  }
}
