import { describe, expect, test } from 'vitest';
import type { CoursePredictionRepository } from '../../../../src/application/ports/out/CoursePredictionRepository';
import type { SavedCoursePrediction } from '../../../../src/domain/entities/SavedCoursePrediction';
import { coursePredictionId } from '../../../../src/domain/valueObjects/Ids';

function samplePrediction(id: string, fileName: string): SavedCoursePrediction {
  return {
    id: coursePredictionId(id),
    fileName,
    targetPaceRaw: '5:00',
    units: 'km',
    savedAt: '2026-08-16T00:00:00.000Z',
    totalTime: '10:00',
    splits: [{ km: 1, grade: '+0.0%', pace: '5:00' }],
  };
}

/** Shared behavioral contract every CoursePredictionRepository
 * implementation must satisfy — mirrors PlanRepository.contract.ts. */
export function coursePredictionRepositoryContract(makeRepository: () => CoursePredictionRepository): void {
  describe('CoursePredictionRepository contract', () => {
    test('findAll on an empty repository returns an empty array', () => {
      expect(makeRepository().findAll()).toEqual([]);
    });

    test('save then findAll returns the saved prediction', () => {
      const repository = makeRepository();
      const prediction = samplePrediction('cp1', 'course.gpx');
      repository.save(prediction);
      expect(repository.findAll()).toEqual([prediction]);
    });

    test('save with an existing id replaces it rather than duplicating it', () => {
      const repository = makeRepository();
      repository.save(samplePrediction('cp1', 'first.gpx'));
      repository.save(samplePrediction('cp1', 'renamed.gpx'));
      expect(repository.findAll()).toHaveLength(1);
      expect(repository.findAll()[0].fileName).toBe('renamed.gpx');
    });

    test('findAll returns every saved prediction', () => {
      const repository = makeRepository();
      repository.save(samplePrediction('cp1', 'first.gpx'));
      repository.save(samplePrediction('cp2', 'second.gpx'));
      expect(repository.findAll().map((p) => p.id).sort()).toEqual(['cp1', 'cp2']);
    });

    test('deleteById removes only that prediction', () => {
      const repository = makeRepository();
      repository.save(samplePrediction('cp1', 'keep.gpx'));
      repository.save(samplePrediction('cp2', 'drop.gpx'));
      repository.deleteById(coursePredictionId('cp2'));
      expect(repository.findAll().map((p) => p.id)).toEqual(['cp1']);
    });

    test('deleteById on an id that does not exist is a no-op', () => {
      const repository = makeRepository();
      repository.save(samplePrediction('cp1', 'keep.gpx'));
      expect(() => repository.deleteById(coursePredictionId('missing'))).not.toThrow();
      expect(repository.findAll()).toHaveLength(1);
    });
  });
}
