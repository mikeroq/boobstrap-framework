import { useCallback, useId, useRef } from "react";
import { composeHandlers, emit, mergeRefs, normalizeId, useControllableState, useIsomorphicLayoutEffect } from "./shared.js";

function isBackdropPointer(element, event) {
  if (event.target !== element) return false;
  const rect = element.getBoundingClientRect();
  return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
}

function syncDocumentState(document) {
  document.body?.classList.toggle("bs-dialog-open", Boolean(document.querySelector("dialog[open]")));
}

export function useDialog(options = {}) {
  const generatedId = useId();
  const dialogId = options.id ?? `bs-dialog-${normalizeId(generatedId)}`;
  const dialogRef = useRef(null);
  const restoreTarget = useRef(null);
  const pendingTransition = useRef(null);
  const previousOpen = useRef(options.open ?? options.defaultOpen ?? false);
  const [open, setOpen] = useControllableState({
    value: options.open,
    defaultValue: options.defaultOpen ?? false,
    onChange: options.onOpenChange,
  });

  useIsomorphicLayoutEffect(() => {
    const element = dialogRef.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
    syncDocumentState(element.ownerDocument);
    if (previousOpen.current !== open) {
      const pending = pendingTransition.current;
      if (pending?.open === open) {
        emit(element, `bs:dialog:${open ? "shown" : "hidden"}`, pending.detail);
        pendingTransition.current = null;
      }
      if (!open && restoreTarget.current?.isConnected) restoreTarget.current.focus();
      previousOpen.current = open;
    }
  }, [open]);

  const transition = useCallback((nextOpen, reason = "api", sourceEvent) => {
    if (nextOpen === open) return false;
    const element = dialogRef.current;
    const action = nextOpen ? "show" : "hide";
    const detail = { adapter: "react", open: nextOpen, reason, sourceEvent };
    if (!emit(element, `bs:dialog:${action}`, detail, true)) return false;
    if (nextOpen) restoreTarget.current = sourceEvent?.currentTarget ?? element?.ownerDocument.activeElement;
    pendingTransition.current = { open: nextOpen, detail };
    return setOpen(nextOpen, detail);
  }, [open, setOpen]);

  const show = useCallback((reason = "api", sourceEvent) => transition(true, reason, sourceEvent), [transition]);
  const hide = useCallback((reason = "api", sourceEvent) => transition(false, reason, sourceEvent), [transition]);
  const toggle = useCallback((reason = "api", sourceEvent) => transition(!open, reason, sourceEvent), [open, transition]);

  const getTriggerProps = useCallback((props = {}) => ({
    ...props,
    type: props.type ?? "button",
    "aria-controls": props["aria-controls"] ?? dialogId,
    "aria-expanded": String(open),
    onClick: composeHandlers(props.onClick, (event) => toggle("trigger", event.nativeEvent ?? event)),
  }), [dialogId, open, toggle]);

  const getDialogProps = useCallback((props = {}) => ({
    ...props,
    id: props.id ?? dialogId,
    ref: mergeRefs(dialogRef, props.ref),
    "data-bs-state": open ? "open" : "closed",
    onCancel: composeHandlers(props.onCancel, (event) => {
      event.preventDefault();
      hide("escape", event.nativeEvent ?? event);
    }),
    onClick: composeHandlers(props.onClick, (event) => {
      const nativeEvent = event.nativeEvent ?? event;
      if (props["data-bs-dialog-close-on-backdrop"] !== "false" && isBackdropPointer(event.currentTarget, nativeEvent)) {
        hide("backdrop", nativeEvent);
      }
    }),
  }), [dialogId, hide, open]);

  const getDismissProps = useCallback((props = {}) => ({
    ...props,
    type: props.type ?? "button",
    onClick: composeHandlers(props.onClick, (event) => hide("dismiss", event.nativeEvent ?? event)),
  }), [hide]);

  return { open, dialogId, show, hide, toggle, getTriggerProps, getDialogProps, getDismissProps };
}
