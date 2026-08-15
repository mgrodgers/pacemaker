export type FeedbackCategory = 'bug' | 'feature-idea' | 'other';

export interface FeedbackSubmission {
  readonly category: FeedbackCategory;
  readonly description: string;
  /** Anti-bot decoy field — always empty for genuine input. */
  readonly honeypot: string;
}

/** Secondary (driven) port: how the application delivers feedback to
 * wherever it's tracked (a GitHub issue, today). */
export interface FeedbackSubmitter {
  submit(submission: FeedbackSubmission): Promise<void>;
}
