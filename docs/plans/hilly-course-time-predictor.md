# Hilly Course Time Predictor — Acceptance Plan

## Context

Runners often want to know how a target flat-pace effort translates to a real, hilly course. The existing app models workout *plans* (segments with time/distance/pace), but has no concept of terrain or grade-adjusted effort. This feature adds a standalone tool: upload a GPX file, enter a target flat-equivalent pace, and get a predicted total time plus per-km splits for running that course at equivalent effort — using the Minetti metabolic-cost polynomial (GAP) run in reverse per segment.

Full requirements were settled via a grilling session (see conversation): standalone feature (not attached to `Plan`), GPX upload via file picker + drag-drop from day one (native `DOMParser`, no new npm dependency), 50m fixed-distance elevation resampling, pure Minetti inversion only (no eccentric-downhill discount in V1), manual pace entry only, reuse existing units system, explicit errors for invalid/elevation-less GPX, total + per-km table output (no chart), no persistence, no file-size cap.

This plan lists the Layer-1 acceptance scenarios to be reviewed/approved before any implementation, per this repo's TDD workflow. It does not include test code or an implementation sketch.

## Scope note

This is genuinely greenfield (confirmed via exploration): no GPX/geo dependencies, no course/route/elevation/grade domain concepts, and no file-upload UI exist anywhere in the codebase today.

## Expected architecture touch points (for context, not a commitment)

- **`src/domain/valueObjects/Grade.ts`** (new) — grade as a decimal, following the `Pace`/`Duration` immutable-class-with-static-factory pattern.
- **`src/domain/services/GapPredictor.ts`** (new) — pure functions: cost(grade) via Minetti polynomial, and the inversion `actualPace(targetFlatPace, grade)`; plus a function that walks a resampled elevation profile and produces per-km splits + total time. Follows `SegmentCalculator.ts`/`BestEffortFinder.ts` conventions (plain functions, typed interfaces, no I/O).
- **`src/domain/services/ElevationResampler.ts`** (new, or folded into an adapter) — buckets raw `{distanceM, elevationM}` points into fixed 50m intervals and computes grade between buckets. Pure, so it belongs in `domain/`, taking already-parsed points (not raw GPX/XML) as input, keeping GPX/XML parsing itself in the adapter layer.
- **`src/adapters/driven/gpx/GpxParser.ts`** (new) — adapter using native `DOMParser` to turn raw GPX XML into `{distanceM, elevationM}[]` points; owns "invalid GPX" and "no elevation data" error cases.
- **`src/application/ports/in/PlanningService.ts` or a new sibling port** — likely a new port (e.g. `CoursePredictionService`) rather than extending `PlanningService`, since this is explicitly not plan-related; exposes something like `predictCourseTime(gpxContent, targetPace, units)`.
- **`src/adapters/driving/ui/components/CoursePredictorScreen.tsx`** (new) + **`hooks/useCoursePredictorController.ts`** (new) — new top-level nav screen with file drop-zone/picker, pace input, and a results table, following the existing screen/controller-hook pairing.
- **`tests/dsl/PlannerDsl.ts`** — likely needs a parallel/sibling DSL (or an extension) speaking in course/GPX/prediction vocabulary, since the existing DSL is scoped to plans/segments.

Exact file boundaries (e.g. whether resampling is its own file or part of `GapPredictor`) are implementation-time decisions, not part of this plan.

## Layer-1 Acceptance Scenarios

### Core GAP math (grade → equivalent pace)
1. *a flat course (0% grade throughout) predicts the same total time as the target flat pace times the course distance*
2. *a sustained uphill grade predicts a slower actual pace than the target flat pace for that segment*
3. *a moderate sustained downhill grade predicts a faster actual pace than the target flat pace for that segment*
4. *a very steep downhill grade (beyond Minetti's economy-minimum point) predicts actual pace slowing back down rather than continuing to speed up*
5. *a course with equal uphill and downhill sections of the same grade magnitude does not net to the flat-pace time — the uphill penalty exceeds the downhill benefit*

### Elevation resampling
6. *a GPX track with noisy point-to-point elevation still produces a stable, non-jittery predicted pace per kilometer*
7. *a GPX track with unevenly spaced points is resampled into consistent fixed-distance intervals before grade is computed*

### Whole-course prediction & splits
8. *a hilly GPX course produces a single total predicted time*
9. *a hilly GPX course produces a per-kilometer split table showing grade and predicted pace for each kilometer*
10. *the sum of per-kilometer split times equals the reported total predicted time*
11. *the predicted time and splits are displayed in the user's currently selected units (km or miles)*

### Input handling / errors
12. *uploading a file that is not valid GPX shows a clear error and produces no prediction*
13. *uploading valid GPX with no elevation data anywhere in the track shows a clear error rather than silently predicting a flat-course time*
14. *a course can be uploaded via the file picker*
15. *a course can be uploaded via drag-and-drop*
16. *entering an invalid or empty target pace prevents prediction and shows a clear error*

### Ephemeral behavior
17. *navigating away from and back to the course predictor screen does not preserve a previous upload or result* (confirms no persistence, per V1 scope)

## Verification

Once implemented (per the repo's red→green→commit TDD cycle, one scenario at a time):
- `npm run test` — new scenarios run as Layer-1 acceptance tests via `InProcessPlannerDriver`-equivalent (likely a new in-process driver for course prediction), plus supporting unit tests for `GapPredictor`/`ElevationResampler`/`GpxParser` under `tests/unit/domain/` and `tests/unit/adapters/`.
- `npm run typecheck`
- `npm run test:e2e` — one new happy-path scenario added to `e2e/critical-path.spec.ts` (upload a fixture GPX, enter a pace, see a predicted time), per the existing "one happy path per feature area" convention.
- Manual check in the dev server (`npm run dev`): upload a real GPX file (e.g. exported from Strava/Garmin) and sanity-check the predicted time against known GAP calculators.
