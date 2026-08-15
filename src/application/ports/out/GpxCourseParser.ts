import type { TrackPoint } from '../../../domain/services/ElevationResampler';

/** Secondary (driven) port: parses raw GPX file content into track points.
 * Implementations may throw to signal malformed input or missing
 * elevation data — see the adapter implementation for the specific error
 * types. */
export interface GpxCourseParser {
  parse(gpxContent: string): TrackPoint[];
}
