import { emit, queryRoots, requireElement, setState } from "./shared.js";

const instances = new WeakMap();

export class Banner {
  constructor(element) {
    this.element = requireElement(element, "Banner");
    this.dismissElement = element.querySelector("[data-bs-banner-dismiss]");
    this.onDismiss = () => this.dismiss();

    if (this.dismissElement) {
      if (!this.dismissElement.textContent.trim() && !this.dismissElement.hasAttribute("aria-label")) {
        this.dismissElement.setAttribute("aria-label", "Dismiss banner");
      }
      this.dismissElement.addEventListener("click", this.onDismiss);
    }

    this.sync();
    instances.set(element, this);
  }

  static getOrCreateInstance(element) {
    return instances.get(element) ?? new Banner(element);
  }

  get visible() {
    return !this.element.hidden;
  }

  sync() {
    setState(this.element, this.visible ? "visible" : "dismissed");
  }

  dismiss() {
    if (!this.visible || !emit(this.element, "bs:banner:dismiss", { controller: this }, true)) return false;
    this.element.hidden = true;
    this.sync();
    emit(this.element, "bs:banner:dismissed", { controller: this });
    return true;
  }

  show() {
    if (this.visible || !emit(this.element, "bs:banner:show", { controller: this }, true)) return false;
    this.element.hidden = false;
    this.sync();
    emit(this.element, "bs:banner:shown", { controller: this });
    return true;
  }

  destroy() {
    this.dismissElement?.removeEventListener("click", this.onDismiss);
    instances.delete(this.element);
  }
}

export function initBanners(root = document) {
  return queryRoots(root, "[data-bs-banner]").map((element) => Banner.getOrCreateInstance(element));
}
