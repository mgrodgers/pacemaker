import { useMemo } from 'react';
import { getFeedbackService } from '../../../../composition/container';
import type { FeedbackService } from '../../../../application/ports/in/FeedbackService';

export function useFeedbackService(): FeedbackService {
  return useMemo(() => getFeedbackService(), []);
}
