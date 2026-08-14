import { InMemoryPaceDefaultsRepository } from '../../../../src/adapters/driven/persistence/InMemoryPaceDefaultsRepository';
import { paceDefaultsRepositoryContract } from './PaceDefaultsRepository.contract';

paceDefaultsRepositoryContract(() => new InMemoryPaceDefaultsRepository());
