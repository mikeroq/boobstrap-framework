import { useState } from "react";
import { useButton, useCollapse, useCombobox, useDialog, useDropdown, usePopover, useTabs, useToast, useTooltip } from "@boobstrap/react";

export function ReactAdapterTypeFixture() {
  const [saving, setSaving] = useState(false);
  const button = useButton({
    loading: saving,
    loadingLabel: "Saving changes",
    onLoadingChange: (loading, detail) => {
      detail.adapter satisfies "react";
      setSaving(loading);
    },
  });
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
  const dialog = useDialog({ id: "typed-dialog", defaultOpen: false });
  const combobox = useCombobox({
    options: [{ value: "engineer", label: "Engineer" }],
    defaultValue: "engineer",
    onValueChange: (_value, detail) => detail.option?.label.toLocaleLowerCase(),
  });
  const tabs = useTabs({
    defaultSelectedId: "typed-profile-tab",
    onSelectedChange: (_selectedId, detail) => detail.panel?.focus(),
  });
  const toast = useToast({ defaultOpen: false, duration: 2500 });
  const tooltip = useTooltip({ id: "typed-tooltip", placement: "top" });
  const popover = usePopover({ id: "typed-popover", placement: "bottom" });

  collapse.show();
  button.stop("type-test");
  dropdown.hide({ restoreFocus: true, reason: "type-test" });
  dialog.show("type-test");
  tabs.activate("typed-profile-tab");
  toast.show("type-test");
  tooltip.hide("type-test");
  popover.toggle("type-test");

  return (
    <main>
      <button className="bs-btn" {...button.getButtonProps()}><span className="bs-btn-label">Save</span></button>
      <button className="bs-btn" {...collapse.getTriggerProps()}>Details</button>
      <div className="bs-collapse" {...collapse.getPanelProps()}>Typed details</div>

      <div className="bs-dropdown" {...dropdown.getRootProps()}>
        <button className="bs-btn" {...dropdown.getTriggerProps()}>Actions</button>
        <div className="bs-dropdown-menu" {...dropdown.getMenuProps()}>
          <button className="bs-dropdown-item" type="button" role="menuitem">Edit</button>
        </div>
      </div>

      <button className="bs-btn" {...dialog.getTriggerProps()}>Open dialog</button>
      <dialog className="bs-dialog" {...dialog.getDialogProps()}>
        <div className="bs-dialog-body">Typed dialog</div>
        <button {...dialog.getDismissProps()}>Close</button>
      </dialog>

      <div className="bs-combobox" {...combobox.getRootProps()}>
        <input className="bs-combobox-input" {...combobox.getInputProps()} />
        <button className="bs-combobox-toggle" {...combobox.getToggleProps()} />
        <div className="bs-combobox-listbox" {...combobox.getListboxProps()}>
          {combobox.filteredOptions.map((option, index) => <div className="bs-combobox-option" key={option.value} {...combobox.getOptionProps(option, index)}>{option.label}</div>)}
        </div>
      </div>

      <div className="bs-tabs" aria-label="Typed settings" {...tabs.getTablistProps()}>
        <button className="bs-tab" {...tabs.getTabProps({ id: "typed-profile-tab", controls: "typed-profile-panel" })}>Profile</button>
      </div>
      <div className="bs-tab-panel" id="typed-profile-panel" {...tabs.getPanelProps({ tabId: "typed-profile-tab" })}>Profile settings</div>
      <button {...toast.getTriggerProps()}>Toast</button><div {...toast.getToastProps()}><button {...toast.getDismissProps()}>Dismiss</button></div>
      <button {...tooltip.getTriggerProps()}>Tooltip</button><div {...tooltip.getTooltipProps()}>Details</div>
      <button {...popover.getTriggerProps()}>Popover</button><div {...popover.getPopoverProps()}>Details</div>
    </main>
  );
}
