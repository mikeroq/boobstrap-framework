import { useCallback, useEffect, useId, useRef } from "react";
import { composeHandlers, emit, mergeRefs, normalizeId, positionFloating, useControllableState, useIsomorphicLayoutEffect } from "./shared.js";

export function useTooltip(options = {}) {
  const generatedId = useId();
  const tooltipId = options.id ?? `bs-tooltip-${normalizeId(generatedId)}`;
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const pendingTransition = useRef(null);
  const previousOpen = useRef(options.open ?? options.defaultOpen ?? false);
  const [open, setOpen] = useControllableState({ value: options.open, defaultValue: options.defaultOpen ?? false, onChange: options.onOpenChange });

  const transition = useCallback((nextOpen, reason = "api", sourceEvent) => {
    if (nextOpen === open) return false;
    const detail = { adapter: "react", open: nextOpen, reason, sourceEvent };
    if (!emit(triggerRef.current, `bs:tooltip:${nextOpen ? "show" : "hide"}`, detail, true)) return false;
    pendingTransition.current = { open: nextOpen, detail };
    return setOpen(nextOpen, detail);
  }, [open, setOpen]);
  const show = useCallback((reason, event) => transition(true, reason, event), [transition]);
  const hide = useCallback((reason, event) => transition(false, reason, event), [transition]);

  useIsomorphicLayoutEffect(() => {
    if (open) positionFloating(triggerRef.current, panelRef.current, options.placement ?? "top");
    if (previousOpen.current !== open) {
      const pending = pendingTransition.current;
      if (pending?.open === open) emit(triggerRef.current, `bs:tooltip:${open ? "shown" : "hidden"}`, pending.detail);
      pendingTransition.current = null;
      previousOpen.current = open;
    }
  }, [open, options.placement]);

  useEffect(() => {
    if (!open) return undefined;
    const update = () => positionFloating(triggerRef.current, panelRef.current, options.placement ?? "top");
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, options.placement]);

  const getTriggerProps = useCallback((props = {}) => ({
    ...props,
    ref: mergeRefs(triggerRef, props.ref),
    "aria-describedby": open ? [props["aria-describedby"], tooltipId].filter(Boolean).join(" ") : props["aria-describedby"],
    "data-bs-state": open ? "shown" : "hidden",
    onMouseEnter: composeHandlers(props.onMouseEnter, (event) => show("mouseenter", event.nativeEvent ?? event)),
    onMouseLeave: composeHandlers(props.onMouseLeave, (event) => hide("mouseleave", event.nativeEvent ?? event)),
    onFocus: composeHandlers(props.onFocus, (event) => show("focus", event.nativeEvent ?? event)),
    onBlur: composeHandlers(props.onBlur, (event) => hide("blur", event.nativeEvent ?? event)),
    onKeyDown: composeHandlers(props.onKeyDown, (event) => {
      if (event.key === "Escape") hide("escape", event.nativeEvent ?? event);
    }),
  }), [hide, open, show, tooltipId]);

  const getTooltipProps = useCallback((props = {}) => ({
    ...props,
    id: props.id ?? tooltipId,
    ref: mergeRefs(panelRef, props.ref),
    role: props.role ?? "tooltip",
    hidden: !open,
    "data-bs-placement": options.placement ?? "top",
  }), [open, options.placement, tooltipId]);

  return { open, tooltipId, show, hide, getTriggerProps, getTooltipProps };
}
