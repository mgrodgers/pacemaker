import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TotalsBar } from '../../../src/adapters/driving/ui/components/TotalsBar';

describe('TotalsBar', () => {
  test('renders the given totals verbatim', () => {
    render(<TotalsBar totals={{ distance: '5 km', time: '22:30', pace: '4:30/km' }} />);
    expect(screen.getByTestId('totals-distance')).toHaveTextContent('5 km');
    expect(screen.getByTestId('totals-time')).toHaveTextContent('22:30');
    expect(screen.getByTestId('totals-pace')).toHaveTextContent('4:30/km');
  });
});
