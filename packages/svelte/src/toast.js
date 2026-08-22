import { composeHandlers, emit } from "./shared.js";

export function createToast(options = {}) {
  let toastElement = null;
  let timer = null;
  let remaining = options.duration ?? 5000;
  let startedAt = 0;
  let isOpen = options.open ?? options.defaultOpen ?? false;

  const getToast = () => toastElement || (typeof document !== "undefined" ? (options.id ? document.getElementById(options.id) : document.querySelector(".bs-toast")) : null);

  const clearTimer = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const schedule = (duration = options.duration ?? 5000) => {
    clearTimer();
    if (!isOpen || options.autohide === false || duration <= 0) return;
    remaining = duration;
    startedAt = Date.now();
    timer = setTimeout(() => hide("timeout"), duration);
  };

  const pause = () => {
    if (!timer) return;
    remaining = Math.max(0, remaining - (Date.now() - startedAt));
    clearTimer();
  };

  const resume = () => {
    if (isOpen && !timer) schedule(remaining || options.duration || 5000);
  };

  const syncState = () => {
    const toastEl = getToast();
    if (toastEl) {
      toastEl.hidden = !isOpen;
      toastEl.dataset.bsState = isOpen ? "shown" : "hidden";
    }
  };

  const transition = (nextOpen, reason = "api", sourceEvent) => {
    if (nextOpen === isOpen) return false;
    const toastEl = getToast();
    const action = nextOpen ? "show" : "hide";
    const detail = { adapter: "svelte", open: nextOpen, reason, sourceEvent };
    if (!emit(toastEl, `bs:toast:${action}`, detail, true)) return false;
    isOpen = nextOpen;
    options.onOpenChange?.(nextOpen, detail);
    syncState();
    clearTimer();
    if (nextOpen) schedule();
    emit(toastEl, `bs:toast:${nextOpen ? "shown" : "hidden"}`, detail);
    return true;
  };

  const show = (reason = "api", event) => {
    if (isOpen) {
      schedule();
      return false;
    }
    return transition(true, reason, event);
  };

  const hide = (reason = "api", event) => transition(false, reason, event);

  const getToastProps = (props = {}) => ({
    ...props,
    hidden: !isOpen,
    role: props.role ?? "status",
    "aria-live": props["aria-live"] ?? "polite",
    "data-bs-state": isOpen ? "shown" : "hidden",
    onpointerenter: composeHandlers(props.onpointerenter || props.onPointerenter, pause),
    onpointerleave: composeHandlers(props.onpointerleave || props.onPointerleave, resume),
    onfocusin: composeHandlers(props.onfocusin || props.onFocusin, pause),
    onfocusout: composeHandlers(props.onfocusout || props.onFocusout, resume),
  });

  const getTriggerProps = (props = {}) => ({
    ...props,
    type: props.type ?? "button",
    "aria-expanded": String(isOpen),
    onclick: composeHandlers(props.onclick || props.onClick, (event) => show("trigger", event)),
  });

  const getDismissProps = (props = {}) => ({
    ...props,
    type: props.type ?? "button",
    "aria-label": props["aria-label"] ?? "Dismiss notification",
    onclick: composeHandlers(props.onclick || props.onClick, (event) => hide("dismiss", event)),
  });

  const toastAction = (node) => {
    toastElement = node;
    syncState();
    if (isOpen) schedule();
    return {
      update() {
        syncState();
      },
      destroy() {
        clearTimer();
        toastElement = null;
      },
    };
  };

  return {
    get open() {
      return isOpen;
    },
    show,
    hide,
    pause,
    resume,
    getToastProps,
    getTriggerProps,
    getDismissProps,
    toast: toastAction,
  };
}

export { createToast as useToast };
