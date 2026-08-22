import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { composeHandlers, emit, nextId, useControllableState } from "./shared.js";

function syncDocumentState(document) {
  document?.body?.classList.toggle("bs-dialog-open", Boolean(document.querySelector("dialog[open]")));
}

export function useCommandPalette(options = {}) {
  const paletteId = options.id ?? nextId("bs-command-palette");
  const dialogRef = ref(null);
  const inputRef = ref(null);
  const restoreTarget = ref(null);
  const shortcut = options.shortcut ?? "k";

  const [open, setOpen] = useControllableState(options, "open", "defaultOpen", "onOpenChange", false);
  const query = ref("");
  const activeIndex = ref(0);

  const transition = (nextOpen, reason = "api", sourceEvent) => {
    if (nextOpen === open.value) return false;
    const detail = { adapter: "vue", open: nextOpen, reason, sourceEvent };
    if (!emit(dialogRef.value, `bs:command:${nextOpen ? "show" : "hide"}`, detail, true)) return false;
    if (nextOpen) restoreTarget.value = sourceEvent?.currentTarget ?? dialogRef.value?.ownerDocument?.activeElement;
    return setOpen(nextOpen, detail);
  };

  const show = (reason, event) => transition(true, reason, event);
  const hide = (reason, event) => transition(false, reason, event);
  const toggle = (reason, event) => transition(!open.value, reason, event);

  watch(open, async (nextOpen) => {
    await nextTick();
    const element = dialogRef.value;
    if (!element) return;
    if (nextOpen && !element.open) {
      element.showModal();
      query.value = "";
      activeIndex.value = 0;
      inputRef.value?.focus();
      emit(element, "bs:command:shown", { adapter: "vue", open: true });
    }
    if (!nextOpen && element.open) {
      element.close();
      if (restoreTarget.value?.isConnected) restoreTarget.value.focus();
      emit(element, "bs:command:hidden", { adapter: "vue", open: false });
    }
    syncDocumentState(element.ownerDocument);
  }, { immediate: true });

  const handleGlobalKeydown = (event) => {
    const isCmdOrCtrl = event.metaKey || event.ctrlKey;
    if (isCmdOrCtrl && event.key.toLowerCase() === shortcut.toLowerCase()) {
      event.preventDefault();
      toggle("shortcut", event);
    }
  };

  onMounted(() => {
    window.addEventListener("keydown", handleGlobalKeydown);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("keydown", handleGlobalKeydown);
    if (dialogRef.value?.open) dialogRef.value.close();
  });

  const select = (item, sourceEvent) => {
    const element = dialogRef.value;
    const value = item.value ?? item.dataset?.bsValue ?? item.label ?? "";
    const detail = { adapter: "vue", item, value, label: item.label ?? "", sourceEvent };
    if (!emit(element, "bs:command:select", detail, true)) return false;
    hide("select", sourceEvent);
    return true;
  };

  const getDialogProps = (props = {}) => ({
    ...props,
    id: props.id ?? paletteId,
    ref: (element) => { dialogRef.value = element; },
    "aria-modal": "true",
    "data-bs-state": open.value ? "open" : "closed",
    onClick: composeHandlers(props.onClick, (event) => {
      if (event.target === dialogRef.value) {
        hide("backdrop", event);
      }
    }),
    onCancel: composeHandlers(props.onCancel, (event) => {
      event.preventDefault();
      hide("escape", event);
    }),
  });

  const getInputProps = (props = {}) => ({
    ...props,
    ref: (element) => { inputRef.value = element; },
    value: props.value ?? query.value,
    placeholder: props.placeholder ?? "Type a command or search...",
    onInput: composeHandlers(props.onInput, (event) => {
      query.value = event.target.value;
      activeIndex.value = 0;
    }),
  });

  return {
    open,
    query,
    activeIndex,
    paletteId,
    show,
    hide,
    toggle,
    select,
    getDialogProps,
    getInputProps,
  };
}
