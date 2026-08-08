import { useState } from 'react';
import { PlansScreen } from './components/PlansScreen';
import { PlanScreen } from './components/PlanScreen';
import type { PlanId } from '../../../domain/valueObjects/Ids';

export function App() {
  const [activePlanId, setActivePlanId] = useState<PlanId | null>(null);

  return (
    <div
      style={{
        maxWidth: 640,
        margin: '0 auto',
        minHeight: '100vh',
        fontFamily: 'var(--font-body)',
        paddingBottom: 'var(--space-8)',
      }}
    >
      {activePlanId ? (
        <PlanScreen planId={activePlanId} onBack={() => setActivePlanId(null)} />
      ) : (
        <PlansScreen onOpenPlan={setActivePlanId} />
      )}
    </div>
  );
}
