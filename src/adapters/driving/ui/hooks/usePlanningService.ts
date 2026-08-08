import { useMemo } from 'react';
import { getPlanningService } from '../../../../composition/container';
import type { PlanningService } from '../../../../application/ports/in/PlanningService';

export function usePlanningService(): PlanningService {
  return useMemo(() => getPlanningService(), []);
}
