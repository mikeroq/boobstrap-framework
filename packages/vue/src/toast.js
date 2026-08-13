import { onBeforeUnmount, ref, watch } from "vue";
import { composeHandlers, emit, useControllableState } from "./shared.js";

export function useToast(options = {}) {
  const toastRef = ref(null);
  const timer = ref(null);
  const remaining = ref(options.duration ?? 5000);
  const startedAt = ref(0);
  const pending = ref(null);
  const [open, setOpen] = useControllableState(options, "open", "defaultOpen", "onOpenChange", false);
  const hide = (reason = "api", sourceEvent) => transition(false, reason, sourceEvent);
  const clearTimer = () => {
    clearTimeout(timer.value);
    timer.value = null;
  };
  const schedule = (duration = options.duration ?? 5000) => {
    clearTimer();
    if (!open.value || options.autohide === false || duration <= 0) return;
    remaining.value = duration;
    startedAt.value = Date.now();
    timer.value = setTimeout(() => hide("timeout"), duration);
  };
  const pause = () => {
    if (!timer.value) return;
    remaining.value = Math.max(0, remaining.value - (Date.now() - startedAt.value));
    clearTimer();
  };
  const resume = () => {
    if (open.value && !timer.value) schedule(remaining.value || options.duration || 5000);
  };
  watch(open, (nextOpen) => {
    clearTimer();
    if (pending.value?.open === nextOpen) emit(toastRef.value, `bs:toast:${nextOpen ? "shown" : "hidden"}`, pending.value.detail);
    pending.value = null;
    if (nextOpen) schedule();
  }, { immediate: true });
  onBeforeUnmount(clearTimer);
  function transition(nextOpen, reason = "api", sourceEvent) {
    if (nextOpen === open.value) return false;
    const detail = { adapter: "vue", open: nextOpen, reason, sourceEvent };
    if (!emit(toastRef.value, `bs:toast:${nextOpen ? "show" : "hide"}`, detail, true)) return false;
    pending.value = { open: nextOpen, detail };
    return setOpen(nextOpen, detail);
  }
  const show = (reason, event) => {
    if (open.value) {
      schedule();
      return false;
    }
    return transition(true, reason, event);
  };
  const getToastProps = (props = {}) => ({
    ...props,
    ref: (element) => { toastRef.value = element; },
    hidden: !open.value,
    role: props.role ?? "status",
    "aria-live": props["aria-live"] ?? "polite",
    "data-bs-state": open.value ? "shown" : "hidden",
    onPointerenter: composeHandlers(props.onPointerenter, pause),
    onPointerleave: composeHandlers(props.onPointerleave, resume),
    onFocusin: composeHandlers(props.onFocusin, pause),
    onFocusout: composeHandlers(props.onFocusout, resume),
  });
  const getTriggerProps = (props = {}) => ({ ...props, type: props.type ?? "button", "aria-expanded": String(open.value), onClick: composeHandlers(props.onClick, (event) => show("trigger", event)) });
  const getDismissProps = (props = {}) => ({ ...props, type: props.type ?? "button", "aria-label": props["aria-label"] ?? "Dismiss notification", onClick: composeHandlers(props.onClick, (event) => hide("dismiss", event)) });
  return { open, show, hide, getToastProps, getTriggerProps, getDismissProps };
}
