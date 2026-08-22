import { composeHandlers, emit, nextId } from "./shared.js";

function syncDocumentState(doc) {
  doc?.body?.classList.toggle("bs-dialog-open", Boolean(doc.querySelector("dialog[open]")));
}

export function createCommandPalette(options = {}) {
  const paletteId = options.id ?? nextId("bs-command-palette");
  let dialogElement = null;
  let inputElement = null;
  let restoreTarget = null;
  let isOpen = options.open ?? options.defaultOpen ?? false;
  let queryText = "";
  let activeIdx = 0;
  const shortcutKey = (options.shortcut ?? "k").toLowerCase();

  const syncState = () => {
    if (!dialogElement) return;
    if (isOpen && !dialogElement.open) {
      if (typeof dialogElement.showModal === "function") dialogElement.showModal();
      queryText = "";
      activeIdx = 0;
      inputElement?.focus();
      emit(dialogElement, "bs:command:shown", { adapter: "svelte", open: true });
    }
    if (!isOpen && dialogElement.open) {
      if (typeof dialogElement.close === "function") dialogElement.close();
      if (restoreTarget?.isConnected) restoreTarget.focus();
      emit(dialogElement, "bs:command:hidden", { adapter: "svelte", open: false });
    }
    dialogElement.dataset.bsState = isOpen ? "open" : "closed";
    syncDocumentState(dialogElement.ownerDocument);
  };

  const transition = (nextOpen, reason = "api", sourceEvent) => {
    if (nextOpen === isOpen) return false;
    const action = nextOpen ? "show" : "hide";
    const detail = { adapter: "svelte", open: nextOpen, reason, sourceEvent };
    if (!emit(dialogElement, `bs:command:${action}`, detail, true)) return false;
    if (nextOpen) {
      restoreTarget = sourceEvent?.currentTarget ?? (dialogElement?.ownerDocument || document).activeElement;
    }
    isOpen = nextOpen;
    options.onOpenChange?.(nextOpen, detail);
    syncState();
    return true;
  };

  const show = (reason = "api", event) => transition(true, reason, event);
  const hide = (reason = "api", event) => transition(false, reason, event);
  const toggle = (reason = "api", event) => transition(!isOpen, reason, event);

  const select = (item, sourceEvent) => {
    const value = item?.value ?? item?.dataset?.bsValue ?? item?.label ?? item?.textContent?.trim() ?? "";
    const detail = { adapter: "svelte", item, value, label: item?.label ?? item?.textContent?.trim() ?? "", sourceEvent };
    if (!emit(dialogElement, "bs:command:select", detail, true)) return false;
    hide("select", sourceEvent);
    return true;
  };

  const onGlobalKeydown = (event) => {
    const isCmdOrCtrl = event.metaKey || event.ctrlKey;
    if (isCmdOrCtrl && event.key.toLowerCase() === shortcutKey) {
      event.preventDefault();
      toggle("shortcut", event);
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("keydown", onGlobalKeydown);
  }

  const destroy = () => {
    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", onGlobalKeydown);
    }
    if (dialogElement?.open && typeof dialogElement.close === "function") {
      dialogElement.close();
    }
  };

  const getDialogProps = (props = {}) => ({
    ...props,
    id: props.id ?? paletteId,
    "aria-modal": "true",
    "data-bs-state": isOpen ? "open" : "closed",
    onclick: composeHandlers(props.onclick || props.onClick, (event) => {
      if (event.target === dialogElement) {
        hide("backdrop", event);
      }
    }),
    oncancel: composeHandlers(props.oncancel || props.onCancel, (event) => {
      event.preventDefault();
      hide("escape", event);
    }),
  });

  const getInputProps = (props = {}) => ({
    ...props,
    value: props.value ?? queryText,
    placeholder: props.placeholder ?? "Type a command or search...",
    oninput: composeHandlers(props.oninput || props.onInput, (event) => {
      queryText = event.target.value;
      activeIdx = 0;
    }),
  });

  const dialogAction = (node) => {
    dialogElement = node;
    node.id ||= paletteId;
    syncState();
    return {
      update() {
        syncState();
      },
      destroy() {
        destroy();
        dialogElement = null;
      },
    };
  };

  const inputAction = (node) => {
    inputElement = node;
    return {
      destroy() {
        inputElement = null;
      },
    };
  };

  return {
    get open() {
      return isOpen;
    },
    get query() {
      return queryText;
    },
    get activeIndex() {
      return activeIdx;
    },
    paletteId,
    show,
    hide,
    toggle,
    select,
    getDialogProps,
    getInputProps,
    dialog: dialogAction,
    input: inputAction,
    destroy,
  };
}

export { createCommandPalette as useCommandPalette };
