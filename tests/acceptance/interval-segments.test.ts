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

  test('a rest step fires even when the interval has a single rep, unlike rest-between-reps', async () => {
    const plan = dsl.onPlan('Rest step single rep').addInterval({
      steps: [
        { mode: 'distance-pace', distance: '1', pace: '5:00' },
        { kind: 'rest', mode: 'time-distance', time: '1:30', distance: '0' },
      ],
      reps: 1,
      rest: null, // rest-between-reps stays off — only the step-level rest should count
    });
    expect((await plan.totals()).time).toBe('6:30'); // 5:00 work + 1:30 rest step
  });

  test('multiple rests can sit between different steps in the same interval', async () => {
    const plan = dsl.onPlan('Multiple rest steps').addInterval({
      steps: [
        { mode: 'distance-pace', distance: '0.4', pace: '5:00' },
        { kind: 'rest', mode: 'time-distance', time: '1:00', distance: '0' },
        { mode: 'distance-pace', distance: '0.4', pace: '5:00' },
        { kind: 'rest', mode: 'time-distance', time: '0:30', distance: '0' },
        { mode: 'distance-pace', distance: '0.4', pace: '5:00' },
      ],
      reps: 1,
      rest: null,
    });
    expect((await plan.totals()).distance).toBe('1.2 km');
    expect((await plan.totals()).time).toBe('7:30'); // 3x2:00 work + 1:00 + 0:30 rest
  });

  test('the ladder summary shows a rest step distinctly from a work step', async () => {
    const plan = dsl.onPlan('Rest step summary').addInterval({
      steps: [
        { mode: 'distance-pace', distance: '0.4', pace: '5:00' },
        { kind: 'rest', mode: 'time-pace', time: '1:00', pace: '7:00' },
      ],
      reps: 1,
      rest: null,
    });
    expect((await plan.segmentSummaries())[0]).toBe('0.4km@5:00, rest 1:00');
  });
});
