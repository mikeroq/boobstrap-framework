import { emit, queryRoots, requireElement, setState } from "./shared.js";

const instances = new WeakMap();
const itemSelector = '[role="menuitem"]:not(:disabled):not([aria-disabled="true"])';

export class Dropdown {
  constructor(element) {
    this.element = requireElement(element, "Dropdown");
    this.toggleElement = element.querySelector('[data-bs-toggle="dropdown"]');
    this.menu = element.querySelector("[data-bs-dropdown-menu]");
    if (!this.toggleElement || !this.menu) {
      throw new Error("Dropdown requires a toggle and a menu.");
    }

    this.onToggleClick = (event) => {
      event.preventDefault();
      this.toggle();
    };
    this.onMenuClick = (event) => {
      if (event.target.closest(itemSelector)) this.hide();
    };
    this.onKeydown = (event) => this.handleKeydown(event);
    this.onDocumentPointerdown = (event) => {
      if (this.expanded && !this.element.contains(event.target)) this.hide();
    };

    this.toggleElement.addEventListener("click", this.onToggleClick);
    this.menu.addEventListener("click", this.onMenuClick);
    this.element.addEventListener("keydown", this.onKeydown);
    element.ownerDocument.addEventListener("pointerdown", this.onDocumentPointerdown);
    this.toggleElement.setAttribute("aria-haspopup", "menu");
    this.sync();
    instances.set(element, this);
  }

  static getOrCreateInstance(element) {
    return instances.get(element) ?? new Dropdown(element);
  }

  get expanded() {
    return !this.menu.hidden;
  }

  get items() {
    return [...this.menu.querySelectorAll(itemSelector)].filter((item) => !item.hidden);
  }

  sync() {
    const expanded = this.expanded;
    this.toggleElement.setAttribute("aria-expanded", String(expanded));
    setState(this.element, expanded ? "open" : "closed");
    setState(this.menu, expanded ? "open" : "closed");
  }

  show() {
    if (this.expanded || !emit(this.element, "bs:dropdown:show", { controller: this }, true)) return false;
    this.menu.hidden = false;
    this.sync();
    emit(this.element, "bs:dropdown:shown", { controller: this });
    return true;
  }

  hide(options = {}) {
    if (!this.expanded || !emit(this.element, "bs:dropdown:hide", { controller: this }, true)) return false;
    this.menu.hidden = true;
    this.sync();
    if (options.restoreFocus) this.toggleElement.focus();
    emit(this.element, "bs:dropdown:hidden", { controller: this });
    return true;
  }

  toggle() {
    return this.expanded ? this.hide() : this.show();
  }

  focusItem(index) {
    const items = this.items;
    if (!items.length) return;
    items[(index + items.length) % items.length].focus();
  }

  handleKeydown(event) {
    const items = this.items;
    const itemIndex = items.indexOf(event.target);
    if (event.key === "Escape" && this.expanded) {
      event.preventDefault();
      this.hide({ restoreFocus: true });
      return;
    }
    if (event.key === "Tab" && this.expanded) {
      this.hide();
      return;
    }
    if (event.target === this.toggleElement && ["ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
      this.show();
      this.focusItem(event.key === "ArrowDown" ? 0 : -1);
      return;
    }
    if (itemIndex < 0) return;
    const nextIndex = {
      ArrowDown: itemIndex + 1,
      ArrowUp: itemIndex - 1,
      Home: 0,
      End: items.length - 1,
    }[event.key];
    if (nextIndex !== undefined) {
      event.preventDefault();
      this.focusItem(nextIndex);
    }
  }

  destroy() {
    this.toggleElement.removeEventListener("click", this.onToggleClick);
    this.menu.removeEventListener("click", this.onMenuClick);
    this.element.removeEventListener("keydown", this.onKeydown);
    this.element.ownerDocument.removeEventListener("pointerdown", this.onDocumentPointerdown);
    instances.delete(this.element);
  }
}

export function initDropdowns(root = document) {
  return queryRoots(root, "[data-bs-dropdown]").map((element) => Dropdown.getOrCreateInstance(element));
}
