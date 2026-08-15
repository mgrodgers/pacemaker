import { afterEach, describe, expect, test, vi } from 'vitest';
import { GithubApiError, RestGithubIssueClient } from './githubIssueClient.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('RestGithubIssueClient', () => {
  test('POSTs to the GitHub issues API with the token and labels, returns the created issue URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ html_url: 'https://github.com/mgrodgers/pacemaker/issues/42' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new RestGithubIssueClient('gh-token-123', 'mgrodgers/pacemaker');
    const result = await client.createIssue({
      title: 'Bug: it broke',
      body: 'details',
      labels: ['needs-triage', 'user-feedback'],
    });

    expect(result).toEqual({ url: 'https://github.com/mgrodgers/pacemaker/issues/42' });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/mgrodgers/pacemaker/issues',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer gh-token-123' }),
        body: JSON.stringify({ title: 'Bug: it broke', body: 'details', labels: ['needs-triage', 'user-feedback'] }),
      })
    );
  });

  test('throws GithubApiError on a non-2xx response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({}) }));
    const client = new RestGithubIssueClient('bad-token', 'mgrodgers/pacemaker');

    await expect(client.createIssue({ title: 't', body: 'b', labels: [] })).rejects.toThrow(GithubApiError);
  });
});
