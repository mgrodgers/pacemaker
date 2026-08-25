import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelpScreen } from '../../../src/adapters/driving/ui/components/HelpScreen';

describe('HelpScreen', () => {
  test('explains how to create a plan, add and edit a segment, reorder segments, read totals, and use the course predictor', () => {
    render(<HelpScreen onBack={() => {}} />);

    expect(screen.getAllByText(/create a plan/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/add a segment/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/edit its fields/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/reorder/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/totals/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/course predictor/i).length).toBeGreaterThan(0);
  });

  test('the back button calls onBack', async () => {
    const user = userEvent.setup();
    let wentBack = false;
    render(<HelpScreen onBack={() => (wentBack = true)} />);
    await user.click(screen.getByRole('button', { name: 'Back to plans' }));
    expect(wentBack).toBe(true);
  });
});
