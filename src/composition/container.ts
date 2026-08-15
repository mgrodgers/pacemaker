import { PlanningServiceImpl } from '../application/PlanningServiceImpl';
import { FeedbackServiceImpl } from '../application/FeedbackServiceImpl';
import { seedExamplePlanIfEmpty } from '../application/ExamplePlanSeeder';
import { LocalStoragePlanRepository } from '../adapters/driven/persistence/LocalStoragePlanRepository';
import { LocalStoragePaceDefaultsRepository } from '../adapters/driven/persistence/LocalStoragePaceDefaultsRepository';
import { RandomIdGenerator } from '../adapters/driven/persistence/IdGenerator';
import { HttpFeedbackSubmitter } from '../adapters/driven/feedback/HttpFeedbackSubmitter';
import type { PlanningService } from '../application/ports/in/PlanningService';
import type { FeedbackService } from '../application/ports/in/FeedbackService';

/** The only place concrete adapters are wired to the application. Adding a
 * backend later means adding a new PlanRepository implementation here —
 * nothing in domain/, application/, or adapters/driving/ui needs to change. */
let service: PlanningService | null = null;

export function getPlanningService(): PlanningService {
  if (!service) {
    const repository = new LocalStoragePlanRepository();
    const paceDefaultsRepository = new LocalStoragePaceDefaultsRepository();
    const idGenerator = new RandomIdGenerator();
    seedExamplePlanIfEmpty(repository, idGenerator);
    service = new PlanningServiceImpl(repository, idGenerator, paceDefaultsRepository);
  }
  return service;
}

let feedbackService: FeedbackService | null = null;

export function getFeedbackService(): FeedbackService {
  if (!feedbackService) {
    feedbackService = new FeedbackServiceImpl(new HttpFeedbackSubmitter());
  }
  return feedbackService;
}
