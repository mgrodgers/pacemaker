import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedbackModal } from '../../../src/adapters/driving/ui/components/FeedbackModal';

describe('FeedbackModal', () => {
  test('renders a description field, category select, and submit button', () => {
    render(<FeedbackModal onClose={() => {}} />);
    expect(screen.getByTestId('feedback-description')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-category')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-submit')).toBeInTheDocument();
  });

  test('disables the submit button until the description is non-blank', async () => {
    const user = userEvent.setup();
    render(<FeedbackModal onClose={() => {}} />);

    expect(screen.getByTestId('feedback-submit')).toBeDisabled();

    await user.type(screen.getByTestId('feedback-description'), 'it broke');
    expect(screen.getByTestId('feedback-submit')).toBeEnabled();

    await user.clear(screen.getByTestId('feedback-description'));
    await user.type(screen.getByTestId('feedback-description'), '   ');
    expect(screen.getByTestId('feedback-submit')).toBeDisabled();
  });
});
