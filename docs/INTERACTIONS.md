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

The CSS, Boobstrap JS, Alpine, React, and Vue layers are implemented and tested against the same public lifecycle contract.

## Directional contract (RTL)

Every component in this contract is direction-neutral by default. Boobstrap uses logical CSS properties (`margin-inline`, `padding-inline`, `inset-inline-start`, `border-inline-end`, etc.) so a `dir="rtl"` ancestor mirrors the layout without component-specific overrides. Adapters and JavaScript controllers must therefore:

- Read and write logical coordinates. The floating UI controller exposes `data-bs-placement` values of `start` and `end` (not `left`/`right`); adapters translate these into `inset-inline-start`/`inset-inline-end` for the panel and arrow.
- Honor a `[dir="rtl"]` ancestor when computing placement. When the document direction flips, `start` becomes the visual right and `end` becomes the visual left; controllers should re-evaluate placement on `directionchange` events or on each open.
- Avoid physical `left:` / `right:` declarations on `transform` or animation offsets for persistent state. A one-shot keyframe animation may keep physical values (the `bs-drawer-start` / `bs-drawer-end` swap in `dialog.css` is the canonical example), but a persistent closed-state position must use logical properties or a `[dir="rtl"]` override.

The framework's own behavior under RTL is verified by `tests/rtl.mjs`. Adapters that consume the contract inherit the same coverage if they delegate placement to the framework helpers and avoid re-implementing physical coordinates.

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
- Closed or inactive content uses the native `hidden` attribute when it leaves layout entirely. Responsive menus use `data-bs-state` plus mobile `inert` because the same content remains visible on desktop.
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

## Dismissible banner

```html
<div class="bs-banner bs-banner-info" role="status" data-bs-banner>
  <div class="bs-banner-inner">
    <svg class="bs-banner-icon" viewBox="0 0 24 24" aria-hidden="true">…</svg>
    <div class="bs-banner-content">
      <strong class="bs-banner-title">Preview environment</strong>
      <span class="bs-banner-message">Features may change before release.</span>
    </div>
    <a class="bs-banner-action" href="/">View live site</a>
    <button class="bs-banner-dismiss" type="button" data-bs-banner-dismiss aria-label="Dismiss preview banner">×</button>
  </div>
</div>
```

The banner is CSS-only unless `data-bs-banner` is present. The controller enhances `data-bs-banner-dismiss`, reflects `data-bs-state="visible|dismissed"`, and preserves the element so an application can show it again.

Public API:

```js
import { Banner } from "@boobstrap/boobstrap/js/banner";

const banner = Banner.getOrCreateInstance(document.querySelector("[data-bs-banner]"));
banner.dismiss();
banner.show();
banner.destroy();
```

Events: cancelable `bs:banner:dismiss` and `bs:banner:show`; completed `bs:banner:dismissed` and `bs:banner:shown`.

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

## Accordion

Accordion composes the collapse contract into a group. Put each native button inside a heading, connect it to a uniquely identified panel with `aria-controls`, and label an optional panel `role="region"` with the trigger. The default group keeps one item open; add `data-bs-accordion-always-open` when multiple panels may remain open.

```html
<div class="bs-accordion" data-bs-accordion>
  <section class="bs-accordion-item">
    <h2 class="bs-accordion-header">
      <button class="bs-accordion-trigger" type="button" data-bs-toggle="collapse" aria-controls="answer-one">
        Question <span class="bs-accordion-icon" aria-hidden="true">⌄</span>
      </button>
    </h2>
    <div class="bs-collapse bs-accordion-panel" id="answer-one" role="region">
      <div class="bs-accordion-body">Answer</div>
    </div>
  </section>
</div>
```

Use `.bs-accordion-flush` to remove the outer inline border/radius and `.bs-accordion-compact` for denser spacing. Avoid `role="region"` when a page contains many accordion panels, since excessive landmarks make navigation harder. Accordion uses native button keyboard behavior and the existing cancelable collapse events; canceled sibling closure also cancels the requested opening.

## Dialogs and drawers

