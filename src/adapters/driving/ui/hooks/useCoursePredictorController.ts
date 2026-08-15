import { useCallback, useState } from 'react';
import { useCoursePredictionService } from './useCoursePredictionService';
import { usePlanningService } from './usePlanningService';
import type { CoursePredictionView } from '../../../../application/dto/CoursePredictionViews';

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the file.'));
    reader.readAsText(file);
  });
}

/** Drives the standalone course predictor screen. State is intentionally
 * local/ephemeral — nothing here is persisted, so navigating away and back
 * loses the upload and result (by design, per the feature's V1 scope). */
export function useCoursePredictorController() {
  const service = useCoursePredictionService();
  const units = usePlanningService().getPaceDefaults().units;

  const [fileName, setFileName] = useState<string | null>(null);
  const [gpxContent, setGpxContent] = useState<string | null>(null);
  const [paceRaw, setPaceRaw] = useState('');
  const [result, setResult] = useState<CoursePredictionView | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadFile = useCallback(async (file: File) => {
    setError(null);
    setResult(null);
    try {
      const content = await readFileAsText(file);
      setFileName(file.name);
      setGpxContent(content);
    } catch {
      setFileName(null);
      setGpxContent(null);
      setError('Could not read that file.');
    }
  }, []);

  const predict = useCallback(() => {
    setError(null);
    if (gpxContent == null) {
      setError('Upload a GPX file first.');
      return;
    }
    try {
      setResult(service.predictCourseTime(gpxContent, paceRaw, units));
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : 'Could not predict a time for that course.');
    }
  }, [service, gpxContent, paceRaw, units]);

  return { fileName, paceRaw, setPaceRaw, result, error, units, loadFile, predict };
}
