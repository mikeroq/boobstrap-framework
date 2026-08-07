# @boobstrap/react

Official headless React behavior for Boobstrap components. The hooks implement the same state, events, keyboard behavior, and accessibility contract as Boobstrap JS while React owns rendering and lifecycle.

## Install

```bash
npm install @boobstrap/boobstrap @boobstrap/react react
```

```js
import "@boobstrap/boobstrap";
import { useCollapse, useDropdown, useTabs } from "@boobstrap/react";
```

React remains a peer dependency. The adapter does not import or initialize Boobstrap JS.

## Collapse

```jsx
function Details() {
  const collapse = useCollapse({ id: "details" });

  return (
    <>
      <button className="bs-btn" {...collapse.getTriggerProps()}>Show details</button>
      <div className="bs-collapse" {...collapse.getPanelProps()}>Details</div>
    </>
  );
}
```

Pass `open` and `onOpenChange` for controlled state, or `defaultOpen` for uncontrolled state.

## Dropdown

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

## Tabs

```jsx
function Settings() {
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

See the [Boobstrap interaction contract](https://boobstrap.org/docs#react) for complete behavior and accessibility guidance.
