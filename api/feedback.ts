import type { VercelRequest, VercelResponse } from '@vercel/node';
import { RestGithubIssueClient } from './lib/githubIssueClient';
import { InMemoryFixedWindowRateLimiter } from './lib/feedbackAbuseGuard';
import { handleFeedbackSubmission } from './lib/feedbackRequestHandler';

const RATE_LIMIT_MAX = Number(process.env.FEEDBACK_RATE_LIMIT_MAX ?? 3);
const RATE_LIMIT_WINDOW_MS = Number(process.env.FEEDBACK_RATE_LIMIT_WINDOW_MS ?? 10 * 60 * 1000);

// Module-level: only survives while this serverless instance stays warm.
// Best-effort, accepted tradeoff for a short pilot — see docs/plans/feedback-github-issue.md.
const rateLimiter = new InMemoryFixedWindowRateLimiter(RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);

function firstForwardedIp(header: string | string[] | undefined): string {
  const value = Array.isArray(header) ? header[0] : header;
  return value?.split(',')[0]?.trim() ?? 'unknown';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (!token || !repo) {
    res.status(500).json({ error: 'Feedback service is not configured.' });
    return;
  }

  const body = req.body ?? {};
  const result = await handleFeedbackSubmission(
    {
      category: String(body.category ?? ''),
      description: String(body.description ?? ''),
      honeypot: String(body.honeypot ?? ''),
      clientIp: firstForwardedIp(req.headers['x-forwarded-for']),
    },
    { githubClient: new RestGithubIssueClient(token, repo), rateLimiter }
  );

  switch (result.kind) {
    case 'created':
      res.status(201).json({ url: result.issueUrl });
      return;
    case 'dropped-silently':
      res.status(200).json({ ok: true });
      return;
    case 'rate-limited':
      res.status(429).json({ error: 'Too many submissions.' });
      return;
    case 'invalid':
      res.status(400).json({ error: result.reason });
      return;
  }
}
