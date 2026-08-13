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

The plugin registers `bsButton`, `bsCollapse`, `bsCombobox`, `bsDialog`, `bsDropdown`, `bsPopover`, `bsTabs`, `bsToast`, and `bsTooltip` data providers. Each provider exposes reusable Alpine bind objects so component markup contains names instead of duplicated behavior expressions.

## Dialog or drawer

```html
<div x-data="bsDialog">
  <button class="bs-btn" type="button" x-bind="trigger" aria-controls="account-drawer">Account</button>
  <dialog class="bs-drawer bs-drawer-end" id="account-drawer" x-ref="dialog" x-bind="panel" aria-labelledby="account-drawer-title">
    <header class="bs-drawer-header">
      <h2 class="bs-drawer-title" id="account-drawer-title">Account</h2>
      <button class="bs-drawer-close" type="button" x-bind="dismiss" aria-label="Close account drawer">×</button>
    </header>
    <div class="bs-drawer-body">Drawer content</div>
  </dialog>
</div>
```

Use `.bs-dialog` instead of `.bs-drawer` for a centered modal. The provider exposes `show()`, `hide()`, and `toggle()`, works in the standard and strict-CSP builds, restores focus, and honors `data-bs-dialog-close-on-backdrop="false"`.

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

## Searchable combobox

Initialize the component with `x-data="bsCombobox" x-bind="root"`. Apply `x-bind="input"`, `x-bind="toggleButton"`, `x-bind="listbox"`, and `x-bind="option"` to the matching Boobstrap combobox elements. Filtering, active-option navigation, selection, dismissal, hidden-input synchronization, and lifecycle events work in both standard Alpine and strict-CSP builds.

See the [Boobstrap interaction contract](https://boobstrap.org/docs#alpine) for complete markup and behavior guidance.