Dialogs and drawers share one native `<dialog>` behavior contract. Use `.bs-dialog` for a centered modal or `.bs-drawer` with `.bs-drawer-start` / `.bs-drawer-end` for a viewport-height panel at a logical edge. Both accept optional header and footer regions around an independently scrolling body.

```html
<button class="bs-btn bs-btn-primary" type="button" data-bs-toggle="dialog" aria-controls="profile-dialog">
  Edit profile
</button>

<dialog
  class="bs-dialog bs-dialog-lg bs-dialog-height-lg"
  id="profile-dialog"
  data-bs-dialog
  aria-labelledby="profile-dialog-title"
  aria-describedby="profile-dialog-description"
>
  <header class="bs-dialog-header">
    <h2 class="bs-dialog-title" id="profile-dialog-title">Edit profile</h2>
    <p class="bs-dialog-description" id="profile-dialog-description">Update the details shown to your team.</p>
    <button class="bs-dialog-close" type="button" data-bs-dialog-dismiss aria-label="Close profile dialog">×</button>
  </header>
  <div class="bs-dialog-body"><!-- long content or a form --></div>
  <footer class="bs-dialog-footer">
    <button class="bs-btn bs-btn-secondary" type="button" data-bs-dialog-dismiss>Cancel</button>
    <button class="bs-btn bs-btn-primary" type="submit">Save changes</button>
  </footer>
</dialog>
```

The header, description, close button, and footer are optional. Headers without a description collapse to one row rather than reserving description space. The body uses `overflow: auto`; constrained dialogs and full-height drawers keep their header and footer visible while only the body scrolls. Modal widths are `.bs-dialog-sm`, `.bs-dialog-lg`, and `.bs-dialog-xl`; heights are `.bs-dialog-height-sm`, `.bs-dialog-height-lg`, and `.bs-dialog-fullscreen`. Drawer widths are `.bs-drawer-sm`, `.bs-drawer-lg`, and `.bs-drawer-xl`. Override `--bs-dialog-width`, `--bs-dialog-max-height`, or `--bs-drawer-width` at the component boundary for a product-specific size.

Backdrop clicks dismiss by default. Set `data-bs-dialog-close-on-backdrop="false"` when an outside pointer must not discard work. `Escape` remains available, and applications should always provide at least one explicit dismiss path. Native modal semantics contain focus and make background content inert; the controller synchronizes triggers, locks document scrolling, emits lifecycle events, and restores focus.

Public API:

```js
import { Dialog } from "@boobstrap/boobstrap/js/dialog";

const dialog = Dialog.getOrCreateInstance(document.querySelector("#profile-dialog"));
dialog.show();
dialog.hide();
dialog.toggle();
dialog.destroy();
```

Events: cancelable `bs:dialog:show` and `bs:dialog:hide`; completed `bs:dialog:shown` and `bs:dialog:hidden`. The drawer API and events are intentionally identical because placement is a CSS presentation choice.

Use `.bs-alert-dialog` with the same controller for short confirmations that interrupt a destructive or consequential action. Set `role="alertdialog"`, provide an accessible title and description, and set `data-bs-dialog-close-on-backdrop="false"` so an accidental outside click cannot confirm or discard the decision.

## Responsive navbar

The navbar controller turns `.bs-navbar-menu` into an off-canvas dialog at the mobile breakpoint while leaving the same content inline on larger screens. Put `data-bs-navbar` and a unique `id` on the menu, connect its toggle and backdrop with `aria-controls`, and add `data-bs-navbar-close` to navigation targets that should close the mobile menu after selection.

```html
<header class="bs-navbar">
  <a class="bs-navbar-brand" href="/">Acme</a>
  <button class="bs-navbar-toggle" type="button" data-bs-toggle="navbar" aria-controls="primary-nav" aria-label="Toggle navigation">☰</button>
  <div class="bs-navbar-menu" id="primary-nav" data-bs-navbar data-bs-state="closed" aria-label="Primary navigation">
    <nav class="bs-navbar-nav" aria-label="Primary">
      <a class="bs-navbar-link" href="/products" data-bs-navbar-close>Products</a>
      <a class="bs-navbar-link" href="/pricing" data-bs-navbar-close>Pricing</a>
    </nav>
    <div class="bs-navbar-actions"><a class="bs-btn bs-btn-primary" href="/signup">Get started</a></div>
  </div>
</header>
<button class="bs-navbar-backdrop" type="button" data-bs-navbar-dismiss aria-controls="primary-nav" aria-label="Close navigation"></button>
```

