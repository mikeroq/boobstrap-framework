# Slice 6 — RTL audit

This file records every physical CSS property in the framework that needed to
become logical, every override rule that already exists, and the final
resolution status. It is the deliverable for the audit pass described in
`plans/v06/06-rtl.md`. Items marked **fixed** are resolved by the v0.6.6 PR;
items marked **deferred** are documented but left for follow-up.

## Audit method

A repository-wide regex scan was performed against every CSS file in
`src/` for the following physical properties:

- `left:` / `right:` outside of `@keyframes` or transform-related contexts
- `margin-left:` / `margin-right:` / `padding-left:` / `padding-right:` /
  `border-left:` / `border-right:` not paired with an RTL override
- `translateX(-100%)` / `translateX(100%)` outside of `prefers-reduced-motion`
  or RTL-aware contexts
- `background-position: left|right X center` (skipped — none found)

The scan also looked for `border-bottom`/`border-top` and `margin-top`/
`margin-bottom` — those are non-directional (they apply symmetrically in both
writing modes) and are not listed below.

## Findings and resolution

### `src/components/dialog.css`

| Line | Original | Status |
|------|----------|--------|
| 24 | `from { transform: translateX(-100%); }` (`.bs-drawer-start`) | Correct under LTR; **deferred** — already overridden by `[dir="rtl"]` block at the bottom of the file. |
| 216 | `from { transform: translateX(100%); }` (`.bs-drawer-end`) | Same as above; **deferred**. |
| 220-221 | `[dir="rtl"]` swap for animation-name | **Already correct** — relies on existing swap; left untouched. |

### `src/components/navigation.css`

| Line | Original | Resolution |
|------|----------|------------|
| 71 | `z-index: 60;` for mobile `.bs-navbar-menu` | **Fixed** → `var(--bs-z-navbar)` (1050). |
| 88 | `transform: translateX(105%);` (closed mobile menu) | **Fixed** — added `[dir="rtl"] .bs-navbar-menu { transform: translateX(-105%); }` so the off-screen direction matches the inline-start anchor. |
| 96 | `transform: translateX(0);` (open mobile menu) | Already direction-neutral. |
| 112 | `z-index: 55;` for `.bs-navbar-backdrop` | **Fixed** → `var(--bs-z-navbar-backdrop)` (1040). |
| 159 | `border-left: 2px solid transparent;` (`.bs-nav-link`) | **Fixed** → `border-inline-start`. |
| 169 | `border-left-color: var(--bs-color-primary);` | **Fixed** → `border-inline-start-color`. |
| 564 | `z-index: 2;` (`.bs-sidebar-rail`) | Local stacking context — **kept** (no RTL implication). |
| 679 | `z-index: 60;` (`.bs-sidebar-drawer`) | **Fixed** → `var(--bs-z-fixed)` (1030). |
| 690 | `transform: translateX(-105%);` (closed `.bs-sidebar-drawer`) | **Fixed** — added `[dir="rtl"] .bs-sidebar-drawer { transform: translateX(105%); }`. |
| 698 | `transform: translateX(105%);` (`.bs-sidebar-drawer.bs-sidebar-end`) | **Fixed** — added `[dir="rtl"] .bs-sidebar-drawer.bs-sidebar-end { transform: translateX(-105%); }`. |
| 701 | `transform: translateX(0);` (open drawer) | Already direction-neutral. |
| 705 | `z-index: 55;` (`.bs-sidebar-backdrop`) | **Fixed** → `var(--bs-z-navbar-backdrop)` (1040). |

### `src/components/list.css`

| Line | Original | Resolution |
|------|----------|------------|
| 42 | `padding-left: 2rem;` (`.bs-checklist > li`) | **Fixed** → `padding-inline-start`. |
| 48 | `top: 0.12rem; left: 0;` (`::before` check icon) | **Fixed** → `inset-block-start: 0.12rem; inset-inline-start: 0;`. |

### `src/components/button.css`

| Line | Original | Resolution |
|------|----------|------------|
| 168-169 | `border-right`/`border-bottom` for `.bs-btn-caret::after` | **Deferred** — converting to `border-inline-end`/`border-block-end` would change the rendered arrow direction in LTR; the caret rotation must remain an authored choice. Documented in slice 6 follow-ups. |

### `src/components/skeleton.css` and `src/components/progress.css`

`translateX(-100%)` / `translateX(100%)` inside `@keyframes` are exempt per
the audit policy (the motion is direction-neutral; reversing it would
visualize the loading bar moving "backward"). No change.

