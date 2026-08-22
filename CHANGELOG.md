# Changelog

Notable changes to Boobstrap are documented here. The project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) structure and the versioning policy in [docs/VERSIONING.md](docs/VERSIONING.md).

## 0.7.0

- **Custom CSS Compiler (`@boobstrap/boobstrap/compiler`) & CLI (`npx boobstrap build`).** Added a fast programmatic build API (`compileCss`) and CLI executable for custom theme generation, component cherry-picking/tree-shaking, palette/radius filtering, custom breakpoints, static token inlining, and minification.
- **CSS Cascade Layers (`@layer`).** Structured all core CSS into `@layer bs.base, bs.layout, bs.components, bs.utilities;` so user styles and third-party CSS frameworks override library defaults without specificity hacks.
- **Automatic `prefers-color-scheme` Theming.** Enhanced design tokens with an automatic media-query fallback so dark mode works out of the box without requiring manual `data-bs-theme="dark"` attributes.
- **Command Palette Primitive (`Cmd+K` / `Ctrl+K`).** Added `.bs-command-palette` CSS foundations, vanilla `CommandPalette` controller, and official Alpine (`commandPalette`), React (`useCommandPalette`), Vue (`useCommandPalette`), and Svelte (`createCommandPalette`) adapters with real-time filtering and keyboard navigation.
- **Bottom Sheet Drawer (`.bs-drawer-bottom`).** Added bottom-docked sliding sheet with drag-to-dismiss gesture handling and top-rounded corner scale.
- **Multi-Select Combobox (`.bs-combobox-multi`).** Added multi-select chips/tags support with keyboard removal and array-value event synchronization across all adapters.
- **Official Svelte 5 Adapter (`@boobstrap/svelte`).** Introduced the official Svelte 5 package featuring all 18 interactive primitives, TypeScript typings, Svelte 5 runes support, and dual Svelte actions (`use:...`) and prop-getter (`{...getProps()}`) ergonomics.
- **Segmented Control & File Dropzone Components.**
  - Added `.bs-segmented-control`, `.bs-segmented-item`, `.bs-segmented-control-sm`, `.bs-segmented-control-lg`, and `.bs-segmented-control-block`.
  - Added `.bs-dropzone`, `.bs-dropzone-icon`, `.bs-dropzone-title`, `.bs-dropzone-hint`, and `.bs-dropzone-input`.
- **Developer Tooling & IDE Integration.**
  - `npx boobstrap init`: Interactive and automated CLI wizard generating config files and IDE presets.
  - `npx boobstrap custom-data`: Generates `.vscode/css.custom-data.json` and `.vscode/html.custom-data.json` for VS Code / Cursor autocomplete across 1,126 classes, 109 tokens, and attributes.
  - `@boobstrap/boobstrap/schema.json`: JSON Schema for `boobstrap.config.json`.
  - `defineConfig()` helper: Type-safe configuration helper exported from `@boobstrap/boobstrap/compiler`.
