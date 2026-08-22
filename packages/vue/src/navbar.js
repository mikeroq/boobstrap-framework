import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { composeHandlers, emit, nextId, useControllableState } from "./shared.js";

export function useNavbar(options = {}) {
  const menuId = options.id ?? nextId("bs-navbar");
  const menuRef = ref(null);
  const restoreTarget = ref(null);
  const pending = ref(null);
  const [open, setOpen] = useControllableState(options, "open", "defaultOpen", "onOpenChange", false);

  watch(open, async (nextOpen) => {
    await nextTick();
    const element = menuRef.value;
    element?.ownerDocument.body?.classList.toggle("bs-navbar-open", nextOpen);
    if (pending.value?.open === nextOpen) emit(element, `bs:navbar:${nextOpen ? "shown" : "hidden"}`, pending.value.detail);
    if (nextOpen) element?.querySelector("a[href], button:not([disabled]), [tabindex]:not([tabindex=\"-1\"])")?.focus();
    if (!nextOpen && restoreTarget.value?.isConnected) restoreTarget.value.focus();
    pending.value = null;
  });

  const transition = (nextOpen, reason = "api", sourceEvent) => {
    if (nextOpen === open.value) return false;
    const detail = { adapter: "vue", open: nextOpen, reason, sourceEvent };
    if (!emit(menuRef.value, `bs:navbar:${nextOpen ? "show" : "hide"}`, detail, true)) return false;
    if (nextOpen) restoreTarget.value = sourceEvent?.currentTarget ?? menuRef.value?.ownerDocument.activeElement;
    pending.value = { open: nextOpen, detail };
    return setOpen(nextOpen, detail);
  };
  const show = (reason, event) => transition(true, reason, event);
  const hide = (reason, event) => transition(false, reason, event);
  const toggle = (reason, event) => transition(!open.value, reason, event);
  const onDocumentKeydown = (event) => {
    if (open.value && event.key === "Escape") {
      event.preventDefault();
      hide("escape", event);
    }
  };
  onMounted(() => menuRef.value?.ownerDocument.addEventListener("keydown", onDocumentKeydown));
  onBeforeUnmount(() => {
    menuRef.value?.ownerDocument.removeEventListener("keydown", onDocumentKeydown);
    menuRef.value?.ownerDocument.body?.classList.remove("bs-navbar-open");
  });

  const getTriggerProps = (props = {}) => ({ ...props, type: props.type ?? "button", "aria-controls": props["aria-controls"] ?? menuId, "aria-expanded": String(open.value), onClick: composeHandlers(props.onClick, (event) => toggle("trigger", event)) });
  const getMenuProps = (props = {}) => ({
    ...props,
    id: props.id ?? menuId,
    ref: (element) => { menuRef.value = element; },
    "data-bs-state": open.value ? "open" : "closed",
    onClick: composeHandlers(props.onClick, (event) => { if (event.target.closest("[data-bs-navbar-close]")) hide("selection", event); }),
  });
  const getDismissProps = (props = {}) => ({ ...props, type: props.type ?? "button", "data-bs-state": open.value ? "open" : "closed", onClick: composeHandlers(props.onClick, (event) => hide("dismiss", event)) });
  return { open, menuId, show, hide, toggle, getTriggerProps, getMenuProps, getDismissProps };
}
