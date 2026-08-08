import { emit, setState } from "./shared.js";

export function button(initialLoading = false) {
  return {
    loading: initialLoading,
    initiallyDisabled: false,
    originalAriaLabel: null,

    init() {
      this.initiallyDisabled = this.$root.disabled;
      this.originalAriaLabel = this.$root.getAttribute("aria-label");
      setState(this.$root, this.loading ? "loading" : "idle");
    },

    transition(loading, reason = "api") {
      if (loading === this.loading) return false;
      const action = loading ? "start" : "stop";
      const detail = { adapter: "alpine", loading, reason, component: this };
      if (!emit(this.$root, `bs:button:${action}`, detail, true)) return false;
      this.loading = loading;
      setState(this.$root, loading ? "loading" : "idle");
      this.$nextTick(() => emit(this.$root, `bs:button:${loading ? "started" : "stopped"}`, detail));
      return true;
    },

    start(reason) {
      return this.transition(true, reason);
    },

    stop(reason) {
      return this.transition(false, reason);
    },

    toggle(reason) {
      return this.transition(!this.loading, reason);
    },

    root: {
      ["@click"]() {
        if (this.$root.hasAttribute("data-bs-loading")) this.start("trigger");
      },
      [":disabled"]() {
        return this.initiallyDisabled || this.loading;
      },
      [":aria-busy"]() {
        return this.loading ? "true" : null;
      },
      [":aria-label"]() {
        return this.loading ? (this.$root.dataset.bsLoadingLabel || "Loading") : this.originalAriaLabel;
      },
      [":data-bs-state"]() {
        return this.loading ? "loading" : "idle";
      },
    },
  };
}
