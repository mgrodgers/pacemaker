import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SegmentTypeChips } from '../../../src/adapters/driving/ui/components/SegmentTypeChips';

describe('SegmentTypeChips', () => {
  test('renders one chip per segment type', () => {
    render(<SegmentTypeChips onAdd={() => {}} />);
    for (const label of ['Warmup', 'Easy', 'Tempo', 'Interval', 'Rest', 'Cooldown']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
  });

  test('clicking a chip calls onAdd with that segment type', async () => {
    const user = userEvent.setup();
    const added: string[] = [];
    render(<SegmentTypeChips onAdd={(type) => added.push(type)} />);
    await user.click(screen.getByRole('button', { name: 'Interval' }));
    expect(added).toEqual(['interval']);
  });
});
