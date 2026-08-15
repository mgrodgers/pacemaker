# Plan: In-app feedback → GitHub issue

## Context

We're presenting the app to new testers and want their feedback captured as GitHub issues (the existing tracker per `docs/agents/issue-tracker.md`). Rather than relying on testers to have GitHub accounts and file issues themselves, we're adding an in-app "Feedback" button: tester fills a small form (free-text description + category), it POSTs to a new Vercel serverless function, which creates a GitHub issue server-side using a PAT that never touches the browser. The app is already deployed on Vercel as a static site.

User-approved scope (decided before this plan was written, not open for re-litigation during implementation):
- **Fields**: description + category dropdown (Bug / Feature idea / Other). No separate title — derived server-side from category + first line of description.
- **Abuse protection**: hidden honeypot field (bots fill it, humans don't — tripped honeypot returns success to the client but silently drops, no issue created) + a best-effort in-memory per-IP rate limit inside the function. Explicitly accepted as weak (resets on cold start) — sufficient for a short pilot with a handful of testers; no new infra (Upstash/Redis) for this iteration.
- **Labels**: `needs-triage` (existing convention, per `docs/agents/triage-labels.md`) + `user-feedback` (new, created once).

This is the first feature in the repo that talks to an external system over the network — there is no existing `fetch()`, `import.meta.env`, or `api/` usage to follow, and no modal/dialog component exists yet. Where no precedent exists, this plan establishes one consistent with the rest of the codebase's hexagonal style (plain sync-where-possible interfaces, thrown typed errors instead of Result wrappers, thin adapters/handlers, logic kept in plainly-testable units) rather than pulling in new abstractions.

Feedback is **not** a `src/domain/` concept (it has nothing to do with Plan/Segment/Pace) — it gets its own small parallel hexagon (`FeedbackService` / `FeedbackSubmitter`) rather than being bolted onto `PlanningService`.

## Ports and error shape

`src/application/ports/out/FeedbackSubmitter.ts`:
```ts
export type FeedbackCategory = 'bug' | 'feature-idea' | 'other';

export interface FeedbackSubmission {
  readonly category: FeedbackCategory;
  readonly description: string;
  readonly honeypot: string; // always empty for genuine input
}

export interface FeedbackSubmitter {
  submit(submission: FeedbackSubmission): Promise<void>;
}
```

`src/application/ports/in/FeedbackService.ts` — `submitFeedback(submission): Promise<void>`.

`src/application/errors/FeedbackError.ts`, styled like `src/domain/errors/DomainError.ts`:
```ts
export class FeedbackError extends Error {}
export class FeedbackValidationError extends FeedbackError {}
export class FeedbackRateLimitedError extends FeedbackError {}
export class FeedbackSubmissionFailedError extends FeedbackError {}
```
UI distinguishes failure modes via `instanceof`, same pattern as `PlanNotFoundError` elsewhere. `FeedbackServiceImpl` throws `FeedbackValidationError` itself; `HttpFeedbackSubmitter` throws the other two based on HTTP status and lets `FeedbackServiceImpl` propagate them uncaught. This is the **first async out-port** in the codebase — no existing precedent, but Promise + thrown errors (no Result/Either) is the natural fit given everything else in the app already throws for command failures.

Issue title/body/label derivation is a GitHub concept, not an application concept — it lives entirely server-side, not in `FeedbackServiceImpl`.

## Validation placement

- **UI** (`useFeedbackController`): disable submit while blank. Convenience only.
- **Application** (`FeedbackServiceImpl`): re-validates non-blank description, throws `FeedbackValidationError`. Same role `PlanNotFoundError` plays — protects every future caller, not just this form.
- **Server** (`api/lib/feedbackRequestHandler.ts`): re-validates non-blank + length cap + category is a known value. This is the real security boundary since `/api/feedback` is a public endpoint reachable directly (curl/replay), bypassing the SPA entirely.

Small duplication across these three is accepted deliberately — `src/` and `api/` are different tsconfig projects/runtimes with no shared-module precedent, and sharing a 2-line rule isn't worth coupling the browser bundle's build graph to the serverless function's.

## Server-side design (`api/`)

Thin handler + plain, dependency-injected, unit-testable functions (mirrors `container.ts` wiring vs. `PlanningServiceImpl` logic elsewhere):

- **`api/lib/githubIssueClient.ts`** — `GithubIssueClient` interface (`createIssue({title, body, labels}): Promise<{url}>`) + `RestGithubIssueClient` (real, `fetch`-based against `https://api.github.com/repos/${repo}/issues`, `Authorization: Bearer ${token}`, throws on non-2xx). Testable by stubbing `fetch`, no Vercel types involved.
- **`api/lib/feedbackAbuseGuard.ts`** — `isHoneypotTripped(honeypot)`, `RateLimiter` interface + `InMemoryFixedWindowRateLimiter` (injectable clock, mirrors the repo's `FixedIdGenerator` test-double style).
- **`api/lib/feedbackRequestHandler.ts`** — the fully unit-testable core, framework-agnostic (no `VercelRequest`/`VercelResponse`):
  ```ts
  export type FeedbackHandlerResult =
    | { kind: 'created'; issueUrl: string }
    | { kind: 'dropped-silently' }
    | { kind: 'rate-limited' }
    | { kind: 'invalid'; reason: string };

  export async function handleFeedbackSubmission(
    input: { category: string; description: string; honeypot: string; clientIp: string },
    deps: { githubClient: GithubIssueClient; rateLimiter: RateLimiter }
  ): Promise<FeedbackHandlerResult>;
  ```
  Order: validate → honeypot (drop silently) → rate limit by `clientIp` → derive title/body → `createIssue({..., labels: ['needs-triage', 'user-feedback']})`.
- **`api/feedback.ts`** — thin Vercel handler: reads `GITHUB_TOKEN`/`GITHUB_REPO` env vars, constructs `RestGithubIssueClient` + a module-level `InMemoryFixedWindowRateLimiter`, extracts `clientIp` from `x-forwarded-for`, calls `handleFeedbackSubmission`, maps `kind` → HTTP status (201/200/429/400). No business logic here.

**Toolchain caveat**: `tsconfig.api.json` can't be added to root `tsconfig.json`'s `references` until `api/` has at least one `.ts` file (`tsc -b` errors on an empty include glob) — so the tsconfig/`vite.config.ts` test.include wiring lands in the *same* commit as the first real `api/lib` file, not before.

## UI

- No router in this app (`App.tsx` is view-state based: `'plans' | 'plan' | 'settings'`). `FeedbackButton` is self-contained (owns its own open/closed state) and gets rendered **once** in `App.tsx` alongside the view switch — no prop-drilling into each screen's own `<nav>` needed.
- No modal/dialog exists yet — panel reuses `.card`/`.elev-md`; a small new `.overlay` backdrop block is added to `src/styles/tokens.css` in the same commit as the button (not independently TDD-able, it's pure CSS).
- `useFeedbackService.ts` mirrors `usePlanningService.ts` (one-line `useMemo` over `getFeedbackService()`).
- `useFeedbackController.ts` mirrors `useDefaultPaceSettingsController.ts` — owns description/category/honeypot/status (`idle|submitting|success|error|rate-limited`) local state.
- `data-testid`s: `feedback-button`, `feedback-modal`, `feedback-description`, `feedback-category`, `feedback-honeypot`, `feedback-submit`, `feedback-success`, `feedback-error`.
- Tests stub `global.fetch` (`vi.stubGlobal`) — first precedent for this in the repo, since everything else has been local-storage-only.

## File list

**Application**: `src/application/ports/out/FeedbackSubmitter.ts`, `src/application/ports/in/FeedbackService.ts`, `src/application/FeedbackServiceImpl.ts`, `src/application/errors/FeedbackError.ts`

**Adapters (driven)**: `src/adapters/driven/feedback/HttpFeedbackSubmitter.ts` (real), `src/adapters/driven/feedback/InMemoryFeedbackSubmitter.ts` (fake, doubles as test double)

**Composition**: `src/composition/container.ts` (add `getFeedbackService()`)

**UI**: `src/adapters/driving/ui/hooks/useFeedbackService.ts`, `.../hooks/useFeedbackController.ts`, `.../components/FeedbackButton.tsx`, `.../components/FeedbackModal.tsx`, `.../components/icons.tsx` (add feedback icon), `.../App.tsx` (render `<FeedbackButton />`), `src/styles/tokens.css` (add `.overlay`)

**api/**: `api/feedback.ts`, `api/lib/githubIssueClient.ts` (+ `.test.ts`), `api/lib/feedbackAbuseGuard.ts` (+ `.test.ts`), `api/lib/feedbackRequestHandler.ts` (+ `.test.ts`) — tests colocated inside `api/lib/` (not `tests/`) so they fall under `tsconfig.api.json`'s own include without cross-referencing another project

**Config**: `tsconfig.api.json` (new, modeled on `tsconfig.node.json`: no DOM lib, `include: ["api"]`), `tsconfig.json` (add reference), `vite.config.ts` (add `'api/**/*.test.ts'` to `test.include`), `package.json` (add `@vercel/node` devDependency for handler types), `.env.example` (new: `GITHUB_TOKEN=`, `GITHUB_REPO=mgrodgers/pacemaker`), `.gitignore` (add `.env*`), `vercel.json` (only if zero-config detection of `api/*.ts` turns out to need an explicit runtime pin — verify on first deploy before adding)

**Tests**: `tests/unit/application/FeedbackServiceImpl.test.ts`, `tests/unit/adapters/feedback/HttpFeedbackSubmitter.test.ts`, `tests/unit/ui/FeedbackModal.test.tsx`, `e2e/feedback.spec.ts` (mocks `**/api/feedback` via `page.route()` — first precedent for network mocking in this repo's e2e suite, since `vite preview`, what Playwright's `webServer` runs, cannot execute real Vercel functions)

## Sequenced TDD slices (red → green → commit, each leaves typecheck/test/build green)

**Application core**
1. `FeedbackServiceImpl.submitFeedback` forwards a trimmed submission to the submitter — introduces `FeedbackSubmitter`, `FeedbackService`, `FeedbackServiceImpl`, `InMemoryFeedbackSubmitter`.
2. Blank/whitespace-only description throws `FeedbackValidationError` without calling the submitter.
3. Pin: submitter errors propagate through `submitFeedback` uncaught.

**Real client adapter**
4. `HttpFeedbackSubmitter` POSTs `{category, description, honeypot}` to `/api/feedback`, resolves on 2xx (stub `fetch`).
5. HTTP 429 → `FeedbackRateLimitedError`; other non-2xx/network failure → `FeedbackSubmissionFailedError`.

**Composition**
6. Wire `getFeedbackService()` into `container.ts` (verified by typecheck/build, no new test).

**UI**
7. `FeedbackModal` renders description textarea, category select, submit button.
8. Submit disabled while description is blank.
9. Submitting valid input calls `fetch` with expected body, shows success state (stub 201).
10. 429 response shows a rate-limit-specific message.
11. Other failures show a generic error and preserve the draft (description not cleared).
12. Honeypot input added, visually hidden, out of tab order.
13. `FeedbackButton` opens/closes the modal, wired once into `App.tsx`; `.overlay` CSS lands in this commit.

**Server (`api/`)**
14. Stand up `tsconfig.api.json` + root reference + `vite.config.ts` test.include, plus `isHoneypotTripped` — first commit to exercise the whole `api/` toolchain, verify `typecheck`/`test` explicitly.
15. `InMemoryFixedWindowRateLimiter` allows N/window per key, rejects N+1, injectable clock.
16. `RestGithubIssueClient` POSTs to the GitHub issues API with PAT + labels, returns created URL; throws on non-2xx (stub `fetch`).
17. `handleFeedbackSubmission` creates an issue with `needs-triage` + `user-feedback` labels and a derived title (fake `GithubIssueClient`).
18. Scenario: honeypot-filled input → `dropped-silently`, GitHub never called.
19. Scenario: rate-limited key → `rate-limited`, GitHub never called.
20. Blank description / unknown category → `invalid`, GitHub never called.
21. `api/feedback.ts` thin handler: env vars, `RestGithubIssueClient`, rate limiter, status-code mapping; add `@vercel/node` devDependency. (Not independently unit-tested by design — thin wiring only.)

**End-to-end + docs**
22. `e2e/feedback.spec.ts` — mocks `**/api/feedback`, drives the real rendered UI (open → fill → submit → success).
23. `.env.example`, `.gitignore` entry, README note on required env vars.

Note: the feature is only functionally complete against real GitHub once **both** step 5 (client) and step 21 (server) land — earlier commits are test-green via stubbed `fetch`, not runtime-functional yet, which is expected for TDD slicing.

## Manual setup required from the user (cannot be done by the agent)

- Create a GitHub PAT scoped to `mgrodgers/pacemaker` with `Issues: Read and write` (fine-grained PAT recommended over a classic `repo`-scoped one).
- Add `GITHUB_TOKEN` and `GITHUB_REPO=mgrodgers/pacemaker` as Vercel Environment Variables (Project Settings → Environment Variables, Production + Preview).
- Trigger/confirm a redeploy after adding env vars (a deploy that predates them won't pick them up).
- Verify after first deploy that Vercel actually built `api/feedback.ts` as a serverless function.
- For manual end-to-end testing against the real endpoint locally, `vercel dev` with a local `.env` is needed — `vite dev`/`vite preview` can't execute the function.

## Agent can do

- Create the `user-feedback` label once via `gh label create user-feedback --description "Submitted via the in-app feedback form" --color <hex>` (will confirm before running — label creation is low-risk/reversible but touches shared repo state).
- All code, tests, config, and the commits/PR itself.

## Verification

- `npm run typecheck`, `npm run test`, `npm run build` green after every commit.
- `npx vitest run api/lib/feedbackRequestHandler.test.ts` etc. for server-logic units in isolation.
- `npm run test:e2e` runs `e2e/feedback.spec.ts` (mocked network) alongside the existing critical-path suite.
- After the user completes the manual Vercel/GitHub setup above, a real manual smoke test: open the deployed app, submit feedback, confirm an issue appears on `mgrodgers/pacemaker` with `needs-triage` + `user-feedback` labels.
