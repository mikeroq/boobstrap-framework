import { useCallback, useEffect, useRef } from "react";
import { composeHandlers, emit, mergeRefs, useControllableState, useIsomorphicLayoutEffect } from "./shared.js";

const focusableSelector = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])";
const controlledSelector = (attribute, id) => `[${attribute}][aria-controls="${CSS.escape(id)}"]`;

function focusableElements(element) {
  return [...element.querySelectorAll(focusableSelector)].filter((item) => !item.hidden && item.getAttribute("aria-hidden") !== "true" && item.getClientRects().length > 0);
}

function getOverlay(media) {
  return Boolean(media?.matches);
}

function shouldIgnoreShortcut(event, document) {
  const target = event.target;
  const tag = target?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) return true;
  if (document.querySelector("dialog[open]")) return true;
  return false;
}

export function useSidebar(options = {}) {
  const sidebarRef = useRef(null);
  const restoreTargetRef = useRef(null);
  const expandedRef = useRef(true);
  const mediaRef = useRef(null);
  const pendingTransition = useRef(null);
  const previousOpen = useRef(options.open ?? options.defaultOpen ?? false);
  const originalRoleRef = useRef(null);
  const originalTabIndexRef = useRef(null);

  const [open, setOpen] = useControllableState({
    value: options.open,
    defaultValue: options.defaultOpen ?? false,
    onChange: options.onOpenChange,
  });

  useIsomorphicLayoutEffect(() => {
    if (previousOpen.current === open) return;
    const pending = pendingTransition.current;
    if (pending?.open === open) {
      emit(sidebarRef.current, pending.eventName, pending.detail);
      pendingTransition.current = null;
    }
    previousOpen.current = open;
  }, [open]);

  useEffect(() => {
    const root = sidebarRef.current;
    if (!root || !root.id) return undefined;
    const document = root.ownerDocument;
    const media = document.defaultView.matchMedia(options.media ?? "(max-width: 64rem)");
    mediaRef.current = media;
    originalRoleRef.current = root.getAttribute("role");
    originalTabIndexRef.current = root.getAttribute("tabindex");

    const triggers = [...document.querySelectorAll(controlledSelector('data-bs-toggle="sidebar"', root.id))];
    const dismissers = [
      ...root.querySelectorAll("[data-bs-sidebar-dismiss]"),
      ...document.querySelectorAll(controlledSelector("data-bs-sidebar-dismiss", root.id)),
    ];

    const onTrigger = (event) => {
      event.preventDefault();
      if (getOverlay(media)) toggle({ reason: "trigger", sourceEvent: event, restoreTarget: event.currentTarget });
    };
    const onDismiss = (event) => {
      event.preventDefault();
      if (getOverlay(media)) hide({ reason: "dismiss", sourceEvent: event });
    };
    const onElementClick = (event) => {
      if (getOverlay(media) && event.target.closest("[data-bs-sidebar-close]")) {
        hide({ reason: "selection", sourceEvent: event, restoreFocus: false });
      }
    };
    const onKeydown = (event) => {
      if (options.shortcut && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === options.shortcut.toLowerCase()) {
        if (shouldIgnoreShortcut(event, document)) return;
        event.preventDefault();
        if (getOverlay(media)) toggle({ reason: "shortcut", sourceEvent: event, restoreTarget: document.activeElement });
        return;
      }
      if (!getOverlay(media) || !open) return;
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
    media.addEventListener("change", onMediaChange);
    sync();
    return () => {
      triggers.forEach((trigger) => trigger.removeEventListener("click", onTrigger));
      dismissers.forEach((dismiss) => dismiss.removeEventListener("click", onDismiss));
      root.removeEventListener("click", onElementClick);
      document.removeEventListener("keydown", onKeydown);
      media.removeEventListener("change", onMediaChange);
      root.inert = false;
      delete root.dataset.bsOverlay;
      document.body?.classList.remove("bs-sidebar-open");
    };
  }, [open, options.shortcut, options.media]);

  const sync = useCallback(() => {
    const root = sidebarRef.current;
    if (!root || !root.id) return;
    const document = root.ownerDocument;
    const overlay = getOverlay(mediaRef.current);
    const collapseMode = root.dataset.bsSidebarCollapse || "none";
    if (collapseMode === "none") expandedRef.current = true;
    const displayedOpen = overlay ? open : expandedRef.current;
    root.dataset.bsState = overlay ? (open ? "open" : "closed") : (expandedRef.current ? "expanded" : "collapsed");
    root.dataset.bsOverlay = overlay && open ? "open" : "closed";
    const triggers = [...document.querySelectorAll(controlledSelector('data-bs-toggle="sidebar"', root.id))];
    const dismissers = [
      ...root.querySelectorAll("[data-bs-sidebar-dismiss]"),
      ...document.querySelectorAll(controlledSelector("data-bs-sidebar-dismiss", root.id)),
    ];
    const backdrops = dismissers.filter((item) => item.classList.contains("bs-sidebar-backdrop"));
    triggers.forEach((trigger) => trigger.setAttribute("aria-expanded", String(displayedOpen)));
    backdrops.forEach((backdrop) => { backdrop.dataset.bsState = overlay && open ? "open" : "closed"; });
    if (overlay) {
      root.setAttribute("role", "dialog");
      root.setAttribute("aria-modal", "true");
      root.setAttribute("aria-hidden", String(!open));
      root.inert = !open;
      if (!root.hasAttribute("tabindex")) root.tabIndex = -1;
    } else {
      if (originalRoleRef.current === null) root.removeAttribute("role");
      else root.setAttribute("role", originalRoleRef.current);
      root.removeAttribute("aria-modal");
      root.removeAttribute("aria-hidden");
      root.inert = false;
      if (originalTabIndexRef.current === null) root.removeAttribute("tabindex");
      else root.setAttribute("tabindex", originalTabIndexRef.current);
    }
    const hasOpenOverlay = Boolean(document.querySelector('[data-bs-sidebar][data-bs-overlay="open"]'));
    document.body?.classList.toggle("bs-sidebar-open", hasOpenOverlay);
  }, [open]);

  const transition = useCallback((nextOpen, transitionOptions = {}) => {
    const root = sidebarRef.current;
    if (!root) return false;
    const action = nextOpen ? "show" : "hide";
    const detail = { adapter: "react", open: nextOpen, reason: transitionOptions.reason ?? "api", sourceEvent: transitionOptions.sourceEvent };
    if (!emit(root, `bs:sidebar:${action}`, detail, true)) return false;
    if (nextOpen) restoreTargetRef.current = transitionOptions.restoreTarget ?? root.ownerDocument.activeElement;
    pendingTransition.current = { open: nextOpen, detail, eventName: `bs:sidebar:${nextOpen ? "shown" : "hidden"}` };
    const changed = setOpen(nextOpen, detail);
    if (nextOpen) {
      const overlay = getOverlay(mediaRef.current);
      if (overlay) {
        queueMicrotask(() => {
          const focusable = focusableElements(root);
          (focusable[0] ?? root).focus();
        });
      }
    } else if (transitionOptions.restoreFocus !== false && restoreTargetRef.current?.isConnected) {
      restoreTargetRef.current.focus();
    }
    return changed;
  }, [setOpen]);

  const show = useCallback((transitionOptions = {}) => transition(true, transitionOptions), [transition]);
  const hide = useCallback((transitionOptions = {}) => transition(false, transitionOptions), [transition]);
  const toggle = useCallback((transitionOptions = {}) => transition(!open, transitionOptions), [open, transition]);

  const expand = useCallback((transitionOptions = {}) => {
    const root = sidebarRef.current;
    if (!root) return false;
    if (getOverlay(mediaRef.current)) return show(transitionOptions);
    if (root.dataset.bsSidebarCollapse === "none" || expandedRef.current) return false;
    const detail = { adapter: "react", reason: transitionOptions.reason ?? "api", sourceEvent: transitionOptions.sourceEvent };
    if (!emit(root, "bs:sidebar:expand", detail, true)) return false;
    expandedRef.current = true;
    sync();
    emit(root, "bs:sidebar:expanded", detail);
    return true;
  }, [show, sync]);

  const collapse = useCallback((transitionOptions = {}) => {
    const root = sidebarRef.current;
    if (!root) return false;
    if (getOverlay(mediaRef.current)) return hide(transitionOptions);
    if (root.dataset.bsSidebarCollapse === "none" || !expandedRef.current) return false;
    const detail = { adapter: "react", reason: transitionOptions.reason ?? "api", sourceEvent: transitionOptions.sourceEvent };
    if (!emit(root, "bs:sidebar:collapse", detail, true)) return false;
    expandedRef.current = false;
    sync();
    emit(root, "bs:sidebar:collapsed", detail);
    return true;
  }, [hide, sync]);

  const getRootProps = useCallback((props = {}) => ({
    ...props,
    ref: mergeRefs(sidebarRef, props.ref),
    "data-bs-state": open ? "open" : "closed",
  }), [open]);

  return { open, show, hide, toggle, expand, collapse, getRootProps };
}
