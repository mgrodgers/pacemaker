import type { FeedbackSubmission, FeedbackSubmitter } from '../../../application/ports/out/FeedbackSubmitter';

/** Real driven adapter: POSTs feedback to the Vercel serverless function
 * at /api/feedback, which creates a GitHub issue server-side. */
export class HttpFeedbackSubmitter implements FeedbackSubmitter {
  async submit(submission: FeedbackSubmission): Promise<void> {
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    });
  }
}
