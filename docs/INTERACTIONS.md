# Boobstrap interaction contract

Boobstrap is CSS-first. Importing `@boobstrap/boobstrap` or its stylesheet never loads, initializes, or requires JavaScript. Applications may bring their own behavior or opt into Boobstrap's dependency-free controllers.

The contract in this document is also the compatibility target for official Alpine, React, and Vue adapters. Adapters are alternative behavior layers: an application should not attach both Boobstrap JS and a framework adapter to the same component instance.

## Support layers

| Layer | Runtime | Intended use |
|---|---|---|
| Boobstrap CSS | None | Static HTML or applications providing their own behavior |
| Boobstrap JS | Browser DOM APIs | Progressive enhancement and imperative applications |
| Alpine adapter | Optional Alpine peer dependency | Attribute-driven reactive applications |
| React adapter | React peer dependency | Controlled and uncontrolled React components |
| Vue adapter | Vue peer dependency | Vue components and `v-model` state |

The CSS, Boobstrap JS, Alpine, and React layers are implemented today. Vue remains a planned adapter.

## Installation and initialization

Importing the stylesheet remains unchanged:

```js
import "@boobstrap/boobstrap";
```

Initialize all supported interactive components explicitly:

```js
import { initBoobstrap } from "@boobstrap/boobstrap/js";

const boobstrap = initBoobstrap();

// Remove every listener created by this initialization scope.
boobstrap.destroy();
```

Applications can import and initialize one component type instead:

```js
import { initDropdowns } from "@boobstrap/boobstrap/js/dropdown";

const dropdowns = initDropdowns(document);
```

Imports have no DOM side effects. Initialization is explicit, accepts a `Document` or `Element` scope, and returns controllers with a `destroy()` method.

## Shared state and event rules

- Initial state must be understandable from semantic HTML before initialization.
- Closed or inactive content uses the native `hidden` attribute.
- Controllers reflect public visual state through `data-bs-state`.
- Triggers keep `aria-expanded` or `aria-selected` synchronized with visible state.
- Before-events are cancelable. Calling `preventDefault()` prevents the state transition.
- After-events bubble and describe a completed transition.
- Event names use `bs:<component>:<action>`.
- Removing a controller with `destroy()` removes listeners but does not rewrite application content.

## Loading button

```html
<button
  class="bs-btn bs-btn-primary"
  type="button"
  data-bs-button
  data-bs-loading
  data-bs-loading-label="Saving changes"
>
  <span class="bs-btn-label">Save changes</span>
  <span class="bs-spinner bs-btn-spinner" aria-hidden="true"></span>
</button>
```

`data-bs-loading` starts loading after a click. The controller applies native `disabled`, `aria-busy="true"`, a specific accessible loading label, and `data-bs-state="loading"`. It preserves the original attributes and restores them when `stop()` runs. The application owns the asynchronous operation and decides when it has settled.

Public API:

```js
import { Button } from "@boobstrap/boobstrap/js/button";

const save = Button.getOrCreateInstance(document.querySelector("[data-bs-button]"));
save.start();
save.stop();
save.toggle();
save.destroy();
```

Events: `bs:button:start`, `bs:button:started`, `bs:button:stop`, and `bs:button:stopped`. The before-events are cancelable.

## Collapse

```html
<button
  class="bs-btn bs-btn-secondary"
  type="button"
  data-bs-toggle="collapse"
  aria-controls="details"
>
  Show details
</button>

<div class="bs-collapse" id="details" hidden>
  Details
</div>
```

Public API:

```js
import { Collapse } from "@boobstrap/boobstrap/js/collapse";

const collapse = Collapse.getOrCreateInstance(document.querySelector("#details"));
collapse.show();
collapse.hide();
collapse.toggle();
collapse.destroy();
```

Events: `bs:collapse:show`, `bs:collapse:shown`, `bs:collapse:hide`, and `bs:collapse:hidden`.

## Dropdown

```html
<div class="bs-dropdown" data-bs-dropdown>
  <button class="bs-btn" type="button" data-bs-toggle="dropdown" aria-controls="actions-menu">
    Actions
  </button>

  <div class="bs-dropdown-menu" id="actions-menu" role="menu" data-bs-dropdown-menu hidden>
    <button class="bs-dropdown-item" type="button" role="menuitem">Edit</button>
    <button class="bs-dropdown-item" type="button" role="menuitem">Duplicate</button>
  </div>
</div>
```

