import { emit, setState } from "./shared.js";

export function password(options = {}) {
  return {
    visible: false,
    showLabel: "Show password",
    hideLabel: "Hide password",

    init() {
      this.input = this.$el.querySelector("[data-bs-password-input]") ?? this.$el.querySelector('input[type="password"], input[type="text"]');
      this.toggleElement = this.$el.querySelector("[data-bs-password-toggle]");
      this.labelElement = this.toggleElement?.querySelector("[data-bs-password-label]") ?? null;
      if (this.toggleElement) {
        this.showLabel = this.toggleElement.dataset.bsPasswordShowLabel ?? options.showLabel ?? "Show password";
        this.hideLabel = this.toggleElement.dataset.bsPasswordHideLabel ?? options.hideLabel ?? "Hide password";
      }
      this.visible = this.input?.type === "text";
      this.sync();
    },

    sync() {
      if (!this.toggleElement) return;
      this.toggleElement.setAttribute("aria-pressed", String(this.visible));
      this.toggleElement.setAttribute("aria-label", this.visible ? this.hideLabel : this.showLabel);
      if (this.labelElement) this.labelElement.textContent = this.visible ? this.hideLabel : this.showLabel;
      setState(this.$el, this.visible ? "visible" : "hidden");
    },

    setVisible(visible) {
      if (visible === this.visible || !this.input) return false;
      if (!emit(this.$el, "bs:password:toggle", { adapter: "alpine", component: this, visible }, true)) return false;
      const selectionStart = this.input.selectionStart;
      const selectionEnd = this.input.selectionEnd;
      this.visible = visible;
      this.input.type = visible ? "text" : "password";
      this.sync();
      this.input.focus({ preventScroll: true });
      if (selectionStart !== null && selectionEnd !== null) this.input.setSelectionRange(selectionStart, selectionEnd);
      emit(this.$el, "bs:password:toggled", { adapter: "alpine", component: this, visible });
      return true;
    },

    toggle() {
      return this.setVisible(!this.visible);
    },

    toggleButton: {
      ["@click"]() {
        this.toggle();
      },
      [":aria-pressed"]() {
        return String(this.visible);
      },
      [":aria-label"]() {
        return this.visible ? this.hideLabel : this.showLabel;
      },
    },
  };
}
