# Plan 007: Establish visual regression baselines

> **Executor instructions**: Follow every gate and update the index. Baselines must be deterministic and reviewable; do not accept broad screenshots simply because they changed.
>
> **Drift check (run first)**: `git diff --stat ef6a032..HEAD -- tests .github/workflows/ci.yml package.json src`
> If Plans 005 or 006 are incomplete, stop; their final visuals must be included in the first baseline.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED — unstable baselines create noisy CI
- **Depends on**: `plans/005-accordion.md`, `plans/006-skeletons.md`
- **Category**: tests
- **Planned at**: commit `ef6a032`, 2026-08-13

## Why this matters

Current tests verify computed properties, overflow, interactions, Axe, themes, palettes, and reduced motion, but they cannot detect many visual regressions in spacing, typography, alignment, clipping, or stacking. Focused screenshot baselines make the visual framework contract reviewable without replacing semantic assertions.

## Current state

- `tests/browser.mjs` serves `tests/fixture.html` and loops themes and mobile/desktop viewports.
- CI runs browser contracts in Chromium, Firefox, and WebKit.
- There are no committed Playwright screenshot baselines or pixel-diff assertions.
- Existing browser scripts use raw Playwright and collect failures rather than `@playwright/test`; follow this style unless a small migration clearly reduces complexity.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Generate | documented baseline command | creates only expected snapshot files |
| Verify Chromium | `BROWSER=chromium npm run test:visual` | zero diffs |
| Full | `npm test` | exit 0 |

## Scope

**In scope**:
- New focused visual fixture and screenshot test under `tests/`
- Committed baseline images under `tests/visual-snapshots/`
- Root scripts and CI workflow
- README contributor instructions
- Minimal test-only CSS for deterministic fixture layout

**Out of scope**:
- Replacing behavioral/Axe assertions
- Site-repository screenshots
- Baselines for browser chrome, fonts fetched from networks, or animation mid-frames

## Git workflow

- Branch `agent/visual-regression`.
- Separate baseline images from harness code in commits if review tooling benefits.

## Steps

### Step 1: Build a deterministic component matrix

Create a fixture with stable local/system fonts, fixed viewport sections, animations disabled for capture, and representative variants of every component including accordion and skeleton. Use semantic markup and no external resources.

**Verify**: fixture loads without network requests, console errors, or horizontal overflow.

### Step 2: Capture focused baselines

Capture named component regions, not one giant page. Cover dark/light desktop and mobile; add targeted RTL, square-radius, and reduced-motion images where the rendering differs. Start with Chromium baselines for cross-platform stability; retain functional tests across all three engines.

**Verify**: run the capture command twice in a clean checkout → second run produces no Git diff.

### Step 3: Add CI verification and artifacts

Run visual diff in the browser job and upload actual/diff images on failure. Pin environment assumptions sufficiently that developer and CI output agree. Set a small, justified pixel threshold only for unavoidable raster differences.

**Verify**: deliberately alter a component spacing value locally → `npm run test:visual` fails and creates a useful diff; revert it and the command passes.

### Step 4: Document review workflow

Explain how to update baselines intentionally, inspect diffs, and avoid blanket acceptance.

**Verify**: README names exact update and verification commands.

## Test plan

- Every component family has at least one focused capture.
- Theme, breakpoint, RTL, radius, and reduced-motion differences are represented without combinatorial explosion.
- CI uploads diagnostics only on failure.

## Done criteria

- [ ] Deterministic committed baselines exist.
- [ ] A real visual change fails locally and in CI.
- [ ] Existing semantic, Axe, and cross-browser tests remain intact.
- [ ] Baseline update workflow is documented.
- [ ] `npm test` passes with visual checks included.

## STOP conditions

- Identical clean runs generate image churn.
- Reliable output requires downloading fonts or other network assets.
- Snapshot size becomes unreasonable; reduce to focused regions instead of increasing thresholds.

## Maintenance notes

Visual diffs require human review. A changed snapshot is not automatically correct; reviewers must connect each changed region to an intentional CSS/API change.

