import { createApp, h, onMounted } from "vue";
import { useBanner, useButton, useCollapse, useCombobox, useDialog, useDropdown, useInputMask, useNavbar, useOtp, usePassword, usePopover, useScrollspy, useTabs, useToast, useTooltip } from "../packages/vue/src/index.js";
import { interactionEvents } from "../src/js/interaction-contract.js";

window.bsEvents = [];
for (const name of interactionEvents) {
  document.addEventListener(name, (event) => window.bsEvents.push({ name, adapter: event.detail?.adapter }));
}

createApp({
  setup() {
    const button = useButton({ loadingLabel: "Saving changes" });
    const collapse = useCollapse({ id: "vue-details" });
    const dialog = useDialog({ id: "vue-dialog" });
    const dropdown = useDropdown({ id: "vue-menu" });
    const navbar = useNavbar({ id: "vue-navbar" });
    const combobox = useCombobox({ id: "vue-role", options: [{ value: "designer", label: "Designer" }, { value: "engineer", label: "Engineer" }] });
    const tabs = useTabs({ defaultSelectedId: "vue-profile-tab" });
    const toast = useToast({ duration: 180 });
    const tooltip = useTooltip({ id: "vue-tooltip", placement: "top" });
    const popover = usePopover({ id: "vue-popover", placement: "bottom" });
    const banner = useBanner({});
    const mask = useInputMask("(999) 999-9999");
    const otp = useOtp();
    const password = usePassword();
    const scrollspy = useScrollspy();
    onMounted(() => { window.vueReady = true; });

    return () => h("main", { class: "bs-container bs-section bs-stack bs-gap-6" }, [
      h("h1", "Vue adapter contract"),
      h("header", { class: "bs-navbar", "aria-label": "Vue navbar example" }, [
        h("span", { class: "bs-navbar-brand" }, "Boobstrap"),
        h("button", navbar.getTriggerProps({ id: "vue-navbar-toggle", class: "bs-navbar-toggle", "aria-label": "Toggle Vue navigation" }), "☰"),
        h("div", navbar.getMenuProps({ class: "bs-navbar-menu", "aria-label": "Vue navigation" }), [h("a", { class: "bs-navbar-link", href: "#vue-loading", "data-bs-navbar-close": "" }, "Components"), h("button", navbar.getDismissProps({ class: "bs-btn bs-btn-secondary" }), "Close navigation")]),
        h("button", navbar.getDismissProps({ class: "bs-navbar-backdrop", "aria-label": "Close Vue navigation" })),
      ]),
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
      h("section", { "aria-label": "Vue banner example", "data-test-banner": "" }, [
        h("div", banner.getBannerProps({ id: "vue-banner", class: "bs-banner" }), [
          h("div", { class: "bs-banner-inner" }, [
            h("strong", { class: "bs-banner-title" }, "Preview"),
            h("span", { class: "bs-banner-message" }, "Composable dismiss."),
            h("button", banner.getDismissProps({ id: "vue-banner-dismiss", class: "bs-banner-dismiss", "data-bs-banner-dismiss": "", "aria-label": "Dismiss banner" }), "×"),
          ]),
        ]),
      ]),
      h("section", { "aria-label": "Vue input mask example" }, [
        h("label", { class: "bs-label", for: "vue-mask-input" }, "Phone"),
        h("input", mask.getInputProps({ id: "vue-mask-input", class: "bs-input" })),
      ]),
      h("section", { "aria-label": "Vue OTP example", "data-test-otp": "" }, [
        h("span", { class: "bs-label", id: "vue-otp-label" }, "One-time code"),
        h("div", otp.getRootProps({ class: "bs-otp", "aria-labelledby": "vue-otp-label" }), [
          h("input", otp.getInputProps(0, { id: "vue-otp-1", class: "bs-otp-input", "aria-label": "Digit 1" })),
          h("input", otp.getInputProps(1, { id: "vue-otp-2", class: "bs-otp-input", "aria-label": "Digit 2" })),
          h("input", otp.getInputProps(2, { id: "vue-otp-3", class: "bs-otp-input", "aria-label": "Digit 3" })),
          h("input", otp.getInputProps(3, { id: "vue-otp-4", class: "bs-otp-input", "aria-label": "Digit 4" })),
          h("input", { id: "vue-otp-value", type: "hidden", "data-bs-otp-value": "" }),
        ]),
      ]),
      h("section", { "aria-label": "Vue password example", "data-test-password": "" }, [
        h("label", { class: "bs-label", for: "vue-password-input" }, "Password"),
        h("div", password.getRootProps({ class: "bs-input-group" }), [
          h("input", password.getInputProps({ id: "vue-password-input", class: "bs-input", type: "password" })),
          h("button", password.getToggleProps({ id: "vue-password-toggle", class: "bs-btn bs-btn-secondary", type: "button" }), "Toggle"),
        ]),
      ]),
      h("section", { "aria-label": "Vue scrollspy example", "data-test-scrollspy": "" }, [
        h("nav", scrollspy.getNavProps({ id: "vue-scrollspy", class: "bs-nav", "aria-label": "Vue section navigation" }), [
          h("a", { class: "bs-nav-link", href: "#vue-scrollspy-intro" }, "Introduction"),
          h("a", { class: "bs-nav-link", href: "#vue-scrollspy-details" }, "Details"),
          h("a", { class: "bs-nav-link", href: "#vue-scrollspy-summary" }, "Summary"),
        ]),
        h("article", [
          h("h2", { id: "vue-scrollspy-intro" }, "Introduction"),
          h("p", { style: "min-block-size: 80vh" }, "Long introductory content."),
          h("h2", { id: "vue-scrollspy-summary" }, "Summary"),
          h("p", { style: "min-block-size: 80vh" }, "Intermediate anchor so the active link can change."),
          h("h2", { id: "vue-scrollspy-details" }, "Details"),
          h("p", { style: "min-block-size: 80vh" }, "Detailed content so the final link can become active."),
        ]),
      ]),
    ]);
  },
}).mount("#app");
