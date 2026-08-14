import type { PaceDefaults } from '../../../domain/valueObjects/PaceDefaults';

/** Secondary port for the single, global, non-plan-scoped pace-defaults
 * record. Mirrors `PlanRepository`'s shape but for one object, not a
 * collection. */
export interface PaceDefaultsRepository {
  load(): PaceDefaults;
  save(defaults: PaceDefaults): void;
}
