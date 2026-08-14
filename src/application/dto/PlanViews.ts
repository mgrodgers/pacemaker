import type { PlanId, SegmentId, StepId } from '../../domain/valueObjects/Ids';
import type { Units } from '../../domain/valueObjects/Units';
import type { FieldMode } from '../../domain/valueObjects/FieldMode';
import type { SegmentType } from '../../domain/valueObjects/SegmentType';
import type { StepKind } from '../../domain/valueObjects/StepKind';

/** A field's display value plus whether it's currently derived (read-only)
 * under the segment/step's active mode. */
export interface FieldView {
  readonly value: string;
  readonly editable: boolean;
}

export interface StepDetail {
  readonly id: StepId;
  readonly kind: StepKind;
  readonly mode: FieldMode;
  readonly time: FieldView;
  readonly distance: FieldView;
  readonly pace: FieldView;
}

export interface SegmentDetail {
  readonly id: SegmentId;
  readonly type: SegmentType;
  readonly typeLabel: string;
  readonly tagClass: string;
  readonly mode: FieldMode;
  readonly time: FieldView;
  readonly distance: FieldView;
  readonly pace: FieldView;
  readonly reps: number;
  readonly restEnabled: boolean;
  readonly restMode: FieldMode;
  readonly restTime: FieldView;
  readonly restDistance: FieldView;
  readonly restPace: FieldView;
  readonly summary: string;
  readonly steps: readonly StepDetail[];
}

export interface PlanDetail {
  readonly id: PlanId;
  readonly name: string;
  readonly units: Units;
  readonly segments: readonly SegmentDetail[];
}

export interface PlanListItem {
  readonly id: PlanId;
  readonly name: string;
  readonly statsText: string;
}

export interface TotalsView {
  readonly distance: string;
  readonly time: string;
  readonly pace: string;
}

export interface BestEffortView {
  readonly key: string;
  readonly label: string;
  readonly time: string;
  readonly pace: string;
}
