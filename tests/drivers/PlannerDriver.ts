import type { Units } from '../../src/domain/valueObjects/Units';
import type { SegmentType } from '../../src/domain/valueObjects/SegmentType';
import type { StepKind } from '../../src/domain/valueObjects/StepKind';

export type UnitSystem = Units;

export type FieldSpec =
  | { mode: 'time-pace'; time: string; pace: string }
  | { mode: 'distance-pace'; distance: string; pace: string }
  | { mode: 'time-distance'; time: string; distance: string };

/** One entry in an interval's ladder. `kind` defaults to `'work'` when
 * omitted — only specify `'rest'` to place a rest between steps. */
export type IntervalStepSpec = FieldSpec & { readonly kind?: StepKind };

export interface IntervalSpec {
  readonly steps: readonly IntervalStepSpec[];
  readonly reps?: number;
  /** Omit or pass null to leave rest-between-reps disabled. */
  readonly rest?: FieldSpec | null;
}

export interface EffortView {
  readonly time: string;
  readonly pace: string;
}

export interface TotalsView {
  readonly distance: string;
  readonly time: string;
  readonly pace: string;
}

/**
 * Layer 3 (Protocol Driver): translates the DSL's intent into a concrete
 * way of talking to the system under test. Every method here is expressed
 * in terms a human could observe — plan names, segment position, visible
 * field values — never internal ids, so an in-process driver and a
 * UI-automation driver can both implement it without the DSL or Layer-1
 * tests knowing which one is running.
 *
 * Every method is async: a UI driver has to wait on real browser
 * interactions, so the contract is async everywhere, even where the
 * in-process driver resolves immediately.
 */
export interface PlannerDriver {
  planNames(): Promise<string[]>;
  createPlan(name: string): Promise<void>;
  renamePlan(currentName: string, newName: string): Promise<void>;
  duplicatePlan(name: string): Promise<void>;
  deletePlan(name: string): Promise<void>;
  setUnits(planName: string, units: UnitSystem): Promise<void>;

  addSegment(planName: string, type: Exclude<SegmentType, 'interval'>, spec: FieldSpec): Promise<void>;
  addIntervalSegment(planName: string, spec: IntervalSpec): Promise<void>;
  removeSegment(planName: string, segmentIndex: number): Promise<void>;
  moveSegment(planName: string, fromIndex: number, toIndex: number): Promise<void>;

  totals(planName: string): Promise<TotalsView>;
  bestEffort(planName: string, key: string): Promise<EffortView | null>;
  segmentSummaries(planName: string): Promise<string[]>;
}
