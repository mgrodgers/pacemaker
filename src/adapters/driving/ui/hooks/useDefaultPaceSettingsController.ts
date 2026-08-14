import { useCallback, useState } from 'react';
import { usePlanningService } from './usePlanningService';
import type { SegmentType } from '../../../../domain/valueObjects/SegmentType';
import type { Units } from '../../../../domain/valueObjects/Units';

/** Drives the default-pace settings screen. Same revision-bump pattern as
 * usePlansController, scoped globally rather than to one plan id. */
export function useDefaultPaceSettingsController() {
  const service = usePlanningService();
  const [, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((r) => r + 1), []);

  const run = useCallback(
    <Args extends unknown[], R>(fn: (...args: Args) => R) =>
      (...args: Args): R => {
        const result = fn(...args);
        refresh();
        return result;
      },
    [refresh]
  );

  return {
    paceDefaults: service.getPaceDefaults(),
    setUnits: run((units: Units) => service.setPaceDefaultsUnits(units)),
    setPaceDefault: run((type: SegmentType, raw: string) => service.setPaceDefault(type, raw)),
  };
}
