import { beforeEach, describe, expect, test } from 'vitest';
import { PlannerDsl } from '../dsl/PlannerDsl';
import { InProcessPlannerDriver } from '../drivers/InProcessPlannerDriver';

let dsl: PlannerDsl;

beforeEach(() => {
  dsl = new PlannerDsl(new InProcessPlannerDriver());
});

describe('segment field modes: any two of time/distance/pace determine the third', () => {
  test('time+pace derives distance', async () => {
    const plan = dsl.onPlan('Tempo run').addTempo({ mode: 'time-pace', time: '20:00', pace: '5:00' });
    expect((await plan.segmentSummaries())[0]).toBe('20:00 · 4km @ 5:00/km');
  });

  test('distance+pace derives time', async () => {
    const plan = dsl.onPlan('Tempo run').addTempo({ mode: 'distance-pace', distance: '5', pace: '4:30' });
    expect((await plan.totals()).time).toBe('22:30');
  });

  test('time+distance derives pace', async () => {
    const plan = dsl.onPlan('Tempo run').addTempo({ mode: 'time-distance', time: '30:00', distance: '5' });
    expect((await plan.totals()).pace).toBe('6:00/km');
  });
});
