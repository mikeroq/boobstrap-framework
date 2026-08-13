import { emit, positionFloating, setState } from "./shared.js";

export function tooltip(options = {}) {
  return {
    open: false,

    triggerElement() { return this.$refs.trigger; },
    panelElement() { return this.$refs.tooltip; },
    position() { positionFloating(this.triggerElement(), this.panelElement(), options.placement ?? "top"); },

    transition(nextOpen, reason = "api", sourceEvent) {
      if (nextOpen === this.open) return false;
      const trigger = this.triggerElement();
      const detail = { adapter: "alpine", component: this, open: nextOpen, reason, sourceEvent };
      if (!emit(trigger, `bs:tooltip:${nextOpen ? "show" : "hide"}`, detail, true)) return false;
      this.open = nextOpen;
      setState(trigger, nextOpen ? "shown" : "hidden");
      this.$nextTick(() => {
        if (nextOpen) this.position();
        emit(trigger, `bs:tooltip:${nextOpen ? "shown" : "hidden"}`, detail);
      });
      return true;
    },

    show(reason = "api", event) { return this.transition(true, reason, event); },
    hide(reason = "api", event) { return this.transition(false, reason, event); },
    trigger: {
      ["@mouseenter"](event) { this.show("mouseenter", event); },
      ["@mouseleave"](event) { this.hide("mouseleave", event); },
      ["@focus"](event) { this.show("focus", event); },
      ["@blur"](event) { this.hide("blur", event); },
      ["@keydown.escape"](event) { this.hide("escape", event); },
      [":aria-describedby"]() { return this.open ? this.panelElement()?.id : null; },
      [":data-bs-state"]() { return this.open ? "shown" : "hidden"; },
    },
    panel: {
      role: "tooltip",
      [":hidden"]() { return !this.open; },
      [":data-bs-placement"]() { return options.placement ?? "top"; },
    },
  };
}
