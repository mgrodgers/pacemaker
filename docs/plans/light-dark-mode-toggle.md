# Plan: Light/Dark/System appearance toggle (issue #13)

## Context

Feedback filed through the in-app Feedback button (`docs/plans/feedback-github-issue.md`) asked: *"The UI is very dark. how about a toggle to switch from light to dark? Do you have a light mode?"* (GitHub issue [#13](https://github.com/mgrodgers/pacemaker/issues/13)). The app currently ships one hardcoded dark palette in `src/styles/tokens.css` with no light-mode values, no `prefers-color-scheme` handling, and no theme selector anywhere — this is a from-scratch feature.

User-approved scope:
- Three-way choice — **Light / Dark / System** (System follows the OS `prefers-color-scheme`), using the existing `.seg`/`.seg-opt` radiogroup control already used for the km/mi units toggle in `SettingsScreen.tsx`.
- The agent picks reasonable light-mode color values (below, reviewed and approved by the user via rendered swatches before implementation).

## Design

**No application-layer port for this.** Every existing persistence adapter in this codebase (`LocalStoragePlanRepository`, `LocalStoragePaceDefaultsRepository`) backs a port because it's injected into `PlanningServiceImpl` and needs a fake (`InMemory...`) for the acceptance-test DSL. Theme preference has no service to inject into and nothing plays the `InProcessPlannerDriver` role for it — it's pure UI/display state with zero domain business rules. A port with one real implementation and no fake would be hexagonal purity with no payoff, so this is a plain module (`themePreferenceStorage.ts`, not `...Repository.ts` — that suffix in this codebase means "implements an out-port") consumed directly by a UI hook, tested against real `localStorage` exactly like `SettingsScreen.test.tsx` already does today (`beforeEach(() => window.localStorage.clear())`).

**CSS is fully declarative — no `matchMedia` listener in JS.** "System" means the `data-theme` attribute is **never written at all** (not `data-theme="system"`); the OS-following behavior comes entirely from a `prefers-color-scheme` media query that's live by construction:

```css
:root { /* today's dark values stay the unchanged default/fallback */ }

@media (prefers-color-scheme: light) {
  :root:not([data-theme]) { /* light overrides — System, OS prefers light */ }
}
:root[data-theme="light"] { /* light overrides — explicit Light, any OS setting */ }
/* explicit Dark: data-theme="dark" matches neither block above, falls through to the default :root dark values — no extra block needed */
```

The two override blocks are mutually exclusive by construction (attribute-absence vs. attribute-presence, not value inequality), so there's no ordering/specificity tie to reason about. `useTheme` and the bootstrap script must `removeAttribute('data-theme')` for System, never set it to the literal `"system"`.

One existing bug this surfaces and fixes in the same pass: `--color-divider` is hardcoded to a literal copy of the dark `--color-text` value (`color-mix(in srgb, #e9e9ed 16%, transparent)`) instead of referencing it. Fix to `color-mix(in srgb, var(--color-text) 16%, transparent)` in the base `:root` so it re-derives automatically in both themes — one fewer property to duplicate across the two override blocks.

**Light-mode values** (derived from tokens already in the file, contrast-checked against WCAG AA, approved by the user):

| Token | Dark (existing) | Light (approved) | Why |
|---|---|---|---|
| `--color-bg` | `#161826` | `#f3f5fe` | = `--color-neutral-100` |
| `--color-surface` | `#232532` | `#ffffff` | dark surface is *lighter* than bg (cards pop); nothing in the scale is lighter than neutral-100, so white preserves that relationship |
| `--color-text` | `#e9e9ed` | `#292b31` | = `--color-neutral-900`; ~13:1 contrast on the bg above (AAA) |
| `--color-accent` | `#9184d9` | `#5d5294` | = `--color-accent-700`. The as-is dark accent is only ~3.2:1 on white (fails AA for the small text it's used as in `.card-kicker`/`.tag-outline`/links) — darkened one scale step to ~6.8:1, same hue |
| `--color-accent-2` | `#a7a1db` | `#796cbf` | = `--color-accent-600`; currently unused anywhere in the codebase, kept one step lighter than accent for parity with dark mode |
| shadows | hardcoded dark neutral grays | tied to `--color-text` via `color-mix`, lower opacity | reusing the dark grays on white reads as heavy/muddy; see snippet below |

```css
--shadow-sm: 0 0 0 1px color-mix(in srgb, var(--color-text) 12%, transparent);
--shadow-md: 0 0 0 1px color-mix(in srgb, var(--color-text) 18%, transparent), 0 6px 18px rgba(41, 43, 49, 0.12);
--shadow-lg: 0 0 0 1px color-mix(in srgb, var(--color-text) 24%, transparent), 0 16px 40px rgba(41, 43, 49, 0.16);
```

`--color-neutral-*`/`--color-accent-*` scales and things like `.tag-accent`/`.tag-neutral` (fixed dark-chip-on-light-text pairings) are unchanged — they're self-contained regardless of overall theme.

**No flash of the wrong theme on load.** This is a Vite SPA with no SSR, so applying the theme only via a post-mount `useEffect` would flash the default dark theme for users who picked Light. `index.html` gets a small inline synchronous `<script>` as the first thing in `<head>` (before any stylesheet), reading the same `localStorage` key and setting `data-theme` before first paint. The storage key is necessarily duplicated as a literal in both `index.html` (no build-step touches inline script tags) and `themePreferenceStorage.ts` — same category of accepted duplication as the client/server validation overlap in the feedback plan. Comment both sides pointing at each other.

## File list

- `src/adapters/driven/persistence/themePreferenceStorage.ts` (new) — `ThemePreference = 'light' | 'dark' | 'system'`, `loadTheme()`/`saveTheme()`, `STORAGE_KEY = 'runPlanner.themePreference'`, default `'system'`, try/catch fallback matching `LocalStoragePaceDefaultsRepository`'s style.
- `tests/unit/adapters/persistence/themePreferenceStorage.test.ts` (new)
- `src/adapters/driving/ui/hooks/useTheme.ts` (new) — owns `preference`/`setPreference`, effect applies/removes `data-theme` on `document.documentElement`.
- `src/adapters/driving/ui/components/SettingsScreen.tsx` — new "Appearance" `.seg`/`role="radiogroup"` section (plain text labels "Light"/"Dark"/"System", no new icons — matches the existing text-only km/mi toggle) above or below the units toggle.
- `tests/unit/ui/SettingsScreen.test.tsx` — extend with the new section's tests.
- `src/styles/tokens.css` — light override blocks + `--color-divider` fix.
- `index.html` — inline bootstrap script.
- `e2e/appearance.spec.ts` (new, following the feedback feature's one-file-per-feature-area e2e convention).

## Sequenced TDD slices (red → green → commit, each leaves typecheck/test/build green)

1. **`themePreferenceStorage`**: `loadTheme()` defaults to `'system'` when nothing stored; `saveTheme` → `loadTheme` round-trips for all three values; a corrupted/unrecognized stored value falls back to `'system'` rather than throwing.
2. **`useTheme` + Appearance radiogroup renders**: hook applies/removes `data-theme` in an effect; `SettingsScreen` gets the three-option Appearance radiogroup. Test mirrors the existing "renders one row per segment type" shape.
3. **Selection persists**: selecting an option, unmounting, remounting shows it still selected (mirrors the existing "editing a pace field and coming back… shows the saved value" test) — also assert `document.documentElement.getAttribute('data-theme')` reflects the choice, or is absent for System.
4. **`tokens.css`** light blocks + `--color-divider` fix. Not independently unit-tested (CSS-only, like the feedback feature's `.overlay` block) — verified via `npm run build` + manual/e2e check. Own commit, substantial independently-reviewable diff.
5. **`index.html` bootstrap script**. Not independently unit-tested (thin wiring, same rationale as `api/feedback.ts`) — verified manually + by slice 6's e2e reload assertions.
6. **`e2e/appearance.spec.ts`**:
   - Scenario A: `page.emulateMedia({ colorScheme })` toggled between `'dark'`/`'light'` with the in-app preference left at System (default) — assert computed background color flips accordingly and `data-theme` stays absent in both cases.
   - Scenario B: explicitly choose Light in Settings, `page.reload()` (with OS colorScheme emulated as dark, to prove the explicit choice overrides it) — assert the light background persists.

## Verification

- `npm run typecheck`, `npm run test`, `npm run build` green after slices 1–3.
- Slices 4–5 verified by `npm run build` plus manual browser check (no automated unit test, consistent with how CSS-only and thin-wiring changes were handled in the feedback feature).
- `npm run test:e2e` for slice 6, on both `desktop-chromium` and `mobile-safari` projects.
- Manual check: toggle to Light, reload — no flash of dark before light paints. Toggle to System with OS dark mode on, then off — background flips live without needing to revisit Settings.
