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

The plugin registers `bsCollapse`, `bsDropdown`, and `bsTabs` data providers. Each provider exposes reusable Alpine bind objects so component markup contains names instead of duplicated behavior expressions.

See the [Boobstrap interaction contract](https://boobstrap.org/docs#alpine) for complete markup and behavior guidance.
