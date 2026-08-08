import { InMemoryPlanRepository } from '../../../../src/adapters/driven/persistence/InMemoryPlanRepository';
import { planRepositoryContract } from './PlanRepository.contract';

planRepositoryContract(() => new InMemoryPlanRepository());
