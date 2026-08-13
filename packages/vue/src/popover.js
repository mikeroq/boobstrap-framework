import { onBeforeUnmount, ref, watch } from "vue";
import { composeHandlers, emit, nextId, positionFloating, useControllableState } from "./shared.js";

export function usePopover(options = {}) {
  const popoverId = options.id ?? nextId("bs-popover");
  const triggerRef = ref(null);
  const panelRef = ref(null);
  const [open, setOpen] = useControllableState(options, "open", "defaultOpen", "onOpenChange", false);
  const update = () => positionFloating(triggerRef.value, panelRef.value, options.placement ?? "bottom");
  const onDocumentPointer = (event) => { if (!triggerRef.value?.contains(event.target) && !panelRef.value?.contains(event.target)) hide("outside", event); };
  watch(open, (nextOpen) => { if (nextOpen) queueMicrotask(update); });
  onBeforeUnmount(() => {
    triggerRef.value?.ownerDocument.removeEventListener("pointerdown", onDocumentPointer);
    window.removeEventListener("resize", update);
    window.removeEventListener("scroll", update, true);
  });
  const transition = (nextOpen, reason = "api", sourceEvent) => {
    if (nextOpen === open.value) return false;
    const detail = { adapter: "vue", open: nextOpen, reason, sourceEvent };
    if (!emit(triggerRef.value, `bs:popover:${nextOpen ? "show" : "hide"}`, detail, true)) return false;
    const changed = setOpen(nextOpen, detail);
    const ownerDocument = triggerRef.value?.ownerDocument;
    if (nextOpen) { ownerDocument?.addEventListener("pointerdown", onDocumentPointer); window.addEventListener("resize", update); window.addEventListener("scroll", update, true); }
    else { ownerDocument?.removeEventListener("pointerdown", onDocumentPointer); window.removeEventListener("resize", update); window.removeEventListener("scroll", update, true); }
    queueMicrotask(() => emit(triggerRef.value, `bs:popover:${nextOpen ? "shown" : "hidden"}`, detail));
    return changed;
  };
  const show = (reason, event) => transition(true, reason, event);
  const hide = (reason, event) => transition(false, reason, event);
  const toggle = (reason, event) => transition(!open.value, reason, event);
  const getTriggerProps = (props = {}) => ({ ...props, ref: (element) => { triggerRef.value = element; }, type: props.type ?? "button", "aria-controls": props["aria-controls"] ?? popoverId, "aria-expanded": String(open.value), "data-bs-state": open.value ? "shown" : "hidden", onClick: composeHandlers(props.onClick, (event) => toggle("trigger", event)), onKeydown: composeHandlers(props.onKeydown, (event) => { if (event.key === "Escape") hide("escape", event); }) });
  const getPopoverProps = (props = {}) => ({ ...props, id: props.id ?? popoverId, ref: (element) => { panelRef.value = element; }, role: props.role ?? "dialog", hidden: !open.value, "data-bs-placement": options.placement ?? "bottom" });
  return { open, popoverId, show, hide, toggle, getTriggerProps, getPopoverProps };
}
