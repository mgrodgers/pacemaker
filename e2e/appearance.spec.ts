import { test, expect, type Page } from '@playwright/test';

const bgColor = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim());
const dataTheme = (page: Page) => page.evaluate(() => document.documentElement.getAttribute('data-theme'));

test.describe('System appearance follows the OS color scheme', () => {
  test('background flips with the OS preference and no explicit data-theme is ever set', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await page.waitForSelector('.nav-brand');
    expect(await bgColor(page)).toBe('#161826');
    expect(await dataTheme(page)).toBeNull();

    await page.emulateMedia({ colorScheme: 'light' });
    expect(await bgColor(page)).toBe('#f3f5fe');
    expect(await dataTheme(page)).toBeNull();
  });
});

test.describe('An explicit theme choice overrides the OS preference', () => {
  test('choosing Light in Settings persists across reload even with the OS set to dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await page.getByRole('button', { name: 'Default paces' }).click();
    await page.locator('label.seg-opt', { hasText: 'Light' }).click();
    expect(await bgColor(page)).toBe('#f3f5fe');

    await page.reload();
    expect(await dataTheme(page)).toBe('light');
    expect(await bgColor(page)).toBe('#f3f5fe');
  });
});
