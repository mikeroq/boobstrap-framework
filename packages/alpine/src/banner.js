import { emit, setState } from "./shared.js";

export function banner(initialVisible = true) {
  return {
    visible: initialVisible,

    rootElement() {
      return this.$refs.banner;
    },

    dismissElement() {
      return this.$refs.dismiss ?? this.rootElement()?.querySelector("[data-bs-banner-dismiss]");
    },

    init() {
      const root = this.rootElement();
      const dismiss = this.dismissElement();
      if (dismiss && !dismiss.textContent.trim() && !dismiss.hasAttribute("aria-label")) {
        dismiss.setAttribute("aria-label", "Dismiss banner");
      }
      setState(root, this.visible ? "visible" : "dismissed");
    },

    transition(visible) {
      if (visible === this.visible) return false;
      const root = this.rootElement();
      const action = visible ? "show" : "dismiss";
      if (!emit(root, `bs:banner:${action}`, { adapter: "alpine", component: this }, true)) return false;
      this.visible = visible;
      root.hidden = !visible;
      setState(root, visible ? "visible" : "dismissed");
      this.$nextTick(() => emit(root, `bs:banner:${visible ? "shown" : "dismissed"}`, { adapter: "alpine", component: this }));
      return true;
    },

    show() {
      return this.transition(true);
    },

    dismiss() {
      return this.transition(false);
    },

    root: {
      [":hidden"]() {
        return !this.visible;
      },
      [":data-bs-state"]() {
        return this.visible ? "visible" : "dismissed";
      },
    },

    dismissButton: {
      ["@click"]() {
        this.dismiss();
      },
    },
  };
}
