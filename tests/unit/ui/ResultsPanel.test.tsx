import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResultsPanel } from '../../../src/adapters/driving/ui/components/ResultsPanel';

describe('ResultsPanel', () => {
  test('shows a fallback message when there are no best efforts yet', () => {
    render(<ResultsPanel totals={{ distance: '0 km', time: '0:00', pace: '—/km' }} bestEfforts={[]} />);
    expect(screen.getByText(/doesn.t cover 1.*km yet/)).toBeInTheDocument();
  });

  test('shows the best efforts table once the plan covers a standard distance', () => {
    render(
      <ResultsPanel
        totals={{ distance: '5 km', time: '22:30', pace: '4:30/km' }}
        bestEfforts={[{ key: '5k', label: '5 km', time: '22:30', pace: '4:30/km' }]}
      />
    );
    expect(screen.getByTestId('best-effort-5k')).toBeInTheDocument();
  });
});
