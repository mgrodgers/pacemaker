# Run Planner

A run/workout planner: build a plan out of warmup, easy, tempo, interval, rest,
and cooldown segments (any two of time/distance/pace determine the third),
then see total distance/time/pace and your best potential effort at standard
race distances.

Built as a hexagonal/DDD app — see [`src/domain`](src/domain),
[`src/application`](src/application), [`src/adapters`](src/adapters),
[`src/composition`](src/composition) — with a Dave Farley–style 4-layer test
suite under [`tests/`](tests) and [`e2e/`](e2e).

## Prerequisites

- Node.js 18+ and npm

## Setup

```bash
npm install
```

## Run it locally

```bash
npm run dev
```

Starts the Vite dev server (default [http://localhost:5173](http://localhost:5173)) with hot reload.

## Run the tests

```bash
npm run test
```

Runs every Vitest suite: domain unit tests, application use-case tests,
`PlanRepository` adapter contract tests, the Layer-1 acceptance suite
(against the in-process driver), and component smoke tests.

```bash
npm run test:e2e
```

Runs the Playwright critical-path suite against the real rendered app (in
Chromium and WebKit), building and serving a production bundle automatically.

```bash
npm run typecheck
```

Type-checks the whole project (app, tests, and config) without emitting.

## Build for production

```bash
npm run build
npm run preview
```

`build` produces a static, installable PWA in `dist/`; `preview` serves that
build locally (default [http://localhost:4173](http://localhost:4173)) so you can sanity-check the production
bundle before deploying.
