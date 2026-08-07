import { useState } from "react";
import { useCollapse, useDropdown, useTabs } from "@boobstrap/react";

export function ReactAdapterTypeFixture() {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const collapse = useCollapse({
    id: "typed-details",
    open: detailsOpen,
    onOpenChange: (open, detail) => {
      detail.adapter satisfies "react";
      setDetailsOpen(open);
    },
  });
  const dropdown = useDropdown({ defaultOpen: false });
  const tabs = useTabs({
    defaultSelectedId: "typed-profile-tab",
    onSelectedChange: (_selectedId, detail) => detail.panel?.focus(),
  });

  collapse.show();
  dropdown.hide({ restoreFocus: true, reason: "type-test" });
  tabs.activate("typed-profile-tab");

  return (
    <main>
      <button className="bs-btn" {...collapse.getTriggerProps()}>Details</button>
      <div className="bs-collapse" {...collapse.getPanelProps()}>Typed details</div>

      <div className="bs-dropdown" {...dropdown.getRootProps()}>
        <button className="bs-btn" {...dropdown.getTriggerProps()}>Actions</button>
        <div className="bs-dropdown-menu" {...dropdown.getMenuProps()}>
          <button className="bs-dropdown-item" type="button" role="menuitem">Edit</button>
        </div>
      </div>

      <div className="bs-tabs" aria-label="Typed settings" {...tabs.getTablistProps()}>
        <button className="bs-tab" {...tabs.getTabProps({ id: "typed-profile-tab", controls: "typed-profile-panel" })}>Profile</button>
      </div>
      <div className="bs-tab-panel" id="typed-profile-panel" {...tabs.getPanelProps({ tabId: "typed-profile-tab" })}>Profile settings</div>
    </main>
  );
}
