import { emit, setState } from "./shared.js";

function focusableElements(element) {
  return [...element.querySelectorAll("a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])")].filter((item) => !item.hidden && item.getAttribute("aria-hidden") !== "true" && item.getClientRects().length > 0);
}

function controlledSelector(attribute, id) {
  return `[${attribute}][aria-controls="${CSS.escape(id)}"]`;
}

export function sidebar(options = {}) {
  return {
    open: false,
    expanded: true,
    overlay: false,
    media: null,
    mediaQuery: options.media ?? "(max-width: 64rem)",
    collapseMode: options.collapse ?? "none",
    shortcut: options.shortcut?.toLowerCase() ?? null,
    triggers: [],
    dismissers: [],
    backdrops: [],
    restoreTarget: null,
    originalRole: null,
    originalTabIndex: null,

    init() {
      const root = this.$refs.sidebar;
      if (!root.id) throw new Error("Sidebar requires an id.");
      this.document = root.ownerDocument;
      this.media = this.document.defaultView.matchMedia(this.mediaQuery);
      this.open = root.dataset.bsState === "open";
      this.expanded = root.dataset.bsState !== "collapsed";
      this.collapseMode = root.dataset.bsSidebarCollapse ?? this.collapseMode;
      this.shortcut = root.dataset.bsSidebarShortcut?.toLowerCase() ?? this.shortcut;

      this.triggers = [...this.document.querySelectorAll(controlledSelector('data-bs-toggle="sidebar"', root.id))];
      this.dismissers = [
        ...root.querySelectorAll("[data-bs-sidebar-dismiss]"),
        ...this.document.querySelectorAll(controlledSelector("data-bs-sidebar-dismiss", root.id)),
      ];
      this.backdrops = this.dismissers.filter((item) => item.classList.contains("bs-sidebar-backdrop"));
      this.originalRole = root.getAttribute("role");
      this.originalTabIndex = root.getAttribute("tabindex");

      this.onTrigger = (event) => {
        event.preventDefault();
        this.toggle({ reason: "trigger", sourceEvent: event, restoreTarget: event.currentTarget });
      };
      this.onDismiss = (event) => {
        event.preventDefault();
        if (this.overlay) this.hide({ reason: "dismiss", sourceEvent: event });
        else this.collapse({ reason: "dismiss", sourceEvent: event });
      };
      this.onElementClick = (event) => {
        if (this.overlay && event.target.closest("[data-bs-sidebar-close]")) {
          this.hide({ reason: "selection", sourceEvent: event, restoreFocus: false });
        }
      };
      this.onKeydown = (event) => this.handleKeydown(event);
      this.onMediaChange = () => this.sync();

      this.triggers.forEach((trigger) => trigger.addEventListener("click", this.onTrigger));
      this.dismissers.forEach((dismiss) => dismiss.addEventListener("click", this.onDismiss));
      root.addEventListener("click", this.onElementClick);
      this.document.addEventListener("keydown", this.onKeydown);
      this.media.addEventListener("change", this.onMediaChange);
      this.sync();
    },

    get overlay() {
      return this.media?.matches ?? false;
    },

    sync() {
      const root = this.$refs.sidebar;
      if (this.collapseMode === "none") this.expanded = true;
      const displayedOpen = this.overlay ? this.open : this.expanded;
      setState(root, this.overlay ? (this.open ? "open" : "closed") : (this.expanded ? "expanded" : "collapsed"));
      root.dataset.bsOverlay = this.overlay && this.open ? "open" : "closed";
      this.triggers.forEach((trigger) => trigger.setAttribute("aria-expanded", String(displayedOpen)));
      this.backdrops.forEach((backdrop) => setState(backdrop, this.overlay && this.open ? "open" : "closed"));
      if (this.overlay) {
        root.setAttribute("role", "dialog");
        root.setAttribute("aria-modal", "true");
        root.setAttribute("aria-hidden", String(!this.open));
        root.inert = !this.open;
        if (!root.hasAttribute("tabindex")) root.tabIndex = -1;
      } else {
        if (this.originalRole === null) root.removeAttribute("role");
        else root.setAttribute("role", this.originalRole);
        root.removeAttribute("aria-modal");
        root.removeAttribute("aria-hidden");
        root.inert = false;
        if (this.originalTabIndex === null) root.removeAttribute("tabindex");
        else root.setAttribute("tabindex", this.originalTabIndex);
      }
      const hasOpenOverlay = Boolean(this.document.querySelector('[data-bs-sidebar][data-bs-overlay="open"]'));
      this.document.body?.classList.toggle("bs-sidebar-open", hasOpenOverlay);
    },

    show(options = {}) {
      if (!this.overlay) return this.expand(options);
      if (this.open) return false;
      const detail = { adapter: "alpine", component: this, reason: options.reason ?? "api", sourceEvent: options.sourceEvent };
      if (!emit(this.$refs.sidebar, "bs:sidebar:show", detail, true)) return false;
      this.open = true;
      this.restoreTarget = options.restoreTarget ?? this.document.activeElement;
      this.sync();
      if (this.overlay) {
        this.$nextTick(() => {
          const focusable = focusableElements(this.$refs.sidebar);
          (focusable[0] ?? this.$refs.sidebar).focus();
        });
      }
      emit(this.$refs.sidebar, "bs:sidebar:shown", detail);
      return true;
    },

    hide(options = {}) {
      if (!this.overlay) return this.collapse(options);
      if (!this.open) return false;
      const detail = { adapter: "alpine", component: this, reason: options.reason ?? "api", sourceEvent: options.sourceEvent };
      if (!emit(this.$refs.sidebar, "bs:sidebar:hide", detail, true)) return false;
      this.open = false;
      this.sync();
      if (options.restoreFocus !== false && this.restoreTarget?.isConnected) this.restoreTarget.focus();
      emit(this.$refs.sidebar, "bs:sidebar:hidden", detail);
      return true;
    },

    toggle(options = {}) {
      return this.overlay ? (this.open ? this.hide(options) : this.show(options)) : (this.expanded ? this.collapse(options) : this.expand(options));
    },

    expand(options = {}) {
      if (this.overlay) return this.show(options);
      if (this.collapseMode === "none" || this.expanded) return false;
      const detail = { adapter: "alpine", component: this, reason: options.reason ?? "api", sourceEvent: options.sourceEvent };
      if (!emit(this.$refs.sidebar, "bs:sidebar:expand", detail, true)) return false;
      this.expanded = true;
      this.sync();
      emit(this.$refs.sidebar, "bs:sidebar:expanded", detail);
      return true;
    },

    collapse(options = {}) {
      if (this.overlay) return this.hide(options);
      if (this.collapseMode === "none" || !this.expanded) return false;
      const detail = { adapter: "alpine", component: this, reason: options.reason ?? "api", sourceEvent: options.sourceEvent };
      if (!emit(this.$refs.sidebar, "bs:sidebar:collapse", detail, true)) return false;
      this.expanded = false;
      this.sync();
      emit(this.$refs.sidebar, "bs:sidebar:collapsed", detail);
      return true;
    },

    handleKeydown(event) {
      if (this.shortcut && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === this.shortcut) {
        event.preventDefault();
        this.toggle({ reason: "shortcut", sourceEvent: event, restoreTarget: this.document.activeElement });
        return;
      }
      if (!this.overlay || !this.open) return;
      if (event.key === "Escape") {
        event.preventDefault();
        this.hide({ reason: "escape", sourceEvent: event });
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = focusableElements(this.$refs.sidebar);
      if (!focusable.length) {
        event.preventDefault();
        this.$refs.sidebar.focus();
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
    },

    destroy() {
      const root = this.$refs.sidebar;
      this.triggers.forEach((trigger) => trigger.removeEventListener("click", this.onTrigger));
      this.dismissers.forEach((dismiss) => dismiss.removeEventListener("click", this.onDismiss));
      root.removeEventListener("click", this.onElementClick);
      this.document.removeEventListener("keydown", this.onKeydown);
      this.media?.removeEventListener("change", this.onMediaChange);
      root.inert = false;
      delete root.dataset.bsOverlay;
      this.document.body?.classList.remove("bs-sidebar-open");
    },
  };
}
