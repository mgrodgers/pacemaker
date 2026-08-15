export class CoursePredictionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CoursePredictionError';
  }
}

export class InvalidPaceError extends CoursePredictionError {
  constructor(message = 'Enter a valid target pace.') {
    super(message);
    this.name = 'InvalidPaceError';
  }
}
