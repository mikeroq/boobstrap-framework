import { addFloatingArrow, autoPosition, nextFloatingId } from "./floating.js";
import { emit, queryRoots, requireElement, setState } from "./shared.js";

const instances = new WeakMap();

export class Popover {
  constructor(element) {
    this.element = requireElement(element, "Popover");
    this.document = element.ownerDocument;
    this.panel = null;
    this.stopPositioning = null;

    this.onToggle = (event) => {
      event.preventDefault();
      this.toggle({ reason: "trigger", sourceEvent: event });
    };
    this.onDocumentPointer = (event) => {
      if (!this.element.contains(event.target) && !this.panel?.contains(event.target)) this.hide({ reason: "outside", sourceEvent: event });
    };
    this.onKeydown = (event) => {
      if (event.key !== "Escape") return;
      if (this.hide({ reason: "escape", sourceEvent: event })) this.element.focus();
    };
    this.onScroll = (event) => {
      this.hide({ reason: "scroll", sourceEvent: event });
    };

    element.addEventListener("click", this.onToggle);
    element.addEventListener("keydown", this.onKeydown);
    element.setAttribute("aria-expanded", "false");
    setState(element, "hidden");
    instances.set(element, this);
  }

  static getOrCreateInstance(element) {
    return instances.get(element) ?? new Popover(element);
  }

  get visible() {
    return Boolean(this.panel && !this.panel.hidden);
  }

  createPanel() {
    const title = this.element.dataset.bsTitle || this.element.dataset.bsPopoverTitle || "";
    const content = this.element.dataset.bsContent || this.element.dataset.bsPopover || "";
    if (!title && !content) return null;
    const panel = this.document.createElement("div");
    panel.className = "bs-popover";
    panel.id = nextFloatingId("bs-popover");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", title || "More information");
    if (title) {
      const header = this.document.createElement("div");
      header.className = "bs-popover-header";
      header.textContent = title;
      panel.append(header);
    }
    if (content) {
      const body = this.document.createElement("div");
      body.className = "bs-popover-body";
      body.textContent = content;
      panel.append(body);
    }
    addFloatingArrow(panel);
    panel.hidden = true;
    this.document.body.append(panel);
    return panel;
  }

  show(options = {}) {
    if (this.visible) return false;
    const detail = { controller: this, reason: options.reason ?? "api", sourceEvent: options.sourceEvent };
    if (!emit(this.element, "bs:popover:show", detail, true)) return false;
    this.panel ??= this.createPanel();
    if (!this.panel) return false;
    this.panel.hidden = false;
    this.element.setAttribute("aria-controls", this.panel.id);
    this.element.setAttribute("aria-expanded", "true");
    this.stopPositioning = autoPosition(this.element, this.panel, this.element.dataset.bsPlacement ?? "bottom");
    this.document.addEventListener("pointerdown", this.onDocumentPointer);
    this.document.addEventListener("keydown", this.onKeydown);
    this.document.defaultView?.addEventListener("scroll", this.onScroll, true);
    setState(this.element, "shown");
    emit(this.element, "bs:popover:shown", detail);
    return true;
  }

  hide(options = {}) {
    if (!this.visible) return false;
    const detail = { controller: this, reason: options.reason ?? "api", sourceEvent: options.sourceEvent };
    if (!emit(this.element, "bs:popover:hide", detail, true)) return false;
    this.panel.hidden = true;
    this.element.setAttribute("aria-expanded", "false");
    this.stopPositioning?.();
    this.stopPositioning = null;
    this.document.removeEventListener("pointerdown", this.onDocumentPointer);
    this.document.removeEventListener("keydown", this.onKeydown);
    this.document.defaultView?.removeEventListener("scroll", this.onScroll, true);
    setState(this.element, "hidden");
    emit(this.element, "bs:popover:hidden", detail);
    return true;
  }

  toggle(options = {}) {
    return this.visible ? this.hide(options) : this.show(options);
  }

  destroy() {
    this.hide({ reason: "destroy" });
    this.element.removeEventListener("click", this.onToggle);
    this.element.removeEventListener("keydown", this.onKeydown);
    this.panel?.remove();
    instances.delete(this.element);
  }
}

export function initPopovers(root = document) {
  return queryRoots(root, "[data-bs-popover]").map((element) => Popover.getOrCreateInstance(element));
}
