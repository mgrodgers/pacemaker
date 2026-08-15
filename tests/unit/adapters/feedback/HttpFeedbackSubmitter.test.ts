import { afterEach, describe, expect, test, vi } from 'vitest';
import { HttpFeedbackSubmitter } from '../../../../src/adapters/driven/feedback/HttpFeedbackSubmitter';
import {
  FeedbackRateLimitedError,
  FeedbackSubmissionFailedError,
} from '../../../../src/application/errors/FeedbackError';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('HttpFeedbackSubmitter', () => {
  test('POSTs the submission as JSON to /api/feedback and resolves on 2xx', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201 });
    vi.stubGlobal('fetch', fetchMock);

    const submitter = new HttpFeedbackSubmitter();
    await submitter.submit({ category: 'bug', description: 'it broke', honeypot: '' });

    expect(fetchMock).toHaveBeenCalledWith('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'bug', description: 'it broke', honeypot: '' }),
    });
  });

  test('throws FeedbackRateLimitedError on a 429 response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429 }));
    const submitter = new HttpFeedbackSubmitter();

    await expect(
      submitter.submit({ category: 'bug', description: 'it broke', honeypot: '' })
    ).rejects.toThrow(FeedbackRateLimitedError);
  });

  test('throws FeedbackSubmissionFailedError on other non-2xx responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const submitter = new HttpFeedbackSubmitter();

    await expect(
      submitter.submit({ category: 'bug', description: 'it broke', honeypot: '' })
    ).rejects.toThrow(FeedbackSubmissionFailedError);
  });

  test('throws FeedbackSubmissionFailedError when the network request itself fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const submitter = new HttpFeedbackSubmitter();

    await expect(
      submitter.submit({ category: 'bug', description: 'it broke', honeypot: '' })
    ).rejects.toThrow(FeedbackSubmissionFailedError);
  });
});
