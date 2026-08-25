import type { IdGenerator } from '../../../application/ports/out/IdGenerator';
import {
  planId,
  segmentId,
  stepId,
  coursePredictionId,
  type PlanId,
  type SegmentId,
  type StepId,
  type CoursePredictionId,
} from '../../../domain/valueObjects/Ids';

function randomSuffix(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2, 10);
}

export class RandomIdGenerator implements IdGenerator {
  newPlanId(): PlanId {
    return planId(`p_${randomSuffix()}`);
  }

  newSegmentId(): SegmentId {
    return segmentId(`s_${randomSuffix()}`);
  }

  newStepId(): StepId {
    return stepId(`st_${randomSuffix()}`);
  }

  newCoursePredictionId(): CoursePredictionId {
    return coursePredictionId(`cp_${randomSuffix()}`);
  }
}
