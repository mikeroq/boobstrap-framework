import { composeHandlers, emit, nextId } from "./shared.js";

export function createCollapse(options = {}) {
  const panelId = options.id ?? nextId("bs-collapse");
  let panelElement = null;
  let isOpen = options.open ?? options.defaultOpen ?? false;

  const getPanel = () => panelElement || (typeof document !== "undefined" ? document.getElementById(panelId) : null);
  const getTrigger = () => typeof document !== "undefined" ? document.querySelector(`[aria-controls="${panelId}"]`) : null;

  const syncState = () => {
    const panelEl = getPanel();
    const trigEl = getTrigger();
    if (panelEl) {
      panelEl.hidden = !isOpen;
      panelEl.dataset.bsState = isOpen ? "open" : "closed";
    }
    if (trigEl) {
      trigEl.setAttribute("aria-expanded", String(isOpen));
    }
  };

  const transition = (nextOpen, reason = "api", sourceEvent) => {
    if (nextOpen === isOpen) return false;
    const panelEl = getPanel();
    const action = nextOpen ? "show" : "hide";
    const detail = { adapter: "svelte", open: nextOpen, reason, sourceEvent };
    if (!emit(panelEl, `bs:collapse:${action}`, detail, true)) return false;
    isOpen = nextOpen;
    options.onOpenChange?.(nextOpen, detail);
    syncState();
    emit(panelEl, `bs:collapse:${nextOpen ? "shown" : "hidden"}`, detail);
    return true;
  };

  const show = (reason = "api", event) => transition(true, reason, event);
  const hide = (reason = "api", event) => transition(false, reason, event);
  const toggle = (reason = "api", event) => transition(!isOpen, reason, event);

  const getTriggerProps = (props = {}) => ({
    ...props,
    type: props.type ?? "button",
    "aria-controls": props["aria-controls"] ?? panelId,
    "aria-expanded": String(isOpen),
    onclick: composeHandlers(props.onclick || props.onClick, (event) => toggle("trigger", event)),
  });

  const getPanelProps = (props = {}) => ({
    ...props,
    id: props.id ?? panelId,
    hidden: !isOpen,
    "data-bs-state": isOpen ? "open" : "closed",
  });

  const triggerAction = (node) => {
    node.setAttribute("aria-controls", panelId);
    node.setAttribute("aria-expanded", String(isOpen));
    const clickHandler = (event) => toggle("trigger", event);
    node.addEventListener("click", clickHandler);
    return {
      update() {
        node.setAttribute("aria-expanded", String(isOpen));
      },
      destroy() {
        node.removeEventListener("click", clickHandler);
      },
    };
  };

  const panelAction = (node) => {
    panelElement = node;
    node.id ||= panelId;
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
    panelId,
    show,
    hide,
    toggle,
    getTriggerProps,
    getPanelProps,
    trigger: triggerAction,
    panel: panelAction,
  };
}

export { createCollapse as useCollapse };
