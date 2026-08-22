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

The plugin registers `bsAccordion`, `bsBanner`, `bsButton`, `bsCollapse`, `bsCombobox`, `bsDialog`, `bsDropdown`, `bsInputMask`, `bsNavbar`, `bsOtp`, `bsPassword`, `bsPopover`, `bsSidebar`, `bsTabs`, `bsToast`, and `bsTooltip` data providers.

## Supported controllers

| controller  | alpine factory | core export        |
|-------------|----------------|--------------------|
| accordion   | `accordion`    | `Accordion`        |
| banner      | `banner`       | `Banner`           |
| button      | `button`       | `Button`           |
| collapse    | `collapse`     | `Collapse`         |
| combobox    | `combobox`     | `Combobox`         |
| dialog      | `dialog`       | `Dialog`           |
| dropdown    | `dropdown`     | `Dropdown`         |
| input-mask  | `inputMask`    | `InputMask`        |
| navbar      | `navbar`       | `Navbar`           |
| otp         | `otp`          | `Otp`              |
| password    | `password`     | `Password`         |
| popover     | `popover`      | `Popover`          |
| sidebar     | `sidebar`     | `Sidebar`          |
| tabs        | `tabs`         | `Tabs`             |
| toast       | `toast`        | `Toast`            |
| tooltip     | `tooltip`      | `Tooltip`          |

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

## Banner

```html
<div class="bs-banner" x-data="bsBanner" x-bind="root" data-bs-state="visible">
  <div class="bs-banner-inner">
    <strong class="bs-banner-title">Preview</strong>
    <span class="bs-banner-message">Dismiss with the adapter hook.</span>
    <button class="bs-banner-dismiss" type="button" data-bs-banner-dismiss x-bind="dismissButton" aria-label="Dismiss banner">×</button>
  </div>
</div>
```

`bsBanner` exposes `show()` and `dismiss()` and reflects state through `data-bs-state="visible|dismissed"`.

## Sidebar

```html
<aside class="bs-sidebar bs-sidebar-start bs-sidebar-drawer" id="app-sidebar" data-bs-sidebar x-data="bsSidebar" x-ref="sidebar" data-bs-state="closed">
  <div class="bs-sidebar-content">
    <a class="bs-sidebar-menu-button" href="/dashboard">Dashboard</a>
  </div>
</aside>
<button class="bs-sidebar-trigger" type="button" data-bs-toggle="sidebar" aria-controls="app-sidebar" x-data="bsSidebar" x-bind="trigger">☰</button>
```

`bsSidebar` exposes `show()`, `hide()`, `toggle()`, `expand()`, and `collapse()` so the same provider handles both responsive drawer behavior and desktop collapse modes.

## Input mask, OTP, and password

```html
<input class="bs-input" x-data="bsInputMask('(999) 999-9999')" x-bind="root" />
<div x-data="bsOtp" x-bind="root">
  <input class="bs-otp-input" data-bs-otp-input />
  <input class="bs-otp-input" data-bs-otp-input />
  <input class="bs-otp-input" data-bs-otp-input />
  <input class="bs-otp-input" data-bs-otp-input />
  <input type="hidden" data-bs-otp-value />
</div>
<div x-data="bsPassword" x-ref="root">
  <input class="bs-input" type="password" data-bs-password-input value="hunter2" />
  <button class="bs-btn bs-btn-secondary" type="button" x-bind="toggleButton" data-bs-password-toggle>Toggle</button>
</div>
```

`bsInputMask`, `bsOtp`, and `bsPassword` mirror their core counterparts so the controller contract holds across layers.

## Searchable combobox

Initialize the component with `x-data="bsCombobox" x-bind="root"`. Apply `x-bind="input"`, `x-bind="toggleButton"`, `x-bind="listbox"`, and `x-bind="option"` to the matching Boobstrap combobox elements. Filtering, active-option navigation, selection, dismissal, hidden-input synchronization, and lifecycle events work in both standard Alpine and strict-CSP builds.

See the [Boobstrap interaction contract](https://boobstrap.org/docs#alpine) for complete markup and behavior guidance.
