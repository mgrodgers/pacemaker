import type { SavedCoursePrediction } from '../../../domain/entities/SavedCoursePrediction';
import type { CoursePredictionId } from '../../../domain/valueObjects/Ids';
import type { CoursePredictionRepository } from '../../../application/ports/out/CoursePredictionRepository';

const STORAGE_KEY = 'runPlanner.coursePredictions';

export class LocalStorageCoursePredictionRepository implements CoursePredictionRepository {
  findAll(): SavedCoursePrediction[] {
    return this.readAll();
  }

  save(prediction: SavedCoursePrediction): void {
    const predictions = this.readAll();
    const index = predictions.findIndex((p) => p.id === prediction.id);
    if (index === -1) predictions.push(prediction);
    else predictions[index] = prediction;
    this.writeAll(predictions);
  }

  deleteById(id: CoursePredictionId): void {
    this.writeAll(this.readAll().filter((p) => p.id !== id));
  }

  private readAll(): SavedCoursePrediction[] {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as SavedCoursePrediction[]) : [];
    } catch {
      return [];
    }
  }

  private writeAll(predictions: readonly SavedCoursePrediction[]): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(predictions));
    } catch {
      // Storage may be unavailable (private browsing quota, disabled
      // storage) — the in-memory copy already returned to the caller still
      // works for the rest of the session.
    }
  }
}
