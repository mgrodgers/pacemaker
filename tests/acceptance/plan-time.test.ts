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

  test('editing a segment after the start time is set updates the derived end time', async () => {
    const plan = dsl
      .onPlan('Grows after start')
      .addTempo({ mode: 'time-pace', time: '45:00', pace: '6:00' })
      .setStartTime('06:00');
    expect((await plan.planTime())?.end.value).toBe('06:45');

    plan.addEasy({ mode: 'time-pace', time: '15:00', pace: '7:00' });
    expect(await plan.planTime()).toEqual({
      start: { value: '06:00', dayOffset: 0 },
      end: { value: '07:00', dayOffset: 0 },
    });
  });

  test('editing a segment after the end time is set updates the derived start time', async () => {
    const plan = dsl
      .onPlan('Grows after end')
      .addTempo({ mode: 'time-pace', time: '45:00', pace: '6:00' })
      .setEndTime('19:00');
    expect((await plan.planTime())?.start.value).toBe('18:15');

    plan.addEasy({ mode: 'time-pace', time: '15:00', pace: '7:00' });
    expect(await plan.planTime()).toEqual({
      start: { value: '18:00', dayOffset: 0 },
      end: { value: '19:00', dayOffset: 0 },
    });
  });

  test('explicitly clearing the plan time removes both start and end', async () => {
    const plan = dsl
      .onPlan('Cleared')
      .addTempo({ mode: 'time-pace', time: '45:00', pace: '6:00' })
      .setStartTime('06:00')
      .clearTime();
    expect(await plan.planTime()).toBeNull();
  });

  test('blanking the anchor field has the same effect as an explicit clear', async () => {
    const plan = dsl
      .onPlan('Blanked')
      .addTempo({ mode: 'time-pace', time: '45:00', pace: '6:00' })
      .setStartTime('06:00')
      .setStartTime('');
    expect(await plan.planTime()).toBeNull();
  });

  test('a plan with no timed segments has no start/end time to display, even if one was set earlier', async () => {
    const plan = dsl
      .onPlan('Emptied out')
      .addTempo({ mode: 'time-pace', time: '45:00', pace: '6:00' })
      .setStartTime('06:00')
      .removeSegment(0);
    expect(await plan.planTime()).toBeNull();

    plan.addTempo({ mode: 'time-pace', time: '45:00', pace: '6:00' });
    expect(await plan.planTime()).toEqual({
      start: { value: '06:00', dayOffset: 0 },
      end: { value: '06:45', dayOffset: 0 },
    });
  });
});
