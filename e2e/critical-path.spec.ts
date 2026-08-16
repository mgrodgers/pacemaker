import { test, expect } from '@playwright/test';
import { PlannerDsl } from '../tests/dsl/PlannerDsl';
import { UiPlannerDriver } from '../tests/drivers/UiPlannerDriver';

/**
 * Layer 1 acceptance tests running through the UiPlannerDriver (Playwright)
 * instead of InProcessPlannerDriver — a small "critical path" subset, one
 * happy-path check per feature area, to catch UI wiring regressions. The
 * bulk of business-rule coverage lives in tests/acceptance/ against the
 * fast in-process driver; this suite exists to prove the real rendered
 * app is wired to the same application layer correctly.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('creating a plan and adding a tempo segment shows correct totals', async ({ page }) => {
  const dsl = new PlannerDsl(new UiPlannerDriver(page));
  const plan = dsl.onPlan('E2E Tempo').addTempo({ mode: 'distance-pace', distance: '5', pace: '4:30' });
  expect((await plan.totals()).time).toBe('22:30');
});

test('interval reps and rest-between-reps compute correctly through the real UI', async ({ page }) => {
  const dsl = new PlannerDsl(new UiPlannerDriver(page));
  const plan = dsl.onPlan('E2E Intervals').addInterval({
    steps: [{ mode: 'distance-pace', distance: '0.4', pace: '5:00' }],
    reps: 2,
    rest: { mode: 'time-distance', time: '1:30', distance: '0' },
  });
  expect((await plan.totals()).time).toBe('5:30');
});

test('adding a rest step between interval steps through the real UI updates totals', async ({ page }) => {
  const dsl = new PlannerDsl(new UiPlannerDriver(page));
  const plan = dsl.onPlan('E2E Rest Step').addInterval({
    steps: [
      { mode: 'distance-pace', distance: '0.4', pace: '5:00' },
      { kind: 'rest', mode: 'time-distance', time: '1:00', distance: '0' },
    ],
    reps: 1,
    rest: null,
  });
  expect((await plan.totals()).time).toBe('3:00'); // 2:00 work + 1:00 rest step
});

test('best potential efforts appear on the Results tab', async ({ page }) => {
  const dsl = new PlannerDsl(new UiPlannerDriver(page));
  const plan = dsl.onPlan('E2E Best Effort').addTempo({ mode: 'distance-pace', distance: '5', pace: '4:30' });
  expect(await plan.bestEffort('5k')).toEqual({ time: '22:30', pace: '4:30/km' });
});

test('setting a default pace on the settings page prefills a matching new segment', async ({ page }) => {
  const dsl = new PlannerDsl(new UiPlannerDriver(page));
  await dsl.setDefaultPace('tempo', '5:00');
  const plan = dsl.onPlan('E2E Default Pace').addSegmentUsingDefaults('tempo');
  expect((await plan.segmentSummaries())[0]).toBe('10:00 · 2km @ 5:00/km');
});

test('renaming, duplicating, and deleting a plan works end to end', async ({ page }) => {
  const dsl = new PlannerDsl(new UiPlannerDriver(page));
  const renamed = dsl
    .onPlan('E2E Original')
    .addWarmup({ mode: 'time-pace', time: '5:00', pace: '6:00' })
    .rename('E2E Renamed');
  const copy = renamed.duplicate();
  expect(await copy.totals()).toEqual(await renamed.totals());
  await copy.delete();
});

test('uploading a GPX and entering a target pace predicts a course time through the real UI', async ({ page }) => {
  const gpx = `<?xml version="1.0"?>
<gpx><trk><trkseg>
  <trkpt lat="51.5007" lon="-0.1246"><ele>10</ele></trkpt>
  <trkpt lat="51.5107" lon="-0.1246"><ele>60</ele></trkpt>
  <trkpt lat="51.5207" lon="-0.1246"><ele>10</ele></trkpt>
</trkseg></trk></gpx>`;

  await page.getByRole('button', { name: 'Course Predictor' }).click();
  await page.getByTestId('gpx-file-input').setInputFiles({
    name: 'course.gpx',
    mimeType: 'application/gpx+xml',
    buffer: Buffer.from(gpx),
  });
  await page.getByLabel('Target pace').fill('5:00');
  await page.getByRole('button', { name: 'Predict' }).click();

  await expect(page.getByTestId('course-total-time')).toBeVisible();
  await expect(page.getByTestId('course-splits-table')).toBeVisible();
});

test('saving a course prediction lets it be reopened after a reload', async ({ page }) => {
  const gpx = `<?xml version="1.0"?>
<gpx><trk><trkseg>
  <trkpt lat="51.5007" lon="-0.1246"><ele>10</ele></trkpt>
  <trkpt lat="51.5107" lon="-0.1246"><ele>60</ele></trkpt>
  <trkpt lat="51.5207" lon="-0.1246"><ele>10</ele></trkpt>
</trkseg></trk></gpx>`;

  await page.getByRole('button', { name: 'Course Predictor' }).click();
  await page.getByTestId('gpx-file-input').setInputFiles({
    name: 'saved-course.gpx',
    mimeType: 'application/gpx+xml',
    buffer: Buffer.from(gpx),
  });
  await page.getByLabel('Target pace').fill('5:00');
  await page.getByRole('button', { name: 'Predict' }).click();
  await expect(page.getByTestId('course-total-time')).toBeVisible();
  const totalTime = await page.getByTestId('course-total-time').textContent();

  await page.getByRole('button', { name: 'Save prediction' }).click();
  await expect(page.getByTestId('saved-prediction-item')).toBeVisible();

  await page.reload();
  await page.getByRole('button', { name: 'Course Predictor' }).click();
  await expect(page.getByTestId('saved-prediction-item')).toBeVisible();

  await page.getByTestId('open-saved-prediction').click();
  await expect(page.getByTestId('course-total-time')).toHaveText(totalTime ?? '');

  await page.getByRole('button', { name: /Delete saved prediction saved-course\.gpx/ }).click();
  await expect(page.getByTestId('saved-predictions-list')).toHaveCount(0);
});

test.describe('mobile layout does not overflow horizontally', () => {
  test('a long interval segment and the add-segment row stay within narrow viewports', async ({ page }) => {
    const dsl = new PlannerDsl(new UiPlannerDriver(page));
    const plan = dsl.onPlan('E2E Narrow Viewport').addInterval({
      steps: [
        { mode: 'distance-pace', distance: '0.4', pace: '5:30' },
        { mode: 'distance-pace', distance: '0.4', pace: '5:15' },
        { mode: 'distance-pace', distance: '0.4', pace: '5:00' },
        { kind: 'rest', mode: 'time-distance', time: '1:00', distance: '0' },
      ],
      reps: 2,
      rest: null,
    });
    await plan.totals();

    for (const width of [320, 375, 414]) {
      await page.setViewportSize({ width, height: 812 });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow, `horizontal overflow at ${width}px width (collapsed)`).toBeLessThanOrEqual(0);

      await page.getByTestId('segment-card').first().click();
      const overflowExpanded = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflowExpanded, `horizontal overflow at ${width}px width (expanded)`).toBeLessThanOrEqual(0);
      await page.getByTestId('segment-card').first().click();
    }
  });
});

test.describe('mobile drag-reorder', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('dragging a segment by its handle reorders the plan at a mobile viewport', async ({ page }) => {
    const dsl = new PlannerDsl(new UiPlannerDriver(page));
    const plan = dsl
      .onPlan('E2E Reorder')
      .addWarmup({ mode: 'time-pace', time: '5:00', pace: '6:00' })
      .addCooldown({ mode: 'time-pace', time: '5:00', pace: '6:30' });

    const before = await plan.segmentSummaries();
    plan.moveSegment(0, 1);
    expect(await plan.segmentSummaries()).toEqual([...before].reverse());
  });
});
