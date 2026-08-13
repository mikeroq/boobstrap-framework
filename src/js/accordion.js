import { Collapse } from "./collapse.js";
import { queryRoots, requireElement } from "./shared.js";

const instances = new WeakMap();

export class Accordion {
  constructor(element) {
    this.element = requireElement(element, "Accordion");
    this.panels = [...element.querySelectorAll(".bs-collapse[id]")];
    this.collapses = this.panels.map((panel) => Collapse.getOrCreateInstance(panel));
    this.onShow = (event) => {
      if (this.alwaysOpen || !this.element.contains(event.target)) return;
      const siblings = this.collapses.filter((collapse) => collapse.element !== event.target && collapse.expanded);
      if (siblings.some((collapse) => !collapse.hide())) event.preventDefault();
    };
    element.addEventListener("bs:collapse:show", this.onShow);
    instances.set(element, this);
  }

  static getOrCreateInstance(element) {
    return instances.get(element) ?? new Accordion(element);
  }

  get alwaysOpen() {
    return this.element.hasAttribute("data-bs-accordion-always-open");
  }

  destroy() {
    this.element.removeEventListener("bs:collapse:show", this.onShow);
    instances.delete(this.element);
  }
}

export function initAccordions(root = document) {
  return queryRoots(root, "[data-bs-accordion]").map((element) => Accordion.getOrCreateInstance(element));
}
