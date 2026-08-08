import { useCallback, useState } from 'react';
import { usePlanningService } from './usePlanningService';
import type { PlanId } from '../../../../domain/valueObjects/Ids';

/** Drives the plans-list screen. Every command re-fetches `listPlans()` on
 * the next render by bumping a local revision counter — the application
 * layer is the single source of truth, this hook just forces React to ask
 * it again after a command runs. */
export function usePlansController() {
  const service = usePlanningService();
  const [, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((r) => r + 1), []);

  const run = useCallback(
    <Args extends unknown[], R>(fn: (...args: Args) => R) =>
      (...args: Args): R => {
        const result = fn(...args);
        refresh();
        return result;
      },
    [refresh]
  );

  return {
    plans: service.listPlans(),
    createPlan: run(() => service.createPlan()),
    renamePlan: run((id: PlanId, name: string) => service.renamePlan(id, name)),
    duplicatePlan: run((id: PlanId) => service.duplicatePlan(id)),
    deletePlan: run((id: PlanId) => service.deletePlan(id)),
  };
}
