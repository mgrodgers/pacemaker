import { beforeEach, describe, expect, test } from 'vitest';
import { PlannerDsl } from '../dsl/PlannerDsl';
import { InProcessPlannerDriver } from '../drivers/InProcessPlannerDriver';

let dsl: PlannerDsl;

beforeEach(() => {
  dsl = new PlannerDsl(new InProcessPlannerDriver());
});

describe('units conversion', () => {
  test('switching a plan to miles converts its displayed totals', async () => {
    const plan = dsl.onPlan('5k').addTempo({ mode: 'distance-pace', distance: '5', pace: '4:30' });
    expect((await plan.totals()).distance).toBe('5 km');

    plan.setUnits('mi');
    expect((await plan.totals()).distance).toBe('3.11 mi');
  });
});
