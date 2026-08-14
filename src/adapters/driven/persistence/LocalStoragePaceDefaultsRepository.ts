import type { PaceDefaultsRepository } from '../../../application/ports/out/PaceDefaultsRepository';
import { EMPTY_PACE_DEFAULTS, type PaceDefaults } from '../../../domain/valueObjects/PaceDefaults';

const STORAGE_KEY = 'runPlanner.paceDefaults';

export class LocalStoragePaceDefaultsRepository implements PaceDefaultsRepository {
  load(): PaceDefaults {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return EMPTY_PACE_DEFAULTS;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? (parsed as PaceDefaults) : EMPTY_PACE_DEFAULTS;
    } catch {
      return EMPTY_PACE_DEFAULTS;
    }
  }

  save(defaults: PaceDefaults): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    } catch {
      /* storage may be unavailable; in-memory copy still works this session */
    }
  }
}
