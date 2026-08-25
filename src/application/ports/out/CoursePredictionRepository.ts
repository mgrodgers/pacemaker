import type { SavedCoursePrediction } from '../../../domain/entities/SavedCoursePrediction';
import type { CoursePredictionId } from '../../../domain/valueObjects/Ids';

/** Secondary (driven) port: how the application persists saved course
 * predictions. Every implementation must satisfy the shared contract in
 * tests/unit/adapters/persistence/CoursePredictionRepository.contract.ts. */
export interface CoursePredictionRepository {
  findAll(): SavedCoursePrediction[];
  save(prediction: SavedCoursePrediction): void;
  deleteById(id: CoursePredictionId): void;
}
