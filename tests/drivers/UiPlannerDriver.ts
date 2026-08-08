import type { Locator, Page } from '@playwright/test';
import type { FieldMode } from '../../src/domain/valueObjects/FieldMode';
import type { SegmentType } from '../../src/domain/valueObjects/SegmentType';
import type { EffortView, FieldSpec, IntervalSpec, PlannerDriver, TotalsView, UnitSystem } from './PlannerDriver';

const SEGMENT_LABEL: Record<Exclude<SegmentType, never>, string> = {
  warmup: 'Warmup',
  easy: 'Easy',
  tempo: 'Tempo',
  interval: 'Interval',
  rest: 'Rest',
  cooldown: 'Cooldown',
};

const MODE_LABEL: Record<FieldMode, string> = {
  'time-pace': 'Time+Pace',
  'distance-pace': 'Dist+Pace',
  'time-distance': 'Time+Dist',
};

function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Layer 3 driver that drives the real rendered app through a Playwright
 * `Page`, touching only what a person could see and click — plan names,
 * segment-type buttons, visible field labels, the drag handle. Implements
 * the same PlannerDriver contract as InProcessPlannerDriver, so any
 * Layer-1 acceptance test written against the DSL can run against this
 * driver unmodified (see e2e/critical-path.spec.ts for the subset that
 * does, as a UI-wiring smoke check).
 */
export class UiPlannerDriver implements PlannerDriver {
  constructor(private readonly page: Page) {}

  async planNames(): Promise<string[]> {
    await this.ensureOnPlansList();
    return this.page.getByTestId('plan-name').allTextContents();
  }

  async createPlan(name: string): Promise<void> {
    await this.ensureOnPlansList();
    await this.page.getByRole('button', { name: 'New plan' }).click();
    await this.commitPlanName(this.page.getByLabel('Plan name'), name);
  }

  async renamePlan(currentName: string, newName: string): Promise<void> {
    await this.ensureOnPlansList();
    await this.cardByName(currentName).getByRole('button', { name: 'Rename' }).click();
    // The name div (which cardByName locates via) is replaced by the input
    // once rename mode starts, so re-query at the page level rather than
    // reusing the now-stale `card` locator.
    await this.commitPlanName(this.page.getByLabel('Plan name'), newName);
  }

  async duplicatePlan(name: string): Promise<void> {
    await this.ensureOnPlansList();
    await this.cardByName(name).getByRole('button', { name: 'Duplicate' }).click();
  }

  async deletePlan(name: string): Promise<void> {
    await this.ensureOnPlansList();
    await this.cardByName(name).getByRole('button', { name: 'Delete' }).click();
  }

  async setUnits(planName: string, units: UnitSystem): Promise<void> {
    await this.ensureOnPlan(planName);
    await this.selectRadio(this.page, units);
  }

  async addSegment(planName: string, type: Exclude<SegmentType, 'interval'>, spec: FieldSpec): Promise<void> {
    await this.ensureOnPlan(planName);
    await this.ensureBuilderSubview();
    await this.page.getByRole('button', { name: SEGMENT_LABEL[type], exact: true }).click();
    const card = this.page.getByTestId('segment-card').last();
    await this.fillFieldTriad(card.getByTestId('segment-fields'), spec);
  }

  async addIntervalSegment(planName: string, spec: IntervalSpec): Promise<void> {
    await this.ensureOnPlan(planName);
    await this.ensureBuilderSubview();
    await this.page.getByRole('button', { name: SEGMENT_LABEL.interval, exact: true }).click();
    const card = this.page.getByTestId('segment-card').last();

    const steps = card.getByTestId('step-editor');
    let count = await steps.count();
    while (count < spec.steps.length) {
      await card.getByRole('button', { name: '+ Add step' }).click();
      count = await steps.count();
    }
    while (count > spec.steps.length) {
      await steps.last().getByRole('button', { name: 'Remove step' }).click();
      count = await steps.count();
    }
    for (let i = 0; i < spec.steps.length; i++) {
      await this.fillFieldTriad(steps.nth(i), spec.steps[i]!);
    }

    if (spec.reps != null) {
      const repsValue = card.getByTestId('reps-value');
      const increase = card.getByRole('button', { name: 'Increase reps' });
      const decrease = card.getByRole('button', { name: 'Decrease reps' });
      let current = Number(await repsValue.textContent());
      while (current < spec.reps) {
        await increase.click();
        current++;
      }
      while (current > spec.reps) {
        await decrease.click();
        current--;
      }
    }

    const wantsRest = spec.rest != null;
    const restToggle = card.getByRole('button', { name: 'Rest between reps' });
    const restIsOn = ((await restToggle.getAttribute('class')) ?? '').includes('btn-primary');
    if (wantsRest !== restIsOn) await restToggle.click();
    if (spec.rest) {
      await this.fillFieldTriad(card.getByTestId('rest-fields'), spec.rest);
    }
  }

