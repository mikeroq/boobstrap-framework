import { useCallback, useEffect, useRef } from "react";
import { composeHandlers, emit, mergeRefs, useControllableState, useIsomorphicLayoutEffect } from "./shared.js";

export function useToast(options = {}) {
  const toastRef = useRef(null);
  const timerRef = useRef(null);
  const remainingRef = useRef(options.duration ?? 5000);
  const startedAtRef = useRef(0);
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

  const hide = useCallback((reason, sourceEvent) => transition(false, reason, sourceEvent), [transition]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const schedule = useCallback((duration = options.duration ?? 5000) => {
    clearTimer();
    if (!open || options.autohide === false || duration <= 0) return;
    remainingRef.current = duration;
    startedAtRef.current = Date.now();
    timerRef.current = setTimeout(() => hide("timeout"), duration);
  }, [clearTimer, hide, open, options.autohide, options.duration]);

  const pause = useCallback(() => {
    if (!timerRef.current) return;
    remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startedAtRef.current));
    clearTimer();
  }, [clearTimer]);

  const resume = useCallback(() => {
    if (open && !timerRef.current) schedule(remainingRef.current || options.duration || 5000);
  }, [open, options.duration, schedule]);

  const show = useCallback((reason, sourceEvent) => {
    if (open) {
      schedule();
      return false;
    }
    return transition(true, reason, sourceEvent);
  }, [open, schedule, transition]);

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
    if (open) schedule();
    else clearTimer();
    return clearTimer;
  }, [clearTimer, open, schedule]);

  const getToastProps = useCallback((props = {}) => ({
    ...props,
    ref: mergeRefs(toastRef, props.ref),
    hidden: !open,
    role: props.role ?? "status",
    "aria-live": props["aria-live"] ?? "polite",
    "data-bs-state": open ? "shown" : "hidden",
    onPointerEnter: composeHandlers(props.onPointerEnter, pause),
    onPointerLeave: composeHandlers(props.onPointerLeave, resume),
    onFocus: composeHandlers(props.onFocus, pause),
    onBlur: composeHandlers(props.onBlur, resume),
  }), [open, pause, resume]);

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
