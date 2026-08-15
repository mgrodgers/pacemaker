import type { GpxCourseParser } from '../../../application/ports/out/GpxCourseParser';
import type { TrackPoint } from '../../../domain/services/ElevationResampler';
import { parseGpx } from './GpxParser';

export class GpxCourseParserAdapter implements GpxCourseParser {
  parse(gpxContent: string): TrackPoint[] {
    return parseGpx(gpxContent);
  }
}
