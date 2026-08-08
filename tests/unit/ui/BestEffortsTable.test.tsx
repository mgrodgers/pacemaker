import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BestEffortsTable } from '../../../src/adapters/driving/ui/components/BestEffortsTable';

describe('BestEffortsTable', () => {
  test('renders one row per best effort, keyed by distance', () => {
    render(
      <BestEffortsTable
        rows={[
          { key: '1k', label: '1 km', time: '4:00', pace: '4:00/km' },
          { key: '5k', label: '5 km', time: '22:30', pace: '4:30/km' },
        ]}
      />
    );
    expect(screen.getByTestId('best-effort-1k')).toHaveTextContent('1 km');
    expect(screen.getByTestId('best-effort-1k')).toHaveTextContent('4:00');
    expect(screen.getByTestId('best-effort-5k')).toHaveTextContent('22:30');
  });
});
