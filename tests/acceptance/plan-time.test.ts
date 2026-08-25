import { beforeEach, describe, expect, test } from 'vitest';
import { PlannerDsl } from '../dsl/PlannerDsl';
import { InProcessPlannerDriver } from '../drivers/InProcessPlannerDriver';

let dsl: PlannerDsl;

beforeEach(() => {
  dsl = new PlannerDsl(new InProcessPlannerDriver());
});

describe('plan start/end time', () => {
  test('setting a start time calculates the end time from the plan’s total', async () => {
    const plan = dsl.onPlan('Morning run').addTempo({ mode: 'time-pace', time: '45:00', pace: '6:00' }).setStartTime('06:00');
    expect(await plan.planTime()).toEqual({
      start: { value: '06:00', dayOffset: 0 },
      end: { value: '06:45', dayOffset: 0 },
    });
  });

  test('setting an end time calculates the start time from the plan’s total', async () => {
    const plan = dsl.onPlan('Evening run').addTempo({ mode: 'time-pace', time: '45:00', pace: '6:00' }).setEndTime('19:00');
    expect(await plan.planTime()).toEqual({
      start: { value: '18:15', dayOffset: 0 },
      end: { value: '19:00', dayOffset: 0 },
    });
  });

  test('setting the end time after the start time makes end the new anchor', async () => {
    const plan = dsl
      .onPlan('Switch anchor')
      .addTempo({ mode: 'time-pace', time: '45:00', pace: '6:00' })
      .setStartTime('06:00')
      .setEndTime('08:00');
    expect(await plan.planTime()).toEqual({
      start: { value: '07:15', dayOffset: 0 },
      end: { value: '08:00', dayOffset: 0 },
    });
  });
});
