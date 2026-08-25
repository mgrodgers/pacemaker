import type { SavedCoursePrediction } from '../../../domain/entities/SavedCoursePrediction';
import type { CoursePredictionId } from '../../../domain/valueObjects/Ids';
import type { CoursePredictionRepository } from '../../../application/ports/out/CoursePredictionRepository';

export class InMemoryCoursePredictionRepository implements CoursePredictionRepository {
  private readonly predictions: SavedCoursePrediction[] = [];

  findAll(): SavedCoursePrediction[] {
    return [...this.predictions];
  }

  save(prediction: SavedCoursePrediction): void {
    const index = this.predictions.findIndex((p) => p.id === prediction.id);
    if (index === -1) this.predictions.push(prediction);
    else this.predictions[index] = prediction;
  }

  deleteById(id: CoursePredictionId): void {
    const index = this.predictions.findIndex((p) => p.id === id);
    if (index !== -1) this.predictions.splice(index, 1);
  }
}
