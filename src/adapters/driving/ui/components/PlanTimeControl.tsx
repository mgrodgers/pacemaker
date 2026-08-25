import type { PlanTimeFieldView, PlanTimeView } from '../../../../application/dto/PlanViews';
import { DeleteIcon } from './icons';

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
      style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-2)', width: '100%', padding: 'var(--space-2) 0' }}
    >
      <TimeField id="plan-time-start" label="Start time" field={time.start} onChange={onSetStartTime} />
      <span aria-hidden="true" style={{ paddingBottom: 8 }}>→</span>
      <TimeField id="plan-time-end" label="End time" field={time.end} onChange={onSetEndTime} />
      <button type="button" className="btn btn-ghost btn-icon" aria-label="Clear time" onClick={onClear}>
        <DeleteIcon size={13} />
      </button>
    </div>
  );
}

function TimeField({
  id,
  label,
  field,
  onChange,
}: {
  id: string;
  label: string;
  field: PlanTimeFieldView;
  onChange: (raw: string) => void;
}) {
  return (
    <div className="field" style={{ flex: 1, minWidth: 0 }}>
      <label htmlFor={id}>{label}</label>
      <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
        <input id={id} type="time" className="input" value={field.value} onChange={(e) => onChange(e.target.value)} />
        <span data-testid={`${id}-offset`} style={{ fontSize: 11, opacity: 0.6, flexShrink: 0 }}>
          {field.dayOffset !== 0 ? `${field.dayOffset > 0 ? '+' : ''}${field.dayOffset}d` : ''}
        </span>
      </span>
    </div>
  );
}
