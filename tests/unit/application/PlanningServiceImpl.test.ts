import { beforeEach, describe, expect, test } from 'vitest';
import { PlanningServiceImpl } from '../../../src/application/PlanningServiceImpl';
import { InMemoryPlanRepository } from '../../../src/adapters/driven/persistence/InMemoryPlanRepository';
import { PlanNotFoundError, SegmentNotFoundError, StepNotFoundError } from '../../../src/domain/errors/DomainError';
import type { IdGenerator } from '../../../src/application/ports/out/IdGenerator';
import { planId, segmentId, stepId, type PlanId, type SegmentId, type StepId } from '../../../src/domain/valueObjects/Ids';

class FixedIdGenerator implements IdGenerator {
  private planSeq = 0;
  private segmentSeq = 0;
  private stepSeq = 0;

  newPlanId(): PlanId {
    return planId(`p${++this.planSeq}`);
  }

  newSegmentId(): SegmentId {
    return segmentId(`s${++this.segmentSeq}`);
  }

  newStepId(): StepId {
    return stepId(`st${++this.stepSeq}`);
  }
}

let repository: InMemoryPlanRepository;
let service: PlanningServiceImpl;

beforeEach(() => {
  repository = new InMemoryPlanRepository();
  service = new PlanningServiceImpl(repository, new FixedIdGenerator());
});

describe('plan lifecycle', () => {
  test('createPlan starts with no segments, in km', () => {
    const id = service.createPlan('5k build-up');
    const plan = service.getPlan(id);
    expect(plan.name).toBe('5k build-up');
    expect(plan.units).toBe('km');
    expect(plan.segments).toEqual([]);
  });

  test('createPlan defaults to "New plan" with no name given', () => {
    const id = service.createPlan();
    expect(service.getPlan(id).name).toBe('New plan');
  });

  test('listPlans returns most-recently-created first', () => {
    service.createPlan('first');
    service.createPlan('second');
    expect(service.listPlans().map((p) => p.name)).toEqual(['second', 'first']);
  });

  test('renamePlan falls back to the previous name when given blank input', () => {
    const id = service.createPlan('original');
    service.renamePlan(id, '   ');
    expect(service.getPlan(id).name).toBe('original');
  });

  test('duplicatePlan copies segments with fresh ids and an appended "copy" suffix', () => {
    const id = service.createPlan('source');
    service.addSegment(id, 'warmup');
    const copyId = service.duplicatePlan(id);

    const original = service.getPlan(id);
    const copy = service.getPlan(copyId);
    expect(copy.name).toBe('source copy');
    expect(copy.segments).toHaveLength(1);
    expect(copy.segments[0]!.id).not.toBe(original.segments[0]!.id);
  });

  test('deletePlan removes it from listPlans', () => {
    const id = service.createPlan('gone soon');
    service.deletePlan(id);
    expect(service.listPlans()).toEqual([]);
  });

  test('operating on an unknown plan id throws PlanNotFoundError', () => {
    expect(() => service.getPlan(planId('missing'))).toThrow(PlanNotFoundError);
  });
});

