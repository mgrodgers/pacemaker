import type { Plan } from '../../../domain/entities/Plan';
import type { PlanId } from '../../../domain/valueObjects/Ids';
import type { PlanRepository } from '../../../application/ports/out/PlanRepository';

/** Backs the InProcessPlannerDriver in tests, and doubles as a fake in
 * application-layer unit tests. Preserves insertion order; `save` on an
 * existing id updates in place rather than moving it. */
export class InMemoryPlanRepository implements PlanRepository {
  private readonly plans: Plan[] = [];

  findAll(): Plan[] {
    return [...this.plans];
  }

  findById(id: PlanId): Plan | null {
    return this.plans.find((plan) => plan.id === id) ?? null;
  }

  save(plan: Plan): void {
    const index = this.plans.findIndex((p) => p.id === plan.id);
    if (index === -1) this.plans.push(plan);
    else this.plans[index] = plan;
  }

  deleteById(id: PlanId): void {
    const index = this.plans.findIndex((p) => p.id === id);
    if (index !== -1) this.plans.splice(index, 1);
  }
}
