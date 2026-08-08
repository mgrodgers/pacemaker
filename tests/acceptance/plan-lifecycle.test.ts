import { beforeEach, describe, expect, test } from 'vitest';
import { PlannerDsl } from '../dsl/PlannerDsl';
import { InProcessPlannerDriver } from '../drivers/InProcessPlannerDriver';

let dsl: PlannerDsl;

beforeEach(() => {
  dsl = new PlannerDsl(new InProcessPlannerDriver());
});

describe('plan lifecycle', () => {
  test('a new plan starts with no distance, time, or pace', async () => {
    expect(await dsl.onPlan('Empty plan').totals()).toEqual({ distance: '0 km', time: '0:00', pace: '—/km' });
  });

  test('renaming a plan keeps its segments', async () => {
    const renamed = dsl.onPlan('Old name').addWarmup({ mode: 'time-pace', time: '5:00', pace: '6:00' }).rename('New name');
    expect((await renamed.totals()).time).toBe('5:00');
  });

  test('duplicating a plan copies its segments independently of the original', async () => {
    const source = dsl.onPlan('Source').addWarmup({ mode: 'time-pace', time: '5:00', pace: '6:00' });
    const copy = source.duplicate();
    expect(await copy.totals()).toEqual(await dsl.onPlan('Source').totals());

    copy.addWarmup({ mode: 'time-pace', time: '5:00', pace: '6:00' });
    expect(await copy.segmentSummaries()).toHaveLength(2);
    expect(await dsl.onPlan('Source').segmentSummaries()).toHaveLength(1);
  });

  test('deleting a plan removes its data — reopening the name starts fresh', async () => {
    await dsl.onPlan('Temporary').addWarmup({ mode: 'time-pace', time: '5:00', pace: '6:00' }).delete();
    expect((await dsl.onPlan('Temporary').totals()).time).toBe('0:00');
  });
});
