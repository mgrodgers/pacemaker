import { describe, expect, test } from 'vitest';
import type { PlanRepository } from '../../../../src/application/ports/out/PlanRepository';
import type { Plan } from '../../../../src/domain/entities/Plan';
import { planId } from '../../../../src/domain/valueObjects/Ids';

function samplePlan(id: string, name: string): Plan {
  return { id: planId(id), name, units: 'km', segments: [] };
}

/** Shared behavioral contract every PlanRepository implementation must
 * satisfy. Run this against each concrete adapter so they stay
 * interchangeable — see LocalStoragePlanRepository.contract.test.ts and
 * InMemoryPlanRepository.contract.test.ts. */
export function planRepositoryContract(makeRepository: () => PlanRepository): void {
  describe('PlanRepository contract', () => {
    test('findAll on an empty repository returns an empty array', () => {
      expect(makeRepository().findAll()).toEqual([]);
    });

    test('findById on an empty repository returns null', () => {
      expect(makeRepository().findById(planId('missing'))).toBeNull();
    });

    test('save then findById returns the saved plan', () => {
      const repository = makeRepository();
      const plan = samplePlan('p1', 'Track ladder');
      repository.save(plan);
      expect(repository.findById(planId('p1'))).toEqual(plan);
    });

    test('save with an existing id replaces it rather than duplicating it', () => {
      const repository = makeRepository();
      repository.save(samplePlan('p1', 'Original'));
      repository.save(samplePlan('p1', 'Renamed'));
      expect(repository.findAll()).toHaveLength(1);
      expect(repository.findById(planId('p1'))?.name).toBe('Renamed');
    });

    test('findAll returns every saved plan', () => {
      const repository = makeRepository();
      repository.save(samplePlan('p1', 'First'));
      repository.save(samplePlan('p2', 'Second'));
      expect(repository.findAll().map((p) => p.id).sort()).toEqual(['p1', 'p2']);
    });

    test('deleteById removes only that plan', () => {
      const repository = makeRepository();
      repository.save(samplePlan('p1', 'Keep'));
      repository.save(samplePlan('p2', 'Drop'));
      repository.deleteById(planId('p2'));
      expect(repository.findAll().map((p) => p.id)).toEqual(['p1']);
    });

    test('deleteById on an id that does not exist is a no-op', () => {
      const repository = makeRepository();
      repository.save(samplePlan('p1', 'Keep'));
      expect(() => repository.deleteById(planId('missing'))).not.toThrow();
      expect(repository.findAll()).toHaveLength(1);
    });
  });
}
