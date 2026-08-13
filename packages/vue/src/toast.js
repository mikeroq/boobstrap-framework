import { onBeforeUnmount, ref, watch } from "vue";
import { composeHandlers, emit, useControllableState } from "./shared.js";

export function useToast(options = {}) {
  const toastRef = ref(null);
  const timer = ref(null);
  const pending = ref(null);
  const [open, setOpen] = useControllableState(options, "open", "defaultOpen", "onOpenChange", false);
  const hide = (reason = "api", sourceEvent) => transition(false, reason, sourceEvent);
  watch(open, (nextOpen) => {
    clearTimeout(timer.value);
    if (pending.value?.open === nextOpen) emit(toastRef.value, `bs:toast:${nextOpen ? "shown" : "hidden"}`, pending.value.detail);
    pending.value = null;
    if (nextOpen && options.autohide !== false) timer.value = setTimeout(() => hide("timeout"), options.duration ?? 5000);
  });
  onBeforeUnmount(() => clearTimeout(timer.value));
  function transition(nextOpen, reason = "api", sourceEvent) {
    if (nextOpen === open.value) return false;
    const detail = { adapter: "vue", open: nextOpen, reason, sourceEvent };
    if (!emit(toastRef.value, `bs:toast:${nextOpen ? "show" : "hide"}`, detail, true)) return false;
    pending.value = { open: nextOpen, detail };
    return setOpen(nextOpen, detail);
  }
  const show = (reason, event) => transition(true, reason, event);
  const getToastProps = (props = {}) => ({ ...props, ref: (element) => { toastRef.value = element; }, hidden: !open.value, role: props.role ?? "status", "aria-live": props["aria-live"] ?? "polite", "data-bs-state": open.value ? "shown" : "hidden" });
  const getTriggerProps = (props = {}) => ({ ...props, type: props.type ?? "button", "aria-expanded": String(open.value), onClick: composeHandlers(props.onClick, (event) => show("trigger", event)) });
  const getDismissProps = (props = {}) => ({ ...props, type: props.type ?? "button", "aria-label": props["aria-label"] ?? "Dismiss notification", onClick: composeHandlers(props.onClick, (event) => hide("dismiss", event)) });
  return { open, show, hide, getToastProps, getTriggerProps, getDismissProps };
}
