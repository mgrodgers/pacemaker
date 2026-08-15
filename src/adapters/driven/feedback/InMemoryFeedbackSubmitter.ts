import type { FeedbackSubmission, FeedbackSubmitter } from '../../../application/ports/out/FeedbackSubmitter';

/** Fake driven adapter — records submissions instead of sending them
 * anywhere. Doubles as a test double in application-layer unit tests. */
export class InMemoryFeedbackSubmitter implements FeedbackSubmitter {
  readonly submissions: FeedbackSubmission[] = [];
  /** Set to make the next `submit` call reject, for exercising error paths. */
  failWith: Error | null = null;

  async submit(submission: FeedbackSubmission): Promise<void> {
    if (this.failWith) throw this.failWith;
    this.submissions.push(submission);
  }
}
