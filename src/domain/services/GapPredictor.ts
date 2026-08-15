import type { Grade } from '../valueObjects/Grade';

const FLAT_COST = 3.6;

/** Metabolic cost of running (J/kg/m) at a given grade, per Minetti's
 * polynomial fit (Minetti et al. 2002). Rises for uphill grades, falls for
 * moderate downhill grades, then rises again beyond roughly -20% as braking
 * cost dominates the energy saved from descending. */
export function metabolicCost(grade: Grade): number {
  const i = grade.decimal;
  return (
    155.4 * i ** 5 - 30.4 * i ** 4 - 43.3 * i ** 3 + 46.3 * i ** 2 + 19.5 * i + FLAT_COST
  );
}

/** Inverts Grade Adjusted Pace: given a target flat-equivalent pace and a
 * grade, returns the actual pace (sec/km) that would cost the same effort
 * on that grade. */
export function actualPaceSecPerKm(targetFlatPaceSecPerKm: number, grade: Grade): number {
  return targetFlatPaceSecPerKm * (metabolicCost(grade) / FLAT_COST);
}
