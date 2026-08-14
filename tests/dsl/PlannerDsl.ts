import type { EffortView, FieldSpec, IntervalSpec, PlannerDriver, TotalsView, UnitSystem } from '../drivers/PlannerDriver';
import type { SegmentType } from '../../src/domain/valueObjects/SegmentType';
import type { StepKind } from '../../src/domain/valueObjects/StepKind';

/**
 * Layer 2 (DSL): the vocabulary every Layer-1 acceptance test is written
 * in. Speaks only in domain terms — plan names, segment specs, totals,
 * best efforts — and never leaks which Protocol Driver is underneath.
 * Swap the driver passed to the constructor and every acceptance test
 * that uses this DSL runs unmodified against a different SUT.
 *
 * Mutating calls queue onto an internal promise chain and return `this`
 * synchronously, so `dsl.onPlan(x).addWarmup(a).addTempo(b)` still reads
 * as a fluent sentence even though a UI driver's steps are genuinely
 * async. Read calls (totals, bestEffort, segmentSummaries) await that
 * queue first, so they always observe every queued step's effect.
 */
export class PlannerDsl {
  constructor(private readonly driver: PlannerDriver) {}

  onPlan(name: string): PlanBuilder {
    const queue = this.driver.planNames().then(async (names) => {
      if (!names.includes(name)) await this.driver.createPlan(name);
    });
    return new PlanBuilder(this.driver, name, queue);
  }

  /** Global, not plan-scoped — the default-pace settings page's own unit
   * choice. Set this before setDefaultPace calls that should be parsed in
   * that unit system. */
  async setDefaultPaceUnits(units: UnitSystem): Promise<void> {
    await this.driver.setDefaultPaceUnits(units);
  }

  /** Global, not plan-scoped — configures one segment type's default
   * pace. */
  async setDefaultPace(type: SegmentType, raw: string): Promise<void> {
    await this.driver.setDefaultPace(type, raw);
  }
}

export class PlanBuilder {
  constructor(
    private readonly driver: PlannerDriver,
    private readonly name: string,
    private queue: Promise<void>
  ) {}

  private enqueue(op: () => Promise<void>): this {
    this.queue = this.queue.then(op);
    return this;
  }

  setUnits(units: UnitSystem): this {
    return this.enqueue(() => this.driver.setUnits(this.name, units));
  }

  addWarmup(spec: FieldSpec): this {
    return this.enqueue(() => this.driver.addSegment(this.name, 'warmup', spec));
  }

  addEasy(spec: FieldSpec): this {
    return this.enqueue(() => this.driver.addSegment(this.name, 'easy', spec));
  }

  addTempo(spec: FieldSpec): this {
    return this.enqueue(() => this.driver.addSegment(this.name, 'tempo', spec));
  }

  addCooldown(spec: FieldSpec): this {
    return this.enqueue(() => this.driver.addSegment(this.name, 'cooldown', spec));
  }

  addRest(spec: FieldSpec): this {
    return this.enqueue(() => this.driver.addSegment(this.name, 'rest', spec));
  }

  addInterval(spec: IntervalSpec): this {
    return this.enqueue(() => this.driver.addIntervalSegment(this.name, spec));
  }

  /** Adds a segment with no explicit field spec, observing whatever the
   * app's current defaults (configured or built-in fallback) produce. */
  addSegmentUsingDefaults(type: SegmentType): this {
    return this.enqueue(() => this.driver.addSegmentUsingDefaults(this.name, type));
  }

  /** Appends one step to an existing interval segment (by index), with no
   * explicit field spec, observing wherever default-inheritance puts its
   * pace. */
  addStepToInterval(segmentIndex: number, kind: StepKind = 'work'): this {
    return this.enqueue(() => this.driver.addStepToInterval(this.name, segmentIndex, kind));
  }

  removeSegment(index: number): this {
    return this.enqueue(() => this.driver.removeSegment(this.name, index));
  }

  moveSegment(fromIndex: number, toIndex: number): this {
    return this.enqueue(() => this.driver.moveSegment(this.name, fromIndex, toIndex));
  }

  rename(newName: string): PlanBuilder {
    const queue = this.queue.then(() => this.driver.renamePlan(this.name, newName));
    return new PlanBuilder(this.driver, newName, queue);
  }

  /** The application layer names duplicates "<source> copy" — returns a
   * builder pointed at that copy so the test can keep chaining. */
  duplicate(): PlanBuilder {
    const copyName = `${this.name} copy`;
    const queue = this.queue.then(() => this.driver.duplicatePlan(this.name));
    return new PlanBuilder(this.driver, copyName, queue);
  }

  async delete(): Promise<void> {
    await this.queue;
    await this.driver.deletePlan(this.name);
  }

  async totals(): Promise<TotalsView> {
    await this.queue;
    return this.driver.totals(this.name);
  }

  async bestEffort(key: '1k' | '5k' | '10k' | '15k' | 'hm'): Promise<EffortView | null> {
    await this.queue;
    return this.driver.bestEffort(this.name, key);
  }

  async segmentSummaries(): Promise<string[]> {
    await this.queue;
    return this.driver.segmentSummaries(this.name);
  }
}
