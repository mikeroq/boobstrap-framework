# @boobstrap/alpine

Official Alpine.js behavior for Boobstrap components. The adapter implements the same state, event, keyboard, and accessibility contract as Boobstrap JS while allowing Alpine to own component state and lifecycle.

## Install

```bash
npm install @boobstrap/boobstrap @boobstrap/alpine alpinejs
```

```js
import "@boobstrap/boobstrap";
import Alpine from "alpinejs";
import boobstrap from "@boobstrap/alpine";

Alpine.plugin(boobstrap);
Alpine.start();
```

Use the CSP build when your application disallows dynamic expression evaluation:

```bash
npm install @boobstrap/boobstrap @boobstrap/alpine @alpinejs/csp
```

```js
import Alpine from "@alpinejs/csp";
import boobstrap from "@boobstrap/alpine";

Alpine.plugin(boobstrap);
Alpine.start();
```

The plugin registers `bsButton`, `bsCollapse`, `bsDropdown`, and `bsTabs` data providers. Each provider exposes reusable Alpine bind objects so component markup contains names instead of duplicated behavior expressions.

## Loading button

```html
<button
  class="bs-btn bs-btn-primary"
  type="button"
  x-data="bsButton"
  x-bind="root"
  data-bs-loading
  data-bs-loading-label="Saving"
>
  <span class="bs-btn-label">Save changes</span>
  <span class="bs-spinner bs-btn-spinner" aria-hidden="true"></span>
</button>
```

The button enters loading state on click. Call `stop()` when the asynchronous action settles.

See the [Boobstrap interaction contract](https://boobstrap.org/docs#alpine) for complete markup and behavior guidance.
