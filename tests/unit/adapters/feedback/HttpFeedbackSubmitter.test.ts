import { afterEach, describe, expect, test, vi } from 'vitest';
import { HttpFeedbackSubmitter } from '../../../../src/adapters/driven/feedback/HttpFeedbackSubmitter';

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
});
