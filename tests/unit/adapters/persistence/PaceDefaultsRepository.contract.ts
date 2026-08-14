import { describe, expect, test } from 'vitest';
import type { PaceDefaultsRepository } from '../../../../src/application/ports/out/PaceDefaultsRepository';
import { EMPTY_PACE_DEFAULTS } from '../../../../src/domain/valueObjects/PaceDefaults';

/** Shared behavioral contract every PaceDefaultsRepository implementation
 * must satisfy — see LocalStoragePaceDefaultsRepository.contract.test.ts
 * and InMemoryPaceDefaultsRepository.contract.test.ts. */
export function paceDefaultsRepositoryContract(makeRepository: () => PaceDefaultsRepository): void {
  describe('PaceDefaultsRepository contract', () => {
    test('load with nothing saved returns the empty defaults', () => {
      expect(makeRepository().load()).toEqual(EMPTY_PACE_DEFAULTS);
    });

    test('save then load returns the saved defaults', () => {
      const repository = makeRepository();
      repository.save({ units: 'mi', paceSecPerKm: { tempo: 300 } });
      expect(repository.load()).toEqual({ units: 'mi', paceSecPerKm: { tempo: 300 } });
    });

    test('save replaces the previous defaults rather than merging', () => {
      const repository = makeRepository();
      repository.save({ units: 'km', paceSecPerKm: { tempo: 300 } });
      repository.save({ units: 'km', paceSecPerKm: { rest: 420 } });
      expect(repository.load()).toEqual({ units: 'km', paceSecPerKm: { rest: 420 } });
    });
  });
}
