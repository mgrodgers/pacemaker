import { describe, expect, test } from 'vitest';
import { handleFeedbackSubmission } from './feedbackRequestHandler';
import type { CreateIssueInput, GithubIssueClient } from './githubIssueClient';
import type { RateLimiter } from './feedbackAbuseGuard';

class FakeGithubIssueClient implements GithubIssueClient {
  readonly calls: CreateIssueInput[] = [];

  async createIssue(input: CreateIssueInput): Promise<{ url: string }> {
    this.calls.push(input);
    return { url: 'https://github.com/mgrodgers/pacemaker/issues/1' };
  }
}

const allowAllRateLimiter: RateLimiter = { tryConsume: () => true };

describe('handleFeedbackSubmission', () => {
  test('creates a GitHub issue with needs-triage + user-feedback labels and a derived title', async () => {
    const githubClient = new FakeGithubIssueClient();

    const result = await handleFeedbackSubmission(
      {
        category: 'bug',
        description: 'The pace resets unexpectedly\nmore details here',
        honeypot: '',
        clientIp: '1.2.3.4',
      },
      { githubClient, rateLimiter: allowAllRateLimiter }
    );

    expect(result).toEqual({ kind: 'created', issueUrl: 'https://github.com/mgrodgers/pacemaker/issues/1' });
    expect(githubClient.calls).toEqual([
      {
        title: 'Bug: The pace resets unexpectedly',
        body: 'The pace resets unexpectedly\nmore details here',
        labels: ['needs-triage', 'user-feedback'],
      },
    ]);
  });

  test('scenario: honeypot-filled feedback is silently dropped without calling GitHub', async () => {
    const githubClient = new FakeGithubIssueClient();

    const result = await handleFeedbackSubmission(
      { category: 'bug', description: 'spam message', honeypot: 'www.spam.example', clientIp: '1.2.3.4' },
      { githubClient, rateLimiter: allowAllRateLimiter }
    );

    expect(result).toEqual({ kind: 'dropped-silently' });
    expect(githubClient.calls).toEqual([]);
  });
});
