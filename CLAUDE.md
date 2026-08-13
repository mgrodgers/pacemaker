# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install              # install dependencies
npm run dev               # Vite dev server (http://localhost:5173)
npm run typecheck         # tsc -b --noEmit across app + tests + config
npm run test               # Vitest: all unit + acceptance suites, single run
npm run test:watch         # Vitest in watch mode
npm run test:e2e           # Playwright critical-path suite (builds + serves dist/, runs on Chromium + WebKit)
npm run build               # tsc -b && vite build -> dist/ (installable PWA)
npm run preview             # serve the production build (http://localhost:4173)
```

Running a single test:
```bash
npx vitest run tests/unit/domain/BestEffortFinder.test.ts   # one Vitest file
npx vitest run -t "best 5k effort"                           # by test name, any file
npx playwright test e2e/critical-path.spec.ts --project=desktop-chromium   # one e2e file/project
```

## Architecture

This is a hexagonal/DDD port of a Claude Design prototype (a run/workout planner: build a plan out of warmup/easy/tempo/interval/rest/cooldown segments, where any two of time/distance/pace determine the third, then see totals and best-potential-effort times at standard race distances). The layering exists specifically so a backend can be added later as a new adapter, not a rewrite — keep that boundary intact when making changes.

- **`src/domain/`** — pure TypeScript, zero framework/IO dependencies. `valueObjects/` (`Duration`, `Distance`, `Pace`, `FieldMode`, `SegmentType`, branded `Ids`), `entities/` (`Plan`, `Segment`, `Step` — plain readonly interfaces, not classes), `services/` (`SegmentCalculator.computeDerived` — the time/distance/pace derivation rule; `PlanProfileBuilder` — expands segments/reps/rest into a flat timed profile; `BestEffortFinder.bestWindow` — the sliding-window best-effort algorithm; `PlanSummaryCalculator` composes the two). All of this is unit-tested directly and never imports anything outside `domain/`.
- **`src/application/`** — `ports/in/PlanningService.ts` is the *one* interface every driving adapter (UI, tests) calls; nothing outside `application/` talks to the domain or a repository directly. `PlanningServiceImpl.ts` is the only place use-cases live — it loads a `Plan` from the `PlanRepository` port, applies a domain operation, saves it back. `ports/out/` (`PlanRepository`, `IdGenerator`) are the secondary ports. `dto/PlanViewMapper.ts` turns domain `Plan`/`Segment`/`Step` into the read-model DTOs in `dto/PlanViews.ts` (formatted strings in the plan's *own* units, plus `editable` flags per field) — this is where unit conversion and "which field is derived" logic for display lives, not in the UI.
- **`src/adapters/driven/persistence/`** — `LocalStoragePlanRepository` (production) and `InMemoryPlanRepository` (test double, also backs `InProcessPlannerDriver`). Both must satisfy the shared contract in `tests/unit/adapters/persistence/PlanRepository.contract.ts`. A future backend (e.g. Supabase) is a third implementation of `PlanRepository`, registered in `composition/container.ts` — no other layer changes.
- **`src/adapters/driving/ui/`** — React components are thin: they call `PlanningService` (never the domain or a repository) via `usePlanController`/`usePlansController`, which use a "command, then bump a revision counter" pattern to force a re-render rather than any external state library — reads (`getPlan`, `getTotals`, `getBestEfforts`) are re-fetched fresh on every render. Segment reordering uses `@dnd-kit` (not native HTML5 drag-and-drop, which doesn't work reliably on touch phones — the primary target device). `FieldTriad.tsx` is the shared Time+Pace/Dist+Pace/Time+Dist control used for a segment's own fields, its rest fields, and each interval step's fields; it keeps a local per-field typing draft so a value like `"12:0"` isn't reformatted out from under the cursor mid-keystroke.
- **`src/composition/container.ts`** — the only place concrete adapters are constructed and wired to `PlanningServiceImpl`. Adding a backend means adding a `PlanRepository` implementation here.
- **`src/styles/tokens.css`** — the ported "Nocturne" design system (CSS custom properties + component classes: `.btn`, `.card`, `.seg`/`.seg-opt`, `.input`/`.field`, `.tag`, `.nav`, `.table`). The Inter font is self-hosted (`src/styles/fonts/`) rather than loaded from Google Fonts, so the PWA app shell works offline. `.input` font-size must stay at 16px or larger — iOS Safari auto-zooms the viewport on focus below that.

### Testing: Dave Farley's 4-layer model

- **Layer 1 (`tests/acceptance/*.test.ts`)** — business rules in domain vocabulary only (plan names, segment specs, totals, best efforts), written as coded TypeScript against the DSL, run via Vitest.
- **Layer 2 (`tests/dsl/PlannerDsl.ts`)** — the fluent vocabulary (`dsl.onPlan(name).addTempo({...}).totals()`). Mutating calls queue onto an internal promise chain and return `this` synchronously so chaining still reads naturally even though the UI driver's steps are genuinely async; read calls (`totals()`, `bestEffort()`, `segmentSummaries()`) await that queue first.
- **Layer 3 (`tests/drivers/`)** — `PlannerDriver.ts` is the shared interface. `InProcessPlannerDriver` calls `PlanningService` directly against an `InMemoryPlanRepository` (sub-millisecond, carries the bulk of acceptance coverage). `UiPlannerDriver` drives the real rendered app via Playwright, touching only visible affordances (button text, `data-testid`s on structural elements like `segment-card`/`step-editor`/`totals-bar`, accessible labels) — never internal ids. The *same* `tests/acceptance/*.test.ts` files can run against either driver.
- **Layer 4** — the SUT: in-process (`PlanningServiceImpl` + `InMemoryPlanRepository`) or a real browser against a built app (`e2e/critical-path.spec.ts`, one happy-path test per feature area plus a mobile-viewport drag-reorder test, run via `npm run test:e2e`).
- Underneath that: `tests/unit/domain/**` (pure algorithm edge cases, e.g. `BestEffortFinder`), `tests/unit/application/**` (`PlanningServiceImpl` against a fake repository), `tests/unit/adapters/persistence/**` (the repository contract run against every implementation), `tests/unit/ui/**` (React Testing Library component smoke tests — wiring only, not business rules).

## Development workflow

All development in this repo — features, fixes, refactors — follows strict TDD. No production code without a failing test driving it first.

1. **New branch**, off `main`.
2. **Plan.** Enter plan mode. The deliverable is a list of Layer-1 acceptance scenarios in the same style as the existing `tests/acceptance/*.test.ts` files — short, domain-vocabulary scenario descriptions (e.g. *"a plan shorter than 1km reports no best efforts"*, *"rest between reps adds time but not distance"*), not test code yet. Note which domain/application/adapter pieces each scenario is expected to touch. This list is what gets reviewed, not an implementation sketch.
3. **Push the plan.** Exit plan mode and write the plan to a file, commit and create a PR. 
3. **Wait for plan approval** before writing any code.
4. **Implement in strict TDD cycles: red → green → commit, repeated per scenario.** For each acceptance scenario from the plan (dropping to domain/application/adapter/component unit tests for any supporting logic underneath it): write one failing test, write the minimum code to pass it, commit that slice. A feature lands as a sequence of small, individually-green commits — never one commit at the end covering the whole feature. Each commit message names the single behavior it made pass.
5. **PR when the feature is complete.** Push the branch and open a PR (`gh pr create`, or if `gh` isn't available, use the compare URL `git push` prints).
