# Boobstrap interaction contract

Boobstrap is CSS-first. Importing `@boobstrap/boobstrap` or its stylesheet never loads, initializes, or requires JavaScript. Applications may bring their own behavior or opt into Boobstrap's dependency-free controllers.

The contract in this document is also the compatibility target for official Alpine, React, and Vue adapters. Adapters are alternative behavior layers: an application should not attach both Boobstrap JS and a framework adapter to the same component instance.

## Support layers

| Layer | Runtime | Intended use |
|---|---|---|
| Boobstrap CSS | None | Static HTML or applications providing their own behavior |
| Boobstrap JS | Browser DOM APIs | Progressive enhancement and imperative applications |
| Alpine adapter | Alpine peer dependency | Attribute-driven reactive applications |
| React adapter | React peer dependency | Controlled and uncontrolled React components |
| Vue adapter | Vue peer dependency | Vue components and `v-model` state |

The Alpine, React, and Vue layers are planned adapters. The CSS and Boobstrap JS contracts below are implemented today.

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
