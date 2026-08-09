import { emit, queryRoots, requireElement, setState } from "./shared.js";

const instances = new WeakMap();

export class Password {
  constructor(element) {
    this.element = requireElement(element, "Password");
    this.input = element.querySelector("[data-bs-password-input]") ?? element.querySelector('input[type="password"], input[type="text"]');
    this.toggleElement = element.querySelector("[data-bs-password-toggle]");
    this.labelElement = this.toggleElement?.querySelector("[data-bs-password-label]") ?? null;
    if (!this.input || !this.toggleElement) throw new Error("Password requires an input and a toggle.");

    this.showLabel = this.toggleElement.dataset.bsPasswordShowLabel ?? "Show password";
    this.hideLabel = this.toggleElement.dataset.bsPasswordHideLabel ?? "Hide password";
    this.onToggle = () => this.toggle();
    this.toggleElement.addEventListener("click", this.onToggle);
    this.sync();
    instances.set(element, this);
  }

  static getOrCreateInstance(element) {
    return instances.get(element) ?? new Password(element);
  }

  get visible() {
    return this.input.type === "text";
  }

  sync() {
    this.toggleElement.setAttribute("aria-pressed", String(this.visible));
    this.toggleElement.setAttribute("aria-label", this.visible ? this.hideLabel : this.showLabel);
    if (this.labelElement) this.labelElement.textContent = this.visible ? this.hideLabel : this.showLabel;
    setState(this.element, this.visible ? "visible" : "hidden");
  }

  setVisible(visible) {
    if (visible === this.visible) return false;
    if (!emit(this.element, "bs:password:toggle", { controller: this, visible }, true)) return false;
    const selectionStart = this.input.selectionStart;
    const selectionEnd = this.input.selectionEnd;
    this.input.type = visible ? "text" : "password";
    this.sync();
    this.input.focus({ preventScroll: true });
    if (selectionStart !== null && selectionEnd !== null) this.input.setSelectionRange(selectionStart, selectionEnd);
    emit(this.element, "bs:password:toggled", { controller: this, visible });
    return true;
  }

  toggle() {
    return this.setVisible(!this.visible);
  }

  destroy() {
    this.toggleElement.removeEventListener("click", this.onToggle);
    instances.delete(this.element);
  }
}

export function initPasswords(root = document) {
  return queryRoots(root, "[data-bs-password]").map((element) => Password.getOrCreateInstance(element));
}
