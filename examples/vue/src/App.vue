<script setup>
import { useDialog, useCommandPalette, useTabs, useButton } from "@boobstrap/vue";

const dialog = useDialog({ id: "vue-dialog" });
const commandPalette = useCommandPalette({ id: "vue-cmd", shortcut: "k" });
const tabs = useTabs({ defaultSelectedId: "tab-overview" });
const button = useButton({ loadingLabel: "Saving..." });

function handleSave() {
  button.start();
  setTimeout(() => button.stop(), 1200);
}
</script>

<template>
  <main class="bs-container bs-section bs-stack bs-gap-6">
    <header class="bs-navbar">
      <span class="bs-navbar-brand">Boobstrap + Vue</span>
      <div class="bs-hstack bs-gap-2">
        <button class="bs-btn bs-btn-secondary" @click="commandPalette.show('header')">
          <kbd class="bs-badge bs-badge-subtle">Cmd+K</kbd> Quick Search
        </button>
        <button class="bs-btn bs-btn-primary" @click="dialog.show('header')">
          Open Modal
        </button>
      </div>
    </header>

    <section class="bs-card bs-card-body bs-stack bs-gap-4">
      <div class="bs-tabs" role="tablist">
        <button v-bind="tabs.getTabProps({ id: 'tab-overview', controls: 'panel-overview', class: 'bs-tab' })">Overview</button>
        <button v-bind="tabs.getTabProps({ id: 'tab-components', controls: 'panel-components', class: 'bs-tab' })">Components</button>
      </div>

      <div v-bind="tabs.getPanelProps({ id: 'panel-overview', tabId: 'tab-overview', class: 'bs-tab-panel' })">
        <p class="bs-lead">Welcome to the Vue 3 + Boobstrap starter template.</p>
        <div class="bs-segmented-control">
          <button class="bs-segmented-item" data-bs-state="active">Standard</button>
          <button class="bs-segmented-item">Compact</button>
          <button class="bs-segmented-item">Expanded</button>
        </div>
      </div>

      <div v-bind="tabs.getPanelProps({ id: 'panel-components', tabId: 'tab-components', class: 'bs-tab-panel' })">
        <div class="bs-dropzone">
          <span class="bs-dropzone-icon">📁</span>
          <span class="bs-dropzone-title">Upload files</span>
          <span class="bs-dropzone-hint">Drag and drop or browse from computer</span>
          <input type="file" class="bs-dropzone-input" />
        </div>
      </div>

      <div>
        <button v-bind="button.getButtonProps({ class: 'bs-btn bs-btn-primary', onClick: handleSave })">
          <span class="bs-btn-label">Save Settings</span>
          <span class="bs-spinner bs-btn-spinner" aria-hidden="true" />
        </button>
      </div>
    </section>

    <dialog v-bind="dialog.getDialogProps({ class: 'bs-dialog' })">
      <div class="bs-dialog-header">
        <h3 class="bs-dialog-title">Modal Title</h3>
      </div>
      <div class="bs-dialog-body">
        <p>This is a native HTML dialog orchestrated by Boobstrap's Vue 3 composable.</p>
      </div>
      <div class="bs-dialog-footer">
        <button class="bs-btn bs-btn-secondary" @click="dialog.hide('cancel')">Cancel</button>
        <button class="bs-btn bs-btn-primary" @click="dialog.hide('confirm')">Confirm</button>
      </div>
    </dialog>
  </main>
</template>
