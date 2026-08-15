import type { Units } from '../../domain/valueObjects/Units';

export interface CourseSplitView {
  readonly km: number;
  readonly grade: string;
  readonly pace: string;
}

export interface CoursePredictionView {
  readonly units: Units;
  readonly totalTime: string;
  readonly splits: readonly CourseSplitView[];
}
