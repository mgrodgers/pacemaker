import type { GithubIssueClient } from './githubIssueClient.js';
import type { RateLimiter } from './feedbackAbuseGuard.js';
import { isHoneypotTripped } from './feedbackAbuseGuard.js';

export type FeedbackCategory = 'bug' | 'feature-idea' | 'other';

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug: 'Bug',
  'feature-idea': 'Feature idea',
  other: 'Other',
};

const MAX_DESCRIPTION_LENGTH = 4000;

export interface FeedbackRequestInput {
  category: string;
  description: string;
  honeypot: string;
  clientIp: string;
}

export type FeedbackHandlerResult =
  | { kind: 'created'; issueUrl: string }
  | { kind: 'dropped-silently' }
  | { kind: 'rate-limited' }
  | { kind: 'invalid'; reason: string };

export interface FeedbackHandlerDeps {
  githubClient: GithubIssueClient;
  rateLimiter: RateLimiter;
}

function isFeedbackCategory(category: string): category is FeedbackCategory {
  return category in CATEGORY_LABELS;
}

/** The real security boundary: /api/feedback is a public endpoint reachable
 * directly (curl/replay), bypassing the SPA's TypeScript types entirely, so
 * every rule here is re-validated independently of the client. */
export async function handleFeedbackSubmission(
  input: FeedbackRequestInput,
  deps: FeedbackHandlerDeps
): Promise<FeedbackHandlerResult> {
  const description = input.description.trim();
  if (description === '') return { kind: 'invalid', reason: 'Description is required.' };
  if (description.length > MAX_DESCRIPTION_LENGTH) return { kind: 'invalid', reason: 'Description is too long.' };
  if (!isFeedbackCategory(input.category)) return { kind: 'invalid', reason: 'Unknown category.' };

  if (isHoneypotTripped(input.honeypot)) return { kind: 'dropped-silently' };

  if (!deps.rateLimiter.tryConsume(input.clientIp)) return { kind: 'rate-limited' };

  const firstLine = description.split('\n')[0]!.slice(0, 60);
  const title = `${CATEGORY_LABELS[input.category]}: ${firstLine}`;

  const { url } = await deps.githubClient.createIssue({
    title,
    body: description,
    labels: ['needs-triage', 'user-feedback'],
  });

  return { kind: 'created', issueUrl: url };
}
