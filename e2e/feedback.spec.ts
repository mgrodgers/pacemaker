import { test, expect } from '@playwright/test';

/**
 * The real /api/feedback function isn't servable by `vite preview` (the
 * static server this suite's webServer runs) — it only exists once
 * deployed to Vercel. Mock the network boundary instead, same as the
 * real HttpFeedbackSubmitter would see a 2xx JSON response.
 *
 * The PWA service worker intercepts fetch() once it takes control of the
 * page, which stops page.route() mocks from seeing the request on WebKit
 * — block service workers for this suite so the mock is reliable across
 * both projects.
 */
test.use({ serviceWorkers: 'block' });

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('sending feedback through the button posts to /api/feedback and shows a confirmation', async ({ page }) => {
  await page.route('**/api/feedback', (route) =>
    route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ url: 'https://github.com/mgrodgers/pacemaker/issues/1' }),
    })
  );

  await page.getByTestId('feedback-button').click();
  await page.getByTestId('feedback-category').selectOption('feature-idea');
  await page.getByTestId('feedback-description').fill('It would be great to export a plan as a calendar file.');

  const request = page.waitForRequest('**/api/feedback');
  await page.getByTestId('feedback-submit').click();

  await expect(page.getByTestId('feedback-success')).toBeVisible();
  expect((await request).postDataJSON()).toEqual({
    category: 'feature-idea',
    description: 'It would be great to export a plan as a calendar file.',
    honeypot: '',
  });
});
