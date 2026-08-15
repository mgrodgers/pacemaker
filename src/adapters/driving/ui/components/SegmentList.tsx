import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { SegmentDetail } from '../../../../application/dto/PlanViews';
import type { SegmentId } from '../../../../domain/valueObjects/Ids';
import { SegmentCard } from './SegmentCard';
import type { PlanCommands } from './PlanCommands';

interface SegmentListProps {
  segments: readonly SegmentDetail[];
  unitLabel: string;
  expandedId: SegmentId | null;
  onToggleExpand: (id: SegmentId) => void;
  commands: PlanCommands;
}

/** @dnd-kit sortable list, not native HTML5 drag-and-drop — the prototype's
 * approach doesn't work reliably on touch phones, the primary target
 * device for a running app. */
export function SegmentList({ segments, unitLabel, expandedId, onToggleExpand, commands }: SegmentListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = segments.findIndex((s) => s.id === active.id);
    const newIndex = segments.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    commands.reorderSegments(arrayMove([...segments], oldIndex, newIndex).map((s) => s.id));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={segments.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 'var(--space-3)' }}>
          {segments.map((segment) => (
            <SegmentCard
              key={segment.id}
              segment={segment}
              unitLabel={unitLabel}
              expanded={expandedId === segment.id}
              onToggleExpand={onToggleExpand}
              commands={commands}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