  async removeSegment(planName: string, segmentIndex: number): Promise<void> {
    await this.ensureOnPlan(planName);
    await this.ensureBuilderSubview();
    await this.page.getByTestId('segment-card').nth(segmentIndex).getByRole('button', { name: 'Delete segment' }).click();
  }

  async moveSegment(planName: string, fromIndex: number, toIndex: number): Promise<void> {
    await this.ensureOnPlan(planName);
    await this.ensureBuilderSubview();
    const cards = this.page.getByTestId('segment-card');
    const handleBox = await cards.nth(fromIndex).getByTestId('drag-handle').boundingBox();
    const targetBox = await cards.nth(toIndex).boundingBox();
    if (!handleBox || !targetBox) throw new Error(`moveSegment: could not locate segment ${fromIndex} or ${toIndex}`);

    const startX = handleBox.x + handleBox.width / 2;
    const startY = handleBox.y + handleBox.height / 2;
    const endX = targetBox.x + targetBox.width / 2;
    const endY = targetBox.y + targetBox.height / 2;

    // dnd-kit's PointerSensor needs real pointer/mouse movement past its
    // activation distance before it treats this as a drag, not a click.
    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.mouse.move(startX, startY + Math.sign(endY - startY || 1) * 12, { steps: 5 });
    await this.page.mouse.move(endX, endY, { steps: 10 });
    await this.page.mouse.up();
  }

  async totals(planName: string): Promise<TotalsView> {
    await this.ensureOnPlan(planName);
    await this.ensureBuilderSubview();
    const bar = this.page.getByTestId('totals-bar');
    return {
      distance: await bar.getByTestId('totals-distance').innerText(),
      time: await bar.getByTestId('totals-time').innerText(),
      pace: await bar.getByTestId('totals-pace').innerText(),
    };
  }

  async bestEffort(planName: string, key: string): Promise<EffortView | null> {
    await this.ensureOnPlan(planName);
    const resultsRadio = this.page.getByRole('radio', { name: 'Results', exact: true });
    if (!(await resultsRadio.isChecked())) await this.selectRadio(this.page, 'Results');
    const row = this.page.getByTestId(`best-effort-${key}`);
    if (!(await row.isVisible().catch(() => false))) return null;
    const cells = await row.locator('td').allInnerTexts();
    return { time: cells[1]!, pace: cells[2]! };
  }

  async segmentSummaries(planName: string): Promise<string[]> {
    await this.ensureOnPlan(planName);
    await this.ensureBuilderSubview();
    return this.page.getByTestId('segment-summary').allInnerTexts();
  }

  private cardByName(name: string): Locator {
    return this.page
      .getByTestId('plan-name')
      .filter({ hasText: new RegExp(`^${escapeForRegExp(name)}$`) })
      .locator('xpath=ancestor::*[@data-testid="plan-card"]');
  }

  private async commitPlanName(input: Locator, name: string): Promise<void> {
    await input.fill(name);
    await input.press('Tab');
  }

  private async ensureOnPlansList(): Promise<void> {
    const back = this.page.getByRole('button', { name: 'Back to plans' });
    if (await back.isVisible().catch(() => false)) {
      await back.click();
    }
  }

  private async ensureOnPlan(name: string): Promise<void> {
    const titleInput = this.page.getByLabel('Plan name');
    if (await titleInput.isVisible().catch(() => false)) {
      if ((await titleInput.inputValue()) === name) return;
    }
    await this.ensureOnPlansList();
    await this.cardByName(name).click();
  }

  private async ensureBuilderSubview(): Promise<void> {
    const radio = this.page.getByRole('radio', { name: 'Builder', exact: true });
    if (!(await radio.isChecked())) await this.selectRadio(this.page, 'Builder');
  }

  /**
   * Our segmented controls hide the real `<input type="radio">` (zero size,
   * `pointer-events: none`) and style the wrapping `<label>` instead, the
   * way a real user's click lands on the label and the browser forwards it
   * to the input. Playwright's actionability checks require the *target*
   * element itself to have a non-zero box, so `.check()` on the input
   * would hang — click the label, exactly like a user's pointer would.
   */
  private async selectRadio(scope: Page | Locator, text: string): Promise<void> {
    await scope
      .locator('label.seg-opt')
      .filter({ hasText: new RegExp(`^${escapeForRegExp(text)}$`) })
      .click();
  }

  private async fillFieldTriad(scope: Locator, spec: FieldSpec): Promise<void> {
    await this.selectRadio(scope, MODE_LABEL[spec.mode]);
    const inputs = scope.locator('.field input.input');
    const timeInput = inputs.nth(0);
    const distanceInput = inputs.nth(1);
    const paceInput = inputs.nth(2);
    switch (spec.mode) {
      case 'time-pace':
        await timeInput.fill(spec.time);
        await paceInput.fill(spec.pace);
        break;
      case 'distance-pace':
        await distanceInput.fill(spec.distance);
        await paceInput.fill(spec.pace);
        break;
      case 'time-distance':
        await timeInput.fill(spec.time);
        await distanceInput.fill(spec.distance);
        break;
    }
  }
}
