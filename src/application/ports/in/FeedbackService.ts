import type { FeedbackSubmission } from '../out/FeedbackSubmitter';

/** Primary (driving) port: the one interface a driving adapter (the
 * feedback form) calls to submit feedback. */
export interface FeedbackService {
  submitFeedback(submission: FeedbackSubmission): Promise<void>;
}
