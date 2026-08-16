import { InMemoryCoursePredictionRepository } from '../../../../src/adapters/driven/persistence/InMemoryCoursePredictionRepository';
import { coursePredictionRepositoryContract } from './CoursePredictionRepository.contract';

coursePredictionRepositoryContract(() => new InMemoryCoursePredictionRepository());
