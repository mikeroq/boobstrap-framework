import { ref, watch } from "vue";
import { composeHandlers, emit, nextId, useControllableState } from "./shared.js";

export function useCollapse(options = {}) {
  const panelId = options.id ?? nextId("bs-collapse");
  const panelRef = ref(null);
  const pending = ref(null);
  const [open, setOpen] = useControllableState(options, "open", "defaultOpen", "onOpenChange", false);
  watch(open, (nextOpen) => {
    if (pending.value?.open === nextOpen) emit(panelRef.value, `bs:collapse:${nextOpen ? "shown" : "hidden"}`, pending.value.detail);
    pending.value = null;
  });
  const transition = (nextOpen, reason = "api", sourceEvent) => {
    if (nextOpen === open.value) return false;
    const detail = { adapter: "vue", open: nextOpen, reason, sourceEvent };
    if (!emit(panelRef.value, `bs:collapse:${nextOpen ? "show" : "hide"}`, detail, true)) return false;
    pending.value = { open: nextOpen, detail };
    return setOpen(nextOpen, detail);
  };
  const show = (reason, event) => transition(true, reason, event);
  const hide = (reason, event) => transition(false, reason, event);
  const toggle = (reason, event) => transition(!open.value, reason, event);
  const getTriggerProps = (props = {}) => ({
    ...props,
    type: props.type ?? "button",
    "aria-controls": props["aria-controls"] ?? panelId,
    "aria-expanded": String(open.value),
    onClick: composeHandlers(props.onClick, (event) => toggle("trigger", event)),
  });
  const getPanelProps = (props = {}) => ({
    ...props,
    id: props.id ?? panelId,
    ref: (element) => { panelRef.value = element; },
    hidden: !open.value,
    "data-bs-state": open.value ? "open" : "closed",
  });
  return { open, panelId, show, hide, toggle, getTriggerProps, getPanelProps };
}
