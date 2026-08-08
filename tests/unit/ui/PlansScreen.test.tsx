import { beforeEach, describe, expect, test } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlansScreen } from '../../../src/adapters/driving/ui/components/PlansScreen';
import type { PlanId } from '../../../src/domain/valueObjects/Ids';

// The composition root seeds a demo "Track ladder" plan the first time its
// repository is empty (see ExamplePlanSeeder), and that seeding is a
// one-time side effect of the singleton's first construction within this
// test file's module registry — clearing localStorage per test does not
// undo it. So these assertions target specific plans by name/id rather
// than assuming the list starts empty.
beforeEach(() => {
  window.localStorage.clear();
});

describe('PlansScreen', () => {
  test('creating a new plan opens it', async () => {
    const user = userEvent.setup();
    const opened: PlanId[] = [];
    render(<PlansScreen onOpenPlan={(id) => opened.push(id)} />);

    await user.click(screen.getByRole('button', { name: 'New plan' }));
    expect(opened).toHaveLength(1);
    expect(screen.getByText('New plan')).toBeInTheDocument();
  });

  test('clicking an existing plan card opens that plan', async () => {
    const user = userEvent.setup();
    const opened: PlanId[] = [];
    render(<PlansScreen onOpenPlan={(id) => opened.push(id)} />);

    await user.click(screen.getByRole('button', { name: 'New plan' }));
    const createdId = opened[0]!;
    opened.length = 0;

    const newCard = screen.getByText('New plan').closest('[data-testid="plan-card"]') as HTMLElement;
    await user.click(within(newCard).getByTestId('plan-name'));
    expect(opened).toEqual([createdId]);
  });

  test('rename, duplicate, and delete keep the list in sync', async () => {
    const user = userEvent.setup();
    render(<PlansScreen onOpenPlan={() => {}} />);
    await user.click(screen.getByRole('button', { name: 'New plan' }));
    const countBeforeActions = screen.getAllByTestId('plan-card').length;

    const card = screen.getByText('New plan').closest('[data-testid="plan-card"]') as HTMLElement;
    await user.click(within(card).getByRole('button', { name: 'Rename' }));
    const input = screen.getByLabelText('Plan name');
    await user.clear(input);
    await user.type(input, 'My Plan');
    await user.tab();
    expect(screen.getByText('My Plan')).toBeInTheDocument();

    const renamedCard = screen.getByText('My Plan').closest('[data-testid="plan-card"]') as HTMLElement;
    await user.click(within(renamedCard).getByRole('button', { name: 'Duplicate' }));
    expect(screen.getAllByTestId('plan-card')).toHaveLength(countBeforeActions + 1);

    const copyCard = screen.getByText('My Plan copy').closest('[data-testid="plan-card"]') as HTMLElement;
    await user.click(within(copyCard).getByRole('button', { name: 'Delete' }));
    expect(screen.getAllByTestId('plan-card')).toHaveLength(countBeforeActions);
    expect(screen.queryByText('My Plan copy')).not.toBeInTheDocument();
  });
});
