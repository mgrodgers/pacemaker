import type { CoursePredictionService } from './ports/in/CoursePredictionService';
import type { GpxCourseParser } from './ports/out/GpxCourseParser';
import type { CoursePredictionRepository } from './ports/out/CoursePredictionRepository';
import type { IdGenerator } from './ports/out/IdGenerator';
import type { Units } from '../domain/valueObjects/Units';
import type { CoursePredictionView } from './dto/CoursePredictionViews';
import type { SavedCoursePrediction } from '../domain/entities/SavedCoursePrediction';
import type { CoursePredictionId } from '../domain/valueObjects/Ids';
import { Pace } from '../domain/valueObjects/Pace';
import { Duration } from '../domain/valueObjects/Duration';
import { predictCourseTime as computeCoursePrediction } from '../domain/services/CoursePredictor';
import { InvalidPaceError } from './errors/CoursePredictionError';

export class CoursePredictionServiceImpl implements CoursePredictionService {
  constructor(
    private readonly gpxParser: GpxCourseParser,
    private readonly repository: CoursePredictionRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  predictCourseTime(gpxContent: string, targetPaceRaw: string, units: Units): CoursePredictionView {
    const pace = Pace.parse(targetPaceRaw, units);
    if (pace == null || !pace.isKnown) throw new InvalidPaceError();

    const points = this.gpxParser.parse(gpxContent);
    const prediction = computeCoursePrediction(points, pace.secPerKm!);

    return {
      units,
      totalTime: Duration.ofSeconds(prediction.totalTimeSec).format(),
      splits: prediction.splits.map((split) => ({
        km: split.km,
        grade: `${split.avgGrade.percent >= 0 ? '+' : ''}${split.avgGrade.percent.toFixed(1)}%`,
        pace: Pace.ofSecPerKm(split.paceSecPerKm).format(units),
      })),
    };
  }

  savePrediction(fileName: string, targetPaceRaw: string, prediction: CoursePredictionView): SavedCoursePrediction {
    const saved: SavedCoursePrediction = {
      id: this.idGenerator.newCoursePredictionId(),
      fileName,
      targetPaceRaw,
      units: prediction.units,
      savedAt: new Date().toISOString(),
      totalTime: prediction.totalTime,
      splits: prediction.splits,
    };
    this.repository.save(saved);
    return saved;
  }

  getSavedPredictions(): SavedCoursePrediction[] {
    return this.repository.findAll();
  }

  deleteSavedPrediction(id: CoursePredictionId): void {
    this.repository.deleteById(id);
  }
}
