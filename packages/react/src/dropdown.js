import { useCallback, useEffect, useId, useRef } from "react";
import { composeHandlers, emit, enabledMenuItems, mergeRefs, normalizeId, useControllableState, useIsomorphicLayoutEffect } from "./shared.js";

export function useDropdown(options = {}) {
  const generatedId = useId();
  const menuId = options.id ?? `bs-dropdown-${normalizeId(generatedId)}`;
  const rootRef = useRef(null);
  const toggleRef = useRef(null);
  const menuRef = useRef(null);
  const pendingTransition = useRef(null);
  const pendingFocus = useRef(null);
  const previousOpen = useRef(options.open ?? options.defaultOpen ?? false);
  const [open, setOpen] = useControllableState({
    value: options.open,
    defaultValue: options.defaultOpen ?? false,
    onChange: options.onOpenChange,
  });

  const focusItem = useCallback((index) => {
    const items = enabledMenuItems(menuRef.current);
    if (items.length) items[(index + items.length) % items.length].focus();
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (previousOpen.current === open) return;
    const pending = pendingTransition.current;
    if (pending?.open === open) {
      if (open && pendingFocus.current?.focusIndex !== undefined) focusItem(pendingFocus.current.focusIndex);
      if (!open && pendingFocus.current?.restoreFocus) toggleRef.current?.focus();
      emit(rootRef.current, `bs:dropdown:${open ? "shown" : "hidden"}`, pending.detail);
      pendingTransition.current = null;
      pendingFocus.current = null;
    }
    previousOpen.current = open;
  }, [focusItem, open]);

  const transition = useCallback((nextOpen, transitionOptions = {}) => {
    if (nextOpen === open) return false;
    const action = nextOpen ? "show" : "hide";
    const detail = {
      adapter: "react",
      open: nextOpen,
      reason: transitionOptions.reason ?? "api",
      sourceEvent: transitionOptions.sourceEvent,
    };
    if (!emit(rootRef.current, `bs:dropdown:${action}`, detail, true)) return false;
    pendingTransition.current = { open: nextOpen, detail };
    pendingFocus.current = transitionOptions;
    return setOpen(nextOpen, detail);
  }, [open, setOpen]);

  const show = useCallback((transitionOptions) => transition(true, transitionOptions), [transition]);
  const hide = useCallback((transitionOptions) => transition(false, transitionOptions), [transition]);
  const toggle = useCallback((transitionOptions) => transition(!open, transitionOptions), [open, transition]);

  useEffect(() => {
    if (!open || !rootRef.current) return undefined;
    const ownerDocument = rootRef.current.ownerDocument;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) hide({ reason: "outside", sourceEvent: event });
    };
    ownerDocument.addEventListener("pointerdown", onPointerDown);
    return () => ownerDocument.removeEventListener("pointerdown", onPointerDown);
  }, [hide, open]);

  const getRootProps = useCallback((props = {}) => ({
    ...props,
    ref: mergeRefs(rootRef, props.ref),
    "data-bs-state": open ? "open" : "closed",
  }), [open]);

  const getTriggerProps = useCallback((props = {}) => ({
    ...props,
    type: props.type ?? "button",
    ref: mergeRefs(toggleRef, props.ref),
    "aria-controls": props["aria-controls"] ?? menuId,
    "aria-expanded": String(open),
    "aria-haspopup": "menu",
    onClick: composeHandlers(props.onClick, (event) => toggle({ reason: "trigger", sourceEvent: event.nativeEvent ?? event })),
    onKeyDown: composeHandlers(props.onKeyDown, (event) => {
      if (!["ArrowDown", "ArrowUp", "Escape"].includes(event.key)) return;
      if (event.key === "Escape") {
        if (!open) return;
        event.preventDefault();
        hide({ reason: "escape", restoreFocus: true, sourceEvent: event.nativeEvent ?? event });
        return;
      }
      event.preventDefault();
      show({ reason: "keyboard", focusIndex: event.key === "ArrowDown" ? 0 : -1, sourceEvent: event.nativeEvent ?? event });
    }),
  }), [hide, menuId, open, show, toggle]);

  const getMenuProps = useCallback((props = {}) => ({
    ...props,
    id: props.id ?? menuId,
    ref: mergeRefs(menuRef, props.ref),
    role: props.role ?? "menu",
    hidden: !open,
    "data-bs-state": open ? "open" : "closed",
    onClick: composeHandlers(props.onClick, (event) => {
      const item = event.target.closest?.('[role="menuitem"]');
      if (item && !item.disabled && item.getAttribute("aria-disabled") !== "true") {
        hide({ reason: "selection", sourceEvent: event.nativeEvent ?? event });
      }
    }),
    onKeyDown: composeHandlers(props.onKeyDown, (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        hide({ reason: "escape", restoreFocus: true, sourceEvent: event.nativeEvent ?? event });
        return;
      }
      if (event.key === "Tab") {
        hide({ reason: "tab", sourceEvent: event.nativeEvent ?? event });
        return;
      }
      const items = enabledMenuItems(menuRef.current);
      const currentIndex = items.indexOf(event.target);
      if (currentIndex < 0) return;
      const nextIndex = {
        ArrowDown: currentIndex + 1,
        ArrowUp: currentIndex - 1,
        Home: 0,
        End: items.length - 1,
      }[event.key];
      if (nextIndex === undefined) return;
      event.preventDefault();
      focusItem(nextIndex);
    }),
  }), [focusItem, hide, menuId, open]);

  return {
    open,
    menuId,
    show,
    hide,
    toggle,
    getRootProps,
    getTriggerProps,
    getMenuProps,
  };
}
