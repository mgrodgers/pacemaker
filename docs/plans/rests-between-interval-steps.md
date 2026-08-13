# Plan: Rests between interval steps (GitHub issue #2)

## Context

Interval segments already support a rest *between reps* — a single rest block on the segment that repeats between full passes through the step ladder. Issue #2 asks for rests *between the individual steps within one rep* too (e.g. 400m fast, rest, 400m fast, rest, 400m fast) — the ladder currently has no way to express that.

Approach (agreed with the user): rest becomes a **kind of step**. A step is either `work` or `rest`; the ladder editor gets a second "+ Add rest" button next to "+ Add step," so a rest is just another entry in the ladder, built with the same per-step editing UI already used for work steps.

Per this repo's TDD workflow, this plan is a list of Layer-1 acceptance scenarios, not an implementation sketch. Each notes the layers/pieces it's expected to touch. Implementation proceeds one scenario at a time: red → green → commit.

## Acceptance scenarios

1. **A rest placed between two work steps adds its own time to the plan.**
   An interval with steps `[work 0.4km@5:00, rest 1:30, work 0.4km@5:00]` and 1 rep totals `0.4+0.4=0.8km` of distance and `2:00 + 1:30 + 2:00 = 5:30` of time.
   Touches: `domain/entities/Step` (kind field), `domain/services/SegmentCalculator` (per-kind defaults), `domain/services/PlanProfileBuilder` (`expandInstances` flattening), DSL/driver (`IntervalSpec.steps[].kind`).

2. **A rest step fires even when the interval has a single rep.**
   Unlike rest-between-reps (which is skipped whenever `reps === 1`), a rest *step* is part of the ladder itself and always runs — an interval with one rep and one rest step between two work steps still adds the rest's time.
   Touches: `domain/services/PlanProfileBuilder`.

3. **Multiple rests can sit between different steps in the same interval.**
   A ladder like `[work, rest, work, rest, work]` adds every rest's time, in order, once per rep.
   Touches: `domain/services/PlanProfileBuilder`.

4. **A rest step doesn't need a pace to contribute time.**
   A newly-added rest step defaults to a time-based entry (no pace required, distance defaults to zero) — mirroring today's rest-between-reps default — so `+ Add rest` produces something immediately usable without the user having to change modes.
   Touches: `domain/services/SegmentCalculator` (`makeStep` defaults per kind), `application/PlanningServiceImpl` (`addIntervalStep` kind param).

5. **The ladder summary shows a rest entry distinctly from a work step.**
   A segment summary line renders a rest step's contribution as `rest {duration}` rather than the usual `{distance}@{pace}` / `{duration}` format used for work steps.
   Touches: `application/dto/PlanViewMapper` (`summarizeStep`).

6. **Rest steps repeat with the rest of the ladder across reps.**
   An interval with `[work, rest, work]` and `reps: 2` adds the rest's time twice (once per rep), same as any work step in the ladder repeats twice.
   Touches: `domain/services/PlanProfileBuilder`.

7. **(E2E happy path) Adding a rest step through the real UI updates totals correctly.**
   Through the rendered app: add an interval, use "+ Add rest" to append a rest step after the default work step, fill in its time, and confirm the totals bar reflects the added time — one happy-path case alongside the existing interval e2e test.
   Touches: `adapters/driving/ui/components/SegmentCard` (`+ Add rest` button, kind-aware step numbering), `StepEditor` (rest-specific field labels), `PlanCommands`/`usePlanController` (kind param plumbed through), `tests/drivers/UiPlannerDriver`.

## Not in scope

- Reordering existing steps (rests are placed by clicking "+ Add step" / "+ Add rest" in the desired sequence, same append-only model steps already have today).
- Changing an existing step's kind in place after creation (no in-place "toggle to rest" control on `StepEditor`).

## Workflow

1. Branch off `main`.
2. This plan committed to the branch and opened as a PR for review.
3. Wait for approval.
4. Implement scenarios 1–7 in strict TDD order (each its own red → green → commit).
5. PR marked ready / merged once complete.
