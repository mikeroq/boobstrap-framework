import { emit, setState } from "./shared.js";

export function toast(initialOpen = false, options = {}) {
  return {
    open: initialOpen,
    timer: null,

    panelElement() {
      return this.$refs.toast;
    },

    init() {
      const panel = this.panelElement();
      panel.hidden = !this.open;
      setState(panel, this.open ? "shown" : "hidden");
      if (this.open) this.schedule();
    },

    schedule() {
      clearTimeout(this.timer);
      if (options.autohide === false || !this.open) return;
      this.timer = setTimeout(() => this.hide("timeout"), options.duration ?? 5000);
    },

    transition(nextOpen, reason = "api", sourceEvent) {
      if (nextOpen === this.open) return false;
      const panel = this.panelElement();
      const detail = { adapter: "alpine", component: this, open: nextOpen, reason, sourceEvent };
      if (!emit(panel, `bs:toast:${nextOpen ? "show" : "hide"}`, detail, true)) return false;
      this.open = nextOpen;
      panel.hidden = !nextOpen;
      setState(panel, nextOpen ? "shown" : "hidden");
      if (nextOpen) this.schedule();
      else clearTimeout(this.timer);
      this.$nextTick(() => emit(panel, `bs:toast:${nextOpen ? "shown" : "hidden"}`, detail));
      return true;
    },

    show(reason = "api", sourceEvent) { return this.transition(true, reason, sourceEvent); },
    hide(reason = "api", sourceEvent) { return this.transition(false, reason, sourceEvent); },
    destroy() { clearTimeout(this.timer); },

    trigger: {
      ["@click"](event) { this.show("trigger", event); },
      [":aria-expanded"]() { return String(this.open); },
    },
    panel: {
      [":hidden"]() { return !this.open; },
      [":data-bs-state"]() { return this.open ? "shown" : "hidden"; },
      ["@pointerenter"]() { clearTimeout(this.timer); },
      ["@pointerleave"]() { this.schedule(); },
      ["@focusin"]() { clearTimeout(this.timer); },
      ["@focusout"]() { this.schedule(); },
    },
    dismiss: {
      ["@click"](event) { this.hide("dismiss", event); },
      [":aria-label"]() { return "Dismiss notification"; },
    },
  };
}
