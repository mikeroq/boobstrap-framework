import { emit, queryRoots, requireElement, setState } from "./shared.js";

const instances = new WeakMap();
const focusableSelector = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])";

const controlledSelector = (attribute, id) => `[${attribute}][aria-controls="${CSS.escape(id)}"]`;

export class Sidebar {
  constructor(element) {
    this.element = requireElement(element, "Sidebar");
    if (!element.id) throw new Error("Sidebar requires an id.");

    this.document = element.ownerDocument;
    this.media = matchMedia(element.dataset.bsSidebarMedia || "(max-width: 64rem)");
    this.open = element.dataset.bsState === "open";
    this.triggers = [...this.document.querySelectorAll(controlledSelector("data-bs-toggle=\"sidebar\"", element.id))];
    this.dismissers = [
      ...element.querySelectorAll("[data-bs-sidebar-dismiss]"),
      ...this.document.querySelectorAll(controlledSelector("data-bs-sidebar-dismiss", element.id)),
    ];
    this.backdrops = this.dismissers.filter((item) => item.classList.contains("bs-sidebar-backdrop"));
    this.restoreTarget = null;
    this.originalRole = element.getAttribute("role");
    this.originalTabIndex = element.getAttribute("tabindex");

    this.onTrigger = (event) => {
      event.preventDefault();
      this.toggle({ reason: "trigger", sourceEvent: event, restoreTarget: event.currentTarget });
    };
    this.onDismiss = (event) => {
      event.preventDefault();
      this.hide({ reason: "dismiss", sourceEvent: event });
    };
    this.onElementClick = (event) => {
      if (event.target.closest("[data-bs-sidebar-close]")) this.hide({ reason: "selection", sourceEvent: event, restoreFocus: false });
    };
    this.onKeydown = (event) => this.handleKeydown(event);
    this.onMediaChange = () => this.sync();

    this.triggers.forEach((trigger) => trigger.addEventListener("click", this.onTrigger));
    this.dismissers.forEach((dismiss) => dismiss.addEventListener("click", this.onDismiss));
    element.addEventListener("click", this.onElementClick);
    this.document.addEventListener("keydown", this.onKeydown);
    this.media.addEventListener("change", this.onMediaChange);
    this.sync();
    instances.set(element, this);
  }

  static getOrCreateInstance(element) {
    return instances.get(element) ?? new Sidebar(element);
  }

  get overlay() {
    return this.media.matches;
  }

  get focusableElements() {
    return [...this.element.querySelectorAll(focusableSelector)].filter((item) => (
      !item.hidden && item.getAttribute("aria-hidden") !== "true" && item.getClientRects().length > 0
    ));
  }

  syncDocumentState() {
    const hasOpenOverlay = Boolean(this.document.querySelector('[data-bs-sidebar][data-bs-overlay="open"]'));
    this.document.body?.classList.toggle("bs-sidebar-open", hasOpenOverlay);
  }

  sync() {
    const displayedOpen = !this.overlay || this.open;
    setState(this.element, displayedOpen ? "open" : "closed");
    this.element.dataset.bsOverlay = this.overlay && this.open ? "open" : "closed";
    this.triggers.forEach((trigger) => trigger.setAttribute("aria-expanded", String(displayedOpen)));
    this.backdrops.forEach((backdrop) => setState(backdrop, this.overlay && this.open ? "open" : "closed"));

    if (this.overlay) {
      this.element.setAttribute("role", "dialog");
      this.element.setAttribute("aria-modal", "true");
      this.element.setAttribute("aria-hidden", String(!this.open));
      this.element.inert = !this.open;
      if (!this.element.hasAttribute("tabindex")) this.element.tabIndex = -1;
    } else {
      if (this.originalRole === null) this.element.removeAttribute("role");
      else this.element.setAttribute("role", this.originalRole);
      this.element.removeAttribute("aria-modal");
      this.element.removeAttribute("aria-hidden");
      this.element.inert = false;
      if (this.originalTabIndex === null) this.element.removeAttribute("tabindex");
      else this.element.setAttribute("tabindex", this.originalTabIndex);
    }
    this.syncDocumentState();
  }

  show(options = {}) {
    if (this.open) return false;
    const detail = { controller: this, reason: options.reason ?? "api", sourceEvent: options.sourceEvent };
    if (!emit(this.element, "bs:sidebar:show", detail, true)) return false;
    this.open = true;
    this.restoreTarget = options.restoreTarget ?? this.document.activeElement;
    this.sync();
    if (this.overlay) queueMicrotask(() => (this.focusableElements[0] ?? this.element).focus());
    emit(this.element, "bs:sidebar:shown", detail);
    return true;
  }

  hide(options = {}) {
    if (!this.open) return false;
    const detail = { controller: this, reason: options.reason ?? "api", sourceEvent: options.sourceEvent };
    if (!emit(this.element, "bs:sidebar:hide", detail, true)) return false;
    this.open = false;
    this.sync();
    if (options.restoreFocus !== false && this.restoreTarget?.isConnected) this.restoreTarget.focus();
    emit(this.element, "bs:sidebar:hidden", detail);
    return true;
  }

  toggle(options = {}) {
    return this.open ? this.hide(options) : this.show(options);
  }

  handleKeydown(event) {
    if (!this.overlay || !this.open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      this.hide({ reason: "escape", sourceEvent: event });
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = this.focusableElements;
    if (!focusable.length) {
      event.preventDefault();
      this.element.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && this.document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && this.document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  destroy() {
    this.triggers.forEach((trigger) => trigger.removeEventListener("click", this.onTrigger));
    this.dismissers.forEach((dismiss) => dismiss.removeEventListener("click", this.onDismiss));
    this.element.removeEventListener("click", this.onElementClick);
    this.document.removeEventListener("keydown", this.onKeydown);
    this.media.removeEventListener("change", this.onMediaChange);
    this.element.inert = false;
    delete this.element.dataset.bsOverlay;
    this.document.body?.classList.remove("bs-sidebar-open");
    instances.delete(this.element);
  }
}

export function initSidebars(root = document) {
  return queryRoots(root, "[data-bs-sidebar]").map((element) => Sidebar.getOrCreateInstance(element));
}
