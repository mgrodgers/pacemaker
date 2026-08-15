import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeedbackModal } from '../../../src/adapters/driving/ui/components/FeedbackModal';

describe('FeedbackModal', () => {
  test('renders a description field, category select, and submit button', () => {
    render(<FeedbackModal onClose={() => {}} />);
    expect(screen.getByTestId('feedback-description')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-category')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-submit')).toBeInTheDocument();
  });
});
