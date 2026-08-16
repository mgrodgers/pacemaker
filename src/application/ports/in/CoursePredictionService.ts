import type { Units } from '../../../domain/valueObjects/Units';
import type { CoursePredictionView } from '../../dto/CoursePredictionViews';
import type { SavedCoursePrediction } from '../../../domain/entities/SavedCoursePrediction';
import type { CoursePredictionId } from '../../../domain/valueObjects/Ids';

/** Primary (driving) port for the standalone hilly-course time predictor.
 * Deliberately separate from PlanningService — this feature has no
 * relationship to a Plan/Segment. */
export interface CoursePredictionService {
  predictCourseTime(gpxContent: string, targetPaceRaw: string, units: Units): CoursePredictionView;
  savePrediction(fileName: string, targetPaceRaw: string, prediction: CoursePredictionView): SavedCoursePrediction;
  getSavedPredictions(): SavedCoursePrediction[];
  deleteSavedPrediction(id: CoursePredictionId): void;
}
