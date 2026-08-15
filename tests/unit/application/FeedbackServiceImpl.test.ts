import { beforeEach, describe, expect, test } from 'vitest';
import { FeedbackServiceImpl } from '../../../src/application/FeedbackServiceImpl';
import { InMemoryFeedbackSubmitter } from '../../../src/adapters/driven/feedback/InMemoryFeedbackSubmitter';
import { FeedbackValidationError } from '../../../src/application/errors/FeedbackError';

let submitter: InMemoryFeedbackSubmitter;
let service: FeedbackServiceImpl;

beforeEach(() => {
  submitter = new InMemoryFeedbackSubmitter();
  service = new FeedbackServiceImpl(submitter);
});

describe('submitFeedback', () => {
  test('forwards a trimmed description and the category to the submitter', async () => {
    await service.submitFeedback({ category: 'bug', description: '  something broke  ', honeypot: '' });
    expect(submitter.submissions).toEqual([{ category: 'bug', description: 'something broke', honeypot: '' }]);
  });

  test('rejects a blank description without calling the submitter', async () => {
    await expect(
      service.submitFeedback({ category: 'bug', description: '   ', honeypot: '' })
    ).rejects.toThrow(FeedbackValidationError);
    expect(submitter.submissions).toEqual([]);
  });
});
