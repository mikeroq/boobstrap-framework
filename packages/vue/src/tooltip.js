import { onBeforeUnmount, ref, watch } from "vue";
import { composeHandlers, emit, nextId, positionFloating, useControllableState } from "./shared.js";

export function useTooltip(options = {}) {
  const tooltipId = options.id ?? nextId("bs-tooltip");
  const triggerRef = ref(null);
  const panelRef = ref(null);
  const [open, setOpen] = useControllableState(options, "open", "defaultOpen", "onOpenChange", false);
  const update = () => positionFloating(triggerRef.value, panelRef.value, options.placement ?? "top");
  watch(open, (nextOpen) => { if (nextOpen) queueMicrotask(update); });
  onBeforeUnmount(() => { window.removeEventListener("resize", update); window.removeEventListener("scroll", update, true); });
  const transition = (nextOpen, reason = "api", sourceEvent) => {
    if (nextOpen === open.value) return false;
    const detail = { adapter: "vue", open: nextOpen, reason, sourceEvent };
    if (!emit(triggerRef.value, `bs:tooltip:${nextOpen ? "show" : "hide"}`, detail, true)) return false;
    const changed = setOpen(nextOpen, detail);
    if (nextOpen) { window.addEventListener("resize", update); window.addEventListener("scroll", update, true); }
    else { window.removeEventListener("resize", update); window.removeEventListener("scroll", update, true); }
    queueMicrotask(() => emit(triggerRef.value, `bs:tooltip:${nextOpen ? "shown" : "hidden"}`, detail));
    return changed;
  };
  const show = (reason, event) => transition(true, reason, event);
  const hide = (reason, event) => transition(false, reason, event);
  const getTriggerProps = (props = {}) => ({ ...props, ref: (element) => { triggerRef.value = element; }, "aria-describedby": open.value ? tooltipId : props["aria-describedby"], "data-bs-state": open.value ? "shown" : "hidden", onMouseenter: composeHandlers(props.onMouseenter, (event) => show("mouseenter", event)), onMouseleave: composeHandlers(props.onMouseleave, (event) => hide("mouseleave", event)), onFocus: composeHandlers(props.onFocus, (event) => show("focus", event)), onBlur: composeHandlers(props.onBlur, (event) => hide("blur", event)), onKeydown: composeHandlers(props.onKeydown, (event) => { if (event.key === "Escape") hide("escape", event); }) });
  const getTooltipProps = (props = {}) => ({ ...props, id: props.id ?? tooltipId, ref: (element) => { panelRef.value = element; }, role: props.role ?? "tooltip", hidden: !open.value, "data-bs-placement": options.placement ?? "top" });
  return { open, tooltipId, show, hide, getTriggerProps, getTooltipProps };
}
