import { beforeEach, describe, expect, test } from 'vitest';
import { PlannerDsl } from '../dsl/PlannerDsl';
import { InProcessPlannerDriver } from '../drivers/InProcessPlannerDriver';

let dsl: PlannerDsl;

beforeEach(() => {
  dsl = new PlannerDsl(new InProcessPlannerDriver());
});

describe('best potential efforts', () => {
  test('a plan shorter than 1km reports no best efforts', async () => {
    const plan = dsl.onPlan('Short').addWarmup({ mode: 'time-pace', time: '2:00', pace: '6:30' });
    expect(await plan.bestEffort('1k')).toBeNull();
  });

  test('best 5k effort on a uniform 5k tempo run equals its own pace', async () => {
    const plan = dsl.onPlan('Tempo').addTempo({ mode: 'distance-pace', distance: '5', pace: '4:30' });
    expect(await plan.bestEffort('5k')).toEqual({ time: '22:30', pace: '4:30/km' });
  });

  test('the fastest segment wins the best-effort window even when slower segments surround it', async () => {
    const plan = dsl
      .onPlan('Fartlek')
      .addEasy({ mode: 'distance-pace', distance: '2', pace: '6:00' })
      .addTempo({ mode: 'distance-pace', distance: '2', pace: '4:00' })
      .addCooldown({ mode: 'time-pace', time: '10:00', pace: '6:00' });
    expect((await plan.bestEffort('1k'))?.time).toBe('4:00');
  });
});
