# Changelog

Notable changes to Boobstrap are documented here. The project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) structure and the versioning policy in [docs/VERSIONING.md](docs/VERSIONING.md).

## 0.6.0

- Completed the responsive 12-column grid with explicit start, offset, and auto utilities at `sm`, `md`, `lg`, `xl`, and `2xl`. The `sm` step is the smallest responsive breakpoint; below `sm` the layout is single-column. See [docs/MIGRATING.md](docs/MIGRATING.md) for the new breakpoint tokens.
- Completed the spacing utility family (`m`, `mt`, `mb`, `ms`, `me`, `mx`, `my`, `p`, `pt`, `pb`, `ps`, `pe`, `px`, `py`, `gap`, `gap-x`, `gap-y`) with responsive variants at `md` and `lg`.
- Added display, position, overflow, flex composition, sizing, text overflow, and media fit utilities with selective responsive coverage.
- Added full semantic variants for `.bs-alert` and `.bs-badge` (`primary`, `info`, `success`, `warning`, `danger`).
- Added `.bs-btn-danger` button variant.
- Added compositional primitives: `.bs-separator`, `.bs-close`, and dropdown helpers (`.bs-dropdown-header`, `.bs-dropdown-divider`, `.bs-dropdown-item-checked`, `.bs-dropdown-item-secondary`).
- Added structural tokens for floating UI: `--bs-z-dropdown`, `--bs-z-sticky`, `--bs-z-fixed`, `--bs-z-navbar-backdrop`, `--bs-z-navbar`, `--bs-z-popover`, `--bs-z-tooltip`, `--bs-z-toast`, `--bs-z-dialog-backdrop`, `--bs-z-dialog`.
- Added component dimension tokens: `--bs-control-size-sm`, `--bs-control-size-md`, `--bs-control-size-lg`, `--bs-control-size-xl`, `--bs-btn-size-sm`, `--bs-btn-size-md`, `--bs-btn-size-lg`, `--bs-overlay-backdrop`.
- Added component-local customization hooks for `bs-btn`, `bs-card`, `bs-dialog`, `bs-control`, `bs-banner`, `bs-toast`, and `bs-sidebar`.
- Added five new controllers with universal adapter parity: `Banner`, `InputMask`, `Otp`, `Password`, and `Sidebar`. Each ships a `@boobstrap/boobstrap/js/<name>` import and a matching Alpine factory, React hook, and Vue composable.
- Shipped a minified CSS bundle at `@boobstrap/boobstrap/min.css` with explicit size budgets enforced by CI.
- Improved forced-colors support so buttons, selects, checkboxes, switches, range thumbs, and alerts keep a recognizable OS shape and high-contrast palette in Windows High Contrast mode.
- **Breaking:** `aria-invalid="false"` no longer applies success styling on `.bs-input`, `.bs-select`, or `.bs-textarea`. Consumers who relied on the implicit green border must switch to `.bs-is-valid`. See [docs/MIGRATING.md](docs/MIGRATING.md) for migration details and a code example.

## 0.5.0

- Added deterministic design-token JSON and ES module exports.
- Added core and Alpine TypeScript declarations.
- Added accordion and loading skeleton component families.
- Added shared adapter conformance and visual regression contracts.
- Aligned toast autohide pause behavior across vanilla, Alpine, React, and Vue.
- Completed Vue package release plumbing.

## 0.4.x

- Expanded navigation, breadcrumb, pagination, table, dialog, drawer, progress, responsive utility, toast, tooltip, popover, and Vue adapter coverage.

## 0.3.x

- Added button groups, toolbars, split actions, loading states, and current-color spinners.

## 0.2.x

- Established dependency-free interaction controllers and official Alpine and React adapters.

Earlier patch releases are represented by repository tags. Historical summaries intentionally describe minor release families rather than inventing per-patch guarantees.