- **Official Starter Examples.** Added `examples/svelte/`, `examples/react/`, and `examples/vue/` starter projects with Vite.
- **Fixed three destroy-path bugs.** `Dialog.destroy()` no longer fires `bs:dialog:hidden` for a torn-down controller or restores focus to a stale target (`src/js/dialog.js`). `Sidebar.destroy()` and `Navbar.destroy()` now recompute the body open-class via `syncDocumentState()` and restore the original `role`/`aria-modal`/`aria-hidden`/`tabindex` instead of unconditionally removing the class — multi-instance sidebars and navbars no longer leak the open class. `Accordion.destroy()` now iterates and destroys each child `Collapse` so sibling coordination isn't orphaned.
- **Hardened `Combobox.destroy()`** to snapshot and restore the original `role`, `aria-autocomplete`, `aria-controls`, `autocomplete`, listbox `id`/`role`, and option `id`/`role` values so consumer-authored ARIA survives a teardown.
- **Hardened `Tabs` keyboard navigation.** `handleKeydown` no longer focuses a disabled tab; all-disabled tablists no-op cleanly; arrow keys skip disabled siblings without re-focusing the active tab.
- **Hardened `Toast` show/pause/resume.** `show()` clears any pending autohide timer and resets `remaining` so a `pointerenter`/`focusin` before the first `show()` cannot schedule a hide against a never-shown toast.
- **Hardened sidebar shortcut handling.** The Ctrl/Cmd+B-style keyboard shortcut on `Sidebar` (vanilla, Alpine, React, Vue, Svelte) now early-returns when the active element is `INPUT`/`TEXTAREA`/`SELECT`/contentEditable or when an open `<dialog>` is on top, so the shortcut cannot steal focus mid-typing.
- **Added `data-bs-dialog-close-on-backdrop` support to `useDialog` (Vue).** The Vue adapter now matches the vanilla controller: backdrop clicks dismiss the dialog unless the consumer explicitly opts out.
- **Added controlled-mode `usePassword` (React).** `usePassword` now exposes `visible` as reactive state via `useState` instead of a ref; new options `visible`, `defaultVisible`, and `onVisibleChange` allow consumers to control the visibility from outside the hook. Existing uncontrolled usage is unchanged.
- **Promoted `usePassword` adapter parity.** All five surfaces now emit cancelable `bs:password:toggle` and post `bs:password:toggled` events with `adapter` detail; the React hook synchronizes labels via `data-bs-password-show-label` / `data-bs-password-hide-label` dataset attributes like its siblings.
- **Added `DialogTransitionOptions` (TypeScript).** Extends `FocusTransitionOptions` with `returnValue` so `show`, `hide`, and `toggle` all accept the same dialog options shape.
- **Corrected `InputMask.format()` and `formatMask` TypeScript signatures.** `format()` now returns `boolean | string` (it returns the formatted value when the input changed, otherwise `false`); `formatMask(value, pattern)` no longer declares an unused `placeholder?` parameter.
- **Tightened focus styles.** Added explicit `:focus-visible` outlines for `.bs-navbar-link`, `.bs-navbar-toggle`, `.bs-nav-link`, `.bs-breadcrumb a`, `.bs-page-nav-link`, `.bs-pagination-link`, `.bs-sidebar-group-action`, `.bs-sidebar-menu-action`, `.bs-sidebar-trigger`, `.bs-sidebar-menu-button`, `.bs-sidebar-menu-sub-button`, and `.bs-sidebar-rail`. Replaced the bare `outline-offset` override on `.bs-table-responsive` with a self-contained `outline` declaration so the rule actually shows a ring.
- **Added `.bs-text-start` and `.bs-text-end` utilities.** Logical-property companions to the existing `.bs-text-left`/`.bs-text-right` aliases; documented in the API contract.
- **Aligned `--bs-btn-size-lg` with the form control size scale.** `--bs-btn-size-lg` now derives from `--bs-control-size-xl`, removing the previous 0.10 rem drift between LG buttons and LG form controls.
- **RTL property cleanup.** Replaced remaining `border-bottom`, `padding-top`, `margin-bottom`, and `text-align: left` rules with `border-block-end`, `padding-block-start`, `margin-block-end`, and `text-align: start` in `code.css`, `list.css`, `table.css`, `card.css`, `alert.css`, and `utilities/typography.css`.
- **Reduced-motion hardening.** Added explicit `@media (prefers-reduced-motion: reduce)` override for `.bs-spinner` so the single-frame flicker from the global `animation-iteration-count: 1` reset is no longer visible.
- **Removed hard-coded `#fff` in form controls.** Indeterminate checkbox, radio dot, and switch thumb now use `var(--bs-color-primary-contrast)` so dark/light/palette variants stay consistent.
- **Packaging fix.** `packages/alpine/package.json` now includes `LICENSE` and `README.md` in `files` so the published Alpine adapter ships the same license artifacts as React, Vue, and Svelte.

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
