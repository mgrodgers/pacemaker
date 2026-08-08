import type { FieldMode } from './FieldMode';

export type SegmentType = 'warmup' | 'easy' | 'tempo' | 'interval' | 'rest' | 'cooldown';

export const SEGMENT_TYPES: readonly SegmentType[] = [
  'warmup',
  'easy',
  'tempo',
  'interval',
  'rest',
  'cooldown',
];

export interface SegmentTypeMeta {
  readonly label: string;
  readonly tag: string;
  readonly defaultMode: FieldMode;
}

export const SEGMENT_TYPE_META: Readonly<Record<SegmentType, SegmentTypeMeta>> = {
  warmup: { label: 'Warmup', tag: 'tag-neutral', defaultMode: 'time-pace' },
  tempo: { label: 'Tempo', tag: 'tag-accent', defaultMode: 'distance-pace' },
  interval: { label: 'Interval', tag: 'tag-accent', defaultMode: 'distance-pace' },
  rest: { label: 'Rest', tag: 'tag-outline', defaultMode: 'time-distance' },
  cooldown: { label: 'Cooldown', tag: 'tag-neutral', defaultMode: 'time-pace' },
  easy: { label: 'Easy', tag: 'tag-outline', defaultMode: 'distance-pace' },
};
