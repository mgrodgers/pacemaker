import type { TrackPoint } from '../../../domain/services/ElevationResampler';

export class InvalidGpxError extends Error {
  constructor(message = 'The uploaded file is not valid GPX.') {
    super(message);
    this.name = 'InvalidGpxError';
  }
}

export class NoElevationDataError extends Error {
  constructor(message = 'This GPX file has no elevation data, so a prediction cannot be made.') {
    super(message);
    this.name = 'NoElevationDataError';
  }
}

const EARTH_RADIUS_M = 6371000;

function haversineMeters(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** Parses GPX track XML into cumulative-distance/elevation points, using
 * the browser's native DOMParser (no external GPX library) and a haversine
 * great-circle distance between consecutive trackpoints. Rejects malformed
 * XML/GPX and tracks that carry no elevation data at all — those cases
 * must surface as an explicit error, never silently fall back to flat. */
export function parseGpx(xmlText: string): TrackPoint[] {
  const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new InvalidGpxError();
  }

  const trkpts = Array.from(doc.getElementsByTagName('trkpt'));
  if (trkpts.length === 0) throw new InvalidGpxError();

  const raw = trkpts.map((pt) => {
    const lat = Number.parseFloat(pt.getAttribute('lat') ?? '');
    const lon = Number.parseFloat(pt.getAttribute('lon') ?? '');
    const eleText = pt.getElementsByTagName('ele')[0]?.textContent;
    const elevationM = eleText != null ? Number.parseFloat(eleText) : NaN;
    return { lat, lon, elevationM };
  });

  if (raw.some((p) => Number.isNaN(p.lat) || Number.isNaN(p.lon))) throw new InvalidGpxError();

  const firstKnownElevation = raw.find((p) => !Number.isNaN(p.elevationM))?.elevationM;
  if (firstKnownElevation == null) throw new NoElevationDataError();

  let cumulativeM = 0;
  let lastElevation = firstKnownElevation;
  const points: TrackPoint[] = [];
  for (let i = 0; i < raw.length; i++) {
    if (i > 0) cumulativeM += haversineMeters(raw[i - 1], raw[i]);
    const elevationM = Number.isNaN(raw[i].elevationM) ? lastElevation : raw[i].elevationM;
    lastElevation = elevationM;
    points.push({ distanceM: cumulativeM, elevationM });
  }
  return points;
}
