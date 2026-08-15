import { afterEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedbackModal } from '../../../src/adapters/driving/ui/components/FeedbackModal';

afterEach(() => {
  vi.unstubAllGlobals();
});

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

  test('submitting valid input posts to /api/feedback and shows a success confirmation', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201 });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<FeedbackModal onClose={() => {}} />);

    await user.type(screen.getByTestId('feedback-description'), 'it broke');
    await user.click(screen.getByTestId('feedback-submit'));

    await screen.findByTestId('feedback-success');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/feedback',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ category: 'bug', description: 'it broke', honeypot: '' }),
      })
    );
  });

  test('shows a rate-limit-specific message on a 429 response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429 }));
    const user = userEvent.setup();
    render(<FeedbackModal onClose={() => {}} />);

    await user.type(screen.getByTestId('feedback-description'), 'it broke');
    await user.click(screen.getByTestId('feedback-submit'));

    const error = await screen.findByTestId('feedback-error');
    expect(error).toHaveTextContent(/too many/i);
  });
});
