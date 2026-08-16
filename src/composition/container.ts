import { PlanningServiceImpl } from '../application/PlanningServiceImpl';
import { FeedbackServiceImpl } from '../application/FeedbackServiceImpl';
import { CoursePredictionServiceImpl } from '../application/CoursePredictionServiceImpl';
import { seedExamplePlanIfEmpty } from '../application/ExamplePlanSeeder';
import { LocalStoragePlanRepository } from '../adapters/driven/persistence/LocalStoragePlanRepository';
import { LocalStoragePaceDefaultsRepository } from '../adapters/driven/persistence/LocalStoragePaceDefaultsRepository';
import { RandomIdGenerator } from '../adapters/driven/persistence/IdGenerator';
import { HttpFeedbackSubmitter } from '../adapters/driven/feedback/HttpFeedbackSubmitter';
import { GpxCourseParserAdapter } from '../adapters/driven/gpx/GpxCourseParserAdapter';
import { LocalStorageCoursePredictionRepository } from '../adapters/driven/persistence/LocalStorageCoursePredictionRepository';
import type { PlanningService } from '../application/ports/in/PlanningService';
import type { FeedbackService } from '../application/ports/in/FeedbackService';
import type { CoursePredictionService } from '../application/ports/in/CoursePredictionService';

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

let coursePredictionService: CoursePredictionService | null = null;

export function getCoursePredictionService(): CoursePredictionService {
  if (!coursePredictionService) {
    coursePredictionService = new CoursePredictionServiceImpl(
      new GpxCourseParserAdapter(),
      new LocalStorageCoursePredictionRepository(),
      new RandomIdGenerator(),
    );
  }
  return coursePredictionService;
}
