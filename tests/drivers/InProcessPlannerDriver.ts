import { PlanningServiceImpl } from '../../src/application/PlanningServiceImpl';
import { InMemoryPlanRepository } from '../../src/adapters/driven/persistence/InMemoryPlanRepository';
import type { IdGenerator } from '../../src/application/ports/out/IdGenerator';
import { planId, segmentId, stepId, type PlanId, type SegmentId, type StepId } from '../../src/domain/valueObjects/Ids';
import type { SegmentType } from '../../src/domain/valueObjects/SegmentType';
import type { FieldMode, SegmentField } from '../../src/domain/valueObjects/FieldMode';
import type { EffortView, FieldSpec, IntervalSpec, PlannerDriver, TotalsView, UnitSystem } from './PlannerDriver';

class SequentialIdGenerator implements IdGenerator {
  private n = 0;
  newPlanId(): PlanId {
    return planId(`p${++this.n}`);
  }
  newSegmentId(): SegmentId {
    return segmentId(`s${++this.n}`);
  }
  newStepId(): StepId {
    return stepId(`st${++this.n}`);
  }
}

/**
 * Layer 3 driver that talks to the application layer's PlanningService
 * directly, in-process — no browser, no server. Backed by
 * InMemoryPlanRepository. This carries the bulk of the acceptance suite:
 * sub-millisecond, deterministic, and exercises real production code
 * (PlanningServiceImpl + the domain) exactly the way the UI adapter does.
 */
export class InProcessPlannerDriver implements PlannerDriver {
  private readonly repository = new InMemoryPlanRepository();
  private readonly service = new PlanningServiceImpl(this.repository, new SequentialIdGenerator());
  private readonly idsByName = new Map<string, PlanId>();

  async planNames(): Promise<string[]> {
    return this.service.listPlans().map((p) => p.name);
  }

  async createPlan(name: string): Promise<void> {
    this.idsByName.set(name, this.service.createPlan(name));
  }

  async renamePlan(currentName: string, newName: string): Promise<void> {
    const id = this.idFor(currentName);
    this.service.renamePlan(id, newName);
    this.idsByName.delete(currentName);
    this.idsByName.set(newName, id);
  }

  async duplicatePlan(name: string): Promise<void> {
    const copyId = this.service.duplicatePlan(this.idFor(name));
    this.idsByName.set(`${name} copy`, copyId);
  }

  async deletePlan(name: string): Promise<void> {
    this.service.deletePlan(this.idFor(name));
    this.idsByName.delete(name);
  }

  async setUnits(planName: string, units: UnitSystem): Promise<void> {
    this.service.setUnits(this.idFor(planName), units);
  }

  async addSegment(planName: string, type: Exclude<SegmentType, 'interval'>, spec: FieldSpec): Promise<void> {
    const pid = this.idFor(planName);
    const segId = this.service.addSegment(pid, type);
    this.applyFields(
      spec,
      (field, raw) => this.service.setSegmentField(pid, segId, field, raw),
      (mode) => this.service.setSegmentMode(pid, segId, mode)
    );
  }

  async addIntervalSegment(planName: string, spec: IntervalSpec): Promise<void> {
    const pid = this.idFor(planName);
    const segId = this.service.addSegment(pid, 'interval');

    let steps = this.stepsOf(pid, segId);
    while (steps.length < spec.steps.length) {
      this.service.addIntervalStep(pid, segId);
      steps = this.stepsOf(pid, segId);
    }
    while (steps.length > spec.steps.length) {
      this.service.removeIntervalStep(pid, segId, steps[steps.length - 1]!.id);
      steps = this.stepsOf(pid, segId);
    }
    steps.forEach((step, i) => {
      this.service.setStepKind(pid, segId, step.id, spec.steps[i]!.kind ?? 'work');
      this.applyFields(
        spec.steps[i]!,
        (field, raw) => this.service.setStepField(pid, segId, step.id, field, raw),
        (mode) => this.service.setStepMode(pid, segId, step.id, mode)
      );
    });

    if (spec.reps != null) {
      const currentReps = this.segmentOf(pid, segId).reps;
      this.service.setReps(pid, segId, spec.reps - currentReps);
    }

    const wantsRest = spec.rest != null;
    if (wantsRest !== this.segmentOf(pid, segId).restEnabled) this.service.toggleRest(pid, segId);
    if (spec.rest) {
      this.applyFields(
        spec.rest,
        (field, raw) => this.service.setRestField(pid, segId, field, raw),
        (mode) => this.service.setRestMode(pid, segId, mode)
      );
    }
  }

  async addSegmentUsingDefaults(planName: string, type: SegmentType): Promise<void> {
    this.service.addSegment(this.idFor(planName), type);
  }

  async removeSegment(planName: string, segmentIndex: number): Promise<void> {
    const pid = this.idFor(planName);
    const segId = this.service.getPlan(pid).segments[segmentIndex]!.id;
    this.service.removeSegment(pid, segId);
  }

  async moveSegment(planName: string, fromIndex: number, toIndex: number): Promise<void> {
    const pid = this.idFor(planName);
    const ids = this.service.getPlan(pid).segments.map((s) => s.id);
    const [moved] = ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, moved!);
    this.service.reorderSegments(pid, ids);
  }

  async totals(planName: string): Promise<TotalsView> {
    return this.service.getTotals(this.idFor(planName));
  }

  async bestEffort(planName: string, key: string): Promise<EffortView | null> {
    const effort = this.service.getBestEfforts(this.idFor(planName)).find((e) => e.key === key);
    return effort ? { time: effort.time, pace: effort.pace } : null;
  }

  async segmentSummaries(planName: string): Promise<string[]> {
    return this.service.getPlan(this.idFor(planName)).segments.map((s) => s.summary);
  }

  private idFor(name: string): PlanId {
    const id = this.idsByName.get(name);
    if (!id) throw new Error(`No plan named "${name}" — create it first.`);
    return id;
  }

  private segmentOf(pid: PlanId, segId: SegmentId) {
    return this.service.getPlan(pid).segments.find((s) => s.id === segId)!;
  }

  private stepsOf(pid: PlanId, segId: SegmentId) {
    return this.segmentOf(pid, segId).steps;
  }

  private applyFields(
    spec: FieldSpec,
    setField: (field: SegmentField, raw: string) => void,
    setMode: (mode: FieldMode) => void
  ): void {
    setMode(spec.mode);
    switch (spec.mode) {
      case 'time-pace':
        setField('time', spec.time);
        setField('pace', spec.pace);
        break;
      case 'distance-pace':
        setField('distance', spec.distance);
        setField('pace', spec.pace);
        break;
      case 'time-distance':
        setField('time', spec.time);
        setField('distance', spec.distance);
        break;
    }
  }
}
