import { describe, expect, test } from 'vitest';
import { parseGpx, InvalidGpxError, NoElevationDataError } from '../../../../src/adapters/driven/gpx/GpxParser';

const VALID_GPX = `<?xml version="1.0"?>
<gpx><trk><trkseg>
  <trkpt lat="51.5007" lon="-0.1246"><ele>10</ele></trkpt>
  <trkpt lat="51.5010" lon="-0.1246"><ele>15</ele></trkpt>
  <trkpt lat="51.5013" lon="-0.1246"><ele>20</ele></trkpt>
</trkseg></trk></gpx>`;

const NO_ELEVATION_GPX = `<?xml version="1.0"?>
<gpx><trk><trkseg>
  <trkpt lat="51.5007" lon="-0.1246"></trkpt>
  <trkpt lat="51.5010" lon="-0.1246"></trkpt>
</trkseg></trk></gpx>`;

describe('parseGpx', () => {
  test('a valid GPX track parses into distance-and-elevation points', () => {
    const points = parseGpx(VALID_GPX);
    expect(points).toHaveLength(3);
    expect(points[0].distanceM).toBe(0);
    expect(points[1].distanceM).toBeGreaterThan(0);
    expect(points[2].distanceM).toBeGreaterThan(points[1].distanceM);
    expect(points.map((p) => p.elevationM)).toEqual([10, 15, 20]);
  });

  test('a file that is not valid GPX throws an error rather than producing a prediction', () => {
    expect(() => parseGpx('this is not xml or gpx at all')).toThrow(InvalidGpxError);
  });

  test('empty input throws an error', () => {
    expect(() => parseGpx('')).toThrow(InvalidGpxError);
  });

  test('valid GPX with no elevation data anywhere throws a distinct error', () => {
    expect(() => parseGpx(NO_ELEVATION_GPX)).toThrow(NoElevationDataError);
  });
});
