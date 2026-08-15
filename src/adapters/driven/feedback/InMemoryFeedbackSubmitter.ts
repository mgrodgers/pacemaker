import type { FeedbackSubmission, FeedbackSubmitter } from '../../../application/ports/out/FeedbackSubmitter';

/** Fake driven adapter — records submissions instead of sending them
 * anywhere. Doubles as a test double in application-layer unit tests. */
export class InMemoryFeedbackSubmitter implements FeedbackSubmitter {
  readonly submissions: FeedbackSubmission[] = [];

  async submit(submission: FeedbackSubmission): Promise<void> {
    this.submissions.push(submission);
  }
}
