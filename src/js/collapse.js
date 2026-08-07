import { emit, queryRoots, requireElement, setState } from "./shared.js";

const instances = new WeakMap();

export class Collapse {
  constructor(element, options = {}) {
    this.element = requireElement(element, "Collapse");
    this.triggers = options.triggers
      ? [...options.triggers]
      : [...element.ownerDocument.querySelectorAll('[data-bs-toggle="collapse"]')]
        .filter((trigger) => trigger.getAttribute("aria-controls") === element.id);
    this.onTriggerClick = (event) => {
      event.preventDefault();
      this.toggle();
    };

    for (const trigger of this.triggers) trigger.addEventListener("click", this.onTriggerClick);
    this.sync();
    instances.set(element, this);
  }

  static getOrCreateInstance(element, options) {
    return instances.get(element) ?? new Collapse(element, options);
  }

  get expanded() {
    return !this.element.hidden;
  }

  sync() {
    const expanded = this.expanded;
    setState(this.element, expanded ? "open" : "closed");
    for (const trigger of this.triggers) trigger.setAttribute("aria-expanded", String(expanded));
  }

  show() {
    if (this.expanded || !emit(this.element, "bs:collapse:show", { controller: this }, true)) return false;
    this.element.hidden = false;
    this.sync();
    emit(this.element, "bs:collapse:shown", { controller: this });
    return true;
  }

  hide() {
    if (!this.expanded || !emit(this.element, "bs:collapse:hide", { controller: this }, true)) return false;
    this.element.hidden = true;
    this.sync();
    emit(this.element, "bs:collapse:hidden", { controller: this });
    return true;
  }

  toggle() {
    return this.expanded ? this.hide() : this.show();
  }

  destroy() {
    for (const trigger of this.triggers) trigger.removeEventListener("click", this.onTriggerClick);
    instances.delete(this.element);
  }
}

export function initCollapses(root = document) {
  return queryRoots(root, ".bs-collapse[id]").map((element) => Collapse.getOrCreateInstance(element));
}
