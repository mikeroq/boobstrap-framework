import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { useBanner, useButton, useCollapse, useCombobox, useCommandPalette, useDialog, useDropdown, useInputMask, useNavbar, useOtp, usePassword, usePopover, useScrollspy, useTabs, useToast, useTooltip } from "@boobstrap/react";
import { interactionEvents } from "../src/js/interaction-contract.js";

window.bsEvents = [];
for (const name of interactionEvents) {
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

function NavbarExample() {
  const navbar = useNavbar({ id: "react-navbar" });
  return (
    <header className="bs-navbar" aria-label="React navbar example">
      <span className="bs-navbar-brand">Boobstrap</span>
      <button id="react-navbar-toggle" className="bs-navbar-toggle" aria-label="Toggle React navigation" {...navbar.getTriggerProps()}>☰</button>
      <div className="bs-navbar-menu" aria-label="React navigation" {...navbar.getMenuProps()}>
        <nav className="bs-navbar-nav" aria-label="React primary"><a className="bs-navbar-link" href="#react-heading" data-bs-navbar-close>Components</a></nav>
        <button className="bs-btn bs-btn-secondary" {...navbar.getDismissProps()}>Close navigation</button>
      </div>
      <button className="bs-navbar-backdrop" aria-label="Close React navigation" {...navbar.getDismissProps()} />
    </header>
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

function DialogExample() {
  const dialog = useDialog({ id: "react-dialog" });
  return (
    <section aria-label="React dialog example">
      <button id="react-dialog-toggle" className="bs-btn bs-btn-primary" {...dialog.getTriggerProps()}>Open dialog</button>
      <dialog className="bs-dialog bs-dialog-sm" aria-labelledby="react-dialog-title" {...dialog.getDialogProps()}>
        <header className="bs-dialog-header">
          <h2 className="bs-dialog-title" id="react-dialog-title">React dialog</h2>
          <p className="bs-dialog-description">Controlled with a reusable hook.</p>
          <button className="bs-dialog-close" aria-label="Close React dialog" {...dialog.getDismissProps()}>×</button>
        </header>
        <div className="bs-dialog-body">Hook-controlled content.</div>
        <footer className="bs-dialog-footer"><button className="bs-btn bs-btn-primary" {...dialog.getDismissProps()}>Done</button></footer>
      </dialog>
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

const roles = [
  { value: "designer", label: "Designer" },
  { value: "engineer", label: "Engineer" },
  { value: "founder", label: "Founder", disabled: true },
];

function ComboboxExample() {
  const combobox = useCombobox({ options: roles });
  return (
    <section aria-label="React combobox example">
      <label className="bs-label" htmlFor="react-role-input">Role</label>
      <div className="bs-combobox" {...combobox.getRootProps()}>
        <input id="react-role-input" className="bs-combobox-input" placeholder="Search roles" {...combobox.getInputProps()} />
        <button className="bs-combobox-toggle" {...combobox.getToggleProps()} />
        <input id="react-role-value" type="hidden" name="role" value={combobox.value} readOnly />
        <div className="bs-combobox-listbox" {...combobox.getListboxProps()}>
          {combobox.filteredOptions.map((option, index) => (
            <div className="bs-combobox-option" key={option.value} {...combobox.getOptionProps(option, index)}>{option.label}</div>
          ))}
          {!combobox.filteredOptions.length && <div className="bs-combobox-empty">No roles found</div>}
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

function FloatingFeedbackExample() {
  const toast = useToast({ duration: 180 });
  const tooltip = useTooltip({ id: "react-tooltip", placement: "top" });
  const popover = usePopover({ id: "react-popover", placement: "bottom" });
  return (
    <section className="bs-stack bs-gap-4" aria-label="React floating feedback">
      <button id="react-toast-toggle" className="bs-btn bs-btn-secondary" {...toast.getTriggerProps()}>Show toast</button>
      <div className="bs-toast-region"><div id="react-toast" className="bs-toast" aria-label="Saved notification" {...toast.getToastProps()}><span className="bs-toast-message">Saved</span><button className="bs-toast-dismiss" {...toast.getDismissProps()}>×</button></div></div>
      <button id="react-tooltip-trigger" className="bs-btn bs-btn-secondary" {...tooltip.getTriggerProps()}>Tooltip trigger</button>
      <div id="react-tooltip" className="bs-tooltip" {...tooltip.getTooltipProps()}>Tooltip details<span className="bs-floating-arrow" aria-hidden="true" /></div>
      <button id="react-popover-trigger" className="bs-btn bs-btn-secondary" {...popover.getTriggerProps()}>Popover trigger</button>
      <div id="react-popover" className="bs-popover" aria-label="Integration guidance" {...popover.getPopoverProps()}><div className="bs-popover-body">Popover details</div><span className="bs-floating-arrow" aria-hidden="true" /></div>
    </section>
  );
}

function BannerExample() {
  const banner = useBanner({});
  return (
    <section aria-label="React banner example" data-test-banner>
      <div id="react-banner" className="bs-banner" {...banner.getBannerProps()}>
        <div className="bs-banner-inner">
          <strong className="bs-banner-title">Preview</strong>
          <span className="bs-banner-message">Hook-controlled dismiss.</span>
          <button id="react-banner-dismiss" className="bs-banner-dismiss" type="button" data-bs-banner-dismiss aria-label="Dismiss banner" {...banner.getDismissProps()}>×</button>
        </div>
      </div>
    </section>
  );
}

function InputMaskExample() {
  const mask = useInputMask("(999) 999-9999");
  return (
    <section aria-label="React input mask example">
      <label className="bs-label" htmlFor="react-mask-input">Phone</label>
      <input id="react-mask-input" className="bs-input" {...mask.getInputProps({ defaultValue: "5125551234" })} />
    </section>
  );
}

function OtpExample() {
  const otp = useOtp();
  return (
    <section aria-label="React OTP example" data-test-otp>
      <span className="bs-label" id="react-otp-label">One-time code</span>
      <div className="bs-otp" {...otp.getRootProps({ "aria-labelledby": "react-otp-label" })}>
        <input id="react-otp-1" className="bs-otp-input" aria-label="Digit 1" {...otp.getInputProps(0)} />
        <input id="react-otp-2" className="bs-otp-input" aria-label="Digit 2" {...otp.getInputProps(1)} />
        <input id="react-otp-3" className="bs-otp-input" aria-label="Digit 3" {...otp.getInputProps(2)} />
        <input id="react-otp-4" className="bs-otp-input" aria-label="Digit 4" {...otp.getInputProps(3)} />
        <input id="react-otp-value" type="hidden" data-bs-otp-value />
      </div>
    </section>
  );
}

function PasswordExample() {
  const password = usePassword();
  return (
    <section aria-label="React password example" data-test-password>
      <label className="bs-label" htmlFor="react-password-input">Password</label>
      <div className="bs-input-group" {...password.getRootProps()}>
        <input id="react-password-input" className="bs-input" type="password" {...password.getInputProps({ defaultValue: "hunter2" })} />
        <button id="react-password-toggle" className="bs-btn bs-btn-secondary" type="button" {...password.getToggleProps()}>Toggle</button>
      </div>
    </section>
  );
}

function ScrollspyExample() {
  const spy = useScrollspy();
  return (
    <section aria-label="React scrollspy example" data-test-scrollspy>
      <nav id="react-scrollspy" className="bs-nav" aria-label="React section navigation" {...spy.getNavProps()}>
        <a className="bs-nav-link" href="#react-scrollspy-intro">Introduction</a>
        <a className="bs-nav-link" href="#react-scrollspy-details">Details</a>
        <a className="bs-nav-link" href="#react-scrollspy-summary">Summary</a>
      </nav>
      <article>
        <h2 id="react-scrollspy-intro">Introduction</h2>
        <p style={{ minBlockSize: "80vh" }}>Long introductory content.</p>
        <h2 id="react-scrollspy-summary">Summary</h2>
        <p style={{ minBlockSize: "80vh" }}>Intermediate anchor so the active link can change.</p>
        <h2 id="react-scrollspy-details">Details</h2>
        <p style={{ minBlockSize: "80vh" }}>Detailed content so the final link can become active.</p>
      </article>
    </section>
  );
}

function CommandPaletteExample() {
  const palette = useCommandPalette({ id: "react-command-palette", shortcut: "k" });
  return (
    <section aria-label="React command palette example">
      <button id="react-command-toggle" className="bs-btn bs-btn-secondary" type="button" onClick={() => palette.toggle("trigger")}>Open commands</button>
      <dialog className="bs-command-palette" {...palette.getDialogProps()} aria-label="React commands">
        <div className="bs-command-palette-header">
          <input id="react-command-input" className="bs-command-palette-input" type="search" {...palette.getInputProps()} />
        </div>
        <div className="bs-command-palette-list" role="listbox">
          <div id="react-cmd-copy" className="bs-command-palette-item" role="option" hidden={Boolean(palette.query && !palette.query.toLowerCase().includes("copy"))} onClick={() => palette.select({ label: "Copy", value: "copy" })}>Copy</div>
          <div id="react-cmd-delete" className="bs-command-palette-item" role="option" hidden={Boolean(palette.query && !palette.query.toLowerCase().includes("delete"))} onClick={() => palette.select({ label: "Delete", value: "delete" })}>Delete</div>
        </div>
      </dialog>
    </section>
  );
}

function App() {
  useEffect(() => { window.reactReady = true; }, []);
  return (
    <>
      <LoadingButtonExample />
      <NavbarExample />
      <CollapseExample />
      <ControlledCollapseExample />
      <DialogExample />
      <DropdownExample />
      <ComboboxExample />
      <TabsExample />
      <FloatingFeedbackExample />
      <BannerExample />
      <InputMaskExample />
      <OtpExample />
      <PasswordExample />
      <ScrollspyExample />
      <CommandPaletteExample />
    </>
  );
}

createRoot(document.querySelector("#root")).render(<StrictMode><App /></StrictMode>);