Below `48rem` by default, the controller traps focus, closes on `Escape`, backdrop, explicit dismiss, or `data-bs-navbar-close`, restores focus, and locks background scrolling. Override the behavior breakpoint with `data-bs-navbar-media`. On desktop the menu returns to ordinary document flow and its temporary dialog attributes are removed.

```js
import { Navbar } from "@boobstrap/boobstrap/js/navbar";

const navbar = Navbar.getOrCreateInstance(document.querySelector("[data-bs-navbar]"));
navbar.show();
navbar.hide();
navbar.toggle();
navbar.destroy();
```

Events: cancelable `bs:navbar:show` and `bs:navbar:hide`; completed `bs:navbar:shown` and `bs:navbar:hidden`.

## Sidebar

Sidebar is a composable application shell and navigation component. The CSS API owns layout, visual variants, menu anatomy, and responsive states; the optional controller owns mobile dialog behavior and desktop collapse state. Start with `.bs-sidebar-layout`, place `.bs-sidebar` and `.bs-sidebar-main` inside it, then compose only the regions your product needs.

```html
<button
  class="bs-sidebar-trigger"
  type="button"
  data-bs-toggle="sidebar"
  aria-controls="app-sidebar"
  aria-label="Toggle navigation"
>☰</button>

<div class="bs-sidebar-layout">
  <aside
    class="bs-sidebar bs-sidebar-start bs-sidebar-drawer bs-sidebar-collapsible"
    id="app-sidebar"
    data-bs-sidebar
    data-bs-sidebar-collapse="icon"
    data-bs-sidebar-shortcut="b"
    data-bs-state="closed"
    aria-label="Application navigation"
  >
    <div class="bs-sidebar-header">
      <strong class="bs-sidebar-label">Acme</strong>
    </div>

    <div class="bs-sidebar-content">
      <section class="bs-sidebar-group" aria-labelledby="workspace-label">
        <div class="bs-sidebar-group-label" id="workspace-label">Workspace</div>
        <div class="bs-sidebar-group-content">
          <ul class="bs-sidebar-menu">
            <li class="bs-sidebar-menu-item">
              <a class="bs-sidebar-menu-button" href="/dashboard" aria-current="page" data-bs-sidebar-close>
                <svg aria-hidden="true"><!-- icon --></svg>
                <span class="bs-sidebar-label">Dashboard</span>
                <span class="bs-sidebar-menu-badge">12</span>
              </a>
            </li>
          </ul>
        </div>
      </section>
    </div>

    <div class="bs-sidebar-footer">
      <button class="bs-sidebar-menu-button" type="button">
        <span class="bs-sidebar-label">Account</span>
      </button>
    </div>

    <button
      class="bs-sidebar-rail"
      type="button"
      data-bs-toggle="sidebar"
      aria-controls="app-sidebar"
      aria-label="Toggle navigation width"
    ></button>
  </aside>

  <main class="bs-sidebar-main">...</main>
</div>

<button
  class="bs-sidebar-backdrop"
  type="button"
  data-bs-sidebar-dismiss
  aria-controls="app-sidebar"
  aria-label="Close navigation"
></button>
```

### Placement, variants, and collapse modes

- Use `.bs-sidebar-start` or `.bs-sidebar-end` for logical placement. Both follow document direction in RTL layouts.
- Add `.bs-sidebar-floating` for an elevated rail or `.bs-sidebar-inset` when the main surface should appear inset beside it.
- Add `.bs-sidebar-drawer` to turn the sidebar into an accessible off-canvas dialog below the breakpoint in `data-bs-sidebar-media` (default: `64rem`).
- Add `.bs-sidebar-collapsible` and set `data-bs-sidebar-collapse="icon"` to retain an icon rail, `"offcanvas"` to remove the desktop rail, or `"none"` to keep it persistent.
- Set `data-bs-sidebar-shortcut="b"` to enable `Control+B` and `Command+B`. The value may be any single key suitable for the application.

