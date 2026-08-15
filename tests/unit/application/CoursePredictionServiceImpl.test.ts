import { describe, expect, test } from 'vitest';
import { CoursePredictionServiceImpl } from '../../../src/application/CoursePredictionServiceImpl';
import type { GpxCourseParser } from '../../../src/application/ports/out/GpxCourseParser';
import type { TrackPoint } from '../../../src/domain/services/ElevationResampler';
import { InvalidPaceError } from '../../../src/application/errors/CoursePredictionError';

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

describe('CoursePredictionServiceImpl', () => {
  test('predicts a total time and per-km splits for a valid GPX and pace', () => {
    const service = new CoursePredictionServiceImpl(new FakeGpxCourseParser(FLAT_2KM));
    const result = service.predictCourseTime('<gpx/>', '5:00', 'km');
    expect(result.totalTime).toBe('10:00');
    expect(result.splits).toHaveLength(2);
    expect(result.splits[0].km).toBe(1);
    expect(result.units).toBe('km');
  });

  test('rejects an empty or unparseable target pace', () => {
    const service = new CoursePredictionServiceImpl(new FakeGpxCourseParser(FLAT_2KM));
    expect(() => service.predictCourseTime('<gpx/>', '', 'km')).toThrow(InvalidPaceError);
    expect(() => service.predictCourseTime('<gpx/>', 'not a pace', 'km')).toThrow(InvalidPaceError);
  });

  test('propagates the parser error for invalid GPX rather than swallowing it', () => {
    const throwingParser: GpxCourseParser = {
      parse: () => {
        throw new Error('boom');
      },
    };
    const service = new CoursePredictionServiceImpl(throwingParser);
    expect(() => service.predictCourseTime('garbage', '5:00', 'km')).toThrow('boom');
  });
});
