import { useCallback, useId, useRef } from "react";
import { composeHandlers, emit, mergeRefs, normalizeId, useControllableState, useIsomorphicLayoutEffect } from "./shared.js";

const focusableSelector = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])";

export function useNavbar(options = {}) {
  const generatedId = useId();
  const menuId = options.id ?? `bs-navbar-${normalizeId(generatedId)}`;
  const menuRef = useRef(null);
  const restoreTarget = useRef(null);
  const pendingTransition = useRef(null);
  const previousOpen = useRef(options.open ?? options.defaultOpen ?? false);
  const [open, setOpen] = useControllableState({
    value: options.open,
    defaultValue: options.defaultOpen ?? false,
    onChange: options.onOpenChange,
  });

  useIsomorphicLayoutEffect(() => {
    const element = menuRef.current;
    if (!element) return;
    element.ownerDocument.body?.classList.toggle("bs-navbar-open", open);
    if (previousOpen.current !== open) {
      const pending = pendingTransition.current;
      if (pending?.open === open) emit(element, `bs:navbar:${open ? "shown" : "hidden"}`, pending.detail);
      if (open) queueMicrotask(() => element.querySelector(focusableSelector)?.focus());
      if (!open && restoreTarget.current?.isConnected) restoreTarget.current.focus();
      pendingTransition.current = null;
      previousOpen.current = open;
    }
    return () => element.ownerDocument.body?.classList.remove("bs-navbar-open");
  }, [open]);

  const transition = useCallback((nextOpen, reason = "api", sourceEvent) => {
    if (nextOpen === open) return false;
    const detail = { adapter: "react", open: nextOpen, reason, sourceEvent };
    if (!emit(menuRef.current, `bs:navbar:${nextOpen ? "show" : "hide"}`, detail, true)) return false;
    if (nextOpen) restoreTarget.current = sourceEvent?.currentTarget ?? menuRef.current?.ownerDocument.activeElement;
    pendingTransition.current = { open: nextOpen, detail };
    return setOpen(nextOpen, detail);
  }, [open, setOpen]);

  const show = useCallback((reason = "api", event) => transition(true, reason, event), [transition]);
  const hide = useCallback((reason = "api", event) => transition(false, reason, event), [transition]);
  const toggle = useCallback((reason = "api", event) => transition(!open, reason, event), [open, transition]);

  useIsomorphicLayoutEffect(() => {
    if (!open) return undefined;
    const document = menuRef.current?.ownerDocument;
    const onKeydown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        hide("escape", event);
      }
    };
    document?.addEventListener("keydown", onKeydown);
    return () => document?.removeEventListener("keydown", onKeydown);
  }, [hide, open]);

  const getTriggerProps = useCallback((props = {}) => ({
    ...props,
    type: props.type ?? "button",
    "aria-controls": props["aria-controls"] ?? menuId,
    "aria-expanded": String(open),
    onClick: composeHandlers(props.onClick, (event) => {
      restoreTarget.current = event.currentTarget;
      toggle("trigger", event);
    }),
  }), [menuId, open, toggle]);

  const getMenuProps = useCallback((props = {}) => ({
    ...props,
    id: props.id ?? menuId,
    ref: mergeRefs(menuRef, props.ref),
    "data-bs-state": open ? "open" : "closed",
    onClick: composeHandlers(props.onClick, (event) => {
      if (event.target.closest("[data-bs-navbar-close]")) hide("selection", event.nativeEvent ?? event);
    }),
  }), [hide, menuId, open]);

  const getDismissProps = useCallback((props = {}) => ({
    ...props,
    type: props.type ?? "button",
    "data-bs-state": open ? "open" : "closed",
    onClick: composeHandlers(props.onClick, (event) => hide("dismiss", event.nativeEvent ?? event)),
  }), [hide, open]);

  return { open, menuId, show, hide, toggle, getTriggerProps, getMenuProps, getDismissProps };
}