The controller supports pointer activation, outside-pointer dismissal, `Escape`, `Tab`, arrow navigation, `Home`, and `End`. `Escape` returns focus to the toggle. Disabled menu items are skipped.

Public API: `show()`, `hide({ restoreFocus })`, `toggle()`, and `destroy()`.

Events: `bs:dropdown:show`, `bs:dropdown:shown`, `bs:dropdown:hide`, and `bs:dropdown:hidden`.

A split dropdown combines the same controller with a button group. The first button keeps the default action; the compact trigger owns only the alternatives:

```html
<div class="bs-dropdown bs-btn-group" data-bs-dropdown>
  <button class="bs-btn bs-btn-primary" type="button">Save changes</button>
  <button
    class="bs-btn bs-btn-primary bs-btn-split bs-btn-caret"
    id="save-toggle"
    type="button"
    data-bs-toggle="dropdown"
    aria-controls="save-menu"
    aria-label="More save options"
  ></button>
  <div class="bs-dropdown-menu" id="save-menu" role="menu" aria-labelledby="save-toggle" data-bs-dropdown-menu hidden>
    <button class="bs-dropdown-item" type="button" role="menuitem">Save and publish</button>
  </div>
</div>
```

## Tabs

```html
<div class="bs-tabs" role="tablist" aria-label="Account" data-bs-tabs>
  <button class="bs-tab" id="profile-tab" type="button" role="tab" aria-controls="profile-panel" aria-selected="true">
    Profile
  </button>
  <button class="bs-tab" id="security-tab" type="button" role="tab" aria-controls="security-panel">
    Security
  </button>
</div>

<div class="bs-tab-panel" id="profile-panel" role="tabpanel" aria-labelledby="profile-tab">Profile settings</div>
<div class="bs-tab-panel" id="security-panel" role="tabpanel" aria-labelledby="security-tab" hidden>Security settings</div>
```

Tabs use automatic activation. Horizontal tablists support Left/Right; vertical tablists support Up/Down. Both support `Home` and `End`, skip disabled tabs, maintain roving `tabindex`, and synchronize their panels.

Public API: `activate(tab)` and `destroy()`.

Events: cancelable `bs:tabs:change` and completed `bs:tabs:changed`. Event detail includes the previous and next tabs and panels.

## Adapter requirements

Official adapters must:

1. Preserve the documented semantic structure, classes, state attributes, and keyboard behavior.
2. Use the same event names when the host framework supports DOM events, while also exposing idiomatic framework callbacks.
3. Support externally controlled state without attaching Boobstrap JS controllers to framework-owned DOM.
4. Keep framework runtimes as peer dependencies.
5. Pass the shared browser behavior and Axe accessibility contract.
6. Document any deliberate difference from the base interaction contract.

This keeps examples visually and behaviorally equivalent while allowing each framework to own state in its normal way.

## Alpine adapter

Install Boobstrap with either Alpine's standard build or its CSP-compatible build:

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

The plugin must be registered before `Alpine.start()`. It provides `bsButton`, `bsCollapse`, `bsDropdown`, and `bsTabs` data providers. Reusable bind objects keep behavior out of inline expressions and work with the official `@alpinejs/csp` build.

### Alpine loading button

```html
<button
  class="bs-btn bs-btn-primary"
  type="button"
  x-data="bsButton"
  x-bind="root"
  data-bs-loading
  data-bs-loading-label="Saving changes"
  @click="persistChanges().finally(() => stop())"
>
  <span class="bs-btn-label">Save changes</span>
  <span class="bs-spinner bs-btn-spinner" aria-hidden="true"></span>
</button>
```

### Alpine collapse

```html
<div x-data="bsCollapse">
  <button
    class="bs-btn bs-btn-secondary"
    type="button"
    x-bind="trigger"
    aria-controls="details"
  >
    Show details
  </button>

  <div class="bs-collapse" id="details" x-bind="panel" hidden>
    Details
  </div>
</div>
```

### Alpine dropdown

