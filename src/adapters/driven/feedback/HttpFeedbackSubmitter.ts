import type { FeedbackSubmission, FeedbackSubmitter } from '../../../application/ports/out/FeedbackSubmitter';
import { FeedbackRateLimitedError, FeedbackSubmissionFailedError } from '../../../application/errors/FeedbackError';

/** Real driven adapter: POSTs feedback to the Vercel serverless function
 * at /api/feedback, which creates a GitHub issue server-side. */
export class HttpFeedbackSubmitter implements FeedbackSubmitter {
  async submit(submission: FeedbackSubmission): Promise<void> {
    let response: Response;
    try {
      response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      });
    } catch {
      throw new FeedbackSubmissionFailedError('Could not reach the feedback service.');
    }

    if (response.status === 429) throw new FeedbackRateLimitedError('Too many feedback submissions.');
    if (!response.ok) throw new FeedbackSubmissionFailedError(`Feedback service responded with ${response.status}.`);
  }
}
