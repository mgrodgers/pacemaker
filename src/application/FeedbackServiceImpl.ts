import type { FeedbackService } from './ports/in/FeedbackService';
import type { FeedbackSubmission, FeedbackSubmitter } from './ports/out/FeedbackSubmitter';
import { FeedbackValidationError } from './errors/FeedbackError';

export class FeedbackServiceImpl implements FeedbackService {
  constructor(private readonly submitter: FeedbackSubmitter) {}

  async submitFeedback(submission: FeedbackSubmission): Promise<void> {
    const description = submission.description.trim();
    if (description === '') throw new FeedbackValidationError('Description is required.');
    await this.submitter.submit({ ...submission, description });
  }
}
