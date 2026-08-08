import { beforeEach, describe, expect, test } from 'vitest';
import { PlannerDsl } from '../dsl/PlannerDsl';
import { InProcessPlannerDriver } from '../drivers/InProcessPlannerDriver';

let dsl: PlannerDsl;

beforeEach(() => {
  dsl = new PlannerDsl(new InProcessPlannerDriver());
});

describe('reordering segments', () => {
  test('moving a segment changes summary order but not the plan totals', async () => {
    const plan = dsl
      .onPlan('Ladder')
      .addWarmup({ mode: 'time-pace', time: '5:00', pace: '6:00' })
      .addCooldown({ mode: 'time-pace', time: '5:00', pace: '6:30' });

    const before = await plan.totals();
    const beforeOrder = await plan.segmentSummaries();

    plan.moveSegment(0, 1);

    expect(await plan.totals()).toEqual(before);
    expect(await plan.segmentSummaries()).toEqual([...beforeOrder].reverse());
  });
});
