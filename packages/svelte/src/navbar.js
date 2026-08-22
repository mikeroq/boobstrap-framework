import { composeHandlers, emit, nextId } from "./shared.js";

export function createNavbar(options = {}) {
  const menuId = options.id ?? nextId("bs-navbar");
  let menuElement = null;
  let triggerElement = null;
  let restoreTarget = null;
  let isOpen = options.open ?? options.defaultOpen ?? false;

  const getMenu = () => menuElement || (typeof document !== "undefined" ? document.getElementById(menuId) : null);
  const getTrigger = () => triggerElement || (typeof document !== "undefined" ? document.querySelector(`[aria-controls="${menuId}"]`) : null);

  const syncState = () => {
    const menuEl = getMenu();
    const trigEl = getTrigger();
    if (menuEl) {
      menuEl.dataset.bsState = isOpen ? "open" : "closed";
      menuEl.ownerDocument?.body?.classList.toggle("bs-navbar-open", isOpen);
    }
    if (trigEl) {
      trigEl.setAttribute("aria-expanded", String(isOpen));
    }
  };

  const transition = (nextOpen, reason = "api", sourceEvent) => {
    if (nextOpen === isOpen) return false;
    const menuEl = getMenu();
    const trigEl = getTrigger();
    const action = nextOpen ? "show" : "hide";
    const detail = { adapter: "svelte", open: nextOpen, reason, sourceEvent };
    if (!emit(menuEl || trigEl, `bs:navbar:${action}`, detail, true)) return false;
    if (nextOpen) {
      restoreTarget = sourceEvent?.currentTarget ?? (menuEl?.ownerDocument || document).activeElement;
    }
    isOpen = nextOpen;
    options.onOpenChange?.(nextOpen, detail);
    syncState();
    if (nextOpen) {
      menuEl?.querySelector('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')?.focus();
    }
    if (!nextOpen && restoreTarget?.isConnected) {
      restoreTarget.focus();
    }
    emit(menuEl || trigEl, `bs:navbar:${nextOpen ? "shown" : "hidden"}`, detail);
    return true;
  };

  const show = (reason = "api", event) => transition(true, reason, event);
  const hide = (reason = "api", event) => transition(false, reason, event);
  const toggle = (reason = "api", event) => transition(!isOpen, reason, event);

  const onDocKeydown = (event) => {
    if (isOpen && event.key === "Escape") {
      event.preventDefault();
      hide("escape", event);
    }
  };

  if (typeof document !== "undefined") {
    document.addEventListener("keydown", onDocKeydown);
  }

  const getTriggerProps = (props = {}) => ({
    ...props,
    type: props.type ?? "button",
    "aria-controls": props["aria-controls"] ?? menuId,
    "aria-expanded": String(isOpen),
    onclick: composeHandlers(props.onclick || props.onClick, (event) => toggle("trigger", event)),
  });

  const getMenuProps = (props = {}) => ({
    ...props,
    id: props.id ?? menuId,
    "data-bs-state": isOpen ? "open" : "closed",
    onclick: composeHandlers(props.onclick || props.onClick, (event) => {
      if (event.target.closest("[data-bs-navbar-close]")) hide("selection", event);
    }),
  });

  const getDismissProps = (props = {}) => ({
    ...props,
    type: props.type ?? "button",
    "data-bs-state": isOpen ? "open" : "closed",
    onclick: composeHandlers(props.onclick || props.onClick, (event) => hide("dismiss", event)),
  });

  const triggerAction = (node) => {
    triggerElement = node;
    node.setAttribute("aria-controls", menuId);
    node.setAttribute("aria-expanded", String(isOpen));
    return {
      destroy() {
        triggerElement = null;
      },
    };
  };

  const menuAction = (node) => {
    menuElement = node;
    node.id ||= menuId;
    syncState();
    return {
      update() {
        syncState();
      },
      destroy() {
        menuElement = null;
      },
    };
  };

  const dismissAction = (node) => {
    const clickHandler = (event) => hide("dismiss", event);
    node.addEventListener("click", clickHandler);
    return {
      destroy() {
        node.removeEventListener("click", clickHandler);
      },
    };
  };

  return {
    get open() {
      return isOpen;
    },
    menuId,
    show,
    hide,
    toggle,
    getTriggerProps,
    getMenuProps,
    getDismissProps,
    trigger: triggerAction,
    menu: menuAction,
    dismiss: dismissAction,
  };
}

export { createNavbar as useNavbar };
