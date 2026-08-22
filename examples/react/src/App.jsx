import React from "react";
import { useDialog, useCommandPalette, useTabs, useButton } from "@boobstrap/react";

export default function App() {
  const dialog = useDialog({ id: "react-dialog" });
  const commandPalette = useCommandPalette({ id: "react-cmd", shortcut: "k" });
  const tabs = useTabs({ defaultSelectedId: "tab-overview" });
  const button = useButton({ loadingLabel: "Saving..." });

  const handleSave = () => {
    button.start();
    setTimeout(() => button.stop(), 1200);
  };

  return (
    <main className="bs-container bs-section bs-stack bs-gap-6">
      <header className="bs-navbar">
        <span className="bs-navbar-brand">Boobstrap + React</span>
        <div className="bs-hstack bs-gap-2">
          <button className="bs-btn bs-btn-secondary" onClick={() => commandPalette.show("header")}>
            <kbd className="bs-badge bs-badge-subtle">Cmd+K</kbd> Quick Search
          </button>
          <button className="bs-btn bs-btn-primary" onClick={() => dialog.show("header")}>
            Open Modal
          </button>
        </div>
      </header>

      <section className="bs-card bs-card-body bs-stack bs-gap-4">
        <div className="bs-tabs" role="tablist">
          <button {...tabs.getTabProps({ id: "tab-overview", controls: "panel-overview", className: "bs-tab" })}>Overview</button>
          <button {...tabs.getTabProps({ id: "tab-components", controls: "panel-components", className: "bs-tab" })}>Components</button>
        </div>

        <div {...tabs.getPanelProps({ id: "panel-overview", tabId: "tab-overview", className: "bs-tab-panel" })}>
          <p className="bs-lead">Welcome to the React + Boobstrap starter template.</p>
          <div className="bs-segmented-control">
            <button className="bs-segmented-item" data-bs-state="active">Standard</button>
            <button className="bs-segmented-item">Compact</button>
            <button className="bs-segmented-item">Expanded</button>
          </div>
        </div>

        <div {...tabs.getPanelProps({ id: "panel-components", tabId: "tab-components", className: "bs-tab-panel" })}>
          <div className="bs-dropzone">
            <span className="bs-dropzone-icon">📁</span>
            <span className="bs-dropzone-title">Upload files</span>
            <span className="bs-dropzone-hint">Drag and drop or browse from computer</span>
            <input type="file" className="bs-dropzone-input" />
          </div>
        </div>

        <div>
          <button {...button.getButtonProps({ className: "bs-btn bs-btn-primary", onClick: handleSave })}>
            <span className="bs-btn-label">Save Settings</span>
            <span className="bs-spinner bs-btn-spinner" aria-hidden="true" />
          </button>
        </div>
      </section>

      <dialog {...dialog.getDialogProps({ className: "bs-dialog" })}>
        <div className="bs-dialog-header">
          <h3 className="bs-dialog-title">Modal Title</h3>
        </div>
        <div className="bs-dialog-body">
          <p>This is a native HTML dialog orchestrated by Boobstrap's React hook adapter.</p>
        </div>
        <div className="bs-dialog-footer">
          <button className="bs-btn bs-btn-secondary" onClick={() => dialog.hide("cancel")}>Cancel</button>
          <button className="bs-btn bs-btn-primary" onClick={() => dialog.hide("confirm")}>Confirm</button>
        </div>
      </dialog>
    </main>
  );
}
