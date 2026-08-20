import { emit, positionFloating, setState } from "./shared.js";

export function popover(options = {}) {
  return {
    open: false,
    triggerElement() { return this.$refs.trigger; },
    panelElement() { return this.$refs.popover; },
    position() { positionFloating(this.triggerElement(), this.panelElement(), options.placement ?? "bottom"); },

    transition(nextOpen, reason = "api", sourceEvent) {
      if (nextOpen === this.open) return false;
      const trigger = this.triggerElement();
      const detail = { adapter: "alpine", component: this, open: nextOpen, reason, sourceEvent };
      if (!emit(trigger, `bs:popover:${nextOpen ? "show" : "hide"}`, detail, true)) return false;
      this.open = nextOpen;
      setState(trigger, nextOpen ? "shown" : "hidden");
      this.$nextTick(() => {
        if (nextOpen) this.position();
        emit(trigger, `bs:popover:${nextOpen ? "shown" : "hidden"}`, detail);
      });
      return true;
    },
    show(reason = "api", event) { return this.transition(true, reason, event); },
    hide(reason = "api", event) { return this.transition(false, reason, event); },
    toggle(reason = "api", event) { return this.transition(!this.open, reason, event); },
    trigger: {
      ["@click"](event) { this.toggle("trigger", event); },
      ["@keydown.escape"](event) { this.hide("escape", event); },
      [":aria-controls"]() { return this.panelElement()?.id; },
      [":aria-expanded"]() { return String(this.open); },
      [":data-bs-state"]() { return this.open ? "shown" : "hidden"; },
    },
    panel: {
      role: "dialog",
      ["@scroll.window"](event) { this.hide("scroll", event); },
      ["@click.outside"](event) {
        if (!this.triggerElement().contains(event.target)) this.hide("outside", event);
      },
      [":hidden"]() { return !this.open; },
      [":data-bs-placement"]() { return options.placement ?? "bottom"; },
    },
  };
}
