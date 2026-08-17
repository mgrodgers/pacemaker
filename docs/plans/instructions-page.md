# Plan: Instructions page

Fixes #21 — "The app looks pretty but I don't really know what to do with it. Are there
instructions somewhere?" Follow-up comment: "A basic instruction page ... would suffice.
Something to show what the different areas are and how to add info."

## Scope decision

This is UI-only: a written walkthrough of the app's areas, no domain rules, no persisted
state. It mirrors the existing feedback feature exactly — `FeedbackButton` (fixed floating
icon button, owns its own open/closed state) opening `FeedbackModal` (overlay/card/dialog),
wired into `App.tsx`. An `InstructionsButton`/`InstructionsModal` pair follows the same
shape, positioned bottom-left so it doesn't collide with the feedback button (bottom-right).

Real screenshots aren't producible in this pass, so content is text-only, using the app's
own terminology so it can't drift out of sync with the UI the way a screenshot would.

Because there's no domain vocabulary to write a Layer-1 acceptance scenario against (same
as the feedback feature, which has no acceptance test), this plan lists component-level
scenarios instead — the precedent set by `tests/unit/ui/FeedbackButton.test.tsx` /
`FeedbackModal.test.tsx` plus `e2e/feedback.spec.ts`.

## Scenarios

1. **Clicking the instructions button opens the instructions page; clicking Close
   dismisses it.** Touches: new `InstructionsButton.tsx`, `InstructionsModal.tsx`.

2. **The instructions page shows a section for each main area of the app** — Your plans,
   Building a plan, Totals & Results, Course Predictor, Default paces — each describing
   what it's for and how to use it, in the app's own terminology (segment types, the
   time/distance/pace triad, Builder/Results toggle, etc.). Touches: `InstructionsModal.tsx`
   content.

3. **(e2e) A user can open the app, tap the instructions button, see the walkthrough, and
   close it.** Touches: new `e2e/instructions.spec.ts`, `App.tsx` wiring.

## Pieces expected to change

- `src/adapters/driving/ui/components/InstructionsButton.tsx` — new, mirrors
  `FeedbackButton.tsx`; `data-testid="instructions-button"`, positioned bottom-left.
- `src/adapters/driving/ui/components/InstructionsModal.tsx` — new, mirrors
  `FeedbackModal.tsx`'s dialog shell (no form/submit); `data-testid="instructions-modal"`.
- `src/adapters/driving/ui/components/icons.tsx` — new `HelpIcon`, same stroke-path SVG
  style as the existing icons.
- `src/adapters/driving/ui/App.tsx` — render `<InstructionsButton />` alongside
  `<FeedbackButton />`.
- `tests/unit/ui/InstructionsButton.test.tsx`, `InstructionsModal.test.tsx` — component
  smoke tests, same shape as the feedback component tests.
- `e2e/instructions.spec.ts` — one happy-path scenario, no network mocking needed (unlike
  `feedback.spec.ts`, there's no API call).

## Out of scope

- No domain/application/persistence changes.
- No real screenshots/images — text walkthrough only.
- No first-run auto-open / "don't show again" — button is always available, same as
  feedback.
