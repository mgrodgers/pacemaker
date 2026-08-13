import type { StepDetail } from '../../../../application/dto/PlanViews';
import type { FieldMode, SegmentField } from '../../../../domain/valueObjects/FieldMode';
import { FieldTriad } from './FieldTriad';
import { CloseIcon } from './icons';

interface StepEditorProps {
  step: StepDetail;
  index: number;
  unitLabel: string;
  canRemove: boolean;
  onModeChange: (mode: FieldMode) => void;
  onFieldChange: (field: SegmentField, raw: string) => void;
  onRemove: () => void;
}

export function StepEditor({ step, index, unitLabel, canRemove, onModeChange, onFieldChange, onRemove }: StepEditorProps) {
  const isRest = step.kind === 'rest';
  return (
    <div data-testid="step-editor" style={{ border: '1px solid var(--color-neutral-700)', borderRadius: 8, padding: 'var(--space-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
        <span style={{ fontSize: 11, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {isRest ? 'Rest' : `Step ${index}`}
        </span>
        {canRemove && (
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            aria-label="Remove step"
            style={{ width: 24, height: 24 }}
            onClick={onRemove}
          >
            <CloseIcon />
          </button>
        )}
      </div>
      <FieldTriad
        name={step.id}
        unitLabel={unitLabel}
        mode={step.mode}
        time={step.time}
        distance={step.distance}
        pace={step.pace}
        timeLabel={isRest ? 'Rest time' : 'Time'}
        distanceLabel={isRest ? `Rest dist (${unitLabel})` : `Dist (${unitLabel})`}
        paceLabel={isRest ? 'Rest pace' : 'Pace'}
        onModeChange={onModeChange}
        onFieldChange={onFieldChange}
      />
    </div>
  );
}
