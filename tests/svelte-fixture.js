import {
  createBanner, createButton, createCollapse, createCombobox, createCommandPalette,
  createDialog, createDropdown, createInputMask, createNavbar, createOtp,
  createPassword, createPopover, createScrollspy, createTabs, createToast, createTooltip
} from "../packages/svelte/src/index.js";
import { interactionEvents } from "../src/js/interaction-contract.js";

window.bsEvents = [];
for (const name of interactionEvents) {
  document.addEventListener(name, (event) => window.bsEvents.push({ name, adapter: event.detail?.adapter }));
}

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith("on") && typeof value === "function") {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === "class") {
      node.className = value;
    } else if (key === "hidden") {
      node.hidden = Boolean(value);
    } else if (key === "disabled") {
      node.disabled = Boolean(value);
    } else if (value !== undefined && value !== null) {
      node.setAttribute(key, String(value));
    }
  }
  for (const child of Array.isArray(children) ? children : [children]) {
    if (typeof child === "string") {
      node.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      node.appendChild(child);
    }
  }
  return node;
}

const app = document.getElementById("app");

const button = createButton({ loadingLabel: "Saving changes" });
const collapse = createCollapse({ id: "svelte-details" });
const dialog = createDialog({ id: "svelte-dialog" });
const commandPalette = createCommandPalette({ id: "svelte-command-palette", shortcut: "k" });
const dropdown = createDropdown({ id: "svelte-menu" });
const navbar = createNavbar({ id: "svelte-navbar" });
const combobox = createCombobox({ id: "svelte-role", options: [{ value: "designer", label: "Designer" }, { value: "engineer", label: "Engineer" }] });
const tabs = createTabs({ defaultSelectedId: "svelte-profile-tab" });
const toast = createToast({ duration: 180 });
const tooltip = createTooltip({ id: "svelte-tooltip", placement: "top" });
const popover = createPopover({ id: "svelte-popover", placement: "bottom" });
const banner = createBanner({});
const mask = createInputMask("(999) 999-9999");
const otp = createOtp();
const password = createPassword();
const scrollspy = createScrollspy();

