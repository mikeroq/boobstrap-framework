# Boobstrap

**A cheeky CSS framework that still means business.**

Boobstrap is a lightweight, class-based CSS framework for polished interfaces without a required JavaScript runtime. Version 0.2 provides themeable foundations, responsive layout primitives, components, focused utilities, and optional behavior layers under a predictable `bs-` prefix.

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
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@boobstrap/boobstrap@0.3.0/dist/boobstrap.css" />
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

Boobstrap JS currently provides loading button, collapse, dropdown, and tabs controllers with synchronized ARIA state, cancelable lifecycle events, keyboard behavior where applicable, and explicit cleanup. Component-level imports are available at `/js/button`, `/js/collapse`, `/js/dropdown`, and `/js/tabs`.

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
          <div class="bs-card-body">
            <span class="bs-badge bs-badge-primary">Boobstrap</span>
            <h1 class="bs-card-title bs-mt-4">Look good. Ship fast.</h1>
            <p class="bs-card-text">Thoughtful defaults, ready to customize.</p>
            <button class="bs-btn bs-btn-primary" type="button">Get started</button>
          </div>
        </article>
      </div>
    </main>
  </body>
</html>
```

## What ships in v0.2

- Dark and light semantic theme tokens
- Reset and typography foundations
- Fluid containers and a mobile-first 12-column CSS Grid
- Buttons, cards, badges, forms, alerts, and code windows
- Button groups, toolbars, split dropdowns, icon buttons, state variants, and loading buttons
- Optional loading button, collapse, dropdown, and tabs styles and dependency-free controllers
- Official Alpine and React adapters with framework-owned state
- Display, flex, sizing, positioning, spacing, and typography utilities
- A standalone `dist/boobstrap.css` bundle with no runtime dependencies

The complete component, class, and design-token reference lives in the [framework documentation](https://boobstrap.org/docs). The reference is derived from the compiled package used by the site.

## Themes and customization

Dark mode is the default. Set the theme on the document or any subtree:

```html
<html data-bs-theme="light">
```

Override semantic tokens after importing Boobstrap:

```css
:root {
  --bs-color-primary: #6d4aff;
  --bs-color-primary-hover: #8568ff;
  --bs-radius-md: 0.5rem;
}
```

## Browser support

The release test matrix covers current Chromium, Firefox, and WebKit engines at mobile and desktop viewport sizes. Browser contracts exercise both themes, responsive grid behavior, visible focus treatment, reduced-motion behavior, optional controller interactions, keyboard navigation, and automated Axe accessibility checks.

Legacy browsers are not a target. Boobstrap uses modern CSS features including custom properties, Grid, `clamp()`, and modern color syntax.

## Development

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

- Dependency-free collapse, dropdown, and tabs controllers
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
