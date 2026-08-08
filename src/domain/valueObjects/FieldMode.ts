export type FieldMode = 'time-pace' | 'distance-pace' | 'time-distance';

export type SegmentField = 'time' | 'distance' | 'pace';

const EDITABLE_FIELDS: Readonly<Record<FieldMode, ReadonlySet<SegmentField>>> = {
  'time-pace': new Set(['time', 'pace']),
  'distance-pace': new Set(['distance', 'pace']),
  'time-distance': new Set(['time', 'distance']),
};

/** The mode picks which two of {time, distance, pace} are user-editable;
 * the third is always derived. */
export function isFieldEditable(mode: FieldMode, field: SegmentField): boolean {
  return EDITABLE_FIELDS[mode].has(field);
}
