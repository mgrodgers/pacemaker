import { useCallback, useState } from 'react';
import { useCoursePredictionService } from './useCoursePredictionService';
import { usePlanningService } from './usePlanningService';
import type { CoursePredictionView } from '../../../../application/dto/CoursePredictionViews';
import type { SavedCoursePrediction } from '../../../../domain/entities/SavedCoursePrediction';
import type { CoursePredictionId } from '../../../../domain/valueObjects/Ids';

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the file.'));
    reader.readAsText(file);
  });
}

/** Drives the standalone course predictor screen. Upload/edit state (file,
 * pace draft) is local/ephemeral by design — navigating away loses an
 * in-progress upload. A predicted result can be explicitly saved, which
 * persists it via CoursePredictionService so it survives navigation/reload. */
export function useCoursePredictorController() {
  const service = useCoursePredictionService();
  const units = usePlanningService().getPaceDefaults().units;

  const [fileName, setFileName] = useState<string | null>(null);
  const [gpxContent, setGpxContent] = useState<string | null>(null);
  const [paceRaw, setPaceRaw] = useState('');
  const [result, setResult] = useState<CoursePredictionView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedPredictions, setSavedPredictions] = useState<SavedCoursePrediction[]>(() =>
    service.getSavedPredictions(),
  );

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

  const savePrediction = useCallback(() => {
    if (result == null) return;
    service.savePrediction(fileName ?? 'course.gpx', paceRaw, result);
    setSavedPredictions(service.getSavedPredictions());
  }, [service, fileName, paceRaw, result]);

  const openSavedPrediction = useCallback((prediction: SavedCoursePrediction) => {
    setFileName(prediction.fileName);
    setPaceRaw(prediction.targetPaceRaw);
    setResult({ units: prediction.units, totalTime: prediction.totalTime, splits: prediction.splits });
    setError(null);
  }, []);

  const deleteSavedPrediction = useCallback(
    (id: CoursePredictionId) => {
      service.deleteSavedPrediction(id);
      setSavedPredictions(service.getSavedPredictions());
    },
    [service],
  );

  return {
    fileName,
    paceRaw,
    setPaceRaw,
    result,
    error,
    units,
    loadFile,
    predict,
    savedPredictions,
    savePrediction,
    openSavedPrediction,
    deleteSavedPrediction,
  };
}
