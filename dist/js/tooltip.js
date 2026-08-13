import { addFloatingArrow, autoPosition, nextFloatingId } from "./floating.js";
import { emit, queryRoots, requireElement, setState } from "./shared.js";

const instances = new WeakMap();

function tooltipContent(element) {
  return element.dataset.bsTitle || element.dataset.bsTooltip || element.getAttribute("title") || "";
}

export class Tooltip {
  constructor(element) {
    this.element = requireElement(element, "Tooltip");
    this.document = element.ownerDocument;
    this.panel = null;
    this.stopPositioning = null;
    this.originalTitle = element.getAttribute("title");
    if (this.originalTitle) element.removeAttribute("title");

    this.onShow = (event) => this.show({ reason: event.type, sourceEvent: event });
    this.onHide = (event) => this.hide({ reason: event.type, sourceEvent: event });
    this.onKeydown = (event) => {
      if (event.key === "Escape") this.hide({ reason: "escape", sourceEvent: event });
    };

    element.addEventListener("mouseenter", this.onShow);
    element.addEventListener("mouseleave", this.onHide);
    element.addEventListener("focusin", this.onShow);
    element.addEventListener("focusout", this.onHide);
    element.addEventListener("keydown", this.onKeydown);
    setState(element, "hidden");
    instances.set(element, this);
  }

  static getOrCreateInstance(element) {
    return instances.get(element) ?? new Tooltip(element);
  }

  get visible() {
    return Boolean(this.panel && !this.panel.hidden);
  }

  createPanel() {
    const content = tooltipContent(this.element);
    if (!content) return null;
    const panel = this.document.createElement("div");
    panel.className = "bs-tooltip";
    panel.id = nextFloatingId("bs-tooltip");
    panel.setAttribute("role", "tooltip");
    panel.textContent = content;
    addFloatingArrow(panel);
    panel.hidden = true;
    this.document.body.append(panel);
    return panel;
  }

  show(options = {}) {
    if (this.visible) return false;
    const detail = { controller: this, reason: options.reason ?? "api", sourceEvent: options.sourceEvent };
    if (!emit(this.element, "bs:tooltip:show", detail, true)) return false;
    this.panel ??= this.createPanel();
    if (!this.panel) return false;
    this.panel.hidden = false;
    this.element.setAttribute("aria-describedby", [this.element.getAttribute("aria-describedby"), this.panel.id].filter(Boolean).join(" "));
    this.stopPositioning = autoPosition(this.element, this.panel, this.element.dataset.bsPlacement ?? "top");
    setState(this.element, "shown");
    emit(this.element, "bs:tooltip:shown", detail);
    return true;
  }

  hide(options = {}) {
    if (!this.visible) return false;
    const detail = { controller: this, reason: options.reason ?? "api", sourceEvent: options.sourceEvent };
    if (!emit(this.element, "bs:tooltip:hide", detail, true)) return false;
    this.panel.hidden = true;
    this.stopPositioning?.();
    this.stopPositioning = null;
    const describedBy = (this.element.getAttribute("aria-describedby") ?? "").split(/\s+/).filter((id) => id && id !== this.panel.id);
    if (describedBy.length) this.element.setAttribute("aria-describedby", describedBy.join(" "));
    else this.element.removeAttribute("aria-describedby");
    setState(this.element, "hidden");
    emit(this.element, "bs:tooltip:hidden", detail);
    return true;
  }

  destroy() {
    this.hide({ reason: "destroy" });
    this.element.removeEventListener("mouseenter", this.onShow);
    this.element.removeEventListener("mouseleave", this.onHide);
    this.element.removeEventListener("focusin", this.onShow);
    this.element.removeEventListener("focusout", this.onHide);
    this.element.removeEventListener("keydown", this.onKeydown);
    if (this.originalTitle) this.element.setAttribute("title", this.originalTitle);
    this.panel?.remove();
    instances.delete(this.element);
  }
}

export function initTooltips(root = document) {
  return queryRoots(root, "[data-bs-tooltip]").map((element) => Tooltip.getOrCreateInstance(element));
}
