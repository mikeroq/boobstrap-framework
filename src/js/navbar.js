import { emit, queryRoots, requireElement, setState } from "./shared.js";

const instances = new WeakMap();
const focusableSelector = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])";
const controlledSelector = (attribute, id) => `[${attribute}][aria-controls="${CSS.escape(id)}"]`;

export class Navbar {
  constructor(element) {
    this.element = requireElement(element, "Navbar");
    if (!element.id) throw new Error("Navbar requires an id.");

    this.document = element.ownerDocument;
    this.media = matchMedia(element.dataset.bsNavbarMedia || "(max-width: 48rem)");
    this.open = element.dataset.bsState === "open";
    this.triggers = [...this.document.querySelectorAll(controlledSelector("data-bs-toggle=\"navbar\"", element.id))];
    this.dismissers = [
      ...element.querySelectorAll("[data-bs-navbar-dismiss]"),
      ...this.document.querySelectorAll(controlledSelector("data-bs-navbar-dismiss", element.id)),
    ];
    this.backdrops = this.dismissers.filter((item) => item.classList.contains("bs-navbar-backdrop"));
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
      if (this.overlay && event.target.closest("[data-bs-navbar-close]")) {
        this.hide({ reason: "selection", sourceEvent: event, restoreFocus: false });
      }
    };
    this.onKeydown = (event) => this.handleKeydown(event);
    this.onMediaChange = () => this.sync();

    this.progressBar = this.element.querySelector(".bs-navbar-progress, [data-bs-scroll-progress], .bs-reading-progress");
    this.onWindowScroll = () => {
      if (!this.progressBar) return;
      const win = this.document.defaultView || window;
      const maxScroll = this.document.documentElement.scrollHeight - win.innerHeight;
      this.progressBar.value = maxScroll > 0 ? (win.scrollY / maxScroll) * 100 : 0;
    };

    this.triggers.forEach((trigger) => trigger.addEventListener("click", this.onTrigger));
    this.dismissers.forEach((dismiss) => dismiss.addEventListener("click", this.onDismiss));
    element.addEventListener("click", this.onElementClick);
    this.document.addEventListener("keydown", this.onKeydown);
    this.media.addEventListener("change", this.onMediaChange);
    if (this.progressBar) {
      this.document.addEventListener("scroll", this.onWindowScroll, { passive: true });
      this.onWindowScroll();
    }
    this.sync();
    instances.set(element, this);
  }

  static getOrCreateInstance(element) {
    return instances.get(element) ?? new Navbar(element);
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
    const hasOpenNavbar = Boolean(this.document.querySelector('[data-bs-navbar][data-bs-overlay="open"]'));
    this.document.body?.classList.toggle("bs-navbar-open", hasOpenNavbar);
  }

  sync() {
    setState(this.element, this.overlay ? (this.open ? "open" : "closed") : "open");
    this.element.dataset.bsOverlay = this.overlay && this.open ? "open" : "closed";
    this.triggers.forEach((trigger) => trigger.setAttribute("aria-expanded", String(this.overlay ? this.open : true)));
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
    if (!this.overlay || this.open) return false;
    const detail = { controller: this, reason: options.reason ?? "api", sourceEvent: options.sourceEvent };
    if (!emit(this.element, "bs:navbar:show", detail, true)) return false;
    this.open = true;
    this.restoreTarget = options.restoreTarget ?? this.document.activeElement;
    this.sync();
    queueMicrotask(() => (this.focusableElements[0] ?? this.element).focus());
    emit(this.element, "bs:navbar:shown", detail);
    return true;
  }

  hide(options = {}) {
    if (!this.overlay || !this.open) return false;
    const detail = { controller: this, reason: options.reason ?? "api", sourceEvent: options.sourceEvent };
    if (!emit(this.element, "bs:navbar:hide", detail, true)) return false;
    this.open = false;
    this.sync();
    if (options.restoreFocus !== false && this.restoreTarget?.isConnected) this.restoreTarget.focus();
    emit(this.element, "bs:navbar:hidden", detail);
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
    if (this.progressBar) {
      this.document.removeEventListener("scroll", this.onWindowScroll);
    }
    this.element.inert = false;
    delete this.element.dataset.bsOverlay;
    if (this.originalRole === null) this.element.removeAttribute("role");
    else this.element.setAttribute("role", this.originalRole);
    this.element.removeAttribute("aria-modal");
    this.element.removeAttribute("aria-hidden");
    if (this.originalTabIndex === null) this.element.removeAttribute("tabindex");
    else this.element.setAttribute("tabindex", this.originalTabIndex);
    this.syncDocumentState();
    instances.delete(this.element);
  }
}

export function initNavbars(root = document) {
  return queryRoots(root, "[data-bs-navbar]").map((element) => Navbar.getOrCreateInstance(element));
}
