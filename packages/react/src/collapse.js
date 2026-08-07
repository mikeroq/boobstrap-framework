import { useCallback, useId, useRef } from "react";
import { composeHandlers, emit, mergeRefs, normalizeId, useControllableState, useIsomorphicLayoutEffect } from "./shared.js";

export function useCollapse(options = {}) {
  const generatedId = useId();
  const panelId = options.id ?? `bs-collapse-${normalizeId(generatedId)}`;
  const panelRef = useRef(null);
  const pendingTransition = useRef(null);
  const previousOpen = useRef(options.open ?? options.defaultOpen ?? false);
  const [open, setOpen] = useControllableState({
    value: options.open,
    defaultValue: options.defaultOpen ?? false,
    onChange: options.onOpenChange,
  });

  useIsomorphicLayoutEffect(() => {
    if (previousOpen.current === open) return;
    const pending = pendingTransition.current;
    if (pending?.open === open) {
      emit(panelRef.current, `bs:collapse:${open ? "shown" : "hidden"}`, pending.detail);
      pendingTransition.current = null;
    }
    previousOpen.current = open;
  }, [open]);

  const transition = useCallback((nextOpen, reason = "api", sourceEvent) => {
    if (nextOpen === open) return false;
    const action = nextOpen ? "show" : "hide";
    const detail = { adapter: "react", open: nextOpen, reason, sourceEvent };
    if (!emit(panelRef.current, `bs:collapse:${action}`, detail, true)) return false;
    pendingTransition.current = { open: nextOpen, detail };
    return setOpen(nextOpen, detail);
  }, [open, setOpen]);

  const show = useCallback(() => transition(true), [transition]);
  const hide = useCallback(() => transition(false), [transition]);
  const toggle = useCallback(() => transition(!open), [open, transition]);

  const getTriggerProps = useCallback((props = {}) => ({
    ...props,
    type: props.type ?? "button",
    "aria-controls": props["aria-controls"] ?? panelId,
    "aria-expanded": String(open),
    onClick: composeHandlers(props.onClick, (event) => transition(!open, "trigger", event.nativeEvent ?? event)),
  }), [open, panelId, transition]);

  const getPanelProps = useCallback((props = {}) => ({
    ...props,
    id: props.id ?? panelId,
    ref: mergeRefs(panelRef, props.ref),
    hidden: !open,
    "data-bs-state": open ? "open" : "closed",
  }), [open, panelId]);

  return {
    open,
    panelId,
    show,
    hide,
    toggle,
    getTriggerProps,
    getPanelProps,
  };
}
