import { beforeEach } from 'vitest';
import { LocalStoragePlanRepository } from '../../../../src/adapters/driven/persistence/LocalStoragePlanRepository';
import { planRepositoryContract } from './PlanRepository.contract';

// Unlike InMemoryPlanRepository, every instance here shares the same
// backing localStorage — reset it so the contract's "starts empty" cases
// hold regardless of test order.
beforeEach(() => {
  window.localStorage.clear();
});

planRepositoryContract(() => new LocalStoragePlanRepository());
