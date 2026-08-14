import { useState } from 'react';
import { usePlansController } from '../hooks/usePlansController';
import type { PlanId } from '../../../../domain/valueObjects/Ids';
import { PlusIcon, RenameIcon, DuplicateIcon, DeleteIcon, SettingsIcon } from './icons';

interface PlansScreenProps {
  onOpenPlan: (id: PlanId) => void;
  onOpenSettings: () => void;
}

export function PlansScreen({ onOpenPlan, onOpenSettings }: PlansScreenProps) {
  const { plans, createPlan, renamePlan, duplicatePlan, deletePlan } = usePlansController();
  const [renamingId, setRenamingId] = useState<PlanId | null>(null);
  const [renameValue, setRenameValue] = useState('');

  return (
    <>
      <nav className="nav" style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--color-bg)' }}>
        <span className="nav-brand">Run Planner</span>
        <button
          type="button"
          className="btn btn-ghost btn-icon"
          aria-label="Default paces"
          style={{ marginLeft: 'auto' }}
          onClick={onOpenSettings}
        >
          <SettingsIcon />
        </button>
        <button type="button" className="btn btn-primary btn-icon" aria-label="New plan" onClick={() => onOpenPlan(createPlan())}>
          <PlusIcon />
        </button>
      </nav>

      <div style={{ padding: 'var(--space-4)' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.55, marginBottom: 'var(--space-3)' }}>
          Your plans
        </div>
        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="card elev-sm"
              data-testid="plan-card"
              style={{ padding: 'var(--space-3) var(--space-4)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}
              onClick={() => onOpenPlan(plan.id)}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                {renamingId === plan.id ? (
                  <input
                    className="input"
                    aria-label="Plan name"
                    value={renameValue}
                    autoFocus
                    style={{ fontWeight: 500 }}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => {
                      renamePlan(plan.id, renameValue);
                      setRenamingId(null);
                    }}
                  />
                ) : (
                  <div data-testid="plan-name" style={{ fontFamily: 'var(--font-heading)', fontWeight: 500, fontSize: 16 }}>
                    {plan.name}
                  </div>
                )}
                <div style={{ fontSize: 12.5, opacity: 0.6, marginTop: 4 }}>{plan.statsText}</div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-1)', flexShrink: 0 }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon"
                  aria-label="Rename"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenamingId(plan.id);
                    setRenameValue(plan.name);
                  }}
                >
                  <RenameIcon />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon"
                  aria-label="Duplicate"
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicatePlan(plan.id);
                  }}
                >
                  <DuplicateIcon />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon"
                  aria-label="Delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePlan(plan.id);
                  }}
                >
                  <DeleteIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
