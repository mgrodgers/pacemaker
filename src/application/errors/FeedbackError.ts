export class FeedbackError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FeedbackError';
  }
}

export class FeedbackValidationError extends FeedbackError {
  constructor(message: string) {
    super(message);
    this.name = 'FeedbackValidationError';
  }
}

export class FeedbackRateLimitedError extends FeedbackError {
  constructor(message: string) {
    super(message);
    this.name = 'FeedbackRateLimitedError';
  }
}

export class FeedbackSubmissionFailedError extends FeedbackError {
  constructor(message: string) {
    super(message);
    this.name = 'FeedbackSubmissionFailedError';
  }
}
