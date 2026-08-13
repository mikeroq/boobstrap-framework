import { createApp, h, onMounted } from "vue";
import { useButton, useCollapse, useCombobox, useDialog, useDropdown, usePopover, useTabs, useToast, useTooltip } from "../packages/vue/src/index.js";

window.bsEvents = [];
for (const name of ["bs:button:started", "bs:button:stopped", "bs:collapse:shown", "bs:collapse:hidden", "bs:combobox:shown", "bs:combobox:change", "bs:combobox:hidden", "bs:dialog:shown", "bs:dialog:hidden", "bs:dropdown:shown", "bs:dropdown:hidden", "bs:popover:shown", "bs:popover:hidden", "bs:tabs:changed", "bs:toast:shown", "bs:toast:hidden", "bs:tooltip:shown", "bs:tooltip:hidden"]) {
  document.addEventListener(name, (event) => window.bsEvents.push({ name, adapter: event.detail?.adapter }));
}

createApp({
  setup() {
    const button = useButton({ loadingLabel: "Saving changes" });
    const collapse = useCollapse({ id: "vue-details" });
    const dialog = useDialog({ id: "vue-dialog" });
    const dropdown = useDropdown({ id: "vue-menu" });
    const combobox = useCombobox({ id: "vue-role", options: [{ value: "designer", label: "Designer" }, { value: "engineer", label: "Engineer" }] });
    const tabs = useTabs({ defaultSelectedId: "vue-profile-tab" });
    const toast = useToast({ autohide: false });
    const tooltip = useTooltip({ id: "vue-tooltip", placement: "top" });
    const popover = usePopover({ id: "vue-popover", placement: "bottom" });
    onMounted(() => { window.vueReady = true; });

    return () => h("main", { class: "bs-container bs-section bs-stack bs-gap-6" }, [
      h("h1", "Vue adapter contract"),
      h("button", button.getButtonProps({ id: "vue-loading", class: "bs-btn bs-btn-primary", onClick: () => setTimeout(() => button.stop("async-test"), 100) }), [h("span", { class: "bs-btn-label" }, "Save"), h("span", { class: "bs-spinner bs-btn-spinner", "aria-hidden": "true" })]),
      h("button", collapse.getTriggerProps({ id: "vue-collapse-toggle", class: "bs-btn bs-btn-secondary" }), "Details"),
      h("div", collapse.getPanelProps({ id: "vue-details", class: "bs-collapse bs-card bs-card-body" }), "Vue details"),
      h("button", dialog.getTriggerProps({ id: "vue-dialog-toggle", class: "bs-btn bs-btn-secondary" }), "Open Vue dialog"),
      h("dialog", dialog.getDialogProps({ id: "vue-dialog", class: "bs-dialog", "aria-label": "Vue dialog" }), [h("div", { class: "bs-dialog-body" }, "Dialog content"), h("button", dialog.getDismissProps({ class: "bs-btn bs-btn-primary" }), "Close Vue dialog")]),
      h("div", dropdown.getRootProps({ class: "bs-dropdown" }), [
        h("button", dropdown.getTriggerProps({ id: "vue-menu-toggle", class: "bs-btn bs-btn-secondary" }), "Actions"),
        h("div", dropdown.getMenuProps({ class: "bs-dropdown-menu" }), [h("button", { class: "bs-dropdown-item", type: "button", role: "menuitem" }, "Edit"), h("button", { class: "bs-dropdown-item", type: "button", role: "menuitem" }, "Duplicate")]),
      ]),
      h("div", combobox.getRootProps({ class: "bs-combobox" }), [
        h("input", combobox.getInputProps({ id: "vue-role-input", class: "bs-combobox-input", "aria-label": "Role" })),
        h("button", combobox.getToggleProps({ class: "bs-combobox-toggle" })),
        h("div", combobox.getListboxProps({ class: "bs-combobox-listbox" }), combobox.filteredOptions.value.map((option, index) => h("div", combobox.getOptionProps(option, index, { class: "bs-combobox-option" }), option.label))),
      ]),
      h("div", tabs.getTablistProps({ class: "bs-tabs", "aria-label": "Vue settings" }), [
        h("button", tabs.getTabProps({ id: "vue-profile-tab", controls: "vue-profile-panel", class: "bs-tab" }), "Profile"),
        h("button", tabs.getTabProps({ id: "vue-security-tab", controls: "vue-security-panel", class: "bs-tab" }), "Security"),
      ]),
      h("div", tabs.getPanelProps({ id: "vue-profile-panel", tabId: "vue-profile-tab", class: "bs-tab-panel" }), "Profile settings"),
      h("div", tabs.getPanelProps({ id: "vue-security-panel", tabId: "vue-security-tab", class: "bs-tab-panel" }), "Security settings"),
      h("button", toast.getTriggerProps({ id: "vue-toast-toggle", class: "bs-btn bs-btn-secondary" }), "Show Vue toast"),
      h("div", { class: "bs-toast-region" }, [h("div", toast.getToastProps({ id: "vue-toast", class: "bs-toast", "aria-label": "Saved notification" }), [h("span", { class: "bs-toast-message" }, "Saved"), h("button", toast.getDismissProps({ class: "bs-toast-dismiss" }), "×")])]),
      h("button", tooltip.getTriggerProps({ id: "vue-tooltip-trigger", class: "bs-btn bs-btn-secondary" }), "Vue tooltip"),
      h("div", tooltip.getTooltipProps({ class: "bs-tooltip" }), ["Tooltip details", h("span", { class: "bs-floating-arrow", "aria-hidden": "true" })]),
      h("button", popover.getTriggerProps({ id: "vue-popover-trigger", class: "bs-btn bs-btn-secondary" }), "Vue popover"),
      h("div", popover.getPopoverProps({ class: "bs-popover", "aria-label": "Vue guidance" }), [h("div", { class: "bs-popover-body" }, "Popover details"), h("span", { class: "bs-floating-arrow", "aria-hidden": "true" })]),
    ]);
  },
}).mount("#app");
