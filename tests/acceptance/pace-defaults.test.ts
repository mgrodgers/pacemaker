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

  test('a rest step added to an interval uses the configured rest default pace', async () => {
    await dsl.setDefaultPace('rest', '10:00');
    const plan = dsl
      .onPlan('Interval with rest step')
      .addInterval({
        steps: [{ mode: 'distance-pace', distance: '0.4', pace: '5:00' }],
        reps: 1,
        rest: null,
      })
      .addStepToInterval(0, 'rest');
    // work: 0.4km@5:00 = 2:00. rest step: default time 90s (unchanged) at
    // the configured 10:00/km pace => distance = 90/600 = 0.15km.
    expect((await plan.totals()).distance).toBe('0.55 km');
    expect((await plan.totals()).time).toBe('3:30');
  });

  test('"rest between reps" on an interval uses the configured rest default pace', async () => {
    await dsl.setDefaultPace('rest', '10:00'); // 600 sec/km
    // Everything else (3 work steps, 4 reps, rest-between-reps enabled) is
    // the app's built-in interval preset, left unconfigured.
    const plan = dsl.onPlan('Interval with rest between reps').addSegmentUsingDefaults('interval');
    // work: 4 reps x 3 steps x (0.4km @ built-in 5:00/km = 2:00) = 28:00, 4.8km
    // rest: fires 3 times (reps - 1), each 90s @ configured 10:00/km => 0.15km
    expect((await plan.totals()).time).toBe('28:30');
    expect((await plan.totals()).distance).toBe('5.25 km');
  });
});

describe('default pace settings: interval work-step seeding', () => {
  test('the first work step of a newly created interval uses the configured interval default pace', async () => {
    await dsl.setDefaultPace('interval', '4:00');
    const plan = dsl.onPlan('Interval first step').addSegmentUsingDefaults('interval');
    expect((await plan.segmentSummaries())[0]).toContain('0.4km@4:00');
  });

  test('every work step seeded when an interval is first created matches the pace of the step before it', async () => {
    await dsl.setDefaultPace('interval', '4:00');
    const plan = dsl.onPlan('Interval flat seeding').addSegmentUsingDefaults('interval');
    // 3 starter steps, all at the same flat pace — no varying ladder.
    expect((await plan.segmentSummaries())[0]).toBe('4 × (0.4km@4:00, 0.4km@4:00, 0.4km@4:00) · rest 1:30');
  });

  test('adding a work step via "+ Add step" takes the pace of the interval\'s last existing work step', async () => {
    await dsl.setDefaultPace('interval', '4:00'); // deliberately different — should NOT be picked up
    const plan = dsl
      .onPlan('Add step inherits last')
      .addInterval({
        steps: [
          { mode: 'distance-pace', distance: '0.4', pace: '5:00' },
          { mode: 'distance-pace', distance: '0.4', pace: '6:00' }, // "last" step
        ],
        reps: 1,
        rest: null,
      })
      .addStepToInterval(0, 'work');
    expect((await plan.segmentSummaries())[0]).toBe('0.4km@5:00, 0.4km@6:00, 0.4km@6:00');
  });

  test('adding a work step via "+ Add step" to an interval whose only existing step is a rest step falls back to the interval default', async () => {
    await dsl.setDefaultPace('interval', '4:00');
    const plan = dsl
      .onPlan('Add step after rest only')
      .addInterval({
        steps: [{ kind: 'rest', mode: 'time-pace', time: '1:00', pace: '7:00' }],
        reps: 1,
        rest: null,
      })
      .addStepToInterval(0, 'work');
    expect((await plan.segmentSummaries())[0]).toBe('rest 1:00, 0.4km@4:00');
  });
});