const main = el("main", { class: "bs-container bs-section bs-stack bs-gap-6" }, [
  el("h1", {}, "Svelte adapter contract"),
  el("header", { class: "bs-navbar", "aria-label": "Svelte navbar example" }, [
    el("span", { class: "bs-navbar-brand" }, "Boobstrap"),
    el("button", navbar.getTriggerProps({ id: "svelte-navbar-toggle", class: "bs-navbar-toggle", "aria-label": "Toggle Svelte navigation" }), "☰"),
    el("div", navbar.getMenuProps({ class: "bs-navbar-menu", "aria-label": "Svelte navigation" }), [
      el("a", { class: "bs-navbar-link", href: "#svelte-loading", "data-bs-navbar-close": "" }, "Components"),
      el("button", navbar.getDismissProps({ class: "bs-btn bs-btn-secondary" }), "Close navigation")
    ]),
    el("button", navbar.getDismissProps({ class: "bs-navbar-backdrop", "aria-label": "Close Svelte navigation" })),
  ]),
  el("button", button.getButtonProps({ id: "svelte-loading", class: "bs-btn bs-btn-primary", onclick: () => setTimeout(() => button.stop("async-test"), 100) }), [
    el("span", { class: "bs-btn-label" }, "Save"),
    el("span", { class: "bs-spinner bs-btn-spinner", "aria-hidden": "true" }),
  ]),
  el("button", collapse.getTriggerProps({ id: "svelte-collapse-toggle", class: "bs-btn bs-btn-secondary" }), "Details"),
  el("div", collapse.getPanelProps({ id: "svelte-details", class: "bs-collapse bs-card bs-card-body" }), "Svelte details"),
  el("button", dialog.getTriggerProps({ id: "svelte-dialog-toggle", class: "bs-btn bs-btn-secondary" }), "Open Svelte dialog"),
  el("dialog", dialog.getDialogProps({ id: "svelte-dialog", class: "bs-dialog", "aria-label": "Svelte dialog" }), [
    el("div", { class: "bs-dialog-body" }, "Dialog content"),
    el("button", dialog.getDismissProps({ class: "bs-btn bs-btn-primary" }), "Close Svelte dialog"),
  ]),
  el("div", dropdown.getRootProps({ class: "bs-dropdown" }), [
    el("button", dropdown.getTriggerProps({ id: "svelte-menu-toggle", class: "bs-btn bs-btn-secondary" }), "Actions"),
    el("div", dropdown.getMenuProps({ class: "bs-dropdown-menu" }), [
      el("button", { class: "bs-dropdown-item", type: "button", role: "menuitem" }, "Edit"),
      el("button", { class: "bs-dropdown-item", type: "button", role: "menuitem" }, "Duplicate"),
    ]),
  ]),
  el("div", combobox.getRootProps({ class: "bs-combobox" }), [
    el("input", combobox.getInputProps({ id: "svelte-role-input", class: "bs-combobox-input", "aria-label": "Role" })),
    el("button", combobox.getToggleProps({ class: "bs-combobox-toggle" })),
    el("div", combobox.getListboxProps({ class: "bs-combobox-listbox" }), combobox.filteredOptions.map((option, index) => el("div", combobox.getOptionProps(option, index, { class: "bs-combobox-option" }), option.label))),
  ]),
  el("div", tabs.getTablistProps({ class: "bs-tabs", "aria-label": "Svelte settings" }), [
    el("button", tabs.getTabProps({ id: "svelte-profile-tab", controls: "svelte-profile-panel", class: "bs-tab" }), "Profile"),
    el("button", tabs.getTabProps({ id: "svelte-security-tab", controls: "svelte-security-panel", class: "bs-tab" }), "Security"),
  ]),
  el("div", tabs.getPanelProps({ id: "svelte-profile-panel", tabId: "svelte-profile-tab", class: "bs-tab-panel" }), "Profile settings"),
  el("div", tabs.getPanelProps({ id: "svelte-security-panel", tabId: "svelte-security-tab", class: "bs-tab-panel" }), "Security settings"),
  el("button", toast.getTriggerProps({ id: "svelte-toast-toggle", class: "bs-btn bs-btn-secondary" }), "Show Svelte toast"),
  el("div", { class: "bs-toast-region" }, [
    el("div", toast.getToastProps({ id: "svelte-toast", class: "bs-toast", "aria-label": "Saved notification" }), [
      el("span", { class: "bs-toast-message" }, "Saved"),
      el("button", toast.getDismissProps({ class: "bs-toast-dismiss" }), "×"),
    ]),
  ]),
  el("button", tooltip.getTriggerProps({ id: "svelte-tooltip-trigger", class: "bs-btn bs-btn-secondary" }), "Svelte tooltip"),
  el("div", tooltip.getTooltipProps({ id: "svelte-tooltip", class: "bs-tooltip" }), [
    "Tooltip details",
    el("span", { class: "bs-floating-arrow", "aria-hidden": "true" }),
  ]),
  el("button", popover.getTriggerProps({ id: "svelte-popover-trigger", class: "bs-btn bs-btn-secondary" }), "Svelte popover"),
  el("div", popover.getPopoverProps({ id: "svelte-popover", class: "bs-popover", "aria-label": "Svelte guidance" }), [
    el("div", { class: "bs-popover-body" }, "Popover details"),
    el("span", { class: "bs-floating-arrow", "aria-hidden": "true" }),
  ]),
  el("section", { "aria-label": "Svelte banner example", "data-test-banner": "" }, [
    el("div", banner.getBannerProps({ id: "svelte-banner", class: "bs-banner" }), [
      el("div", { class: "bs-banner-inner" }, [
        el("strong", { class: "bs-banner-title" }, "Preview"),
        el("span", { class: "bs-banner-message" }, "Svelte dismiss."),
        el("button", banner.getDismissProps({ id: "svelte-banner-dismiss", class: "bs-banner-dismiss", "data-bs-banner-dismiss": "", "aria-label": "Dismiss banner" }), "×"),
      ]),
    ]),
  ]),
  el("section", { "aria-label": "Svelte input mask example" }, [
    el("label", { class: "bs-label", for: "svelte-mask-input" }, "Phone"),
    el("input", mask.getInputProps({ id: "svelte-mask-input", class: "bs-input" })),
  ]),
  el("section", { "aria-label": "Svelte OTP example", "data-test-otp": "" }, [
    el("span", { class: "bs-label", id: "svelte-otp-label" }, "One-time code"),
    el("div", otp.getRootProps({ class: "bs-otp", "aria-labelledby": "svelte-otp-label" }), [
      el("input", otp.getInputProps(0, { id: "svelte-otp-1", class: "bs-otp-input", "aria-label": "Digit 1" })),
      el("input", otp.getInputProps(1, { id: "svelte-otp-2", class: "bs-otp-input", "aria-label": "Digit 2" })),
      el("input", otp.getInputProps(2, { id: "svelte-otp-3", class: "bs-otp-input", "aria-label": "Digit 3" })),
      el("input", otp.getInputProps(3, { id: "svelte-otp-4", class: "bs-otp-input", "aria-label": "Digit 4" })),
      el("input", { id: "svelte-otp-value", type: "hidden", "data-bs-otp-value": "" }),
    ]),
  ]),
  el("section", { "aria-label": "Svelte password example", "data-test-password": "" }, [
    el("label", { class: "bs-label", for: "svelte-password-input" }, "Password"),
    el("div", password.getRootProps({ class: "bs-input-group" }), [
      el("input", password.getInputProps({ id: "svelte-password-input", class: "bs-input", type: "password" })),
      el("button", password.getToggleProps({ id: "svelte-password-toggle", class: "bs-btn bs-btn-secondary", type: "button" }), "Toggle"),
    ]),
  ]),
  el("section", { "aria-label": "Svelte command palette example" }, [
    el("button", { id: "svelte-command-toggle", class: "bs-btn bs-btn-secondary", onclick: () => commandPalette.show("trigger") }, "Open Svelte command"),
    el("dialog", commandPalette.getDialogProps({ id: "svelte-command-palette", class: "bs-dialog bs-command-palette", "aria-label": "Svelte command palette" }), [
      el("div", { class: "bs-command-palette-header" }, [
        el("input", commandPalette.getInputProps({ id: "svelte-command-input", class: "bs-input bs-command-palette-input", oninput: (e) => {
          const q = e.target.value.toLowerCase();
          const copyEl = document.getElementById("svelte-cmd-copy");
          const delEl = document.getElementById("svelte-cmd-delete");
          if (copyEl) copyEl.hidden = !("copy link".includes(q));
          if (delEl) delEl.hidden = !("delete file".includes(q));
        } })),
      ]),
      el("div", { class: "bs-command-palette-list" }, [
        el("button", { id: "svelte-cmd-copy", class: "bs-command-palette-item", onclick: (e) => commandPalette.select({ label: "Copy Link", value: "copy" }, e) }, "Copy Link"),
        el("button", { id: "svelte-cmd-delete", class: "bs-command-palette-item", onclick: (e) => commandPalette.select({ label: "Delete File", value: "delete" }, e) }, "Delete File"),
      ]),
    ]),
  ]),
  el("section", { "aria-label": "Svelte scrollspy example", "data-test-scrollspy": "" }, [
    el("nav", scrollspy.getNavProps({ id: "svelte-scrollspy", class: "bs-nav", "aria-label": "Svelte section navigation" }), [
      el("a", { class: "bs-nav-link", href: "#svelte-scrollspy-intro" }, "Introduction"),
      el("a", { class: "bs-nav-link", href: "#svelte-scrollspy-summary" }, "Summary"),
      el("a", { class: "bs-nav-link", href: "#svelte-scrollspy-details" }, "Details"),
    ]),
    el("article", {}, [
      el("h2", { id: "svelte-scrollspy-intro" }, "Introduction"),
      el("p", { style: "min-block-size: 80vh;" }, "Long introductory content."),
      el("h2", { id: "svelte-scrollspy-summary" }, "Summary"),
      el("p", { style: "min-block-size: 80vh;" }, "Intermediate anchor so the active link can change."),
      el("h2", { id: "svelte-scrollspy-details" }, "Details"),
      el("p", { style: "min-block-size: 80vh;" }, "Detailed content so the final link can become active."),
    ]),
  ]),
]);

app.appendChild(main);

// Attach actions
const dialogEl = document.getElementById("svelte-dialog");
if (dialogEl) dialog.dialog(dialogEl);

const cmdPaletteEl = document.getElementById("svelte-command-palette");
if (cmdPaletteEl) commandPalette.dialog(cmdPaletteEl);

const bannerEl = document.getElementById("svelte-banner");
if (bannerEl) banner.banner(bannerEl);

const otpEl = document.querySelector('[data-test-otp] .bs-otp');
if (otpEl) otp.otp(otpEl);

const passwordEl = document.querySelector('[data-test-password] .bs-input-group');
if (passwordEl) password.password(passwordEl);

const scrollspyEl = document.getElementById("svelte-scrollspy");
if (scrollspyEl) scrollspy.scrollspy(scrollspyEl);

window.svelteReady = true;
