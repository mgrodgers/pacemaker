import { beforeEach, describe, expect, test } from 'vitest';
import { PlannerDsl } from '../dsl/PlannerDsl';
import { InProcessPlannerDriver } from '../drivers/InProcessPlannerDriver';

let dsl: PlannerDsl;

beforeEach(() => {
  dsl = new PlannerDsl(new InProcessPlannerDriver());
});

describe('interval segments', () => {
  test('reps repeat every step in the ladder', async () => {
    const plan = dsl.onPlan('Track session').addInterval({
      steps: [
        { mode: 'distance-pace', distance: '0.4', pace: '5:30' },
        { mode: 'distance-pace', distance: '0.4', pace: '5:00' },
      ],
      reps: 3,
      rest: null,
    });
    // 2 steps x 3 reps x 0.4km = 2.4km, no rest configured
    expect((await plan.totals()).distance).toBe('2.4 km');
  });

  test('rest between reps adds time but not distance', async () => {
    const withoutRest = dsl.onPlan('No rest').addInterval({
      steps: [{ mode: 'distance-pace', distance: '0.4', pace: '5:00' }],
      reps: 2,
      rest: null,
    });
    const withRest = dsl.onPlan('With rest').addInterval({
      steps: [{ mode: 'distance-pace', distance: '0.4', pace: '5:00' }],
      reps: 2,
      rest: { mode: 'time-distance', time: '1:30', distance: '0' },
    });
    expect((await withRest.totals()).distance).toBe((await withoutRest.totals()).distance);
    expect((await withRest.totals()).time).not.toBe((await withoutRest.totals()).time);
    expect((await withRest.totals()).time).toBe('5:30'); // 2x(0.4km@5:00 = 2:00) + one 1:30 rest
  });

  test('a single-rep interval never adds rest, even if rest is configured', async () => {
    const plan = dsl.onPlan('Single rep').addInterval({
      steps: [{ mode: 'distance-pace', distance: '1', pace: '5:00' }],
      reps: 1,
      rest: { mode: 'time-distance', time: '1:30', distance: '0' },
    });
    expect((await plan.totals()).time).toBe('5:00');
  });

  test('a rest placed between two work steps adds its own time to the plan', async () => {
    const plan = dsl.onPlan('Rest between steps').addInterval({
      steps: [
        { mode: 'distance-pace', distance: '0.4', pace: '5:00' },
        { kind: 'rest', mode: 'time-distance', time: '1:30', distance: '0' },
        { mode: 'distance-pace', distance: '0.4', pace: '5:00' },
      ],
      reps: 1,
      rest: null,
    });
    expect((await plan.totals()).distance).toBe('0.8 km');
    expect((await plan.totals()).time).toBe('5:30'); // 2:00 + 1:30 + 2:00
  });
});