The menu primitives accept links or buttons. Use `aria-current="page"` for navigation and `data-active="true"` when application state—not the URL—owns selection. `.bs-sidebar-menu-action` is positioned beside its sibling button, `.bs-sidebar-menu-badge` aligns a count at the inline end, and `.bs-sidebar-menu-sub` provides the indented nested level. `.bs-sidebar-skeleton` renders a reduced-motion-aware loading placeholder; customize its text width with `--bs-sidebar-skeleton-width`.

### Responsive and accessibility behavior

Below the configured breakpoint, the controller synchronizes the drawer and backdrop, traps focus while open, closes on `Escape`, restores focus to the trigger, marks the closed drawer inert, and applies `.bs-sidebar-open` to the document body to prevent background scrolling. `data-bs-sidebar-close` closes the mobile drawer after a navigation selection without stealing focus from the destination.

At larger widths, triggers call `expand()` and `collapse()` when a collapse mode is enabled. Header and footer remain fixed while `.bs-sidebar-content` scrolls. Use semantic `<aside>` and `<nav>` elements with accessible labels; icon-only controls require an `aria-label` or visually hidden label.

Public API:

```js
import { Sidebar } from "@boobstrap/boobstrap/js/sidebar";

const sidebar = Sidebar.getOrCreateInstance(document.querySelector("[data-bs-sidebar]"));
sidebar.show();       // mobile drawer
sidebar.hide();       // mobile drawer
sidebar.expand();     // desktop rail
sidebar.collapse();   // desktop rail
sidebar.toggle();     // current responsive mode
sidebar.destroy();
```

Mobile events are `bs:sidebar:show`, `bs:sidebar:shown`, `bs:sidebar:hide`, and `bs:sidebar:hidden`. Desktop events are `bs:sidebar:expand`, `bs:sidebar:expanded`, `bs:sidebar:collapse`, and `bs:sidebar:collapsed`. All before-events are cancelable.

Set `--bs-sidebar-offset`, `--bs-sidebar-height`, `--bs-sidebar-width`, `--bs-sidebar-width-mobile`, and `--bs-sidebar-width-collapsed` at the component boundary. Use `.bs-sidebar-end.bs-sidebar-toc` for a right-hand table of contents; responsive visibility remains a page-layout decision because available reading width differs by application.

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

## Searchable combobox

```html
<label class="bs-label" for="role-search">Role</label>
<div class="bs-combobox" data-bs-combobox>
  <input class="bs-combobox-input" id="role-search" data-bs-combobox-input placeholder="Search roles" />
  <button class="bs-combobox-toggle" type="button" data-bs-combobox-toggle aria-label="Toggle roles"></button>
  <input type="hidden" name="role" data-bs-combobox-value />
  <div class="bs-combobox-listbox" data-bs-combobox-listbox hidden>
    <div class="bs-combobox-option" data-bs-combobox-option data-bs-value="designer">Designer</div>
    <div class="bs-combobox-option" data-bs-combobox-option data-bs-value="engineer">Engineer</div>
    <div class="bs-combobox-empty" data-bs-combobox-empty hidden>No roles found</div>
  </div>
</div>
```

The controller implements the editable ARIA combobox pattern, filters options case-insensitively, maintains `aria-activedescendant`, skips disabled options, and supports arrows, `Enter`, `Escape`, `Tab`, outside-pointer dismissal, and form reset. The hidden input carries the submitted value while the visible input carries the option label.

Public API: `show()`, `hide()`, `toggle()`, `select(option)`, `reset()`, and `destroy()`.

Events: cancelable `bs:combobox:show`, `bs:combobox:hide`, and `bs:combobox:select`; completed `bs:combobox:shown`, `bs:combobox:hidden`, and `bs:combobox:change`.

## Form helpers

The optional JS bundle also initializes three small progressive-enhancement helpers:

