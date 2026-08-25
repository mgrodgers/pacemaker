import type { Units } from '../valueObjects/Units';
import type { CoursePredictionId } from '../valueObjects/Ids';

export interface SavedCourseSplit {
  readonly km: number;
  readonly grade: string;
  readonly pace: string;
}

export interface SavedCoursePrediction {
  readonly id: CoursePredictionId;
  readonly fileName: string;
  readonly targetPaceRaw: string;
  readonly units: Units;
  readonly savedAt: string;
  readonly totalTime: string;
  readonly splits: readonly SavedCourseSplit[];
}
