# Plan 002: Enforce adapter parity and finish toast behavior

> **Executor instructions**: Follow every step and verification gate. Update `plans/README.md` when complete. Do not publish, push, or merge.
>
> **Drift check (run first)**: `git diff --stat ef6a032..HEAD -- src/js packages/alpine/src packages/react/src packages/vue/src tests docs/INTERACTIONS.md scripts/verify-*-package.mjs`
> Material changes to toast behavior or adapter exports are a STOP condition until reconciled.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED — timer and controlled-state behavior can regress subtly
- **Depends on**: `plans/001-release-plumbing.md`
- **Category**: bug, tech-debt
- **Planned at**: commit `ef6a032`, 2026-08-13

## Why this matters

The interaction documentation promises a shared behavioral contract, but toast pause/resume exists only in vanilla and Alpine. Event/export lists are manually repeated across several tests, so future controllers can appear complete while an adapter silently lacks a capability. This plan fixes toast parity and introduces one machine-readable interaction manifest used by verification.

## Current state

- `src/js/toast.js:66-87` tracks remaining duration and pauses on hover/focus.
- `packages/alpine/src/toast.js:47-53` clears and reschedules its timer for pointer and focus events.
- `packages/react/src/toast.js:36-40` schedules one timer with no pause handlers.
- `packages/vue/src/toast.js:10-15` does the same.
- Event-name lists are repeated in `tests/interactions.html`, `tests/alpine-fixture.js`, `tests/react-fixture.jsx`, and `tests/vue-fixture.js`.
- Adapter code emits cancelable `show`/`hide` followed by `shown`/`hidden`; preserve that order and controlled-state semantics.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Focused browsers | `npm run build && npm run test:browser` | all interaction suites pass in Chromium |
| Types/packages | `npm run test:package` | all package and type checks pass |
| Full gate | `npm test` | exit 0 |

## Scope

**In scope**:
- `src/js/index.js`
- `packages/alpine/src/index.js`
- `packages/react/src/index.js`, `packages/react/src/toast.js`
- `packages/vue/src/index.js`, `packages/vue/src/toast.js`
- New `src/js/interaction-contract.js` or `tests/interaction-contract.js`
- Adapter/browser/package verification files
- `docs/INTERACTIONS.md`

**Out of scope**:
- New components
- CSS redesign of toast transitions
- Package versions or publishing

## Git workflow

- Branch `agent/adapter-conformance` from current `dev`.
- Commit logical units: `Add shared adapter conformance contract`, then `Align toast pause behavior`.

## Steps

### Step 1: Create one interaction capability manifest

Define controller/provider/hook/composable names, lifecycle event names, required public methods, and special capabilities such as toast autohide pause. Keep it dependency-free JSON-compatible data. Update package validators or a new verification script to assert every layer exposes its declared surface. Replace duplicated hard-coded event lists where doing so reduces drift without coupling browser fixtures to Node-only modules.

**Verify**: `rg -n "interaction-contract" package.json scripts tests src` → the manifest has a verification consumer and test command.

### Step 2: Add pause/resume to React toast

Track remaining time and start timestamp in refs. Add composed pointer-enter/leave and focus/blur or focus-in/out handlers through `getToastProps`, preserving consumer handlers. Reopening an already open toast should reset its full duration consistently with vanilla behavior. Cleanup all timers on unmount.

**Verify**: React browser test opens a short-duration toast, pauses it longer than its remaining duration while hovered and focused, confirms it stays visible, then resumes and confirms timeout dismissal.

### Step 3: Add pause/resume to Vue toast

Mirror the React/vanilla behavior with refs and returned props, preserving consumer handlers through `composeHandlers`. Avoid browser globals during setup so SSR remains safe.

**Verify**: Vue browser test covers pointer pause, focus pause, resume, timeout, and unmount cleanup; `node scripts/verify-vue-package.mjs` passes.

### Step 4: Document the exact parity contract

Update the toast and adapter sections to state that all layers support duration, opt-out, pointer/focus pause, explicit dismissal, and the four lifecycle events.

**Verify**: `rg -n "pause|duration|autohide" docs/INTERACTIONS.md` → the shared behavior is explicit.

## Test plan

- Vanilla, Alpine, React, and Vue: show, cancelable show, pointer pause, focus pause, resume, timeout, manual dismiss, cleanup.
- Contract verification: fail on a missing export, method, or lifecycle event.
- Use fake-short real browser durations with generous polling rather than exact millisecond assertions.

## Done criteria

- [ ] One manifest describes all interactive layers.
- [ ] React and Vue match vanilla/Alpine toast pause behavior.
- [ ] Package, browser, Axe, and full tests pass.
- [ ] Documentation describes actual shared behavior.
- [ ] No version or release operation occurred.

## STOP conditions

- Controlled React/Vue state makes the requested timeout impossible without changing the documented callback contract.
- The manifest would need runtime framework dependencies in the CSS-only core import.
- Timing tests remain flaky after using state polling and reasonable margins.

## Maintenance notes

Every future interactive component must enter the manifest and conformance suite in the same commit. Review cancellation, cleanup, SSR safety, and event ordering—not only visible state.

