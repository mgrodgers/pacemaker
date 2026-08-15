export interface CreateIssueInput {
  title: string;
  body: string;
  labels: string[];
}

export interface GithubIssueClient {
  createIssue(input: CreateIssueInput): Promise<{ url: string }>;
}

export class GithubApiError extends Error {
  constructor(status: number) {
    super(`GitHub API responded with ${status}`);
    this.name = 'GithubApiError';
  }
}

/** Real GithubIssueClient: creates an issue via the GitHub REST API using
 * a server-side token. Never imported by src/ — this only runs here, in
 * the Vercel function. */
export class RestGithubIssueClient implements GithubIssueClient {
  constructor(
    private readonly token: string,
    private readonly repo: string
  ) {}

  async createIssue(input: CreateIssueInput): Promise<{ url: string }> {
    const response = await fetch(`https://api.github.com/repos/${this.repo}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) throw new GithubApiError(response.status);

    const created = (await response.json()) as { html_url: string };
    return { url: created.html_url };
  }
}
