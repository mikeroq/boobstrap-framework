# @boobstrap/react

Official headless React behavior for Boobstrap components. The hooks implement the same state, events, keyboard behavior, and accessibility contract as Boobstrap JS while React owns rendering and lifecycle.

## Install

```bash
npm install @boobstrap/boobstrap @boobstrap/react react
```

```js
import "@boobstrap/boobstrap";
import { useAccordion, useBanner, useButton, useCollapse, useCombobox, useDialog, useDropdown, useInputMask, useNavbar, useOtp, usePassword, usePopover, useScrollspy, useSidebar, useTabs, useToast, useTooltip } from "@boobstrap/react";
```

React remains a peer dependency. The adapter does not import or initialize Boobstrap JS.

## Supported hooks

| hook          | core export |
|---------------|-------------|
| `useAccordion` | `Accordion` |
| `useBanner`   | `Banner`    |
| `useButton`   | `Button`    |
| `useCollapse` | `Collapse`  |
| `useCombobox` | `Combobox`  |
| `useDialog`   | `Dialog`    |
| `useDropdown` | `Dropdown`  |
| `useInputMask` | `InputMask` |
| `useNavbar`   | `Navbar`    |
| `useOtp`      | `Otp`       |
| `usePassword` | `Password`  |
| `usePopover`  | `Popover`   |
| `useScrollspy` | `Scrollspy` |
| `useSidebar`  | `Sidebar`   |
| `useTabs`     | `Tabs`      |
| `useToast`    | `Toast`     |
| `useTooltip`  | `Tooltip`   |

## Loading button

```jsx
function SaveButton() {
  const save = useButton({ loadingLabel: "Saving" });

  return (
    <button
      className="bs-btn bs-btn-primary"
      {...save.getButtonProps({ onClick: () => setTimeout(save.stop, 1500) })}
    >
      <span className="bs-btn-label">Save changes</span>
      <span className="bs-spinner bs-btn-spinner" aria-hidden="true" />
    </button>
  );
}
```

Pass `loading` and `onLoadingChange` for controlled state, or `defaultLoading` for uncontrolled state. Set `autoStart: false` when the application calls `start()` itself.

## Banner

```jsx
function PreviewBanner() {
  const banner = useBanner({});
  return (
    <div className="bs-banner" {...banner.getBannerProps()}>
      <div className="bs-banner-inner">
        <strong className="bs-banner-title">Preview</strong>
        <span className="bs-banner-message">Adapter-controlled dismiss.</span>
        <button className="bs-banner-dismiss" type="button" {...banner.getDismissProps()}>×</button>
      </div>
    </div>
  );
}
```

`useBanner` returns `visible`, `show()`, `dismiss()`, plus `getBannerProps` and `getDismissProps` helpers.

## Sidebar

```jsx
function AppShell() {
  const sidebar = useSidebar({ id: "app-sidebar" });
  return (
    <>
      <aside className="bs-sidebar bs-sidebar-start" id="app-sidebar" {...sidebar.getRootProps()}>
        <div className="bs-sidebar-content">
          <a className="bs-sidebar-menu-button" href="/dashboard">Dashboard</a>
        </div>
      </aside>
      <button className="bs-sidebar-trigger" type="button" data-bs-toggle="sidebar" aria-controls="app-sidebar">☰</button>
    </>
  );
}
```

`useSidebar` returns `open`, `show`, `hide`, `toggle`, `expand`, `collapse`, and `getRootProps`; both overlay and collapse modes share one hook.

## Input mask, OTP, and password

```jsx
function AuthControls() {
  const mask = useInputMask("(999) 999-9999");
  const otp = useOtp();
  const password = usePassword();
  return (
    <>
      <input className="bs-input" {...mask.getInputProps()} />
      <div {...otp.getRootProps()}>
        <input className="bs-otp-input" {...otp.getInputProps(0)} />
        <input className="bs-otp-input" {...otp.getInputProps(1)} />
        <input className="bs-otp-input" {...otp.getInputProps(2)} />
        <input className="bs-otp-input" {...otp.getInputProps(3)} />
      </div>
      <div {...password.getRootProps()}>
        <input className="bs-input" type="password" {...password.getInputProps()} />
        <button className="bs-btn" type="button" {...password.getToggleProps()}>Toggle</button>
      </div>
    </>
  );
}
```

The hooks preserve the controller contract: `useInputMask` formats as the user types, `useOtp` distributes focus across inputs and supports paste, and `usePassword` reflects `data-bs-state` while preserving focus and selection.

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

## Dialog or drawer

```jsx
function AccountDrawer() {
  const dialog = useDialog({ id: "account-drawer" });
  return <>
    <button className="bs-btn" {...dialog.getTriggerProps()}>Account</button>
    <dialog className="bs-drawer bs-drawer-end" aria-labelledby="account-drawer-title" {...dialog.getDialogProps()}>
      <header className="bs-drawer-header">
        <h2 className="bs-drawer-title" id="account-drawer-title">Account</h2>
        <button className="bs-drawer-close" aria-label="Close account drawer" {...dialog.getDismissProps()}>×</button>
      </header>
      <div className="bs-drawer-body">Drawer content</div>
    </dialog>
  </>;
}
```

Use `.bs-dialog` for a centered modal. Pass `open` and `onOpenChange` for controlled state, or `defaultOpen` for uncontrolled state.

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

## Searchable combobox

Call `useCombobox({ options })` and spread its root, input, toggle, listbox, and option prop getters onto semantic consumer-owned markup. The hook exposes `filteredOptions`, `value`, `query`, and `selectedOption`. It supports controlled `value` / `open` state or uncontrolled `defaultValue` / `defaultOpen` state without importing Boobstrap JS.

See the [Boobstrap interaction contract](https://boobstrap.org/docs#react) for complete behavior and accessibility guidance.
