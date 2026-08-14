import { beforeEach, describe, expect, test } from 'vitest';
import { PlannerDsl } from '../dsl/PlannerDsl';
import { InProcessPlannerDriver } from '../drivers/InProcessPlannerDriver';

let dsl: PlannerDsl;

beforeEach(() => {
  dsl = new PlannerDsl(new InProcessPlannerDriver());
});

describe('default pace settings: fallback before configuration', () => {
  test('a tempo segment added with no configured default uses the existing built-in preset pace', async () => {
    const plan = dsl.onPlan('Tempo run').addSegmentUsingDefaults('tempo');
    expect((await plan.segmentSummaries())[0]).toBe('11:00 · 2km @ 5:30/km');
  });
});
