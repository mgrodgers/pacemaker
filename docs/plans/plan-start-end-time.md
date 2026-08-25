# Plan: per-plan start/end time calculator (issue #25)

## Context

Feedback via the in-app feedback form: *"A simple time calculation could be
helpful. If a start time is entered the end time of the run could be
calculated, or vice versa"* (GitHub issue [#25](https://github.com/mgrodgers/pacemaker/issues/25)).
Triaged `ready-for-agent`, then design-grilled to a shared spec (full
question/answer trail on the issue's own thread). Nothing like this exists
today — `Plan` has no time-of-day concept, only durations/distances/paces.

## Design

- **Persisted per plan**: `Plan` gains `time: { side: 'start' | 'end'; value: ClockTime } | null`. `LocalStoragePlanRepository` just `JSON.stringify`s the plan array directly, so this optional field needs no migration for existing saved plans.
- **New `ClockTime` value object** (`src/domain/valueObjects/ClockTime.ts`), alongside `Duration`/`Distance`/`Pace`: parses/formats `HH:MM`, adds/subtracts a `Duration` (with day-rollover), rounds to the nearest minute.
- **Anchor/derive model mirrors `FieldMode`** (`src/domain/valueObjects/FieldMode.ts`): one literal value + which side is the anchor. The other side is always freshly recomputed from the plan's current total on every `getPlan` read — never independently stored. This is why editing a segment after a time is set updates the *derived* side live while the anchor stays fixed (scenarios 4–5 below).
- **Both fields always editable.** Native `<input type="time">`, minute granularity. Whichever side the user edits last becomes the new anchor (no separate mode toggle, unlike segment `FieldMode` — this is a simpler 2-field calculator). A blank field has the same effect as an explicit clear.
- **Visibility**: control renders near the plan header, not inside `TotalsBar` (that's a read-only stats strip; this needs actual inputs). Hidden when total time is `0`, but the stored anchor is *not* cleared when hidden — it reappears unchanged if segments come back (scenarios 8–9).
- **Midnight rollover**: the derived side carries a `dayOffset` (`0` for the anchor, `±N` for the derived side, supporting runs over 24h) so the UI can render "+1d"/"−1d" without needing to separately know which side is the anchor.
- **`duplicatePlan` resets the anchor** on the copy — a duplicate is a different run, a stale wall-clock time would mislead more than help.
- **Port**: `PlanningService.setPlanTime(planId, side: 'start' | 'end', raw: string): void` / `clearPlanTime(planId): void` — one method keyed by side rather than two separate setters, since "side" is the actual domain concept.
- **DTO**: `PlanDetail.time: { start: { value: string; dayOffset: number }; end: { value: string; dayOffset: number } } | null`. No `FieldView` wrapper — its `editable` flag would be dead weight since both sides are always editable here.

## Layer-1 acceptance scenarios

New file: `tests/acceptance/plan-time.test.ts`, same shape as the existing suites (`describe` block, `InProcessPlannerDriver`, per `tests/acceptance/plan-lifecycle.test.ts`).

1. **Setting a start time calculates the end time from the plan's total.**
2. **Setting an end time calculates the start time from the plan's total** (the reverse direction — confirms symmetry).
3. **Setting the end time after the start time was already set makes end the new anchor**, and start becomes the derived value.
4. **Editing a segment after a start time is set updates the derived end time**, without disturbing the anchored start.
5. **Editing a segment after an end time is set updates the derived start time**, without disturbing the anchored end (opposite anchor — confirms symmetry).
6. **Explicitly clearing the plan's time removes both the start and end display.**
7. **Blanking the anchor field has the same effect as an explicit clear.**
8. **A plan with no timed segments has no start/end time to display**, even if one was set earlier and the plan's segments were since removed.
9. **Re-adding segments that restore a plan's total brings back the previously set start/end time unchanged.**
10. **A start time late at night, with a run long enough to cross midnight, shows the end time with a "+1 day" indicator.**
11. **An end time early in the morning, anchored on end, with a run long enough that the derived start falls on the previous day, shows the start time with a "-1 day" indicator** (confirms `dayOffset` can go negative).
12. **A plan's total with seconds (e.g. 45:33) still produces a start/end time rounded to the nearest minute.**
13. **Duplicating a plan does not carry over its start/end time to the copy.**
14. **Renaming a plan keeps its start/end time**, mirroring the existing "renaming a plan keeps its segments" scenario — confirms `renamePlan` doesn't disturb unrelated plan fields.

## File list

- `src/domain/valueObjects/ClockTime.ts` (new) — parse/format `HH:MM`, add/subtract `Duration` with day-rollover, round to nearest minute.
- `tests/unit/domain/ClockTime.test.ts` (new).
- `src/domain/entities/Plan.ts` — add optional `time` field.
- `src/application/ports/in/PlanningService.ts` — add `setPlanTime`, `clearPlanTime`.
- `src/application/PlanningServiceImpl.ts` — implement both; reset `time` in `duplicatePlan`.
- `src/application/dto/PlanViews.ts` — add `PlanDetail.time`.
- `src/application/dto/PlanViewMapper.ts` — derive the non-anchor side + `dayOffset` from the current total on every map; hide `time` entirely when total is `0`.
- `tests/unit/adapters/persistence/PlanRepository.contract.ts` — extend to round-trip `Plan.time` through both `LocalStoragePlanRepository` and `InMemoryPlanRepository`.
- `tests/drivers/PlannerDriver.ts` — add `setStartTime`, `setEndTime`, `clearTime`, `planTime()`, implemented by both `InProcessPlannerDriver` and `UiPlannerDriver`.
- `tests/dsl/PlannerDsl.ts` — corresponding fluent `PlanBuilder` methods, following the existing `setUnits`/`totals()` pattern.
- `src/adapters/driving/ui/components/PlanTimeControl.tsx` (new) — the two `<input type="time">` fields + clear affordance, rendered near the plan header.
- `tests/unit/ui/` — wiring-only smoke test for the new control.
- `e2e/critical-path.spec.ts` — one happy-path addition once the UI driver plumbing lands (Layer 4).

## Sequenced TDD slices (red → green → commit, each leaves typecheck/test/build green)

1. `ClockTime` unit tests: parse/format, add/subtract `Duration`, day-rollover, minute rounding.
2. Scenario 1 (start → derived end) — `Plan.time`, `setPlanTime`, `PlanViewMapper`, `InProcessPlannerDriver`/DSL plumbing for `setStartTime`/`planTime()`.
3. Scenario 2 (end → derived start) — `setEndTime` plumbing.
4. Scenario 3 (anchor switch).
5. Scenarios 4–5 (derive-fresh-on-edit, both directions).
6. Scenario 6 (explicit clear) — `clearPlanTime`, `clearTime` plumbing.
7. Scenario 7 (blank = clear).
8. Scenarios 8–9 (hide at zero total, anchor persists underneath).
9. Scenarios 10–11 (day rollover, both directions).
10. Scenario 12 (seconds rounding).
11. Scenario 13 (duplicate resets).
12. Scenario 14 (rename preserves).
13. `PlanRepository.contract.ts` extension (persistence round-trip).
14. `PlanTimeControl.tsx` + UI wiring test + `UiPlannerDriver` implementation.
15. `e2e/critical-path.spec.ts` happy-path addition.

## Verification

- `npm run test` after each slice.
- `npm run typecheck` — confirms the new shapes thread consistently across domain → application → DTO → UI.
- `npm run test:e2e` for the final slice, both Chromium and WebKit projects.
