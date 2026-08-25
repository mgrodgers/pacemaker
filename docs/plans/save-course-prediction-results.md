# Plan: Save course prediction results

Fixes #20 — "Save the results of the track prediction somehow."

## Scope decision

`CoursePredictionService` currently returns a `CoursePredictionResult` (total time +
per-km splits) that only lives in the `CoursePredictorScreen` component's local state —
reload the page or navigate away and it's gone. Simplest, most consistent scope: persist
each prediction the same way plans are persisted, as a new entity type owned by a new
`CoursePredictionRepository` port, and show a "Saved predictions" list on the Course
Predictor screen (most recent first) that a user can reopen or delete. No export/sharing
in this pass — that's a separate feature if requested later.

## Acceptance scenarios (Layer 1)

1. **Predicting a course and saving it makes it appear in the saved list.**
   Touches: `CoursePredictionService.save`, new `CoursePredictionRepository` port,
   `CoursePredictorScreen`.

2. **A saved prediction records the source file name, target pace, total time, and the
   date it was saved.** Touches: new `SavedCoursePrediction` entity/DTO shape.

3. **Reopening a saved prediction from the list shows the same total time and splits
   without re-uploading the GPX file or re-entering pace.** Touches:
   `CoursePredictionService.getSaved`, `CoursePredictorScreen`.

4. **Deleting a saved prediction removes it from the list and it does not reappear after
   reload.** Touches: `CoursePredictionService.delete`, `LocalStoragePlanRepository`-style
   persistence adapter for predictions.

5. **Saved predictions persist across a page reload (localStorage-backed), matching how
   plans already persist.** Touches: new `LocalStorageCoursePredictionRepository`, plus
   the shared repository contract test (`PlanRepository.contract.ts`-style) run against
   it.

6. **Predicting the same course twice with different paces saves two distinct entries,
   not an overwrite.** Touches: `CoursePredictionService.save`, id generation
   (`IdGenerator` port, already exists).

## Pieces expected to change

- `src/domain/entities/` — new `SavedCoursePrediction` (or extend an existing entity if a
  lighter shape fits — decide during implementation, not in this plan).
- `src/application/ports/out/CoursePredictionRepository.ts` — new secondary port
  (save/getAll/getById/delete), mirroring `PlanRepository`.
- `src/application/ports/in/CoursePredictionService.ts` — extend with `save`, `getSaved`,
  `delete`.
- `src/application/CoursePredictionServiceImpl.ts` — wire the new port.
- `src/adapters/driven/persistence/` — new `LocalStorageCoursePredictionRepository` +
  `InMemoryCoursePredictionRepository` test double.
- `src/composition/container.ts` — register the new repository.
- `src/adapters/driving/ui/components/CoursePredictorScreen.tsx` — "Save" button on a
  result, and a saved-predictions list section.
- `src/adapters/driving/ui/hooks/useCoursePredictorController.ts` — expose save/list/delete
  actions.
- Supporting unit tests: repository contract, `CoursePredictionServiceImpl`, component
  smoke test for the new list/save/delete UI.

## Open question for review

Is localStorage-only persistence acceptable here, or does "save" imply something that
should survive clearing browser data (e.g. eventually synced via a future backend
adapter)? Given the existing `PlanRepository` is also localStorage-only today, this plan
assumes parity is fine unless told otherwise.
