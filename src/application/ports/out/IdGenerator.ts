import type { PlanId, SegmentId, StepId, CoursePredictionId } from '../../../domain/valueObjects/Ids';

/** Secondary (driven) port: id creation is infrastructure, not domain —
 * kept behind a port so tests can inject deterministic ids. */
export interface IdGenerator {
  newPlanId(): PlanId;
  newSegmentId(): SegmentId;
  newStepId(): StepId;
  newCoursePredictionId(): CoursePredictionId;
}