- `data-bs-password` coordinates a password input and `data-bs-password-toggle`, preserving focus and selection while reflecting `data-bs-state="visible|hidden"`.
- `data-bs-mask="(999) 999-9999"` formats input as the user types. Mask tokens are `9` for a digit, `A` for a letter, and `*` for either.
- `data-bs-otp` coordinates `.bs-otp-input` controls, distributes pasted codes, supports arrow and Backspace movement, and synchronizes `data-bs-otp-value`. Paste is strict and atomic: after characters are filtered by `data-bs-otp-pattern`, a paste with more valid characters than the remaining inputs is rejected without changing any input, value, or state.

Imports are available from `@boobstrap/boobstrap/js/password`, `/input-mask`, and `/otp`. Their completed events are `bs:password:toggled`, `bs:mask:change`, `bs:otp:change`, and `bs:otp:complete`.

### Validation contract

Form state styling distinguishes **explicit validation** (set by the application when validation runs) from **implicit ARIA state** (announced by assistive technology). The selectors that change border and focus-ring color are:

- `.bs-is-valid` — explicit positive validation.
- `.bs-is-invalid` — explicit negative validation.
- `[aria-invalid="true"]` on `.bs-input`, `.bs-select`, or `.bs-textarea` — mirrors `.bs-is-invalid` so the same visual signal is produced whether the application uses a class or an ARIA attribute to mark the field.

`aria-invalid="false"` does not change border color. Many accessibility-first form libraries set `aria-invalid="false"` on every input they manage as the default, so styling on that attribute alone would render every untouched input with a green border. `aria-invalid="false"` is treated as "no information"; the field uses the same neutral border as an input without any ARIA attribute. Applications that want to mark a field positively validated should toggle the `.bs-is-valid` class explicitly.

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

Tabs use automatic activation. Horizontal tablists support Left/Right; vertical tablists support Up/Down. Both support `Home` and `End`, skip disabled tabs, maintain roving `tabindex`, and synchronize their panels. The default underline spans each tab's full inline size, while horizontal overflow remains touch-scrollable without exposing an extra scrollbar.

Public API: `activate(tab)` and `destroy()`.

Events: cancelable `bs:tabs:change` and completed `bs:tabs:changed`. Event detail includes the previous and next tabs and panels.

## Toast notifications

```html
<button class="bs-btn" type="button" data-bs-toggle="toast" aria-controls="saved-toast">Show notification</button>
<div class="bs-toast-region" aria-live="polite">
  <div class="bs-toast bs-toast-success" id="saved-toast" data-bs-toast hidden>
    <div>
      <strong class="bs-toast-title">Saved</strong>
      <span class="bs-toast-message">Workspace changes are live.</span>
    </div>
    <button class="bs-toast-dismiss" type="button" data-bs-toast-dismiss aria-label="Dismiss notification">×</button>
  </div>
</div>
```

Toasts default to a five-second timeout. Set `data-bs-toast-duration="8000"` to change it or `data-bs-toast-autohide="false"` for persistent notifications. Vanilla, Alpine, React, and Vue all pause the remaining autohide duration while the toast is hovered or focused, resume it afterward, support explicit dismissal, and restart the full duration when an already-open toast is shown again. Regions support logical start and bottom placement modifiers.

Public API: `show()`, `hide()`, and `destroy()`. Events are cancelable `bs:toast:show` / `bs:toast:hide` and completed `bs:toast:shown` / `bs:toast:hidden`.

## Tooltips and popovers

```html
<button class="bs-btn" type="button" data-bs-tooltip="Keyboard shortcut: Control B" data-bs-placement="top">Shortcut</button>
<button class="bs-btn" type="button" data-bs-popover="Use one behavior layer per component." data-bs-title="Integration guidance">Guidance</button>
```

Tooltips are brief, non-interactive descriptions shown by hover or focus and dismissed by pointer exit, blur, or `Escape`. Popovers are click-triggered non-modal dialogs that may contain a title and body; they dismiss on an outside pointer, page scroll, or `Escape`. Both support `top`, `bottom`, `start`, and `end`, automatically flip when the requested placement would leave the viewport, and synchronize accessible relationships.

Public APIs expose `show()`, `hide()`, and `destroy()`; popovers also expose `toggle()`. Lifecycle events use `bs:tooltip:*` and `bs:popover:*` with cancelable `show` / `hide` and completed `shown` / `hidden` actions.

