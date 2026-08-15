import { useMemo } from 'react';
import { getCoursePredictionService } from '../../../../composition/container';
import type { CoursePredictionService } from '../../../../application/ports/in/CoursePredictionService';

export function useCoursePredictionService(): CoursePredictionService {
  return useMemo(() => getCoursePredictionService(), []);
}
