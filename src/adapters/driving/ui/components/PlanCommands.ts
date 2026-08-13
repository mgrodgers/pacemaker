import type { SegmentId, StepId } from '../../../../domain/valueObjects/Ids';
import type { FieldMode, SegmentField } from '../../../../domain/valueObjects/FieldMode';
import type { SegmentType } from '../../../../domain/valueObjects/SegmentType';
import type { StepKind } from '../../../../domain/valueObjects/StepKind';

/** The subset of usePlanController's commands the segment/step tree needs.
 * Passed down as one object so SegmentList/SegmentCard/StepEditor don't
 * thread a dozen individual callback props. */
export interface PlanCommands {
  addSegment: (type: SegmentType) => void;
  removeSegment: (segmentId: SegmentId) => void;
  reorderSegments: (orderedSegmentIds: SegmentId[]) => void;
  setSegmentMode: (segmentId: SegmentId, mode: FieldMode) => void;
  setSegmentField: (segmentId: SegmentId, field: SegmentField, raw: string) => void;
  setReps: (segmentId: SegmentId, delta: number) => void;
  toggleRest: (segmentId: SegmentId) => void;
  setRestMode: (segmentId: SegmentId, mode: FieldMode) => void;
  setRestField: (segmentId: SegmentId, field: SegmentField, raw: string) => void;
  addIntervalStep: (segmentId: SegmentId, kind?: StepKind) => void;
  removeIntervalStep: (segmentId: SegmentId, stepId: StepId) => void;
  setStepMode: (segmentId: SegmentId, stepId: StepId, mode: FieldMode) => void;
  setStepField: (segmentId: SegmentId, stepId: StepId, field: SegmentField, raw: string) => void;
}
