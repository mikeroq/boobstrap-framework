import { composeHandlers, emit, enabledMenuItems, nextId } from "./shared.js";

export function createDropdown(options = {}) {
  const menuId = options.id ?? nextId("bs-dropdown");
  let rootElement = null;
  let triggerElement = null;
  let menuElement = null;
  let isOpen = options.open ?? options.defaultOpen ?? false;

  const getRoot = () => rootElement || (typeof document !== "undefined" ? document.querySelector(`[aria-controls="${menuId}"]`)?.closest(".bs-dropdown") : null);
  const getMenu = () => menuElement || (typeof document !== "undefined" ? document.getElementById(menuId) : null);
  const getTrigger = () => triggerElement || (typeof document !== "undefined" ? document.querySelector(`[aria-controls="${menuId}"]`) : null);

  const focusItem = (index) => {
    const menuEl = getMenu();
    const items = enabledMenuItems(menuEl);
    if (items.length) {
      items[(index + items.length) % items.length].focus();
    }
  };

  const syncState = () => {
    const rootEl = getRoot();
    const menuEl = getMenu();
    const trigEl = getTrigger();
    if (rootEl) {
      rootEl.dataset.bsState = isOpen ? "open" : "closed";
    }
    if (menuEl) {
      menuEl.hidden = !isOpen;
      menuEl.dataset.bsState = isOpen ? "open" : "closed";
    }
    if (trigEl) {
      trigEl.setAttribute("aria-expanded", String(isOpen));
    }
  };

  const transition = (nextOpen, transitionOptions = {}) => {
    if (nextOpen === isOpen) return false;
    const rootEl = getRoot();
    const trigEl = getTrigger();
    const detail = { adapter: "svelte", open: nextOpen, reason: transitionOptions.reason ?? "api", sourceEvent: transitionOptions.sourceEvent };
    if (!emit(rootEl || trigEl, `bs:dropdown:${nextOpen ? "show" : "hide"}`, detail, true)) return false;
    isOpen = nextOpen;
    options.onOpenChange?.(nextOpen, detail);
    syncState();
    if (nextOpen && transitionOptions.focusIndex !== undefined) {
      queueMicrotask(() => focusItem(transitionOptions.focusIndex));
    }
    if (!nextOpen && transitionOptions.restoreFocus) {
      trigEl?.focus();
    }
    emit(rootEl || trigEl, `bs:dropdown:${nextOpen ? "shown" : "hidden"}`, detail);
    return true;
  };

  const show = (opts) => transition(true, opts);
  const hide = (opts) => transition(false, opts);
  const toggle = (opts) => transition(!isOpen, opts);

  const onDocPointer = (event) => {
    const rootEl = getRoot();
    if (rootEl && !rootEl.contains(event.target)) {
      hide({ reason: "outside", sourceEvent: event });
    }
  };

  if (typeof document !== "undefined") {
    document.addEventListener("pointerdown", onDocPointer);
  }

  const getRootProps = (props = {}) => ({
    ...props,
    "data-bs-state": isOpen ? "open" : "closed",
  });

  const getTriggerProps = (props = {}) => ({
    ...props,
    type: props.type ?? "button",
    "aria-controls": props["aria-controls"] ?? menuId,
    "aria-expanded": String(isOpen),
    "aria-haspopup": "menu",
    onclick: composeHandlers(props.onclick || props.onClick, (event) => toggle({ reason: "trigger", sourceEvent: event })),
    onkeydown: composeHandlers(props.onkeydown || props.onKeydown, (event) => {
      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        hide({ reason: "escape", restoreFocus: true, sourceEvent: event });
      }
      if (["ArrowDown", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        show({ reason: "keyboard", focusIndex: event.key === "ArrowDown" ? 0 : -1, sourceEvent: event });
      }
    }),
  });

  const getMenuProps = (props = {}) => ({
    ...props,
    id: props.id ?? menuId,
    role: props.role ?? "menu",
    hidden: !isOpen,
    "data-bs-state": isOpen ? "open" : "closed",
    onkeydown: composeHandlers(props.onkeydown || props.onKeydown, (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        hide({ reason: "escape", restoreFocus: true, sourceEvent: event });
        return;
      }
      const menuEl = getMenu();
      const items = enabledMenuItems(menuEl);
      const currentIndex = items.indexOf(event.target);
      const nextIndex = { ArrowDown: currentIndex + 1, ArrowUp: currentIndex - 1, Home: 0, End: items.length - 1 }[event.key];
      if (currentIndex >= 0 && nextIndex !== undefined) {
        event.preventDefault();
        focusItem(nextIndex);
      }
    }),
    onclick: composeHandlers(props.onclick || props.onClick, (event) => {
      if (event.target.closest('[role="menuitem"]:not([aria-disabled="true"]):not([disabled])')) {
        hide({ reason: "item", restoreFocus: true, sourceEvent: event });
      }
    }),
  });

  const dropdownAction = (node) => {
    rootElement = node;
    syncState();
    return {
      update() {
        syncState();
      },
      destroy() {
        rootElement = null;
      },
    };
  };

  const triggerAction = (node) => {
    triggerElement = node;
    node.setAttribute("aria-controls", menuId);
    node.setAttribute("aria-expanded", String(isOpen));
    node.setAttribute("aria-haspopup", "menu");
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

  return {
    get open() {
      return isOpen;
    },
    menuId,
    show,
    hide,
    toggle,
    getRootProps,
    getTriggerProps,
    getMenuProps,
    dropdown: dropdownAction,
    trigger: triggerAction,
    menu: menuAction,
  };
}

export { createDropdown as useDropdown };