```html
<div class="bs-dropdown" x-data="bsDropdown" x-bind="root">
  <button
    class="bs-btn"
    type="button"
    data-bs-toggle="dropdown"
    x-bind="trigger"
    aria-controls="actions-menu"
  >
    Actions
  </button>

  <div
    class="bs-dropdown-menu"
    id="actions-menu"
    role="menu"
    data-bs-dropdown-menu
    x-bind="menu"
    hidden
  >
    <button class="bs-dropdown-item" type="button" role="menuitem">Edit</button>
  </div>
</div>
```

### Alpine tabs

```html
<section x-data="bsTabs">
  <div class="bs-tabs" role="tablist" aria-label="Account" x-bind="tablist">
    <button class="bs-tab" id="profile-tab" type="button" role="tab" x-bind="tab" aria-controls="profile-panel" aria-selected="true">Profile</button>
    <button class="bs-tab" id="security-tab" type="button" role="tab" x-bind="tab" aria-controls="security-panel">Security</button>
  </div>

  <div class="bs-tab-panel" id="profile-panel" role="tabpanel" aria-labelledby="profile-tab" x-bind="panel">Profile settings</div>
  <div class="bs-tab-panel" id="security-panel" role="tabpanel" aria-labelledby="security-tab" x-bind="panel" hidden>Security settings</div>
</section>
```

Do not initialize Boobstrap JS on the same component subtree. Alpine owns these instances' state and lifecycle while preserving the public Boobstrap events and `data-bs-state` values.

## React adapter

Install the headless React hooks alongside React and the Boobstrap stylesheet:

```bash
npm install @boobstrap/boobstrap @boobstrap/react react
```

```js
import "@boobstrap/boobstrap";
import { useButton, useCollapse, useDropdown, useTabs } from "@boobstrap/react";
```

The hooks use React's server-safe ID and state primitives, attach no global behavior during import, and return prop getters for semantic consumer-owned markup. Pass `loading` / `onLoadingChange`, `open` / `onOpenChange`, or `selectedId` / `onSelectedChange` for controlled state; use the matching `default*` option for uncontrolled state.

### React loading button

```jsx
function SaveButton() {
  const save = useButton({ loadingLabel: "Saving changes" });
  const persist = () => persistChanges().finally(() => save.stop());

  return (
    <button className="bs-btn bs-btn-primary" {...save.getButtonProps({ onClick: persist })}>
      <span className="bs-btn-label">Save changes</span>
      <span className="bs-spinner bs-btn-spinner" aria-hidden="true" />
    </button>
  );
}
```

### React collapse

```jsx
function Details() {
  const collapse = useCollapse({ id: "details" });

  return (
    <>
      <button className="bs-btn bs-btn-secondary" {...collapse.getTriggerProps()}>
        Show details
      </button>
      <div className="bs-collapse" {...collapse.getPanelProps()}>
        Details
      </div>
    </>
  );
}
```

### React dropdown

```jsx
function Actions() {
  const dropdown = useDropdown({ id: "actions-menu" });

  return (
    <div className="bs-dropdown" {...dropdown.getRootProps()}>
      <button className="bs-btn" {...dropdown.getTriggerProps()}>Actions</button>
      <div className="bs-dropdown-menu" {...dropdown.getMenuProps()}>
        <button className="bs-dropdown-item" type="button" role="menuitem">Edit</button>
      </div>
    </div>
  );
}
```

### React tabs

```jsx
function Account() {
  const tabs = useTabs({ defaultSelectedId: "profile-tab" });

  return (
    <>
      <div className="bs-tabs" aria-label="Account" {...tabs.getTablistProps()}>
        <button className="bs-tab" {...tabs.getTabProps({ id: "profile-tab", controls: "profile-panel" })}>Profile</button>
        <button className="bs-tab" {...tabs.getTabProps({ id: "security-tab", controls: "security-panel" })}>Security</button>
      </div>
      <div className="bs-tab-panel" id="profile-panel" {...tabs.getPanelProps({ tabId: "profile-tab" })}>Profile settings</div>
      <div className="bs-tab-panel" id="security-panel" {...tabs.getPanelProps({ tabId: "security-tab" })}>Security settings</div>
    </>
  );
}
```

Do not initialize Boobstrap JS or an Alpine provider on a React-owned component subtree. React controls the DOM state while preserving Boobstrap lifecycle events and `data-bs-state` values.
