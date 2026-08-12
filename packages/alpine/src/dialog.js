import { emit, setState } from "./shared.js";

function isBackdropPointer(element, event) {
  if (event.target !== element) return false;
  const rect = element.getBoundingClientRect();
  return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
}

function syncDocumentState(document) {
  document.body?.classList.toggle("bs-dialog-open", Boolean(document.querySelector("dialog[open]")));
}

export function dialog(initialOpen = false) {
  return {
    open: initialOpen,
    restoreTarget: null,

    panelElement() {
      return this.$refs.dialog;
    },

    init() {
      const panel = this.panelElement();
      this.onNativeClose = () => {
        if (!this.open) return;
        this.open = false;
        setState(panel, "closed");
        syncDocumentState(panel.ownerDocument);
        if (this.restoreTarget?.isConnected) this.restoreTarget.focus();
        emit(panel, "bs:dialog:hidden", { adapter: "alpine", component: this, reason: "native" });
      };
      panel.addEventListener("close", this.onNativeClose);
      this.$nextTick(() => {
        if (this.open && !panel.open) panel.showModal();
        setState(panel, this.open ? "open" : "closed");
        syncDocumentState(panel.ownerDocument);
      });
    },

    transition(nextOpen, reason = "api", sourceEvent) {
      if (nextOpen === this.open) return false;
      const panel = this.panelElement();
      const action = nextOpen ? "show" : "hide";
      const detail = { adapter: "alpine", component: this, reason, sourceEvent };
      if (!emit(panel, `bs:dialog:${action}`, detail, true)) return false;
      if (nextOpen) {
        this.restoreTarget = sourceEvent?.currentTarget ?? panel.ownerDocument.activeElement;
        panel.showModal();
      } else {
        panel.close();
      }
      this.open = nextOpen;
      setState(panel, nextOpen ? "open" : "closed");
      syncDocumentState(panel.ownerDocument);
      if (!nextOpen && this.restoreTarget?.isConnected) this.restoreTarget.focus();
      this.$nextTick(() => emit(panel, `bs:dialog:${nextOpen ? "shown" : "hidden"}`, detail));
      return true;
    },

    show(reason = "api", sourceEvent) {
      return this.transition(true, reason, sourceEvent);
    },

    hide(reason = "api", sourceEvent) {
      return this.transition(false, reason, sourceEvent);
    },

    toggle(reason = "api", sourceEvent) {
      return this.transition(!this.open, reason, sourceEvent);
    },

    destroy() {
      this.panelElement()?.removeEventListener("close", this.onNativeClose);
    },

    trigger: {
      ["@click"](event) {
        this.toggle("trigger", event);
      },
      [":aria-expanded"]() {
        return String(this.open);
      },
    },

    panel: {
      ["@cancel"](event) {
        event.preventDefault();
        this.hide("escape", event);
      },
      ["@click"](event) {
        if (this.panelElement().dataset.bsDialogCloseOnBackdrop !== "false" && isBackdropPointer(this.panelElement(), event)) {
          this.hide("backdrop", event);
        }
      },
      [":data-bs-state"]() {
        return this.open ? "open" : "closed";
      },
    },

    dismiss: {
      ["@click"](event) {
        this.hide("dismiss", event);
      },
    },
  };
}
