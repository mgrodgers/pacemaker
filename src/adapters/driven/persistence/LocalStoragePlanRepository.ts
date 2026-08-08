import type { Plan } from '../../../domain/entities/Plan';
import type { PlanId } from '../../../domain/valueObjects/Ids';
import type { PlanRepository } from '../../../application/ports/out/PlanRepository';

const STORAGE_KEY = 'runPlanner.plans';

export class LocalStoragePlanRepository implements PlanRepository {
  findAll(): Plan[] {
    return this.readAll();
  }

  findById(id: PlanId): Plan | null {
    return this.readAll().find((plan) => plan.id === id) ?? null;
  }

  save(plan: Plan): void {
    const plans = this.readAll();
    const index = plans.findIndex((p) => p.id === plan.id);
    if (index === -1) plans.push(plan);
    else plans[index] = plan;
    this.writeAll(plans);
  }

  deleteById(id: PlanId): void {
    this.writeAll(this.readAll().filter((plan) => plan.id !== id));
  }

  private readAll(): Plan[] {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as Plan[]) : [];
    } catch {
      return [];
    }
  }

  private writeAll(plans: readonly Plan[]): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    } catch {
      // Storage may be unavailable (private browsing quota, disabled
      // storage) — the in-memory copy already returned to the caller still
      // works for the rest of the session.
    }
  }
}
