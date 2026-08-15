import { beforeEach, describe, expect, test } from 'vitest';
import { FeedbackServiceImpl } from '../../../src/application/FeedbackServiceImpl';
import { InMemoryFeedbackSubmitter } from '../../../src/adapters/driven/feedback/InMemoryFeedbackSubmitter';

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
});
