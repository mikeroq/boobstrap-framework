import { emit } from "./shared.js";

const focusableSelector = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])";
const focusableElements = (element) => [...element.querySelectorAll(focusableSelector)].filter((item) => !item.hidden && item.getAttribute("aria-hidden") !== "true" && item.getClientRects().length > 0);
const controlledSelector = (attribute, id) => `[${attribute}][aria-controls="${CSS.escape(id)}"]`;
const getOverlay = (media) => Boolean(media?.matches);

function shouldIgnoreShortcut(event, doc) {
  const target = event.target;
  const tag = target?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) return true;
  if (doc.querySelector("dialog[open]")) return true;
  return false;
}

export function createSidebar(options = {}) {
  let sidebarElement = null;
  let restoreTarget = null;
  let isExpanded = true;
  let mediaQueryList = null;
  let originalRole = null;
  let originalTabIndex = null;
  let isOpen = options.open ?? options.defaultOpen ?? false;
  let detachListeners = null;

  const sync = () => {
    const root = sidebarElement;
    if (!root || !root.id) return;
    const doc = root.ownerDocument || document;
    const overlay = getOverlay(mediaQueryList);
    const collapseMode = root.dataset.bsSidebarCollapse || "none";
    if (collapseMode === "none") isExpanded = true;
    const displayedOpen = overlay ? isOpen : isExpanded;
    root.dataset.bsState = overlay ? (isOpen ? "open" : "closed") : (isExpanded ? "expanded" : "collapsed");
    root.dataset.bsOverlay = overlay && isOpen ? "open" : "closed";

    const triggers = [...doc.querySelectorAll(controlledSelector('data-bs-toggle="sidebar"', root.id))];
    const dismissers = [
      ...root.querySelectorAll("[data-bs-sidebar-dismiss]"),
      ...doc.querySelectorAll(controlledSelector("data-bs-sidebar-dismiss", root.id)),
    ];
    const backdrops = dismissers.filter((item) => item.classList.contains("bs-sidebar-backdrop"));
    triggers.forEach((trigger) => trigger.setAttribute("aria-expanded", String(displayedOpen)));
    backdrops.forEach((backdrop) => { backdrop.dataset.bsState = overlay && isOpen ? "open" : "closed"; });

    if (overlay) {
      root.setAttribute("role", "dialog");
      root.setAttribute("aria-modal", "true");
      root.setAttribute("aria-hidden", String(!isOpen));
      root.inert = !isOpen;
      if (!root.hasAttribute("tabindex")) root.tabIndex = -1;
    } else {
      if (originalRole === null) root.removeAttribute("role");
      else root.setAttribute("role", originalRole);
      root.removeAttribute("aria-modal");
      root.removeAttribute("aria-hidden");
      root.inert = false;
      if (originalTabIndex === null) root.removeAttribute("tabindex");
      else root.setAttribute("tabindex", originalTabIndex);
    }
    const hasOpenOverlay = Boolean(doc.querySelector('[data-bs-sidebar][data-bs-overlay="open"]'));
    doc.body?.classList.toggle("bs-sidebar-open", hasOpenOverlay);
  };

  const attach = (root) => {
    if (!root || !root.id) return () => {};
    const doc = root.ownerDocument || document;
    const win = doc.defaultView || window;
    mediaQueryList = win.matchMedia(options.media ?? "(max-width: 64rem)");
    originalRole = root.getAttribute("role");
    originalTabIndex = root.getAttribute("tabindex");

    const triggers = [...doc.querySelectorAll(controlledSelector('data-bs-toggle="sidebar"', root.id))];
    const dismissers = [
      ...root.querySelectorAll("[data-bs-sidebar-dismiss]"),
      ...doc.querySelectorAll(controlledSelector("data-bs-sidebar-dismiss", root.id)),
    ];

    const onTrigger = (event) => {
      event.preventDefault();
      if (getOverlay(mediaQueryList)) toggle({ reason: "trigger", sourceEvent: event, restoreTarget: event.currentTarget });
    };
    const onDismiss = (event) => {
      event.preventDefault();
      if (getOverlay(mediaQueryList)) hide({ reason: "dismiss", sourceEvent: event });
    };
    const onElementClick = (event) => {
      if (getOverlay(mediaQueryList) && event.target.closest("[data-bs-sidebar-close]")) {
        hide({ reason: "selection", sourceEvent: event, restoreFocus: false });
      }
    };
    const onKeydown = (event) => {
      if (options.shortcut && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === options.shortcut.toLowerCase()) {
        if (shouldIgnoreShortcut(event, doc)) return;
        event.preventDefault();
        if (getOverlay(mediaQueryList)) toggle({ reason: "shortcut", sourceEvent: event, restoreTarget: doc.activeElement });
        return;
      }
      if (!getOverlay(mediaQueryList) || !isOpen) return;
      if (event.key === "Escape") {
        event.preventDefault();
        hide({ reason: "escape", sourceEvent: event });
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = focusableElements(root);
      if (!focusable.length) {
        event.preventDefault();
        root.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && doc.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && doc.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const onMediaChange = () => sync();

    triggers.forEach((trigger) => trigger.addEventListener("click", onTrigger));
    dismissers.forEach((dismiss) => dismiss.addEventListener("click", onDismiss));
    root.addEventListener("click", onElementClick);
    doc.addEventListener("keydown", onKeydown);
    mediaQueryList.addEventListener("change", onMediaChange);

    return () => {
      triggers.forEach((trigger) => trigger.removeEventListener("click", onTrigger));
      dismissers.forEach((dismiss) => dismiss.removeEventListener("click", onDismiss));
      root.removeEventListener("click", onElementClick);
      doc.removeEventListener("keydown", onKeydown);
      mediaQueryList?.removeEventListener("change", onMediaChange);
      root.inert = false;
      delete root.dataset.bsOverlay;
      doc.body?.classList.remove("bs-sidebar-open");
    };
  };

  const transition = (nextOpen, transitionOptions = {}) => {
    const root = sidebarElement;
    if (!root) return false;
    const action = nextOpen ? "show" : "hide";
    const detail = { adapter: "svelte", open: nextOpen, reason: transitionOptions.reason ?? "api", sourceEvent: transitionOptions.sourceEvent };
    if (!emit(root, `bs:sidebar:${action}`, detail, true)) return false;
    if (nextOpen) restoreTarget = transitionOptions.restoreTarget ?? (root.ownerDocument || document).activeElement;
    isOpen = nextOpen;
    options.onOpenChange?.(nextOpen, detail);
    sync();
    if (nextOpen && getOverlay(mediaQueryList)) {
      const focusable = focusableElements(root);
      (focusable[0] ?? root)?.focus();
    }
    if (!nextOpen && transitionOptions.restoreFocus !== false && restoreTarget?.isConnected) {
      restoreTarget.focus();
    }
    emit(root, `bs:sidebar:${nextOpen ? "shown" : "hidden"}`, detail);
    return true;
  };

  const show = (opts = {}) => transition(true, opts);
  const hide = (opts = {}) => transition(false, opts);
  const toggle = (opts = {}) => transition(!isOpen, opts);

  const expand = (transitionOptions = {}) => {
    const root = sidebarElement;
    if (!root) return false;
    if (getOverlay(mediaQueryList)) return show(transitionOptions);
    if (root.dataset.bsSidebarCollapse === "none" || isExpanded) return false;
    const detail = { adapter: "svelte", reason: transitionOptions.reason ?? "api", sourceEvent: transitionOptions.sourceEvent };
    if (!emit(root, "bs:sidebar:expand", detail, true)) return false;
    isExpanded = true;
    sync();
    emit(root, "bs:sidebar:expanded", detail);
    return true;
  };

  const collapse = (transitionOptions = {}) => {
    const root = sidebarElement;
    if (!root) return false;
    if (getOverlay(mediaQueryList)) return hide(transitionOptions);
    if (root.dataset.bsSidebarCollapse === "none" || !isExpanded) return false;
    const detail = { adapter: "svelte", reason: transitionOptions.reason ?? "api", sourceEvent: transitionOptions.sourceEvent };
    if (!emit(root, "bs:sidebar:collapse", detail, true)) return false;
    isExpanded = false;
    sync();
    emit(root, "bs:sidebar:collapsed", detail);
    return true;
  };

  const getRootProps = (props = {}) => ({
    ...props,
    "data-bs-state": isOpen ? "open" : "closed",
  });

  const sidebarAction = (node) => {
    sidebarElement = node;
    detachListeners = attach(node);
    sync();
    return {
      update() {
        sync();
      },
      destroy() {
        detachListeners?.();
        detachListeners = null;
        sidebarElement = null;
      },
    };
  };

  return {
    get open() {
      return isOpen;
    },
    show,
    hide,
    toggle,
    expand,
    collapse,
    getRootProps,
    sidebar: sidebarAction,
  };
}

export { createSidebar as useSidebar };
