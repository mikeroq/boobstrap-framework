# Migration guides

Each release with consumer-visible behavior or API changes receives a section here. Read the matching changelog entry first.

## Migration template

1. List renamed or removed selectors, tokens, exports, options, methods, events, and package paths.
2. Provide exact search-and-replace patterns where safe.
3. Explain behavior, keyboard, focus, accessibility, SSR, CSP, or timing changes.
4. List TypeScript errors consumers should expect and their replacements.
5. Reinstall dependencies, rebuild, run application tests, exercise light/dark and responsive states, and review accessibility.

## 0.5.0

The 0.5.0 release is additive. Consumers may opt into `@boobstrap/boobstrap/tokens`, core/Alpine declarations, accordion, skeletons, and `@boobstrap/vue`. React and Vue toast autohide now pauses for pointer hover and focus, matching vanilla and Alpine. Applications that implemented adapter-specific toast timers should remove that workaround and verify timeout behavior.

## 0.6.0

The 0.6.0 release completes the responsive surface and ships five new controllers with universal adapter parity. It also ships a deliberate fix to form validity semantics. Most consumers can adopt the new CSS, tokens, and controllers without changes. The one breaking change is called out in detail below.

### Breaking change: `aria-invalid="false"` no longer styles fields as valid

Previously, any input, select, or textarea with `aria-invalid="false"` received the same green-tinted border and focus ring as `.bs-is-valid`. This was inconsistent with how accessibility-first form libraries set the default — React Hook Form, Final Form, and similar libraries mark every managed input as `aria-invalid="false"` to satisfy assistive technology, which meant every Boobstrap input rendered with a success border by default.

The fix:

- `aria-invalid="false"` no longer changes border color. The field uses the same neutral border as an input without any ARIA attribute. This is "no information" semantics.
- `aria-invalid="true"` on `.bs-input`, `.bs-select`, or `.bs-textarea` still mirrors `.bs-is-invalid` and renders the negative-validation visual.
- The deliberate positive-validation API remains `.bs-is-valid`. Consumers who relied on `aria-invalid="false"` to draw a green border must add the class explicitly.

Before (worked by accident):

```html
<input class="bs-input" aria-invalid="false" />
```

After (correct):

```html
<input class="bs-input" aria-invalid="false" />
<!-- if the application has positively validated the field: -->
<input class="bs-input bs-is-valid" aria-invalid="false" />
```

If you manage form state with a library that defaults to `aria-invalid="false"`, switch to toggling `.bs-is-valid` on validated fields, and leave `aria-invalid` to mirror the actual validation outcome.

### New utility classes

- Responsive 12-column grid spans, starts, and offsets at `sm`, `md`, `lg`, `xl`, and `2xl`. See [STYLE_GUIDE.md § 8 Layout System](../STYLE_GUIDE.md#8-layout-system).
- Spacing utility family completed: margin, padding, and gap in every logical axis (`m`, `mt`, `mb`, `ms`, `me`, `mx`, `my`, `p`, `pt`, `pb`, `ps`, `pe`, `px`, `py`, `gap`, `gap-x`, `gap-y`) with responsive variants at `md` and `lg`. See [STYLE_GUIDE.md § 5 Spacing System](../STYLE_GUIDE.md#5-spacing-system).
- Layout utilities for display, position, overflow, flex composition, sizing, text overflow, and media fit. See [STYLE_GUIDE.md § 8 Layout System](../STYLE_GUIDE.md#8-layout-system).

### New global tokens

- `--bs-breakpoint-sm` / `-md` / `-lg` / `-xl` / `-2xl` — single source for responsive breakpoints.
- `--bs-z-dropdown` / `-sticky` / `-fixed` / `-navbar-backdrop` / `-navbar` / `-popover` / `-tooltip` / `-toast` / `-dialog-backdrop` / `-dialog` — explicit z-index layers for floating UI.
- `--bs-control-size-sm` / `-md` / `-lg` / `-xl` — form-control dimensions.
- `--bs-btn-size-sm` / `-md` / `-lg` — button minimum heights.
- `--bs-overlay-backdrop` — modal, drawer, navbar, and sidebar backdrop tint.

### New component-local customization hooks

These tokens live on the component (or any ancestor) and let a product retint or resize one instance without touching the global `--bs-color-*` scale:

- `--bs-btn-block-size`, `--bs-btn-padding-inline`
- `--bs-card-padding`
- `--bs-dialog-width`, `--bs-dialog-max-height`, `--bs-drawer-width`
- `--bs-control-bg`, `--bs-control-border`, `--bs-control-color` (inputs, selects, textareas)
- `--bs-banner-bg`, `--bs-banner-border`, `--bs-banner-color`
- `--bs-toast-bg`, `--bs-toast-border`, `--bs-toast-color`
- `--bs-sidebar-offset`, `--bs-sidebar-height`, `--bs-sidebar-width`, `--bs-sidebar-width-mobile`, `--bs-sidebar-width-collapsed`, `--bs-sidebar-skeleton-width`

`--bs-alert-accent` and `--bs-badge-accent` were documented in v0.4 and remain public hooks.

### New component classes

- `.bs-alert-info`, `.bs-alert-warning`, `.bs-alert-danger` — full semantic alert variants.
- `.bs-badge-info`, `.bs-badge-success`, `.bs-badge-warning`, `.bs-badge-danger` — full semantic badge variants.
- `.bs-btn-danger` — destructive button variant.
- `.bs-separator` — themed horizontal rule (vertical inside flex via `aria-orientation`).
- `.bs-close` — generic close button (used by dialog, drawer, banner, and toast).
- `.bs-dropdown-header`, `.bs-dropdown-divider`, `.bs-dropdown-item-checked`, `.bs-dropdown-item-secondary` — compositional dropdown helpers.

### New controllers (universal across adapters)

Five new controllers ship with matching Alpine, React, and Vue adapters:

| core export | alpine factory | react hook | vue composable |
|---|---|---|---|
| `Banner`    | `banner`    | `useBanner`    | `useBanner`    |
| `InputMask` | `inputMask` | `useInputMask` | `useInputMask` |
| `Otp`       | `otp`       | `useOtp`       | `useOtp`       |
| `Password`  | `password`  | `usePassword`  | `usePassword`  |
| `Sidebar`   | `sidebar`   | `useSidebar`   | `useSidebar`   |

Each controller has a component-level `@boobstrap/boobstrap/js/<name>` import and a matching adapter entry. All controllers emit the same `bs:<component>:<action>` event names and respect the same accessibility contract documented in [docs/INTERACTIONS.md](INTERACTIONS.md).

### Distribution

- New `@boobstrap/boobstrap/min.css` export points at `dist/boobstrap.min.css` for production builds. The default `@boobstrap/boobstrap` import remains the unminified `dist/boobstrap.css` for readability.
- The minified bundle is verified by `scripts/verify-size.mjs` against an explicit size budget on every CI run.

### Forced-colors support

Components that override native chrome — buttons, selects, checkboxes, switches, range thumbs, and alerts — opt into `forced-color-adjust: auto` so users keep a recognizable OS shape and high-contrast palette in Windows High Contrast mode. Select chevrons, switch knobs, and alert borders remain visible against the system palette. No application change is required; this is purely a CSS addition.
