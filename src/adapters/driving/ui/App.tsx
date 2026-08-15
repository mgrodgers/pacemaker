import { useState } from 'react';
import { PlansScreen } from './components/PlansScreen';
import { PlanScreen } from './components/PlanScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { FeedbackButton } from './components/FeedbackButton';
import type { PlanId } from '../../../domain/valueObjects/Ids';

type View = 'plans' | 'plan' | 'settings';

export function App() {
  const [view, setView] = useState<View>('plans');
  const [activePlanId, setActivePlanId] = useState<PlanId | null>(null);

  const returnFromSettings = () => setView(activePlanId ? 'plan' : 'plans');

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
      {view === 'settings' && <SettingsScreen onBack={returnFromSettings} />}
      {view === 'plan' && activePlanId && (
        <PlanScreen
          planId={activePlanId}
          onBack={() => setView('plans')}
          onOpenSettings={() => setView('settings')}
        />
      )}
      {view === 'plans' && (
        <PlansScreen
          onOpenPlan={(id) => {
            setActivePlanId(id);
            setView('plan');
          }}
          onOpenSettings={() => setView('settings')}
        />
      )}
      <FeedbackButton />
    </div>
  );
}
