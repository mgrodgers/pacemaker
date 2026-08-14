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

describe('default pace settings: configuring a default', () => {
  test('setting a default pace for tempo changes the pace new tempo segments start with', async () => {
    await dsl.setDefaultPace('tempo', '5:00');
    const plan = dsl.onPlan('Faster tempo').addSegmentUsingDefaults('tempo');
    expect((await plan.segmentSummaries())[0]).toBe('10:00 · 2km @ 5:00/km');
  });

  test('changing a default pace later does not change the pace of segments already added', async () => {
    await dsl.setDefaultPace('tempo', '5:00');
    const plan = dsl.onPlan('Locked-in tempo').addSegmentUsingDefaults('tempo');
    await plan.segmentSummaries(); // force the segment to actually be added before the default changes
    await dsl.setDefaultPace('tempo', '4:45');
    expect((await plan.segmentSummaries())[0]).toBe('10:00 · 2km @ 5:00/km');
  });
});
