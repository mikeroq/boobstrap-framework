import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { useButton, useCollapse, useDropdown, useTabs } from "@boobstrap/react";

window.bsEvents = [];
for (const name of ["bs:button:started", "bs:button:stopped", "bs:collapse:shown", "bs:collapse:hidden", "bs:dropdown:shown", "bs:dropdown:hidden", "bs:tabs:changed"]) {
  document.addEventListener(name, (event) => window.bsEvents.push({ name, adapter: event.detail.adapter }));
}

function LoadingButtonExample() {
  const save = useButton({ loadingLabel: "Saving changes" });
  return (
    <section aria-label="React loading button example">
      <button id="react-loading-button" className="bs-btn bs-btn-primary" {...save.getButtonProps({ onClick: () => setTimeout(() => save.stop("async-test"), 250) })}>
        <span className="bs-btn-label">Save changes</span>
        <span className="bs-spinner bs-btn-spinner" aria-hidden="true" />
      </button>
    </section>
  );
}

function CollapseExample() {
  const collapse = useCollapse({ id: "react-collapse-panel" });
  return (
    <section aria-labelledby="react-heading">
      <h1 id="react-heading">React interaction contract</h1>
      <button id="react-collapse-toggle" className="bs-btn bs-btn-secondary" {...collapse.getTriggerProps()}>
        Toggle details
      </button>
      <div id="react-collapse-panel" className="bs-collapse bs-card bs-mt-4" {...collapse.getPanelProps()}>
        <div className="bs-card-body">React collapsible details</div>
      </div>
    </section>
  );
}

function ControlledCollapseExample() {
  const [open, setOpen] = useState(false);
  const collapse = useCollapse({ id: "react-controlled-panel", open, onOpenChange: setOpen });
  return (
    <section aria-label="Controlled collapse">
      <button id="react-controlled-toggle" className="bs-btn bs-btn-secondary" {...collapse.getTriggerProps()}>Controlled details</button>
      <button id="react-controlled-external" className="bs-btn bs-btn-secondary" type="button" onClick={() => setOpen((current) => !current)}>External state</button>
      <div className="bs-collapse" {...collapse.getPanelProps()}>Controlled content</div>
    </section>
  );
}

function DropdownExample() {
  const dropdown = useDropdown({ id: "react-actions-menu" });
  return (
    <section aria-label="React dropdown example">
      <div className="bs-dropdown" {...dropdown.getRootProps()}>
        <button id="react-actions-toggle" className="bs-btn bs-btn-secondary" {...dropdown.getTriggerProps()}>Actions</button>
        <div id="react-actions-menu" className="bs-dropdown-menu" aria-labelledby="react-actions-toggle" {...dropdown.getMenuProps()}>
          <button className="bs-dropdown-item" type="button" role="menuitem">Edit</button>
          <button className="bs-dropdown-item" type="button" role="menuitem" aria-disabled="true">Archive</button>
          <button className="bs-dropdown-item" type="button" role="menuitem">Duplicate</button>
        </div>
      </div>
    </section>
  );
}

function TabsExample() {
  const tabs = useTabs({ defaultSelectedId: "react-profile-tab" });
  return (
    <section aria-label="React tabs example">
      <div className="bs-tabs" aria-label="Account settings" {...tabs.getTablistProps()}>
        <button className="bs-tab" {...tabs.getTabProps({ id: "react-profile-tab", controls: "react-profile-panel" })}>Profile</button>
        <button className="bs-tab" {...tabs.getTabProps({ id: "react-billing-tab", controls: "react-billing-panel", disabled: true })}>Billing</button>
        <button className="bs-tab" {...tabs.getTabProps({ id: "react-security-tab", controls: "react-security-panel" })}>Security</button>
      </div>
      <div className="bs-tab-panel" id="react-profile-panel" {...tabs.getPanelProps({ tabId: "react-profile-tab" })}>Profile settings</div>
      <div className="bs-tab-panel" id="react-billing-panel" {...tabs.getPanelProps({ tabId: "react-billing-tab" })}>Billing settings</div>
      <div className="bs-tab-panel" id="react-security-panel" {...tabs.getPanelProps({ tabId: "react-security-tab" })}>Security settings</div>
    </section>
  );
}

function App() {
  useEffect(() => { window.reactReady = true; }, []);
  return (
    <>
      <LoadingButtonExample />
      <CollapseExample />
      <ControlledCollapseExample />
      <DropdownExample />
      <TabsExample />
    </>
  );
}

createRoot(document.querySelector("#root")).render(<StrictMode><App /></StrictMode>);
