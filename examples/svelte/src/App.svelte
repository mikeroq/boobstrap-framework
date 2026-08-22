<script>
  import { createDialog, createCommandPalette, createTabs, createButton } from "@boobstrap/svelte";

  const dialog = createDialog({ id: "example-dialog" });
  const commandPalette = createCommandPalette({ id: "example-cmd", shortcut: "k" });
  const tabs = createTabs({ defaultSelectedId: "tab-overview" });
  const saveBtn = createButton({ loadingLabel: "Saving..." });

  function handleSave() {
    saveBtn.start();
    setTimeout(() => saveBtn.stop(), 1200);
  }
</script>

<main class="bs-container bs-section bs-stack bs-gap-6">
  <header class="bs-navbar">
    <span class="bs-navbar-brand">Boobstrap + Svelte 5</span>
    <div class="bs-hstack bs-gap-2">
      <button class="bs-btn bs-btn-secondary" onclick={() => commandPalette.show("header")}>
        <kbd class="bs-badge bs-badge-subtle">Cmd+K</kbd> Quick Search
      </button>
      <button class="bs-btn bs-btn-primary" onclick={() => dialog.show("header")}>
        Open Modal
      </button>
    </div>
  </header>

  <section class="bs-card bs-card-body bs-stack bs-gap-4">
    <div class="bs-tabs" role="tablist">
      <button {...tabs.getTabProps({ id: "tab-overview", controls: "panel-overview", class: "bs-tab" })}>Overview</button>
      <button {...tabs.getTabProps({ id: "tab-components", controls: "panel-components", class: "bs-tab" })}>Components</button>
    </div>

    <div {...tabs.getPanelProps({ id: "panel-overview", tabId: "tab-overview", class: "bs-tab-panel" })}>
      <p class="bs-lead">Welcome to the Svelte 5 + Boobstrap starter template.</p>
      <div class="bs-segmented-control">
        <button class="bs-segmented-item" data-bs-state="active">Standard</button>
        <button class="bs-segmented-item">Compact</button>
        <button class="bs-segmented-item">Expanded</button>
      </div>
    </div>

    <div {...tabs.getPanelProps({ id: "panel-components", tabId: "tab-components", class: "bs-tab-panel" })}>
      <div class="bs-dropzone">
        <span class="bs-dropzone-icon">📁</span>
        <span class="bs-dropzone-title">Upload files</span>
        <span class="bs-dropzone-hint">Drag and drop or browse from computer</span>
        <input type="file" class="bs-dropzone-input" />
      </div>
    </div>

    <div>
      <button {...saveBtn.getButtonProps({ class: "bs-btn bs-btn-primary", onclick: handleSave })}>
        <span class="bs-btn-label">Save Settings</span>
        <span class="bs-spinner bs-btn-spinner" aria-hidden="true"></span>
      </button>
    </div>
  </section>

  <dialog {...dialog.getDialogProps({ class: "bs-dialog" })}>
    <div class="bs-dialog-header">
      <h3 class="bs-dialog-title">Modal Title</h3>
    </div>
    <div class="bs-dialog-body">
      <p>This is a native HTML dialog orchestrated by Boobstrap's Svelte 5 runes composable.</p>
    </div>
    <div class="bs-dialog-footer">
      <button class="bs-btn bs-btn-secondary" onclick={() => dialog.hide("cancel")}>Cancel</button>
      <button class="bs-btn bs-btn-primary" onclick={() => dialog.hide("confirm")}>Confirm</button>
    </div>
  </dialog>
</main>
