import { useCallback, useEffect, useId, useRef } from "react";
import { composeHandlers, emit, mergeRefs, normalizeId, positionFloating, useControllableState, useIsomorphicLayoutEffect } from "./shared.js";

export function usePopover(options = {}) {
  const generatedId = useId();
  const popoverId = options.id ?? `bs-popover-${normalizeId(generatedId)}`;
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const pendingTransition = useRef(null);
  const previousOpen = useRef(options.open ?? options.defaultOpen ?? false);
  const [open, setOpen] = useControllableState({ value: options.open, defaultValue: options.defaultOpen ?? false, onChange: options.onOpenChange });

  const transition = useCallback((nextOpen, reason = "api", sourceEvent) => {
    if (nextOpen === open) return false;
    const detail = { adapter: "react", open: nextOpen, reason, sourceEvent };
    if (!emit(triggerRef.current, `bs:popover:${nextOpen ? "show" : "hide"}`, detail, true)) return false;
    pendingTransition.current = { open: nextOpen, detail };
    return setOpen(nextOpen, detail);
  }, [open, setOpen]);
  const show = useCallback((reason, event) => transition(true, reason, event), [transition]);
  const hide = useCallback((reason, event) => transition(false, reason, event), [transition]);
  const toggle = useCallback((reason, event) => transition(!open, reason, event), [open, transition]);

  useIsomorphicLayoutEffect(() => {
    if (open) positionFloating(triggerRef.current, panelRef.current, options.placement ?? "bottom");
    if (previousOpen.current !== open) {
      const pending = pendingTransition.current;
      if (pending?.open === open) emit(triggerRef.current, `bs:popover:${open ? "shown" : "hidden"}`, pending.detail);
      pendingTransition.current = null;
      previousOpen.current = open;
    }
  }, [open, options.placement]);

  useEffect(() => {
    if (!open) return undefined;
    const ownerDocument = triggerRef.current?.ownerDocument;
    const update = () => positionFloating(triggerRef.current, panelRef.current, options.placement ?? "bottom");
    const onPointerDown = (event) => {
      if (!triggerRef.current?.contains(event.target) && !panelRef.current?.contains(event.target)) hide("outside", event);
    };
    ownerDocument?.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      ownerDocument?.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [hide, open, options.placement]);

  const getTriggerProps = useCallback((props = {}) => ({
    ...props,
    ref: mergeRefs(triggerRef, props.ref),
    type: props.type ?? "button",
    "aria-controls": props["aria-controls"] ?? popoverId,
    "aria-expanded": String(open),
    "data-bs-state": open ? "shown" : "hidden",
    onClick: composeHandlers(props.onClick, (event) => toggle("trigger", event.nativeEvent ?? event)),
    onKeyDown: composeHandlers(props.onKeyDown, (event) => {
      if (event.key === "Escape") hide("escape", event.nativeEvent ?? event);
    }),
  }), [hide, open, popoverId, toggle]);

  const getPopoverProps = useCallback((props = {}) => ({
    ...props,
    id: props.id ?? popoverId,
    ref: mergeRefs(panelRef, props.ref),
    role: props.role ?? "dialog",
    hidden: !open,
    "data-bs-placement": options.placement ?? "bottom",
  }), [open, options.placement, popoverId]);

  return { open, popoverId, show, hide, toggle, getTriggerProps, getPopoverProps };
}
