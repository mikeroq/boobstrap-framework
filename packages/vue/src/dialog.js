import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import { composeHandlers, emit, nextId, useControllableState } from "./shared.js";

function syncDocumentState(document) {
  document?.body?.classList.toggle("bs-dialog-open", Boolean(document.querySelector("dialog[open]")));
}

export function useDialog(options = {}) {
  const dialogId = options.id ?? nextId("bs-dialog");
  const dialogRef = ref(null);
  const restoreTarget = ref(null);
  const pending = ref(null);
  const [open, setOpen] = useControllableState(options, "open", "defaultOpen", "onOpenChange", false);
  watch(open, async (nextOpen) => {
    await nextTick();
    const element = dialogRef.value;
    if (nextOpen && !element?.open) element?.showModal();
    if (!nextOpen && element?.open) element.close();
    syncDocumentState(element?.ownerDocument);
    if (pending.value?.open === nextOpen) emit(element, `bs:dialog:${nextOpen ? "shown" : "hidden"}`, pending.value.detail);
    if (!nextOpen && restoreTarget.value?.isConnected) restoreTarget.value.focus();
    pending.value = null;
  }, { immediate: true });
  const transition = (nextOpen, reason = "api", sourceEvent) => {
    if (nextOpen === open.value) return false;
    const detail = { adapter: "vue", open: nextOpen, reason, sourceEvent };
    if (!emit(dialogRef.value, `bs:dialog:${nextOpen ? "show" : "hide"}`, detail, true)) return false;
    if (nextOpen) restoreTarget.value = sourceEvent?.currentTarget ?? dialogRef.value?.ownerDocument.activeElement;
    pending.value = { open: nextOpen, detail };
    return setOpen(nextOpen, detail);
  };
  const show = (reason, event) => transition(true, reason, event);
  const hide = (reason, event) => transition(false, reason, event);
  const toggle = (reason, event) => transition(!open.value, reason, event);
  onBeforeUnmount(() => { if (dialogRef.value?.open) dialogRef.value.close(); });
  const getTriggerProps = (props = {}) => ({ ...props, type: props.type ?? "button", "aria-controls": props["aria-controls"] ?? dialogId, "aria-expanded": String(open.value), onClick: composeHandlers(props.onClick, (event) => toggle("trigger", event)) });
  const getDialogProps = (props = {}) => ({
    ...props,
    id: props.id ?? dialogId,
    ref: (element) => { dialogRef.value = element; },
    "data-bs-state": open.value ? "open" : "closed",
    onCancel: composeHandlers(props.onCancel, (event) => { event.preventDefault(); hide("escape", event); }),
  });
  const getDismissProps = (props = {}) => ({ ...props, type: props.type ?? "button", onClick: composeHandlers(props.onClick, (event) => hide("dismiss", event)) });
  return { open, dialogId, show, hide, toggle, getTriggerProps, getDialogProps, getDismissProps };
}
