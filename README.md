# Boobstrap

**A cheeky CSS framework that still means business.**

Boobstrap is a lightweight, class-based CSS framework for polished interfaces without a required JavaScript runtime. It provides themeable foundations, responsive layout primitives, components, focused utilities, and optional behavior layers under a predictable `bs-` prefix.

[Documentation](https://boobstrap.org/docs) · [Live site](https://boobstrap.org) · [npm](https://www.npmjs.com/package/@boobstrap/boobstrap) · [Issues](https://github.com/mikeroq/boobstrap-framework/issues)

## Starter template

Start from the responsive [Vite starter](examples/starter), which imports Boobstrap from npm and includes theme customization, components, forms, inline SVG icons, and a production validation command. Download the packaged template from the [Boobstrap documentation](https://boobstrap.org/docs#starter).

## Install

Choose your package manager:

```bash
npm install @boobstrap/boobstrap
yarn add @boobstrap/boobstrap
pnpm add @boobstrap/boobstrap
bun add @boobstrap/boobstrap
```

All four commands install the same package from the npm registry. For a plain HTML page, use the version-pinned CDN build:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@boobstrap/boobstrap@0.4.0/dist/boobstrap.css" />
```

Import the compiled stylesheet once at your application entry point:

```js
import "@boobstrap/boobstrap/dist/boobstrap.css";
```

You can also copy `dist/boobstrap.css` from the package into your own assets and link it normally.

## Icons (optional)

Boobstrap does not bundle an icon library or JavaScript runtime. Add the sizing utilities to any inline SVG from your preferred library:

```html
<svg class="bs-icon bs-icon-lg" viewBox="0 0 24 24" aria-hidden="true">
  <path d="M12 3v18m9-9H3" />
</svg>
```

For a ready-made icon set, install [Lucide](https://lucide.dev/), then initialize only the icons your application uses:

```bash
npm install lucide
```

```js
import { createIcons, icons } from "lucide";

createIcons({ icons });
```

Lucide remains an opt-in application dependency; Boobstrap stays CSS-only and can be used with any SVG icon source.

## Optional JavaScript

The default Boobstrap import remains CSS-only. For progressive enhancement, initialize the dependency-free interaction layer explicitly:

```js
import "@boobstrap/boobstrap";
import { initBoobstrap } from "@boobstrap/boobstrap/js";

const boobstrap = initBoobstrap();
```

Boobstrap JS provides loading button, collapse, searchable combobox, dialog/drawer, dropdown, input-mask, OTP, password, composable sidebar, and tabs controllers with synchronized ARIA state, cancelable lifecycle events, keyboard behavior where applicable, and explicit cleanup. Every controller has a component-level `/js/<name>` import.

Applications can continue bringing their own behavior. The official Alpine adapter implements the same [interaction contract](docs/INTERACTIONS.md) without attaching Boobstrap JS:

```bash
npm install @boobstrap/alpine alpinejs
```

```js
import Alpine from "alpinejs";
import boobstrap from "@boobstrap/alpine";

Alpine.plugin(boobstrap);
Alpine.start();
```

The official React adapter exposes controlled and uncontrolled headless hooks without attaching Boobstrap JS:

```bash
npm install @boobstrap/react react
```

```jsx
import { useButton, useCollapse } from "@boobstrap/react";

function Details() {
  const collapse = useCollapse({ id: "details" });
  return <>
    <button className="bs-btn" {...collapse.getTriggerProps()}>Details</button>
    <div className="bs-collapse" {...collapse.getPanelProps()}>Content</div>
  </>;
}
```

Vue will follow the same contract with its runtime supplied as a peer dependency.

## Quick start

```html
<!doctype html>
<html lang="en" data-bs-theme="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="/assets/boobstrap.css" />
    <title>Boobstrap example</title>
  </head>
  <body>
    <main class="bs-container bs-section">
      <div class="bs-grid bs-gap-4">
        <article class="bs-card bs-col-12 bs-col-md-6">
          <header class="bs-card-header">
            <h1 class="bs-card-title">Look good. Ship fast.</h1>
            <p class="bs-card-description">Thoughtful defaults, ready to customize.</p>
            <span class="bs-badge bs-badge-primary bs-card-action">Boobstrap</span>
          </header>
          <div class="bs-card-content">Build a polished interface from semantic, composable regions.</div>
          <footer class="bs-card-footer">
            <button class="bs-btn bs-btn-primary" type="button">Get started</button>
          </footer>
        </article>
      </div>
    </main>
  </body>
</html>
```

## What ships

- Composable dark/light modes, five color palettes, and rounded/square radius presets
- Reset and typography foundations
- Fluid containers and a mobile-first 12-column CSS Grid
- Buttons, cards, badges, comprehensive form controls, alerts, and code windows
- Input groups and icons, native selects and date/time pickers, sizes, validation, checks, radios, switches, masks, password reveal, and six-digit OTP
- Button groups, toolbars, split dropdowns, icon buttons, state variants, and loading buttons
- A composable sidebar shell with groups, nested menus, badges, loading states, mobile drawers, and desktop collapse modes
- Native modal dialogs and start/end drawers with composable regions, scroll containment, sizing, focus restoration, and optional backdrop dismissal
- Semantic data tables with striped, hover, bordered, borderless, compact, sticky-header, sortable-header, footer, numeric, action, and empty-state treatments
- Numbered pagination with current, disabled, ellipsis, responsive, and size variants, alongside separate previous/next page navigation
- A scoped DataTables 3 adapter for generated search, page-length, information, sorting, overflow, processing, and pagination controls
- Optional loading button, collapse, searchable combobox, dialog/drawer, dropdown, form-helper, sidebar, and tabs controllers
- Official Alpine and React adapters with framework-owned state
- Display, flex, sizing, positioning, spacing, and typography utilities
- A standalone `dist/boobstrap.css` bundle with no runtime dependencies

The complete component, class, and design-token reference lives in the [framework documentation](https://boobstrap.org/docs). The reference is derived from the compiled package used by the site.

## Themes and customization

Dark mode, the rose palette, and rounded corners are the defaults. Mode, palette, and radius are independent attributes that can be combined on the document or scoped to any subtree:

```html
<html
  data-bs-theme="light"
  data-bs-palette="blue"
  data-bs-radius="square"
>
```

- `data-bs-theme`: `dark` or `light`
- `data-bs-palette`: `rose`, `violet`, `blue`, `teal`, or `amber`
- `data-bs-radius`: `rounded` or `square`

Each palette remaps semantic surfaces, text, primary states, borders, controls, focus, gradients, and shadows. The radius presets remap the complete `--bs-radius-*` scale while leaving intrinsic circles such as radio controls and status dots circular.

Preset attributes are optional. Override semantic tokens after importing Boobstrap when a product needs a custom system:

```css
:root {
  --bs-color-primary: #6d4aff;
  --bs-color-primary-hover: #8568ff;
  --bs-color-primary-contrast: #ffffff;
  --bs-color-focus-ring: rgb(109 74 255 / 30%);
  --bs-radius-md: 0.5rem;
}
```

## Browser support

The release test matrix covers current Chromium, Firefox, and WebKit engines at mobile and desktop viewport sizes. Browser contracts exercise both themes, responsive grid behavior, visible focus treatment, reduced-motion behavior, optional controller interactions, keyboard navigation, and automated Axe accessibility checks.

Legacy browsers are not a target. Boobstrap uses modern CSS features including custom properties, Grid, `clamp()`, and modern color syntax.

## Development

Feature work targets the `dev` branch and is exercised by the website's hosted dev environment without publishing interim npm versions. See [DEVELOPMENT.md](DEVELOPMENT.md) for the cross-repository integration and release flow.

```bash
git clone https://github.com/mikeroq/boobstrap-framework.git
cd boobstrap-framework
npm install
npx playwright install chromium
npm test
```

Useful commands:

| Command | Purpose |
|---|---|
| `npm run build` | Compile source imports into `dist/boobstrap.css` |
| `npm run test:contract` | Verify the exact public class/token contract and bundle metadata |
| `npm run test:css` | Validate compiled CSS syntax |
| `npm run test:browser` | Test themes, layout, interactions, keyboard behavior, focus, motion, and accessibility |
| `npm run test:package` | Inspect the npm tarball contents without publishing |
| `npm test` | Run the complete local release gate |

When changing the public API intentionally, update `tests/api-contract.json` in the same pull request. Accidental selector or token changes fail the contract test.

## Roadmap

### v0.2 — Interaction foundation (shipped)

- Dependency-free collapse, dropdown, responsive sidebar, and tabs controllers
- Shared state, event, keyboard, and accessibility contract
- Official Alpine and React adapters

### v0.3 — Button system (shipped)

- Button groups, wrapping toolbars, and split dropdown actions
- Icon-only buttons with size-aware dimensions
- Active, pressed, disabled, block, and loading states
- Generic current-color spinners
- Loading controllers for Boobstrap JS, Alpine, and React

### v0.4 — Component breadth and adapter parity

- Navigation
- Breadcrumbs and pagination
- Tables
- Progress indicators
- Expanded responsive utilities
- Official Vue adapter
- Toast notifications
- Modals, tooltips, and popovers

### Future

- Token export tooling
- Component-level distribution if bundle growth makes partial imports worthwhile
- Migration guides before the first stable major release

## Project structure

```text
src/
├── base/         # reset, tokens, and typography
├── components/   # reusable component classes
├── js/           # optional dependency-free controllers
├── layout/       # containers and the 12-column grid
├── utilities/    # focused composition helpers
└── boobstrap.css # ordered source entry point

dist/             # published compiled CSS
examples/starter/ # downloadable Vite consumer project
docs/             # public behavior and adapter contracts
scripts/          # build and release validation
tests/            # API contract and browser fixture
```

## Contributing

Keep changes focused, preserve the `bs-` namespace, document public API changes, and run `npm test` before opening a pull request. Accessibility and responsive behavior are part of the component contract, not follow-up work.

## License

[MIT](LICENSE)
