import { SEGMENT_TYPES, SEGMENT_TYPE_META, type SegmentType } from '../../../../domain/valueObjects/SegmentType';

interface SegmentTypeChipsProps {
  onAdd: (type: SegmentType) => void;
}

export function SegmentTypeChips({ onAdd }: SegmentTypeChipsProps) {
  return (
    <div style={{ marginTop: 'var(--space-2)' }}>
      <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.55, marginBottom: 'var(--space-2)' }}>
        Add segment
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        {SEGMENT_TYPES.map((type) => (
          <button key={type} type="button" className="btn btn-secondary" onClick={() => onAdd(type)}>
            {SEGMENT_TYPE_META[type].label}
          </button>
        ))}
      </div>
    </div>
  );
}
