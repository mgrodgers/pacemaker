import { PlanningServiceImpl } from '../application/PlanningServiceImpl';
import { seedExamplePlanIfEmpty } from '../application/ExamplePlanSeeder';
import { LocalStoragePlanRepository } from '../adapters/driven/persistence/LocalStoragePlanRepository';
import { RandomIdGenerator } from '../adapters/driven/persistence/IdGenerator';
import type { PlanningService } from '../application/ports/in/PlanningService';

/** The only place concrete adapters are wired to the application. Adding a
 * backend later means adding a new PlanRepository implementation here —
 * nothing in domain/, application/, or adapters/driving/ui needs to change. */
let service: PlanningService | null = null;

export function getPlanningService(): PlanningService {
  if (!service) {
    const repository = new LocalStoragePlanRepository();
    const idGenerator = new RandomIdGenerator();
    seedExamplePlanIfEmpty(repository, idGenerator);
    service = new PlanningServiceImpl(repository, idGenerator);
  }
  return service;
}
