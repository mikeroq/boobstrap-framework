import { onBeforeUnmount, ref, watch } from "vue";
import { composeHandlers, emit, enabledMenuItems, nextId, useControllableState } from "./shared.js";

export function useDropdown(options = {}) {
  const menuId = options.id ?? nextId("bs-dropdown");
  const rootRef = ref(null);
  const triggerRef = ref(null);
  const menuRef = ref(null);
  const [open, setOpen] = useControllableState(options, "open", "defaultOpen", "onOpenChange", false);
  const onDocumentPointer = (event) => { if (!rootRef.value?.contains(event.target)) hide({ reason: "outside", sourceEvent: event }); };
  watch(open, (nextOpen) => {
    const ownerDocument = rootRef.value?.ownerDocument;
    ownerDocument?.removeEventListener("pointerdown", onDocumentPointer);
    if (nextOpen) ownerDocument?.addEventListener("pointerdown", onDocumentPointer);
  });
  onBeforeUnmount(() => rootRef.value?.ownerDocument.removeEventListener("pointerdown", onDocumentPointer));
  const focusItem = (index) => { const items = enabledMenuItems(menuRef.value); items.length && items[(index + items.length) % items.length].focus(); };
  const transition = (nextOpen, transitionOptions = {}) => {
    if (nextOpen === open.value) return false;
    const detail = { adapter: "vue", open: nextOpen, reason: transitionOptions.reason ?? "api", sourceEvent: transitionOptions.sourceEvent };
    if (!emit(rootRef.value, `bs:dropdown:${nextOpen ? "show" : "hide"}`, detail, true)) return false;
    const changed = setOpen(nextOpen, detail);
    queueMicrotask(() => {
      if (nextOpen && transitionOptions.focusIndex !== undefined) focusItem(transitionOptions.focusIndex);
      if (!nextOpen && transitionOptions.restoreFocus) triggerRef.value?.focus();
      emit(rootRef.value, `bs:dropdown:${nextOpen ? "shown" : "hidden"}`, detail);
    });
    return changed;
  };
  const show = (value) => transition(true, value);
  const hide = (value) => transition(false, value);
  const toggle = (value) => transition(!open.value, value);
  const getRootProps = (props = {}) => ({ ...props, ref: (element) => { rootRef.value = element; }, "data-bs-state": open.value ? "open" : "closed" });
  const getTriggerProps = (props = {}) => ({
    ...props,
    ref: (element) => { triggerRef.value = element; },
    type: props.type ?? "button",
    "aria-controls": props["aria-controls"] ?? menuId,
    "aria-expanded": String(open.value),
    "aria-haspopup": "menu",
    onClick: composeHandlers(props.onClick, (event) => toggle({ reason: "trigger", sourceEvent: event })),
    onKeydown: composeHandlers(props.onKeydown, (event) => {
      if (event.key === "Escape" && open.value) { event.preventDefault(); hide({ reason: "escape", restoreFocus: true, sourceEvent: event }); }
      if (["ArrowDown", "ArrowUp"].includes(event.key)) { event.preventDefault(); show({ reason: "keyboard", focusIndex: event.key === "ArrowDown" ? 0 : -1, sourceEvent: event }); }
    }),
  });
  const getMenuProps = (props = {}) => ({
    ...props,
    id: props.id ?? menuId,
    ref: (element) => { menuRef.value = element; },
    role: props.role ?? "menu",
    hidden: !open.value,
    "data-bs-state": open.value ? "open" : "closed",
    onKeydown: composeHandlers(props.onKeydown, (event) => {
      if (event.key === "Escape") { event.preventDefault(); hide({ reason: "escape", restoreFocus: true, sourceEvent: event }); return; }
      const items = enabledMenuItems(menuRef.value);
      const currentIndex = items.indexOf(event.target);
      const nextIndex = { ArrowDown: currentIndex + 1, ArrowUp: currentIndex - 1, Home: 0, End: items.length - 1 }[event.key];
      if (currentIndex >= 0 && nextIndex !== undefined) { event.preventDefault(); focusItem(nextIndex); }
    }),
  });
  return { open, menuId, show, hide, toggle, getRootProps, getTriggerProps, getMenuProps };
}
