import { beforeEach, describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlanScreen } from '../../../src/adapters/driving/ui/components/PlanScreen';
import { getPlanningService } from '../../../src/composition/container';

beforeEach(() => {
  window.localStorage.clear();
});

describe('PlanScreen', () => {
  test('adding a segment via a type chip auto-expands it with its fields visible', async () => {
    const user = userEvent.setup();
    const service = getPlanningService();
    const planId = service.createPlan('Smoke test plan');

    render(<PlanScreen planId={planId} onBack={() => {}} onOpenSettings={() => {}} />);
    await user.click(screen.getByRole('button', { name: 'Tempo' }));

    expect(screen.getByTestId('segment-fields')).toBeInTheDocument();
    expect(screen.getByTestId('segment-summary')).toBeInTheDocument();
  });

  test('the back button calls onBack', async () => {
    const user = userEvent.setup();
    const service = getPlanningService();
    const planId = service.createPlan('Another plan');
    let wentBack = false;

    render(
      <PlanScreen
        planId={planId}
        onOpenSettings={() => {}}
        onBack={() => {
          wentBack = true;
        }}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Back to plans' }));
    expect(wentBack).toBe(true);
  });

  test('switching to the Results tab shows the plan summary card', async () => {
    const user = userEvent.setup();
    const service = getPlanningService();
    const planId = service.createPlan('Results check');

    render(<PlanScreen planId={planId} onBack={() => {}} onOpenSettings={() => {}} />);
    await user.click(screen.getByText('Results'));
    expect(screen.getByText('Plan summary')).toBeInTheDocument();
  });
});
