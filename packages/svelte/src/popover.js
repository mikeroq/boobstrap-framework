import { composeHandlers, emit, nextId, positionFloating } from "./shared.js";

export function createPopover(options = {}) {
  const popoverId = options.id ?? nextId("bs-popover");
  let triggerElement = null;
  let panelElement = null;
  let isOpen = options.open ?? options.defaultOpen ?? false;

  const getTrigger = () => triggerElement || (typeof document !== "undefined" ? document.querySelector(`[aria-controls="${popoverId}"], #svelte-popover-trigger`) : null);
  const getPanel = () => panelElement || (typeof document !== "undefined" ? document.getElementById(popoverId) : null);

  const update = () => positionFloating(getTrigger(), getPanel(), options.placement ?? "bottom");

  const onDocPointer = (event) => {
    const trigEl = getTrigger();
    const panelEl = getPanel();
    if (!trigEl?.contains(event.target) && !panelEl?.contains(event.target)) {
      hide("outside", event);
    }
  };

  const onScroll = (event) => hide("scroll", event);

  const syncState = () => {
    const trigEl = getTrigger();
    const panelEl = getPanel();
    if (trigEl) {
      trigEl.setAttribute("aria-expanded", String(isOpen));
      trigEl.dataset.bsState = isOpen ? "shown" : "hidden";
    }
    if (panelEl) {
      panelEl.hidden = !isOpen;
    }
    if (isOpen) {
      queueMicrotask(update);
    }
  };

  const transition = (nextOpen, reason = "api", sourceEvent) => {
    if (nextOpen === isOpen) return false;
    const trigEl = getTrigger();
    const action = nextOpen ? "show" : "hide";
    const detail = { adapter: "svelte", open: nextOpen, reason, sourceEvent };
    if (!emit(trigEl, `bs:popover:${action}`, detail, true)) return false;
    isOpen = nextOpen;
    options.onOpenChange?.(nextOpen, detail);
    syncState();

    const doc = trigEl?.ownerDocument || document;
    if (nextOpen) {
      doc.addEventListener("pointerdown", onDocPointer);
      if (typeof window !== "undefined") {
        window.addEventListener("resize", update);
        window.addEventListener("scroll", onScroll, true);
      }
    } else {
      doc.removeEventListener("pointerdown", onDocPointer);
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", update);
        window.removeEventListener("scroll", onScroll, true);
      }
    }

    emit(trigEl, `bs:popover:${nextOpen ? "shown" : "hidden"}`, detail);
    return true;
  };

  const show = (reason = "api", event) => transition(true, reason, event);
  const hide = (reason = "api", event) => transition(false, reason, event);
  const toggle = (reason = "api", event) => transition(!isOpen, reason, event);

  const getTriggerProps = (props = {}) => ({
    ...props,
    type: props.type ?? "button",
    "aria-controls": props["aria-controls"] ?? popoverId,
    "aria-expanded": String(isOpen),
    "data-bs-state": isOpen ? "shown" : "hidden",
    onclick: composeHandlers(props.onclick || props.onClick, (event) => toggle("trigger", event)),
    onkeydown: composeHandlers(props.onkeydown || props.onKeydown, (event) => {
      if (event.key === "Escape") hide("escape", event);
    }),
  });

  const getPopoverProps = (props = {}) => ({
    ...props,
    id: props.id ?? popoverId,
    role: props.role ?? "dialog",
    hidden: !isOpen,
    "data-bs-placement": options.placement ?? "bottom",
  });

  const triggerAction = (node) => {
    triggerElement = node;
    node.setAttribute("aria-controls", popoverId);
    node.setAttribute("aria-expanded", String(isOpen));
    node.dataset.bsState = isOpen ? "shown" : "hidden";
    return {
      destroy() {
        triggerElement = null;
      },
    };
  };

  const popoverAction = (node) => {
    panelElement = node;
    node.id ||= popoverId;
    syncState();
    return {
      update() {
        syncState();
      },
      destroy() {
        panelElement = null;
      },
    };
  };

  return {
    get open() {
      return isOpen;
    },
    popoverId,
    show,
    hide,
    toggle,
    getTriggerProps,
    getPopoverProps,
    trigger: triggerAction,
    popover: popoverAction,
  };
}

export { createPopover as usePopover };
