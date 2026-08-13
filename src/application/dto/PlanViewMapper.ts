import type { Plan } from '../../domain/entities/Plan';
import type { Segment } from '../../domain/entities/Segment';
import type { Step } from '../../domain/entities/Step';
import type { Units } from '../../domain/valueObjects/Units';
import type { StepKind } from '../../domain/valueObjects/StepKind';
import { isFieldEditable } from '../../domain/valueObjects/FieldMode';
import { SEGMENT_TYPE_META } from '../../domain/valueObjects/SegmentType';
import { Duration } from '../../domain/valueObjects/Duration';
import { Distance } from '../../domain/valueObjects/Distance';
import { Pace } from '../../domain/valueObjects/Pace';
import { summarizePlan } from '../../domain/services/PlanSummaryCalculator';
import type {
  BestEffortView,
  FieldView,
  PlanDetail,
  PlanListItem,
  SegmentDetail,
  StepDetail,
  TotalsView,
} from './PlanViews';

function timeField(mode: Segment['mode'], seconds: number): FieldView {
  return { value: Duration.ofSeconds(seconds).format(), editable: isFieldEditable(mode, 'time') };
}

function distanceField(mode: Segment['mode'], km: number, units: Units): FieldView {
  return { value: Distance.ofKm(km).format(units), editable: isFieldEditable(mode, 'distance') };
}

function paceField(mode: Segment['mode'], secPerKm: number | null, units: Units): FieldView {
  return { value: Pace.ofSecPerKm(secPerKm).format(units), editable: isFieldEditable(mode, 'pace') };
}

function summarizeStep(
  step: { timeSec: number; distanceKm: number; paceSecPerKm: number | null; kind?: StepKind },
  units: Units
): string {
  if (step.kind === 'rest') {
    return `rest ${Duration.ofSeconds(step.timeSec).format()}`;
  }
  if (step.distanceKm > 0) {
    return `${Distance.ofKm(step.distanceKm).format(units)}${units}@${Pace.ofSecPerKm(step.paceSecPerKm).format(units)}`;
  }
  return Duration.ofSeconds(step.timeSec).format();
}

function summarizeSegment(segment: Segment, units: Units): string {
  if (segment.type === 'interval') {
    const steps = segment.steps.length ? segment.steps : [segment];
    let text = steps.map((step) => summarizeStep(step, units)).join(', ');
    if (steps.length > 1 && segment.reps > 1) text = `${segment.reps} × (${text})`;
    else if (steps.length === 1 && segment.reps > 1) text = `${segment.reps} × ${text}`;
    if (segment.restEnabled) text += ` · rest ${Duration.ofSeconds(segment.restTimeSec).format()}`;
    return text;
  }
  const timeStr = Duration.ofSeconds(segment.timeSec).format();
  const distStr = `${Distance.ofKm(segment.distanceKm).format(units)}${units}`;
  const pace = Pace.ofSecPerKm(segment.paceSecPerKm).format(units);
  const paceStr = Pace.ofSecPerKm(segment.paceSecPerKm).isKnown ? `${pace}/${units}` : null;
  if (segment.distanceKm > 0) return `${timeStr} · ${distStr}` + (paceStr ? ` @ ${paceStr}` : '');
  return `${timeStr} rest`;
}

function toStepDetail(step: Step, units: Units): StepDetail {
  return {
    id: step.id,
    kind: step.kind,
    mode: step.mode,
    time: timeField(step.mode, step.timeSec),
    distance: distanceField(step.mode, step.distanceKm, units),
    pace: paceField(step.mode, step.paceSecPerKm, units),
  };
}

export function toSegmentDetail(segment: Segment, units: Units): SegmentDetail {
  const meta = SEGMENT_TYPE_META[segment.type];
  return {
    id: segment.id,
    type: segment.type,
    typeLabel: meta.label,
    tagClass: `tag ${meta.tag}`,
    mode: segment.mode,
    time: timeField(segment.mode, segment.timeSec),
    distance: distanceField(segment.mode, segment.distanceKm, units),
    pace: paceField(segment.mode, segment.paceSecPerKm, units),
    reps: segment.reps,
    restEnabled: segment.restEnabled,
    restMode: segment.restMode,
    restTime: timeField(segment.restMode, segment.restTimeSec),
    restDistance: distanceField(segment.restMode, segment.restDistanceKm, units),
    restPace: paceField(segment.restMode, segment.restPaceSecPerKm, units),
    summary: summarizeSegment(segment, units),
    steps: segment.steps.map((step) => toStepDetail(step, units)),
  };
}

export function toPlanDetail(plan: Plan): PlanDetail {
  return {
    id: plan.id,
    name: plan.name,
    units: plan.units,
    segments: plan.segments.map((segment) => toSegmentDetail(segment, plan.units)),
  };
}

export function toTotalsView(plan: Plan): TotalsView {
  const summary = summarizePlan(plan.segments);
  return {
    distance: `${Distance.ofKm(summary.totalDistanceKm).format(plan.units)} ${plan.units}`,
    time: Duration.ofSeconds(summary.totalTimeSec).format(),
    pace: `${Pace.ofSecPerKm(summary.avgPaceSecPerKm).format(plan.units)}/${plan.units}`,
  };
}

export function toPlanListItem(plan: Plan): PlanListItem {
  const totals = toTotalsView(plan);
  return {
    id: plan.id,
    name: plan.name,
    statsText: `${totals.distance} · ${totals.time} · ${totals.pace}`,
  };
}

export function toBestEffortViews(plan: Plan): BestEffortView[] {
  const summary = summarizePlan(plan.segments);
  return summary.bestEfforts
    .filter((effort) => effort.timeSec != null)
    .map((effort) => ({
      key: effort.key,
      label: effort.label,
      time: Duration.ofSeconds(effort.timeSec!).format(),
      pace: `${Pace.ofSecPerKm(effort.paceSecPerKm).format(plan.units)}/${plan.units}`,
    }));
}
