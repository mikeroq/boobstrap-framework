import { emit, queryRoots, requireElement, setState } from "./shared.js";

const instances = new WeakMap();

export class Button {
  constructor(element, options = {}) {
    this.element = requireElement(element, "Button");
    this.autoStart = options.autoStart ?? element.hasAttribute("data-bs-loading");
    this.original = null;
    this.onClick = () => {
      if (this.autoStart) queueMicrotask(() => this.start({ reason: "trigger" }));
    };

    this.element.addEventListener("click", this.onClick);
    if (this.element.dataset.bsState !== "loading") setState(this.element, "idle");
    instances.set(element, this);
  }

  static getOrCreateInstance(element, options) {
    return instances.get(element) ?? new Button(element, options);
  }

  get loading() {
    return this.element.dataset.bsState === "loading";
  }

  start(options = {}) {
    if (this.loading) return false;
    const detail = { controller: this, reason: options.reason ?? "api" };
    if (!emit(this.element, "bs:button:start", detail, true)) return false;

    this.original = {
      disabled: "disabled" in this.element ? this.element.disabled : undefined,
      ariaBusy: this.element.getAttribute("aria-busy"),
      ariaDisabled: this.element.getAttribute("aria-disabled"),
      ariaLabel: this.element.getAttribute("aria-label"),
    };

    if ("disabled" in this.element) this.element.disabled = true;
    else this.element.setAttribute("aria-disabled", "true");
    this.element.setAttribute("aria-busy", "true");
    this.element.setAttribute("aria-label", this.element.dataset.bsLoadingLabel || "Loading");
    setState(this.element, "loading");
    emit(this.element, "bs:button:started", detail);
    return true;
  }

  stop(options = {}) {
    if (!this.loading) return false;
    const detail = { controller: this, reason: options.reason ?? "api" };
    if (!emit(this.element, "bs:button:stop", detail, true)) return false;

    this.restore();
    emit(this.element, "bs:button:stopped", detail);
    return true;
  }

  toggle(options) {
    return this.loading ? this.stop(options) : this.start(options);
  }

  restore() {
    if (this.original) {
      if ("disabled" in this.element) this.element.disabled = this.original.disabled;
      this.restoreAttribute("aria-busy", this.original.ariaBusy);
      this.restoreAttribute("aria-disabled", this.original.ariaDisabled);
      this.restoreAttribute("aria-label", this.original.ariaLabel);
    }
    setState(this.element, "idle");
    this.original = null;
  }

  restoreAttribute(name, value) {
    if (value === null) this.element.removeAttribute(name);
    else this.element.setAttribute(name, value);
  }

  destroy() {
    this.element.removeEventListener("click", this.onClick);
    if (this.loading) this.restore();
    instances.delete(this.element);
  }
}

export function initButtons(root = document) {
  return queryRoots(root, "[data-bs-button]").map((element) => Button.getOrCreateInstance(element));
}
