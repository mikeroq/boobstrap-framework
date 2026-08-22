import { composeHandlers, emit, nextId, positionFloating } from "./shared.js";

export function createTooltip(options = {}) {
  const tooltipId = options.id ?? nextId("bs-tooltip");
  let triggerElement = null;
  let panelElement = null;
  let isOpen = options.open ?? options.defaultOpen ?? false;

  const getTrigger = () => triggerElement || (typeof document !== "undefined" ? document.querySelector(`[aria-describedby="${tooltipId}"], #svelte-tooltip-trigger`) : null);
  const getPanel = () => panelElement || (typeof document !== "undefined" ? document.getElementById(tooltipId) : null);

  const update = () => positionFloating(getTrigger(), getPanel(), options.placement ?? "top");

  const syncState = () => {
    const trigEl = getTrigger();
    const panelEl = getPanel();
    if (trigEl) {
      if (isOpen) trigEl.setAttribute("aria-describedby", tooltipId);
      else trigEl.removeAttribute("aria-describedby");
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
    if (!emit(trigEl, `bs:tooltip:${action}`, detail, true)) return false;
    isOpen = nextOpen;
    options.onOpenChange?.(nextOpen, detail);
    syncState();

    if (typeof window !== "undefined") {
      if (nextOpen) {
        window.addEventListener("resize", update);
        window.addEventListener("scroll", update, true);
      } else {
        window.removeEventListener("resize", update);
        window.removeEventListener("scroll", update, true);
      }
    }

    emit(trigEl, `bs:tooltip:${nextOpen ? "shown" : "hidden"}`, detail);
    return true;
  };

  const show = (reason = "api", event) => transition(true, reason, event);
  const hide = (reason = "api", event) => transition(false, reason, event);

  const getTriggerProps = (props = {}) => ({
    ...props,
    "aria-describedby": isOpen ? tooltipId : props["aria-describedby"],
    "data-bs-state": isOpen ? "shown" : "hidden",
    onmouseenter: composeHandlers(props.onmouseenter || props.onMouseEnter, (event) => show("mouseenter", event)),
    onmouseleave: composeHandlers(props.onmouseleave || props.onMouseLeave, (event) => hide("mouseleave", event)),
    onfocus: composeHandlers(props.onfocus || props.onFocus, (event) => show("focus", event)),
    onblur: composeHandlers(props.onblur || props.onBlur, (event) => hide("blur", event)),
    onkeydown: composeHandlers(props.onkeydown || props.onKeydown, (event) => {
      if (event.key === "Escape") hide("escape", event);
    }),
  });

  const getTooltipProps = (props = {}) => ({
    ...props,
    id: props.id ?? tooltipId,
    role: props.role ?? "tooltip",
    hidden: !isOpen,
    "data-bs-placement": options.placement ?? "top",
  });

  const triggerAction = (node) => {
    triggerElement = node;
    node.dataset.bsState = isOpen ? "shown" : "hidden";
    return {
      destroy() {
        triggerElement = null;
      },
    };
  };

  const tooltipAction = (node) => {
    panelElement = node;
    node.id ||= tooltipId;
    syncState();
    return {
      update() {
        syncState();
      },
      destroy() {
        if (typeof window !== "undefined") {
          window.removeEventListener("resize", update);
          window.removeEventListener("scroll", update, true);
        }
        panelElement = null;
      },
    };
  };

  return {
    get open() {
      return isOpen;
    },
    tooltipId,
    show,
    hide,
    getTriggerProps,
    getTooltipProps,
    trigger: triggerAction,
    tooltip: tooltipAction,
  };
}

export { createTooltip as useTooltip };
