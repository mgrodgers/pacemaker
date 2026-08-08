import type { Plan } from '../../../domain/entities/Plan';
import type { PlanId } from '../../../domain/valueObjects/Ids';

/** Secondary (driven) port: how the application persists plans. Every
 * implementation must satisfy the shared contract in
 * tests/unit/adapters/persistence/PlanRepository.contract.ts. */
export interface PlanRepository {
  findAll(): Plan[];
  findById(id: PlanId): Plan | null;
  save(plan: Plan): void;
  deleteById(id: PlanId): void;
}
