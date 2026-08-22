import { useCallback, useEffect, useId, useRef, useState } from "react";
import { composeHandlers, emit, mergeRefs, normalizeId, useControllableState, useIsomorphicLayoutEffect } from "./shared.js";

function syncDocumentState(document) {
  document.body?.classList.toggle("bs-dialog-open", Boolean(document.querySelector("dialog[open]")));
}

export function useCommandPalette(options = {}) {
  const generatedId = useId();
  const paletteId = options.id ?? `bs-command-palette-${normalizeId(generatedId)}`;
  const dialogRef = useRef(null);
  const inputRef = useRef(null);
  const restoreTarget = useRef(null);
  const shortcut = options.shortcut ?? "k";

  const [open, setOpen] = useControllableState({
    value: options.open,
    defaultValue: options.defaultOpen ?? false,
    onChange: options.onOpenChange,
  });

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const transition = useCallback((nextOpen, reason = "api", sourceEvent) => {
    if (nextOpen === open) return false;
    const element = dialogRef.current;
    const action = nextOpen ? "show" : "hide";
    const detail = { adapter: "react", open: nextOpen, reason, sourceEvent };
    if (!emit(element, `bs:command:${action}`, detail, true)) return false;
    if (nextOpen) restoreTarget.current = sourceEvent?.currentTarget ?? element?.ownerDocument?.activeElement;
    setOpen(nextOpen, detail);
    return true;
  }, [open, setOpen]);

  const show = useCallback((reason = "api", sourceEvent) => transition(true, reason, sourceEvent), [transition]);
  const hide = useCallback((reason = "api", sourceEvent) => transition(false, reason, sourceEvent), [transition]);
  const toggle = useCallback((reason = "api", sourceEvent) => transition(!open, reason, sourceEvent), [open, transition]);

  useIsomorphicLayoutEffect(() => {
    const element = dialogRef.current;
    if (!element) return;
    if (open && !element.open) {
      element.showModal();
      setQuery("");
      setActiveIndex(0);
      inputRef.current?.focus();
      emit(element, "bs:command:shown", { adapter: "react", open: true });
    }
    if (!open && element.open) {
      element.close();
      if (restoreTarget.current?.isConnected) restoreTarget.current.focus();
      emit(element, "bs:command:hidden", { adapter: "react", open: false });
    }
    syncDocumentState(element.ownerDocument);
  }, [open]);

  useEffect(() => {
    const handleGlobalKeydown = (event) => {
      const isCmdOrCtrl = event.metaKey || event.ctrlKey;
      if (isCmdOrCtrl && event.key.toLowerCase() === shortcut.toLowerCase()) {
        event.preventDefault();
        toggle("shortcut", event);
      }
    };
    window.addEventListener("keydown", handleGlobalKeydown);
    return () => window.removeEventListener("keydown", handleGlobalKeydown);
  }, [shortcut, toggle]);

  const select = useCallback((item, sourceEvent) => {
    const element = dialogRef.current;
    const value = item.value ?? item.dataset?.bsValue ?? item.label ?? "";
    const detail = { adapter: "react", item, value, label: item.label ?? "", sourceEvent };
    if (!emit(element, "bs:command:select", detail, true)) return false;
    hide("select", sourceEvent);
    return true;
  }, [hide]);

  const getDialogProps = useCallback((props = {}) => ({
    ...props,
    id: props.id ?? paletteId,
    ref: mergeRefs(dialogRef, props.ref),
    "aria-modal": "true",
    "data-bs-state": open ? "open" : "closed",
    onClick: composeHandlers(props.onClick, (event) => {
      if (event.target === dialogRef.current) {
        hide("backdrop", event);
      }
    }),
    onCancel: composeHandlers(props.onCancel, (event) => {
      event.preventDefault();
      hide("escape", event);
    }),
  }), [paletteId, open, hide]);

  const getInputProps = useCallback((props = {}) => ({
    ...props,
    ref: mergeRefs(inputRef, props.ref),
    value: props.value ?? query,
    placeholder: props.placeholder ?? "Type a command or search...",
    onChange: composeHandlers(props.onChange, (event) => {
      setQuery(event.target.value);
      setActiveIndex(0);
    }),
  }), [query]);

  return {
    open,
    query,
    setQuery,
    activeIndex,
    setActiveIndex,
    paletteId,
    show,
    hide,
    toggle,
    select,
    getDialogProps,
    getInputProps,
  };
}
