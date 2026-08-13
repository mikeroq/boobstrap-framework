import { useCallback, useEffect, useRef } from "react";
import { composeHandlers, emit, mergeRefs, useControllableState, useIsomorphicLayoutEffect } from "./shared.js";

export function useToast(options = {}) {
  const toastRef = useRef(null);
  const timerRef = useRef(null);
  const pendingTransition = useRef(null);
  const previousOpen = useRef(options.open ?? options.defaultOpen ?? false);
  const [open, setOpen] = useControllableState({
    value: options.open,
    defaultValue: options.defaultOpen ?? false,
    onChange: options.onOpenChange,
  });

  const transition = useCallback((nextOpen, reason = "api", sourceEvent) => {
    if (nextOpen === open) return false;
    const detail = { adapter: "react", open: nextOpen, reason, sourceEvent };
    if (!emit(toastRef.current, `bs:toast:${nextOpen ? "show" : "hide"}`, detail, true)) return false;
    pendingTransition.current = { open: nextOpen, detail };
    return setOpen(nextOpen, detail);
  }, [open, setOpen]);

  const show = useCallback((reason, sourceEvent) => transition(true, reason, sourceEvent), [transition]);
  const hide = useCallback((reason, sourceEvent) => transition(false, reason, sourceEvent), [transition]);

  useIsomorphicLayoutEffect(() => {
    if (previousOpen.current === open) return;
    const pending = pendingTransition.current;
    if (pending?.open === open) {
      emit(toastRef.current, `bs:toast:${open ? "shown" : "hidden"}`, pending.detail);
      pendingTransition.current = null;
    }
    previousOpen.current = open;
  }, [open]);

  useEffect(() => {
    if (!open || options.autohide === false) return undefined;
    timerRef.current = setTimeout(() => hide("timeout"), options.duration ?? 5000);
    return () => clearTimeout(timerRef.current);
  }, [hide, open, options.autohide, options.duration]);

  const getToastProps = useCallback((props = {}) => ({
    ...props,
    ref: mergeRefs(toastRef, props.ref),
    hidden: !open,
    role: props.role ?? "status",
    "aria-live": props["aria-live"] ?? "polite",
    "data-bs-state": open ? "shown" : "hidden",
  }), [open]);

  const getTriggerProps = useCallback((props = {}) => ({
    ...props,
    type: props.type ?? "button",
    "aria-expanded": String(open),
    onClick: composeHandlers(props.onClick, (event) => show("trigger", event.nativeEvent ?? event)),
  }), [open, show]);

  const getDismissProps = useCallback((props = {}) => ({
    ...props,
    type: props.type ?? "button",
    "aria-label": props["aria-label"] ?? "Dismiss notification",
    onClick: composeHandlers(props.onClick, (event) => hide("dismiss", event.nativeEvent ?? event)),
  }), [hide]);

  return { open, show, hide, getToastProps, getTriggerProps, getDismissProps };
}
