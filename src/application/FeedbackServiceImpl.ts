import type { FeedbackService } from './ports/in/FeedbackService';
import type { FeedbackSubmission, FeedbackSubmitter } from './ports/out/FeedbackSubmitter';

export class FeedbackServiceImpl implements FeedbackService {
  constructor(private readonly submitter: FeedbackSubmitter) {}

  async submitFeedback(submission: FeedbackSubmission): Promise<void> {
    await this.submitter.submit({ ...submission, description: submission.description.trim() });
  }
}
