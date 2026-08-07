import { emit, setState } from "./shared.js";

export function collapse(initialOpen = false) {
  return {
    open: initialOpen,

    panelElement() {
      return this.$root.querySelector(".bs-collapse");
    },

    init() {
      this.$nextTick(() => setState(this.panelElement(), this.open ? "open" : "closed"));
    },

    transition(open) {
      if (open === this.open) return false;
      const action = open ? "show" : "hide";
      if (!emit(this.panelElement(), `bs:collapse:${action}`, { adapter: "alpine", component: this }, true)) return false;
      this.open = open;
      setState(this.panelElement(), open ? "open" : "closed");
      this.$nextTick(() => emit(this.panelElement(), `bs:collapse:${open ? "shown" : "hidden"}`, { adapter: "alpine", component: this }));
      return true;
    },

    show() {
      return this.transition(true);
    },

    hide() {
      return this.transition(false);
    },

    toggle() {
      return this.transition(!this.open);
    },

    trigger: {
      ["@click"]() {
        this.toggle();
      },
      [":aria-expanded"]() {
        return String(this.open);
      },
    },

    panel: {
      [":hidden"]() {
        return !this.open;
      },
      [":data-bs-state"]() {
        return this.open ? "open" : "closed";
      },
    },
  };
}
