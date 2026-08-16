import { beforeEach } from 'vitest';
import { LocalStorageCoursePredictionRepository } from '../../../../src/adapters/driven/persistence/LocalStorageCoursePredictionRepository';
import { coursePredictionRepositoryContract } from './CoursePredictionRepository.contract';

beforeEach(() => {
  window.localStorage.clear();
});

coursePredictionRepositoryContract(() => new LocalStorageCoursePredictionRepository());