## Scrollspy

Scrollspy marks the section link in a `<nav>` that matches the content the user is currently reading. It is scroll-only: clicks, taps, and keyboard activation do not change the active link, so the page remains the single source of truth. The framework already applies `scroll-behavior: smooth` to `html` in `base/reset.css`; no opt-in class is required.

```html
<nav class="bs-nav" data-bs-scrollspy aria-label="On this page">
  <a class="bs-nav-link" href="#introduction">Introduction</a>
  <a class="bs-nav-link" href="#details">Details</a>
  <a class="bs-nav-link" href="#summary">Summary</a>
</nav>

<article>
  <h2 id="introduction">Introduction</h2>
  <p>…</p>
  <h2 id="summary">Summary</h2>
  <p>…</p>
  <h2 id="details">Details</h2>
  <p>…</p>
</article>
```

Each link's `href` must point to a same-document fragment whose `id` exists. The controller observes those targets with `IntersectionObserver` and falls back to a throttled `scroll` listener. It sets `aria-current="true"` on the active link, removes it on the previous link, and dispatches `bs:scrollspy:activate` with the link and the matching section so applications can mirror selection state elsewhere. The observer is disconnected and the `aria-current` attribute is cleared on `destroy()`.

Public API:

```js
import { Scrollspy } from "@boobstrap/boobstrap/js/scrollspy";

const spy = Scrollspy.getOrCreateInstance(document.querySelector("[data-bs-scrollspy]"));
spy.destroy();
```

Events: `bs:scrollspy:activate`. Detail includes the activated `link` and `section`.

## Universal controllers

Every Boobstrap controller is exposed by all behavior layers (core, Alpine, React, and Vue). There are no core-only controllers; the framework intentionally ships nothing that is framework-incompatible.

| controller  | core    | alpine  | react        | vue        | notes |
|-------------|---------|---------|--------------|------------|-------|
| accordion   | `Accordion` | `accordion` | `useAccordion` | `useAccordion` | universal |
| banner      | `Banner` | `banner` | `useBanner` | `useBanner` | universal |
| button      | `Button` | `button` | `useButton` | `useButton` | universal |
| collapse    | `Collapse` | `collapse` | `useCollapse` | `useCollapse` | universal |
| combobox    | `Combobox` | `combobox` | `useCombobox` | `useCombobox` | universal |
| dialog      | `Dialog` | `dialog` | `useDialog` | `useDialog` | universal |
| dropdown    | `Dropdown` | `dropdown` | `useDropdown` | `useDropdown` | universal |
| input-mask  | `InputMask` | `inputMask` | `useInputMask` | `useInputMask` | universal |
| navbar      | `Navbar` | `navbar` | `useNavbar` | `useNavbar` | universal; responsive overlay |
| otp         | `Otp` | `otp` | `useOtp` | `useOtp` | universal |
| password    | `Password` | `password` | `usePassword` | `usePassword` | universal |
| popover     | `Popover` | `popover` | `usePopover` | `usePopover` | universal |
| scrollspy   | `Scrollspy` | `scrollspy` | `useScrollspy` | `useScrollspy` | universal; scroll-only |
| sidebar     | `Sidebar` | `sidebar` | `useSidebar` | `useSidebar` | universal; responsive overlay + collapse |
| tabs        | `Tabs` | `tabs` | `useTabs` | `useTabs` | universal |
| toast       | `Toast` | `toast` | `useToast` | `useToast` | universal; autohide + pause |
| tooltip     | `Tooltip` | `tooltip` | `useTooltip` | `useTooltip` | universal |

The detailed lifecycle events for each controller live in their respective sections above; `src/js/interaction-contract.js` is the single source of truth for adapter mappings.

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

The plugin must be registered before `Alpine.start()`. It provides `bsButton`, `bsCollapse`, `bsCombobox`, `bsDialog`, `bsDropdown`, `bsNavbar`, `bsPopover`, `bsTabs`, `bsToast`, and `bsTooltip` data providers. Reusable bind objects keep behavior out of inline expressions and work with the official `@alpinejs/csp` build.

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

