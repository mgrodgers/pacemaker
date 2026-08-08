import { useState } from 'react';
import { usePlanController } from '../hooks/usePlanController';
import { SegmentList } from './SegmentList';
import { SegmentTypeChips } from './SegmentTypeChips';
import { TotalsBar } from './TotalsBar';
import { ResultsPanel } from './ResultsPanel';
import { BackIcon } from './icons';
import type { PlanId, SegmentId } from '../../../../domain/valueObjects/Ids';
import type { SegmentType } from '../../../../domain/valueObjects/SegmentType';

interface PlanScreenProps {
  planId: PlanId;
  onBack: () => void;
}

type Subview = 'builder' | 'results';

export function PlanScreen({ planId, onBack }: PlanScreenProps) {
  const controller = usePlanController(planId);
  const [subview, setSubview] = useState<Subview>('builder');
  const [expandedId, setExpandedId] = useState<SegmentId | null>(null);
  const [nameDraft, setNameDraft] = useState<string | null>(null);

  const { plan, totals, bestEfforts } = controller;

  const handleAddSegment = (type: SegmentType) => {
    setExpandedId(controller.addSegment(type));
  };

  return (
    <>
      <nav className="nav" style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--color-bg)' }}>
        <span className="nav-brand">Run Planner</span>
        <button type="button" className="btn btn-ghost btn-icon" aria-label="Back to plans" style={{ marginLeft: 'auto' }} onClick={onBack}>
          <BackIcon />
        </button>
      </nav>

      <div style={{ padding: '0 var(--space-4) var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) 0' }}>
          <input
            className="input"
            aria-label="Plan name"
            value={nameDraft ?? plan.name}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={() => {
              if (nameDraft != null) controller.renamePlan(nameDraft);
              setNameDraft(null);
            }}
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 500,
              fontSize: 18,
              border: 'none',
              background: 'transparent',
              paddingLeft: 0,
              flex: 1,
              minWidth: 0,
            }}
          />
          <div className="seg" role="radiogroup" aria-label="Units" style={{ flexShrink: 0 }}>
            <label className="seg-opt">
              <input type="radio" name="units" checked={plan.units === 'km'} onChange={() => controller.setUnits('km')} />
              km
            </label>
            <label className="seg-opt">
              <input type="radio" name="units" checked={plan.units === 'mi'} onChange={() => controller.setUnits('mi')} />
              mi
            </label>
          </div>
        </div>

        <div className="seg" role="radiogroup" aria-label="View" style={{ width: '100%', marginBottom: 'var(--space-4)' }}>
          <label className="seg-opt" style={{ flex: 1, justifyContent: 'center' }}>
            <input type="radio" name="subview" checked={subview === 'builder'} onChange={() => setSubview('builder')} />
            Builder
          </label>
          <label className="seg-opt" style={{ flex: 1, justifyContent: 'center' }}>
            <input type="radio" name="subview" checked={subview === 'results'} onChange={() => setSubview('results')} />
            Results
          </label>
        </div>

        {subview === 'builder' && (
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <SegmentList
              segments={plan.segments}
              unitLabel={plan.units}
              expandedId={expandedId}
              onToggleExpand={(id) => setExpandedId((cur) => (cur === id ? null : id))}
              commands={controller}
            />
            <SegmentTypeChips onAdd={handleAddSegment} />
            <TotalsBar totals={totals} />
          </div>
        )}

        {subview === 'results' && <ResultsPanel totals={totals} bestEfforts={bestEfforts} />}
      </div>
    </>
  );
}
