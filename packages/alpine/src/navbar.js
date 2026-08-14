import { emit, setState } from "./shared.js";

export function navbar(initialOpen = false) {
  return {
    open: initialOpen,
    restoreTarget: null,

    menuElement() {
      return this.$refs.navbar;
    },

    init() {
      this.$nextTick(() => setState(this.menuElement(), this.open ? "open" : "closed"));
    },

    transition(nextOpen, reason = "api", sourceEvent) {
      if (nextOpen === this.open) return false;
      const menu = this.menuElement();
      const detail = { adapter: "alpine", component: this, reason, sourceEvent };
      if (!emit(menu, `bs:navbar:${nextOpen ? "show" : "hide"}`, detail, true)) return false;
      if (nextOpen) this.restoreTarget = sourceEvent?.currentTarget ?? menu.ownerDocument.activeElement;
      this.open = nextOpen;
      setState(menu, nextOpen ? "open" : "closed");
      menu.ownerDocument.body?.classList.toggle("bs-navbar-open", nextOpen);
      if (!nextOpen && this.restoreTarget?.isConnected) this.restoreTarget.focus();
      this.$nextTick(() => emit(menu, `bs:navbar:${nextOpen ? "shown" : "hidden"}`, detail));
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
      this.menuElement()?.ownerDocument.body?.classList.remove("bs-navbar-open");
    },

    trigger: {
      ["@click"](event) {
        this.toggle("trigger", event);
      },
      [":aria-expanded"]() {
        return String(this.open);
      },
    },

    menu: {
      ["@keydown.escape.window"](event) {
        if (this.open) this.hide("escape", event);
      },
      ["@click"](event) {
        if (event.target.closest("[data-bs-navbar-close]")) this.hide("selection", event);
      },
      [":data-bs-state"]() {
        return this.open ? "open" : "closed";
      },
    },

    dismiss: {
      ["@click"](event) {
        this.hide("dismiss", event);
      },
      [":data-bs-state"]() {
        return this.open ? "open" : "closed";
      },
    },
  };
}
