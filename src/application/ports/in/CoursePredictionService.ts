import type { Units } from '../../../domain/valueObjects/Units';
import type { CoursePredictionView } from '../../dto/CoursePredictionViews';

/** Primary (driving) port for the standalone hilly-course time predictor.
 * Deliberately separate from PlanningService — this feature has no
 * relationship to a Plan/Segment. */
export interface CoursePredictionService {
  predictCourseTime(gpxContent: string, targetPaceRaw: string, units: Units): CoursePredictionView;
}
