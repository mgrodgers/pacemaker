import type { CSSProperties } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { SegmentDetail } from '../../../../application/dto/PlanViews';
import type { SegmentId } from '../../../../domain/valueObjects/Ids';
import { FieldTriad } from './FieldTriad';
import { StepEditor } from './StepEditor';
import { DeleteIcon, DragHandleIcon, ChevronDownIcon } from './icons';
import type { PlanCommands } from './PlanCommands';

interface SegmentCardProps {
  segment: SegmentDetail;
  unitLabel: string;
  expanded: boolean;
  onToggleExpand: (id: SegmentId) => void;
  commands: PlanCommands;
}

export function SegmentCard({ segment, unitLabel, expanded, onToggleExpand, commands }: SegmentCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: segment.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    padding: 'var(--space-3)',
  };

  return (
    <div ref={setNodeRef} style={style} className="card elev-sm" data-testid="segment-card">
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}
        onClick={() => onToggleExpand(segment.id)}
      >
        <span
          {...attributes}
          {...listeners}
          data-testid="drag-handle"
          style={{ cursor: 'grab', opacity: 0.45, flexShrink: 0, touchAction: 'none' }}
          onClick={(e) => e.stopPropagation()}
        >
          <DragHandleIcon />
        </span>
        <span className={segment.tagClass} style={{ flexShrink: 0 }}>
          {segment.typeLabel}
        </span>
        <span
          data-testid="segment-summary"
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 13.5,
            opacity: 0.85,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {segment.summary}
        </span>
        <button
          type="button"
          className="btn btn-ghost btn-icon"
          aria-label="Delete segment"
          style={{ flexShrink: 0, width: 28, height: 28 }}
          onClick={(e) => {
            e.stopPropagation();
            commands.removeSegment(segment.id);
          }}
        >
          <DeleteIcon size={13} />
        </button>
        <span
          style={{
            flexShrink: 0,
            opacity: 0.5,
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform .15s',
          }}
        >
          <ChevronDownIcon />
        </span>
      </div>

      {expanded && (
        <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-neutral-700)' }}>
          {segment.type !== 'interval' && (
            <div data-testid="segment-fields">
              <FieldTriad
                name={segment.id}
                unitLabel={unitLabel}
                mode={segment.mode}
                time={segment.time}
                distance={segment.distance}
                pace={segment.pace}
                onModeChange={(mode) => commands.setSegmentMode(segment.id, mode)}
                onFieldChange={(field, raw) => commands.setSegmentField(segment.id, field, raw)}
              />
            </div>
          )}

          {segment.type === 'interval' && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  opacity: 0.55,
                  marginBottom: 'var(--space-2)',
                }}
              >
                Steps (one rep runs through all of these)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 'var(--space-2)' }}>
                {(() => {
                  let workIndex = 0;
                  return segment.steps.map((step) => {
                    if (step.kind !== 'rest') workIndex += 1;
                    return (
                      <StepEditor
                        key={step.id}
                        step={step}
                        index={workIndex}
                        unitLabel={unitLabel}
                        canRemove={segment.steps.length > 1}
                        onModeChange={(mode) => commands.setStepMode(segment.id, step.id, mode)}
                        onFieldChange={(field, raw) => commands.setStepField(segment.id, step.id, field, raw)}
                        onRemove={() => commands.removeIntervalStep(segment.id, step.id)}
                      />
                    );
                  });
                })()}
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => commands.addIntervalStep(segment.id, 'work')}
                  >
                    + Add step
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => commands.addIntervalStep(segment.id, 'rest')}
                  >
                    + Add rest
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-4)', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.6 }}>Reps</label>
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon"
                    aria-label="Decrease reps"
                    style={{ width: 26, height: 26 }}
                    onClick={() => commands.setReps(segment.id, -1)}
                  >
                    −
                  </button>
                  <span data-testid="reps-value" style={{ minWidth: 20, textAlign: 'center', fontWeight: 500 }}>
                    {segment.reps}
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon"
                    aria-label="Increase reps"
                    style={{ width: 26, height: 26 }}
                    onClick={() => commands.setReps(segment.id, 1)}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className={`btn ${segment.restEnabled ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => commands.toggleRest(segment.id)}
                >
                  Rest between reps
                </button>
              </div>

              {segment.restEnabled && (
                <div data-testid="rest-fields" style={{ marginTop: 'var(--space-3)' }}>
                  <FieldTriad
                    name={`rest-${segment.id}`}
                    unitLabel={unitLabel}
                    mode={segment.restMode}
                    time={segment.restTime}
                    distance={segment.restDistance}
                    pace={segment.restPace}
                    timeLabel="Rest time"
                    distanceLabel={`Rest dist (${unitLabel})`}
                    paceLabel="Rest pace"
                    onModeChange={(mode) => commands.setRestMode(segment.id, mode)}
                    onFieldChange={(field, raw) => commands.setRestField(segment.id, field, raw)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
