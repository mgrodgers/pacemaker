import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedbackButton } from '../../../src/adapters/driving/ui/components/FeedbackButton';

describe('FeedbackButton', () => {
  test('opens the feedback modal on click and closes it via the close button', async () => {
    const user = userEvent.setup();
    render(<FeedbackButton />);

    expect(screen.queryByTestId('feedback-modal')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('feedback-button'));
    expect(screen.getByTestId('feedback-modal')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByTestId('feedback-modal')).not.toBeInTheDocument();
  });
});