describe('segments', () => {
  test('addSegment appends to the end of the plan', () => {
    const id = service.createPlan();
    service.addSegment(id, 'warmup');
    service.addSegment(id, 'cooldown');
    expect(service.getPlan(id).segments.map((s) => s.type)).toEqual(['warmup', 'cooldown']);
  });

  test('addSegment for an interval type seeds a 3-step ladder', () => {
    const id = service.createPlan();
    const segId = service.addSegment(id, 'interval');
    expect(service.getPlan(id).segments.find((s) => s.id === segId)!.steps).toHaveLength(3);
  });

  test('removeSegment drops exactly that segment', () => {
    const id = service.createPlan();
    const keep = service.addSegment(id, 'warmup');
    const drop = service.addSegment(id, 'cooldown');
    service.removeSegment(id, drop);
    expect(service.getPlan(id).segments.map((s) => s.id)).toEqual([keep]);
  });

  test('removeSegment on an unknown id throws', () => {
    const id = service.createPlan();
    expect(() => service.removeSegment(id, segmentId('nope'))).toThrow(SegmentNotFoundError);
  });

  test('reorderSegments applies the given order', () => {
    const id = service.createPlan();
    const a = service.addSegment(id, 'warmup');
    const b = service.addSegment(id, 'tempo');
    service.reorderSegments(id, [b, a]);
    expect(service.getPlan(id).segments.map((s) => s.id)).toEqual([b, a]);
  });

  test('reorderSegments with a list that omits a segment throws', () => {
    const id = service.createPlan();
    const a = service.addSegment(id, 'warmup');
    service.addSegment(id, 'tempo');
    expect(() => service.reorderSegments(id, [a])).toThrow(SegmentNotFoundError);
  });

  test('setSegmentField parses the edited field and recomputes the derived one', () => {
    const id = service.createPlan();
    const segId = service.addSegment(id, 'tempo'); // distance-pace preset
    service.setSegmentField(id, segId, 'distance', '4');
    const segment = service.getPlan(id).segments[0]!;
    expect(segment.distance.value).toBe('4');
    // pace stays as the preset (330s/km) since only distance was edited; time re-derives.
    expect(segment.time.value).toBe('22:00');
  });

  test('setReps never drops below 1', () => {
    const id = service.createPlan();
    const segId = service.addSegment(id, 'interval');
    service.setReps(id, segId, -100);
    expect(service.getPlan(id).segments[0]!.reps).toBe(1);
  });

  test('toggleRest flips restEnabled', () => {
    const id = service.createPlan();
    const segId = service.addSegment(id, 'interval'); // starts restEnabled: true
    service.toggleRest(id, segId);
    expect(service.getPlan(id).segments[0]!.restEnabled).toBe(false);
  });
});

describe('interval steps', () => {
  test('addIntervalStep appends a step to the ladder', () => {
    const id = service.createPlan();
    const segId = service.addSegment(id, 'interval');
    service.addIntervalStep(id, segId);
    expect(service.getPlan(id).segments[0]!.steps).toHaveLength(4);
  });

  test('removeIntervalStep on the last remaining step is a no-op', () => {
    const id = service.createPlan();
    const withStep = service.addSegment(id, 'interval');
    const steps = service.getPlan(id).segments.find((s) => s.id === withStep)!.steps;
    const soleStepId = steps[0]!.id;

    service.removeIntervalStep(id, withStep, steps[1]!.id);
    service.removeIntervalStep(id, withStep, steps[2]!.id);
    expect(service.getPlan(id).segments.find((s) => s.id === withStep)!.steps).toHaveLength(1);

    service.removeIntervalStep(id, withStep, soleStepId);
    expect(service.getPlan(id).segments.find((s) => s.id === withStep)!.steps).toHaveLength(1);
  });

  test('setStepField on an unknown step id throws', () => {
    const id = service.createPlan();
    const segId = service.addSegment(id, 'interval');
    expect(() => service.setStepField(id, segId, stepId('nope'), 'distance', '1')).toThrow(StepNotFoundError);
  });
});

describe('totals and best efforts', () => {
  test('getTotals reflects the plan’s current segments and units', () => {
    const id = service.createPlan();
    const segId = service.addSegment(id, 'tempo');
    service.setSegmentField(id, segId, 'distance', '5');
    service.setSegmentField(id, segId, 'pace', '4:30');
    const totals = service.getTotals(id);
    expect(totals.distance).toBe('5 km');
    expect(totals.time).toBe('22:30');
  });

  test('getBestEfforts omits distances the plan does not cover', () => {
    const id = service.createPlan();
    const segId = service.addSegment(id, 'tempo');
    service.setSegmentField(id, segId, 'distance', '2');
    service.setSegmentField(id, segId, 'pace', '5:00');
    const keys = service.getBestEfforts(id).map((e) => e.key);
    expect(keys).toEqual(['1k']);
  });
});
