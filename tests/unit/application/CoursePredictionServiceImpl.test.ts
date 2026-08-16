import { describe, expect, test } from 'vitest';
import { CoursePredictionServiceImpl } from '../../../src/application/CoursePredictionServiceImpl';
import type { GpxCourseParser } from '../../../src/application/ports/out/GpxCourseParser';
import type { TrackPoint } from '../../../src/domain/services/ElevationResampler';
import { InvalidPaceError } from '../../../src/application/errors/CoursePredictionError';
import { InMemoryCoursePredictionRepository } from '../../../src/adapters/driven/persistence/InMemoryCoursePredictionRepository';
import { RandomIdGenerator } from '../../../src/adapters/driven/persistence/IdGenerator';

class FakeGpxCourseParser implements GpxCourseParser {
  constructor(private readonly points: TrackPoint[]) {}
  parse(): TrackPoint[] {
    return this.points;
  }
}

const FLAT_2KM: TrackPoint[] = [
  { distanceM: 0, elevationM: 10 },
  { distanceM: 2000, elevationM: 10 },
];

function makeService(points: TrackPoint[] = FLAT_2KM) {
  return new CoursePredictionServiceImpl(
    new FakeGpxCourseParser(points),
    new InMemoryCoursePredictionRepository(),
    new RandomIdGenerator(),
  );
}

describe('CoursePredictionServiceImpl', () => {
  test('predicts a total time and per-km splits for a valid GPX and pace', () => {
    const service = makeService();
    const result = service.predictCourseTime('<gpx/>', '5:00', 'km');
    expect(result.totalTime).toBe('10:00');
    expect(result.splits).toHaveLength(2);
    expect(result.splits[0].km).toBe(1);
    expect(result.units).toBe('km');
  });

  test('rejects an empty or unparseable target pace', () => {
    const service = makeService();
    expect(() => service.predictCourseTime('<gpx/>', '', 'km')).toThrow(InvalidPaceError);
    expect(() => service.predictCourseTime('<gpx/>', 'not a pace', 'km')).toThrow(InvalidPaceError);
  });

  test('propagates the parser error for invalid GPX rather than swallowing it', () => {
    const throwingParser: GpxCourseParser = {
      parse: () => {
        throw new Error('boom');
      },
    };
    const service = new CoursePredictionServiceImpl(
      throwingParser,
      new InMemoryCoursePredictionRepository(),
      new RandomIdGenerator(),
    );
    expect(() => service.predictCourseTime('garbage', '5:00', 'km')).toThrow('boom');
  });

  test('saving a prediction makes it appear in the saved list', () => {
    const service = makeService();
    const result = service.predictCourseTime('<gpx/>', '5:00', 'km');
    service.savePrediction('course.gpx', '5:00', result);
    expect(service.getSavedPredictions()).toHaveLength(1);
  });

  test('a saved prediction records the file name, target pace, total time, and a saved-at date', () => {
    const service = makeService();
    const result = service.predictCourseTime('<gpx/>', '5:00', 'km');
    const saved = service.savePrediction('course.gpx', '5:00', result);
    expect(saved.fileName).toBe('course.gpx');
    expect(saved.targetPaceRaw).toBe('5:00');
    expect(saved.totalTime).toBe('10:00');
    expect(saved.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test('a saved prediction carries the splits from the prediction it was saved from', () => {
    const service = makeService();
    const result = service.predictCourseTime('<gpx/>', '5:00', 'km');
    const saved = service.savePrediction('course.gpx', '5:00', result);
    expect(saved.splits).toEqual(result.splits);
  });

  test('predicting the same course twice with different paces saves two distinct entries', () => {
    const service = makeService();
    const first = service.predictCourseTime('<gpx/>', '5:00', 'km');
    const second = service.predictCourseTime('<gpx/>', '6:00', 'km');
    service.savePrediction('course.gpx', '5:00', first);
    service.savePrediction('course.gpx', '6:00', second);
    const saved = service.getSavedPredictions();
    expect(saved).toHaveLength(2);
    expect(saved.map((p) => p.id).length).toBe(new Set(saved.map((p) => p.id)).size);
  });

  test('deleting a saved prediction removes it from the saved list', () => {
    const service = makeService();
    const result = service.predictCourseTime('<gpx/>', '5:00', 'km');
    const saved = service.savePrediction('course.gpx', '5:00', result);
    service.deleteSavedPrediction(saved.id);
    expect(service.getSavedPredictions()).toEqual([]);
  });
});
