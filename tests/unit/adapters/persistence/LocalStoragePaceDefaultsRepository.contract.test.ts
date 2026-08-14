import { beforeEach } from 'vitest';
import { LocalStoragePaceDefaultsRepository } from '../../../../src/adapters/driven/persistence/LocalStoragePaceDefaultsRepository';
import { paceDefaultsRepositoryContract } from './PaceDefaultsRepository.contract';

beforeEach(() => {
  window.localStorage.clear();
});

paceDefaultsRepositoryContract(() => new LocalStoragePaceDefaultsRepository());
