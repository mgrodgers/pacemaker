import { useState, type ChangeEvent } from 'react';
import type { FieldMode, SegmentField } from '../../../../domain/valueObjects/FieldMode';
import type { FieldView } from '../../../../application/dto/PlanViews';
import { formatDurationKeystrokes } from './formatDurationKeystrokes';

interface FieldTriadProps {
  name: string;
  unitLabel: string;
  mode: FieldMode;
  time: FieldView;
  distance: FieldView;
  pace: FieldView;
  onModeChange: (mode: FieldMode) => void;
  onFieldChange: (field: SegmentField, raw: string) => void;
  timeLabel?: string;
  distanceLabel?: string;
  paceLabel?: string;
}

/** The Time+Pace / Dist+Pace / Time+Dist mode switch plus its 3-field grid.
 * Reused for a segment's own fields, its rest fields, and each interval
 * step. Keeps a local per-field typing draft so a value like "12:0" isn't
 * reformatted out from under the cursor before the user finishes typing. */
export function FieldTriad({
  name,
  unitLabel,
  mode,
  time,
  distance,
  pace,
  onModeChange,
  onFieldChange,
  timeLabel = 'Time (mm:ss)',
  distanceLabel,
  paceLabel,
}: FieldTriadProps) {
  const [drafts, setDrafts] = useState<Partial<Record<SegmentField, string>>>({});

  const bind = (field: SegmentField, view: FieldView, isDuration = false) => {
    const current = drafts[field] ?? view.value;
    return {
      value: current,
      readOnly: !view.editable,
      style: { opacity: view.editable ? 1 : 0.5 },
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        const next = isDuration ? formatDurationKeystrokes(current, e.target.value) : e.target.value;
        setDrafts((d) => ({ ...d, [field]: next }));
        onFieldChange(field, next);
      },
      onBlur: () => setDrafts((d) => ({ ...d, [field]: undefined })),
    };
  };

  return (
    <>
      <div className="seg" role="radiogroup" aria-label="Fields" style={{ marginBottom: 'var(--space-3)' }}>
        <label className="seg-opt">
          <input type="radio" name={`mode-${name}`} checked={mode === 'time-pace'} onChange={() => onModeChange('time-pace')} />
          Time+Pace
        </label>
        <label className="seg-opt">
          <input type="radio" name={`mode-${name}`} checked={mode === 'distance-pace'} onChange={() => onModeChange('distance-pace')} />
          Dist+Pace
        </label>
        <label className="seg-opt">
          <input type="radio" name={`mode-${name}`} checked={mode === 'time-distance'} onChange={() => onModeChange('time-distance')} />
          Time+Dist
        </label>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
        <div className="field">
          <label htmlFor={`${name}-time`}>{timeLabel}</label>
          <input id={`${name}-time`} className="input" inputMode="numeric" {...bind('time', time, true)} />
        </div>
        <div className="field">
          <label htmlFor={`${name}-distance`}>{distanceLabel ?? `Distance (${unitLabel})`}</label>
          <input id={`${name}-distance`} className="input" inputMode="decimal" {...bind('distance', distance)} />
        </div>
        <div className="field">
          <label htmlFor={`${name}-pace`}>{paceLabel ?? `Pace (/${unitLabel})`}</label>
          <input id={`${name}-pace`} className="input" inputMode="numeric" {...bind('pace', pace, true)} />
        </div>
      </div>
    </>
  );
}
