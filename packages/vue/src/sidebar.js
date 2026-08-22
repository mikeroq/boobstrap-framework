import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import { composeHandlers, emit, useControllableState } from "./shared.js";

const focusableSelector = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])";
const focusableElements = (element) => [...element.querySelectorAll(focusableSelector)].filter((item) => !item.hidden && item.getAttribute("aria-hidden") !== "true" && item.getClientRects().length > 0);
const controlledSelector = (attribute, id) => `[${attribute}][aria-controls="${CSS.escape(id)}"]`;
const getOverlay = (media) => Boolean(media?.matches);

function shouldIgnoreShortcut(event, document) {
  const target = event.target;
  const tag = target?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) return true;
  if (document.querySelector("dialog[open]")) return true;
  return false;
}

export function useSidebar(options = {}) {
  const sidebarRef = ref(null);
  const restoreTarget = ref(null);
  const expanded = ref(true);
  const media = ref(null);
  const pending = ref(null);
  const originalRole = ref(null);
  const originalTabIndex = ref(null);

  const [open, setOpen] = useControllableState(options, "open", "defaultOpen", "onOpenChange", false);

  watch(open, async (nextOpen) => {
    await nextTick();
    sync();
    if (pending.value?.open === nextOpen) {
      emit(sidebarRef.value, pending.value.eventName, pending.value.detail);
    }
    if (pending.value?.action === "show" && pending.value?.open === nextOpen && getOverlay(media.value)) {
      const focusable = focusableElements(sidebarRef.value);
      (focusable[0] ?? sidebarRef.value)?.focus();
    }
    if (pending.value?.action === "hide" && pending.value?.open === nextOpen && pending.value?.restoreFocus !== false && restoreTarget.value?.isConnected) {
      restoreTarget.value.focus();
    }
    pending.value = null;
  }, { immediate: true });

  const sync = () => {
    const root = sidebarRef.value;
    if (!root || !root.id) return;
    const document = root.ownerDocument;
    const overlay = getOverlay(media.value);
    const collapseMode = root.dataset.bsSidebarCollapse || "none";
    if (collapseMode === "none") expanded.value = true;
    const displayedOpen = overlay ? open.value : expanded.value;
    root.dataset.bsState = overlay ? (open.value ? "open" : "closed") : (expanded.value ? "expanded" : "collapsed");
    root.dataset.bsOverlay = overlay && open.value ? "open" : "closed";
    const triggers = [...document.querySelectorAll(controlledSelector('data-bs-toggle="sidebar"', root.id))];
    const dismissers = [
      ...root.querySelectorAll("[data-bs-sidebar-dismiss]"),
      ...document.querySelectorAll(controlledSelector("data-bs-sidebar-dismiss", root.id)),
    ];
    const backdrops = dismissers.filter((item) => item.classList.contains("bs-sidebar-backdrop"));
    triggers.forEach((trigger) => trigger.setAttribute("aria-expanded", String(displayedOpen)));
    backdrops.forEach((backdrop) => { backdrop.dataset.bsState = overlay && open.value ? "open" : "closed"; });
    if (overlay) {
      root.setAttribute("role", "dialog");
      root.setAttribute("aria-modal", "true");
      root.setAttribute("aria-hidden", String(!open.value));
      root.inert = !open.value;
      if (!root.hasAttribute("tabindex")) root.tabIndex = -1;
    } else {
      if (originalRole.value === null) root.removeAttribute("role");
      else root.setAttribute("role", originalRole.value);
      root.removeAttribute("aria-modal");
      root.removeAttribute("aria-hidden");
      root.inert = false;
      if (originalTabIndex.value === null) root.removeAttribute("tabindex");
      else root.setAttribute("tabindex", originalTabIndex.value);
    }
    const hasOpenOverlay = Boolean(document.querySelector('[data-bs-sidebar][data-bs-overlay="open"]'));
    document.body?.classList.toggle("bs-sidebar-open", hasOpenOverlay);
  };

  const attach = (root) => {
    if (!root || !root.id) return () => {};
    const document = root.ownerDocument;
    media.value = document.defaultView.matchMedia(options.media ?? "(max-width: 64rem)");
    originalRole.value = root.getAttribute("role");
    originalTabIndex.value = root.getAttribute("tabindex");

    const triggers = [...document.querySelectorAll(controlledSelector('data-bs-toggle="sidebar"', root.id))];
    const dismissers = [
      ...root.querySelectorAll("[data-bs-sidebar-dismiss]"),
      ...document.querySelectorAll(controlledSelector("data-bs-sidebar-dismiss", root.id)),
    ];

    const onTrigger = (event) => {
      event.preventDefault();
      if (getOverlay(media.value)) toggle({ reason: "trigger", sourceEvent: event, restoreTarget: event.currentTarget });
    };
    const onDismiss = (event) => {
      event.preventDefault();
      if (getOverlay(media.value)) hide({ reason: "dismiss", sourceEvent: event });
    };
    const onElementClick = (event) => {
      if (getOverlay(media.value) && event.target.closest("[data-bs-sidebar-close]")) {
        hide({ reason: "selection", sourceEvent: event, restoreFocus: false });
      }
    };
    const onKeydown = (event) => {
      if (options.shortcut && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === options.shortcut.toLowerCase()) {
        if (shouldIgnoreShortcut(event, document)) return;
        event.preventDefault();
        if (getOverlay(media.value)) toggle({ reason: "shortcut", sourceEvent: event, restoreTarget: document.activeElement });
        return;
      }
      if (!getOverlay(media.value) || !open.value) return;
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
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const onMediaChange = () => sync();

    triggers.forEach((trigger) => trigger.addEventListener("click", onTrigger));
    dismissers.forEach((dismiss) => dismiss.addEventListener("click", onDismiss));
    root.addEventListener("click", onElementClick);
    document.addEventListener("keydown", onKeydown);
    media.value.addEventListener("change", onMediaChange);
    return () => {
      triggers.forEach((trigger) => trigger.removeEventListener("click", onTrigger));
      dismissers.forEach((dismiss) => dismiss.removeEventListener("click", onDismiss));
      root.removeEventListener("click", onElementClick);
      document.removeEventListener("keydown", onKeydown);
      media.value?.removeEventListener("change", onMediaChange);
      root.inert = false;
      delete root.dataset.bsOverlay;
      document.body?.classList.remove("bs-sidebar-open");
    };
  };

  let detach = null;
  watch(sidebarRef, (root) => {
    if (detach) detach();
    detach = root ? attach(root) : null;
    sync();
  }, { immediate: true });

  onBeforeUnmount(() => { if (detach) detach(); });

  const transition = (nextOpen, transitionOptions = {}) => {
    const root = sidebarRef.value;
    if (!root) return false;
    const action = nextOpen ? "show" : "hide";
    const detail = { adapter: "vue", open: nextOpen, reason: transitionOptions.reason ?? "api", sourceEvent: transitionOptions.sourceEvent };
    if (!emit(root, `bs:sidebar:${action}`, detail, true)) return false;
    if (nextOpen) restoreTarget.value = transitionOptions.restoreTarget ?? root.ownerDocument.activeElement;
    pending.value = { open: nextOpen, detail, eventName: `bs:sidebar:${nextOpen ? "shown" : "hidden"}`, action, restoreFocus: transitionOptions.restoreFocus };
    return setOpen(nextOpen, detail);
  };
  const show = (transitionOptions = {}) => transition(true, transitionOptions);
  const hide = (transitionOptions = {}) => transition(false, transitionOptions);
  const toggle = (transitionOptions = {}) => transition(!open.value, transitionOptions);
  const expand = (transitionOptions = {}) => {
    const root = sidebarRef.value;
    if (!root) return false;
    if (getOverlay(media.value)) return show(transitionOptions);
    if (root.dataset.bsSidebarCollapse === "none" || expanded.value) return false;
    const detail = { adapter: "vue", reason: transitionOptions.reason ?? "api", sourceEvent: transitionOptions.sourceEvent };
    if (!emit(root, "bs:sidebar:expand", detail, true)) return false;
    expanded.value = true;
    sync();
    emit(root, "bs:sidebar:expanded", detail);
    return true;
  };
  const collapse = (transitionOptions = {}) => {
    const root = sidebarRef.value;
    if (!root) return false;
    if (getOverlay(media.value)) return hide(transitionOptions);
    if (root.dataset.bsSidebarCollapse === "none" || !expanded.value) return false;
    const detail = { adapter: "vue", reason: transitionOptions.reason ?? "api", sourceEvent: transitionOptions.sourceEvent };
    if (!emit(root, "bs:sidebar:collapse", detail, true)) return false;
    expanded.value = false;
    sync();
    emit(root, "bs:sidebar:collapsed", detail);
    return true;
  };

  const getRootProps = (props = {}) => ({
    ...props,
    ref: (element) => { sidebarRef.value = element; },
    "data-bs-state": open.value ? "open" : "closed",
  });
  return { open, show, hide, toggle, expand, collapse, getRootProps };
}