Dialogs use one provider around the trigger and native dialog. The same markup can use `.bs-drawer` for edge placement:

```html
<div x-data="bsDialog">
  <button class="bs-btn" type="button" x-bind="trigger" aria-controls="account-drawer">Account</button>
  <dialog class="bs-drawer bs-drawer-end" id="account-drawer" x-ref="dialog" x-bind="panel" aria-labelledby="account-drawer-title">
    <header class="bs-drawer-header">
      <h2 class="bs-drawer-title" id="account-drawer-title">Account</h2>
      <button class="bs-drawer-close" type="button" x-bind="dismiss" aria-label="Close account drawer">×</button>
    </header>
    <div class="bs-drawer-body">...</div>
  </dialog>
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

### Alpine combobox

Use the same option markup as Boobstrap JS, replace `data-bs-combobox` with `x-data="bsCombobox" x-bind="root"`, then apply `x-bind="input"`, `x-bind="toggleButton"`, `x-bind="listbox"`, and `x-bind="option"` to their matching elements. The provider works with both Alpine builds, including strict CSP.

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

### Alpine scrollspy

```html
<nav class="bs-nav" x-data="bsScrollspy" aria-label="On this page">
  <a class="bs-nav-link" href="#introduction">Introduction</a>
  <a class="bs-nav-link" href="#details">Details</a>
  <a class="bs-nav-link" href="#summary">Summary</a>
</nav>
```

## React adapter

Install the headless React hooks alongside React and the Boobstrap stylesheet:

```bash
npm install @boobstrap/boobstrap @boobstrap/react react
```

```js
import "@boobstrap/boobstrap";
import { useButton, useCollapse, useCombobox, useDialog, useDropdown, useNavbar, usePopover, useTabs, useToast, useTooltip } from "@boobstrap/react";
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

### React combobox

`useCombobox({ options })` returns controlled or uncontrolled value/open state, `filteredOptions`, and prop getters for the root, input, toggle, listbox, and each option. Pass `value` / `onValueChange` and `open` / `onOpenChange` for controlled state, or `defaultValue` / `defaultOpen` otherwise. The consumer renders the filtered options and a hidden form input when native submission is required.

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

### React scrollspy

```jsx
import { useScrollspy } from "@boobstrap/react";

function OnThisPage() {
  const spy = useScrollspy();
  return (
    <nav className="bs-nav" aria-label="On this page" {...spy.getNavProps()}>
      <a className="bs-nav-link" href="#introduction">Introduction</a>
      <a className="bs-nav-link" href="#details">Details</a>
      <a className="bs-nav-link" href="#summary">Summary</a>
    </nav>
  );
}
```

## Vue adapter

Install the headless Vue composables with Vue 3.5 or newer:

```bash
npm install @boobstrap/boobstrap @boobstrap/vue vue
```

```vue
<script setup>
import "@boobstrap/boobstrap";
import { useCollapse, useNavbar } from "@boobstrap/vue";

const details = useCollapse({ id: "details" });
</script>

<template>
  <button class="bs-btn" v-bind="details.getTriggerProps()">Details</button>
  <div class="bs-collapse" v-bind="details.getPanelProps()">Progressive content</div>
</template>
```

The adapter exports `useButton`, `useCollapse`, `useCombobox`, `useDialog`, `useDropdown`, `useNavbar`, `usePopover`, `useScrollspy`, `useTabs`, `useToast`, and `useTooltip`. Controlled options accept Vue refs, enabling `v-model`-style ownership; default options provide internal state. Imports are SSR-safe, Vue remains a peer dependency, and no Boobstrap JS controller is attached to Vue-owned DOM.

### Vue scrollspy

```vue
<script setup>
import { useScrollspy } from "@boobstrap/vue";

const spy = useScrollspy();
</script>

<template>
  <nav class="bs-nav" v-bind="spy.getNavProps()" aria-label="On this page">
    <a class="bs-nav-link" href="#introduction">Introduction</a>
    <a class="bs-nav-link" href="#details">Details</a>
    <a class="bs-nav-link" href="#summary">Summary</a>
  </nav>
</template>
```