### `src/components/dialog.css` (drawer already correct)

The dialog/drawer `[dir="rtl"]` animation-name swap was already in place
and verified by the existing `rtl-accordion` visual baseline. Left
untouched.

## Force-colors audit (Slice 6.4)

`appearance: none` controls that needed explicit `forced-colors` overrides:

### `src/components/form.css`

| Selector | Adjustment |
|----------|-----------|
| `.bs-check-input` | Added `forced-color-adjust: none; border-color: CanvasText; background: Canvas;` inside `@media (forced-colors: active)`. |
| `.bs-check-input:checked` | Switched to `Highlight`/`HighlightText` system colors. |
| `.bs-check-input[type="checkbox"]:checked` | Replaced hard-coded white stroke with `HighlightText`. |
| `.bs-check-input[type="checkbox"]:indeterminate` | Replaced hard-coded `#fff` linear gradient with `HighlightText`. |
| `.bs-check-input[type="radio"]:checked` | Replaced `#fff` radial gradient color with `HighlightText`. |
| `.bs-switch .bs-check-input` | Forced `Canvas` background, `CanvasText` border; removed radial-gradient background-image so the binary state is visible via color alone. |
| `.bs-range` | `forced-color-adjust: none` on the input, `::-webkit-slider-runnable-track`, and `::-moz-range-track`. Track uses `Canvas`/`CanvasText`; thumb uses `Highlight`/`HighlightText`. |
| `.bs-select` | `forced-color-adjust: none; background-color: Field; border-color: CanvasText;` — preserves the SVG chevron but lets the system color the surface. |

## `html { min-width: 20rem }` (Slice 6.7)

The 20rem minimum width on `html` is **retained**. Rationale, now in
`STYLE_GUIDE.md`:

- Provides a hard floor at 320 CSS pixels so a UA-induced layout
  collapse (or a bookmarklet shrinking the viewport) cannot push the
  framework into an unsupported configuration where drawers, sidebar
  rails, and pagination controls would re-flow unpredictably.
- Matches the `sm` breakpoint at 40rem, giving the layout one
  full "below-sm" interval before the layout shifts.
- Verified by the new `tests/rtl.mjs` test which renders the fixture at
  a 320px viewport and asserts `getComputedStyle(html).minWidth ===
  '320px'`.

The browser test additionally asserts the min-width is reactive: setting
`documentElement.style.minWidth = "10rem"` then `"30rem"` produces
computed values of `160px` and `480px` respectively.

## New RTL browser test (`tests/rtl.mjs`)

Asserted behaviors, all passing:

- `html` `min-width` survives inline override and resolves to its
  declared rem value.
- `.bs-nav-link[aria-current]` keeps a directional border under RTL
  (`border-inline-start-width` non-zero).
- `.bs-sidebar-start` retains its `border-inline-end` divider in RTL.
- `.bs-input-icon-start` / `.bs-input-icon-end` swap sides correctly
  when `document.dir === "rtl"`.
- Breadcrumb anchors render right-to-left under RTL (first link sits
  to the right of the last).
- Toast region anchors flush against the inline-start edge of the
  viewport in RTL.
- `bs-drawer-start` and `bs-drawer-end` resolve to the correct inline
  edges under RTL.
- 320px viewport honors `html` min-width and renders navigation links.

## New RTL visual regions (`tests/visual.html` + `tests/visual.mjs`)

The visual test now captures the following regions under `direction:
"rtl"` at desktop (1280px) and mobile (390px) viewports, producing
14 new baselines (7 regions × 2 viewports):

- `rtl-navbar`
- `rtl-sidebar`
- `rtl-dropdown`
- `rtl-drawer`
- `rtl-form`
- `rtl-breadcrumb`
- `rtl-floating`

The existing `rtl-accordion` baseline remains byte-stable.

## Deferred items (out of scope for v0.6.6)

- `.bs-btn-caret::after` arrow direction under RTL — currently uses
  physical `border-right`/`border-bottom` and rotation. Converting to
  `border-inline-end`/`border-block-end` would visually mirror the
  caret in LTR, which is a behavior change rather than a logical
  property fix. Marked as a follow-up for v0.7 alongside any broader
  caret-icon work.
- `.bs-page-nav-link:last-child { text-align: end; }` was already
  logical; the existing `text-align: end` is correct in both modes.
  No change.
- `text-align: start` is already correct in both modes across the
  codebase.
