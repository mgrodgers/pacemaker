import type { PlanTimeFieldView, PlanTimeView } from '../../../../application/dto/PlanViews';

interface PlanTimeControlProps {
  time: PlanTimeView | null;
  onSetStartTime: (raw: string) => void;
  onSetEndTime: (raw: string) => void;
  onClear: () => void;
}

/** The plan-level start/end time calculator, near the plan header. Hidden
 * entirely when the plan has no timed segments (PlanViewMapper returns
 * `time: null` in that case) — the underlying anchor is still persisted,
 * so it reappears once the plan has time again. Both fields are always
 * editable; whichever one was last edited becomes the new anchor, and the
 * other is always the freshly-derived side. */
export function PlanTimeControl({ time, onSetStartTime, onSetEndTime, onClear }: PlanTimeControlProps) {
  if (!time) return null;

  return (
    <div
      data-testid="plan-time"
      style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) 0' }}
    >
      <TimeField label="Start time" field={time.start} onChange={onSetStartTime} testId="plan-time-start" />
      <span aria-hidden="true">→</span>
      <TimeField label="End time" field={time.end} onChange={onSetEndTime} testId="plan-time-end" />
      <button type="button" className="btn btn-ghost btn-icon" aria-label="Clear time" onClick={onClear}>
        ×
      </button>
    </div>
  );
}

function TimeField({
  label,
  field,
  onChange,
  testId,
}: {
  label: string;
  field: PlanTimeFieldView;
  onChange: (raw: string) => void;
  testId: string;
}) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
      <input
        type="time"
        className="input"
        aria-label={label}
        value={field.value}
        onChange={(e) => onChange(e.target.value)}
      />
      <span data-testid={`${testId}-offset`} style={{ fontSize: 11, opacity: 0.6 }}>
        {field.dayOffset !== 0 ? `${field.dayOffset > 0 ? '+' : ''}${field.dayOffset}d` : ''}
      </span>
    </span>
  );
}
