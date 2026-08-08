export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class PlanNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Plan not found: ${id}`);
    this.name = 'PlanNotFoundError';
  }
}

export class SegmentNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Segment not found: ${id}`);
    this.name = 'SegmentNotFoundError';
  }
}

export class StepNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Step not found: ${id}`);
    this.name = 'StepNotFoundError';
  }
}
