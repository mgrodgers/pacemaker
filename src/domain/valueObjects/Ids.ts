export type PlanId = string & { readonly __brand: 'PlanId' };
export type SegmentId = string & { readonly __brand: 'SegmentId' };
export type StepId = string & { readonly __brand: 'StepId' };
export type CoursePredictionId = string & { readonly __brand: 'CoursePredictionId' };

export function planId(value: string): PlanId {
  return value as PlanId;
}

export function segmentId(value: string): SegmentId {
  return value as SegmentId;
}

export function stepId(value: string): StepId {
  return value as StepId;
}

export function coursePredictionId(value: string): CoursePredictionId {
  return value as CoursePredictionId;
}
