import { composeHandlers, emit, isBackdropPointer, nextId } from "./shared.js";

function syncDocumentState(doc) {
  doc?.body?.classList.toggle("bs-dialog-open", Boolean(doc.querySelector("dialog[open]")));
}

export function createDialog(options = {}) {
  const dialogId = options.id ?? nextId("bs-dialog");
  let dialogElement = null;
  let restoreTarget = null;
  let isOpen = options.open ?? options.defaultOpen ?? false;

  const getDialog = () => dialogElement || (typeof document !== "undefined" ? document.getElementById(dialogId) : null);
  const getTrigger = () => typeof document !== "undefined" ? document.querySelector(`[aria-controls="${dialogId}"]`) : null;

  const syncState = () => {
    const dialogEl = getDialog();
    const trigEl = getTrigger();
    if (!dialogEl) return;
    if (isOpen && !dialogEl.open) {
      if (typeof dialogEl.showModal === "function") dialogEl.showModal();
      emit(dialogEl, "bs:dialog:shown", { adapter: "svelte", open: true });
    }
    if (!isOpen && dialogEl.open) {
      if (typeof dialogEl.close === "function") dialogEl.close();
      if (restoreTarget?.isConnected) restoreTarget.focus();
      emit(dialogEl, "bs:dialog:hidden", { adapter: "svelte", open: false });
    }
    dialogEl.dataset.bsState = isOpen ? "open" : "closed";
    syncDocumentState(dialogEl.ownerDocument);
    if (trigEl) {
      trigEl.setAttribute("aria-expanded", String(isOpen));
    }
  };

  const transition = (nextOpen, reason = "api", sourceEvent) => {
    if (nextOpen === isOpen) return false;
    const dialogEl = getDialog();
    const action = nextOpen ? "show" : "hide";
    const detail = { adapter: "svelte", open: nextOpen, reason, sourceEvent };
    if (!emit(dialogEl, `bs:dialog:${action}`, detail, true)) return false;
    if (nextOpen) {
      restoreTarget = sourceEvent?.currentTarget ?? (dialogEl?.ownerDocument || document).activeElement;
    }
    isOpen = nextOpen;
    options.onOpenChange?.(nextOpen, detail);
    syncState();
    return true;
  };

  const show = (reason = "api", event) => transition(true, reason, event);
  const hide = (reason = "api", event) => transition(false, reason, event);
  const toggle = (reason = "api", event) => transition(!isOpen, reason, event);

  const getTriggerProps = (props = {}) => ({
    ...props,
    type: props.type ?? "button",
    "aria-controls": props["aria-controls"] ?? dialogId,
    "aria-expanded": String(isOpen),
    onclick: composeHandlers(props.onclick || props.onClick, (event) => toggle("trigger", event)),
  });

  const getDialogProps = (props = {}) => ({
    ...props,
    id: props.id ?? dialogId,
    "data-bs-state": isOpen ? "open" : "closed",
    oncancel: composeHandlers(props.oncancel || props.onCancel, (event) => {
      event.preventDefault();
      hide("escape", event);
    }),
    onclick: composeHandlers(props.onclick || props.onClick, (event) => {
      const dialogEl = getDialog();
      if (dialogEl && dialogEl.dataset.bsDialogCloseOnBackdrop !== "false" && isBackdropPointer(dialogEl, event)) {
        hide("backdrop", event);
      }
    }),
  });

  const getDismissProps = (props = {}) => ({
    ...props,
    type: props.type ?? "button",
    onclick: composeHandlers(props.onclick || props.onClick, (event) => hide("dismiss", event)),
  });

  const triggerAction = (node) => {
    node.setAttribute("aria-controls", dialogId);
    node.setAttribute("aria-expanded", String(isOpen));
    const clickHandler = (event) => toggle("trigger", event);
    node.addEventListener("click", clickHandler);
    return {
      update() {
        node.setAttribute("aria-expanded", String(isOpen));
      },
      destroy() {
        node.removeEventListener("click", clickHandler);
      },
    };
  };

  const dialogAction = (node) => {
    dialogElement = node;
    node.id ||= dialogId;
    syncState();
    return {
      update() {
        syncState();
      },
      destroy() {
        if (dialogElement?.open && typeof dialogElement.close === "function") {
          dialogElement.close();
        }
        dialogElement = null;
      },
    };
  };

  const dismissAction = (node) => {
    const clickHandler = (event) => hide("dismiss", event);
    node.addEventListener("click", clickHandler);
    return {
      destroy() {
        node.removeEventListener("click", clickHandler);
      },
    };
  };

  return {
    get open() {
      return isOpen;
    },
    dialogId,
    show,
    hide,
    toggle,
    getTriggerProps,
    getDialogProps,
    getDismissProps,
    trigger: triggerAction,
    dialog: dialogAction,
    dismiss: dismissAction,
  };
}

export { createDialog as useDialog };
