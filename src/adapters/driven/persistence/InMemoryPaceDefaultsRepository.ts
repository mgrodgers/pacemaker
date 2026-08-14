import type { PaceDefaultsRepository } from '../../../application/ports/out/PaceDefaultsRepository';
import { EMPTY_PACE_DEFAULTS, type PaceDefaults } from '../../../domain/valueObjects/PaceDefaults';

/** Backs the InProcessPlannerDriver in tests, and doubles as a fake in
 * application-layer unit tests. */
export class InMemoryPaceDefaultsRepository implements PaceDefaultsRepository {
  private defaults: PaceDefaults = EMPTY_PACE_DEFAULTS;

  load(): PaceDefaults {
    return this.defaults;
  }

  save(defaults: PaceDefaults): void {
    this.defaults = defaults;
  }
}
