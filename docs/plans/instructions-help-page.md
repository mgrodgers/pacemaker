# Plan: instructions / help page

Fixes #21 — "The app looks pretty but I don't really know what to do with it. Are there
instructions somewhere?" Reporter clarified: a basic instructions page with a few
screenshots showing the different areas and how to add info would suffice.

## Scope decision

This is a pure UI addition — no domain or application logic. A new `HelpScreen`,
reachable from the plans list (alongside the existing settings/course-predictor icons in
`PlansScreen`), added as a new `view` case in `App.tsx` the same way `course-predictor`
and `settings` already are.

"Screenshots" will be simple inline SVG/illustrative diagrams built in the same style as
the existing icon set, not literal captured screenshots — real screenshots baked into the
repo as image assets go stale the moment the UI changes and bloat the PWA bundle; a
lightweight diagram of "here's the plans list, here's a segment card, here's the totals
bar" stays accurate and is trivial to keep in sync. If the reporter specifically wants
real captured screenshots instead, that's a follow-up, not a blocker for this plan.

Content covers: the plans list (create/open/duplicate/delete a plan), the plan editor
(add a segment, edit its fields via the time/pace/distance triad, reorder by drag), the
totals bar and best-effort predictions, and the course predictor (upload a GPX, get a
predicted time). Settings itself doesn't need documenting — it's self-explanatory once
opened.

## Acceptance scenarios (Layer 1)

Layer 1 acceptance tests speak in domain vocabulary (plans, segments, totals) — this
feature is static content navigation, so its coverage sits at Layer 3/4 (a UI smoke test
plus one e2e happy path) rather than as `tests/acceptance/*.test.ts` scenarios. Noting
that here since it's a deviation from the usual plan shape, and listing the behaviors as
scenarios anyway for review:

1. **A help affordance is visible from the plans list and opens the instructions page.**
   Touches: `PlansScreen.tsx` (new icon/button), `App.tsx` (new `'help'` view).

2. **The instructions page explains, in order, how to create a plan, add a segment, edit
   a segment's fields, reorder segments, read the totals/best-effort summary, and use the
   course predictor.** Touches: new `HelpScreen.tsx` content sections.

3. **The instructions page has a back control that returns to wherever it was opened
   from (plans list).** Touches: `HelpScreen.tsx` (`onBack` prop, same pattern as
   `SettingsScreen`/`CoursePredictorScreen`).

4. **The instructions page is reachable and legible on a mobile viewport** (this is the
   primary target device per `tokens.css` guidance). Touches: `HelpScreen.tsx` styling,
   e2e mobile-viewport check.

## Pieces expected to change

- `src/adapters/driving/ui/components/HelpScreen.tsx` — new component, same shape as
  `SettingsScreen`/`CoursePredictorScreen` (nav header with back button + brand, content
  body).
- `src/adapters/driving/ui/components/icons.tsx` — new `HelpIcon` (question mark / book
  glyph) for the entry point.
- `src/adapters/driving/ui/components/PlansScreen.tsx` — add the help icon button next to
  the existing settings/course-predictor icons, with an `onOpenHelp` prop.
- `src/adapters/driving/ui/App.tsx` — add `'help'` to the `View` union and render
  `HelpScreen` for it.
- `tests/unit/ui/` — smoke test asserting the help entry point renders and navigates.
- `e2e/critical-path.spec.ts` — one happy-path scenario: open help from the plans list,
  see the content, go back.

## Open question for review

Confirming the "simple diagrams instead of real screenshots" call above — say so if you'd
rather this ship with actual captured app screenshots instead.
