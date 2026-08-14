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

  test('a default pace configured in mi converts correctly for a plan in km', async () => {
    await dsl.setDefaultPaceUnits('mi');
    await dsl.setDefaultPace('easy', '9:00'); // 9:00/mi
    const plan = dsl.onPlan('Easy run in km').addSegmentUsingDefaults('easy'); // plan stays km (the default)
    expect((await plan.segmentSummaries())[0]).toBe('16:47 · 3km @ 5:36/km');
  });
});

describe('default pace settings: unified rest handling', () => {
  test('a standalone rest segment added via defaults uses time-pace mode with the configured rest default pace', async () => {
    await dsl.setDefaultPace('rest', '10:00');
    const plan = dsl.onPlan('Rest segment').addSegmentUsingDefaults('rest');
    expect((await plan.segmentSummaries())[0]).toBe('1:30 · 0.15km @ 10:00/km');
  });
});
