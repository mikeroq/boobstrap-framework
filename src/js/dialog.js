import { emit, queryRoots, requireElement, setState } from "./shared.js";

const instances = new WeakMap();
const controlledSelector = (id) => `[data-bs-toggle="dialog"][aria-controls="${CSS.escape(id)}"]`;

function isBackdropPointer(element, event) {
  if (event.target !== element) return false;
  const rect = element.getBoundingClientRect();
  return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
}

export class Dialog {
  constructor(element) {
    this.element = requireElement(element, "Dialog");
    if (!(element instanceof HTMLDialogElement)) throw new TypeError("Dialog requires a native <dialog> element.");
    if (!element.id) throw new Error("Dialog requires an id.");

    this.document = element.ownerDocument;
    this.triggers = [...this.document.querySelectorAll(controlledSelector(element.id))];
    this.dismissers = [...element.querySelectorAll("[data-bs-dialog-dismiss]")];
    this.restoreTarget = null;
    this.pendingClose = null;
    this.destroyed = false;

    this.onTrigger = (event) => {
      event.preventDefault();
      this.toggle({ reason: "trigger", sourceEvent: event, restoreTarget: event.currentTarget });
    };
    this.onDismiss = (event) => {
      event.preventDefault();
      this.hide({ reason: "dismiss", sourceEvent: event });
    };
    this.onCancel = (event) => {
      event.preventDefault();
      this.hide({ reason: "escape", sourceEvent: event });
    };
    this.onClick = (event) => {
      if (this.element.dataset.bsDialogCloseOnBackdrop !== "false" && isBackdropPointer(this.element, event)) {
        this.hide({ reason: "backdrop", sourceEvent: event });
      }
    };
    this.onClose = () => this.completeClose();

    this.triggers.forEach((trigger) => trigger.addEventListener("click", this.onTrigger));
    this.dismissers.forEach((dismiss) => dismiss.addEventListener("click", this.onDismiss));
    element.addEventListener("cancel", this.onCancel);
    element.addEventListener("click", this.onClick);
    element.addEventListener("close", this.onClose);
    this.sync();
    instances.set(element, this);
  }

  static getOrCreateInstance(element) {
    return instances.get(element) ?? new Dialog(element);
  }

  syncDocumentState() {
    const hasOpenDialog = Boolean(this.document.querySelector("[data-bs-dialog][open]"));
    this.document.body?.classList.toggle("bs-dialog-open", hasOpenDialog);
  }

  sync() {
    const open = this.element.open;
    setState(this.element, open ? "open" : "closed");
    this.triggers.forEach((trigger) => trigger.setAttribute("aria-expanded", String(open)));
    this.syncDocumentState();
  }

  show(options = {}) {
    if (this.element.open) return false;
    const detail = { controller: this, reason: options.reason ?? "api", sourceEvent: options.sourceEvent };
    if (!emit(this.element, "bs:dialog:show", detail, true)) return false;
    const restoreTarget = options.restoreTarget ?? this.document.activeElement;
    this.element.showModal();
    this.restoreTarget = restoreTarget;
    this.sync();
    emit(this.element, "bs:dialog:shown", detail);
    return true;
  }

  hide(options = {}) {
    if (!this.element.open || this.pendingClose) return false;
    const detail = { controller: this, reason: options.reason ?? "api", sourceEvent: options.sourceEvent };
    if (!emit(this.element, "bs:dialog:hide", detail, true)) return false;
    this.pendingClose = { detail, restoreFocus: options.restoreFocus !== false };
    this.element.close(options.returnValue ?? "");
    this.sync();
    return true;
  }

  toggle(options = {}) {
    return this.element.open ? this.hide(options) : this.show(options);
  }

  completeClose() {
    if (this.destroyed) return;
    const pending = this.pendingClose ?? {
      detail: { controller: this, reason: "native" },
      restoreFocus: false,
    };
    this.pendingClose = null;
    this.sync();
    if (pending.restoreFocus && this.restoreTarget?.isConnected) this.restoreTarget.focus();
    emit(this.element, "bs:dialog:hidden", pending.detail);
  }

  destroy() {
    this.destroyed = true;
    this.triggers.forEach((trigger) => trigger.removeEventListener("click", this.onTrigger));
    this.dismissers.forEach((dismiss) => dismiss.removeEventListener("click", this.onDismiss));
    this.element.removeEventListener("cancel", this.onCancel);
    this.element.removeEventListener("click", this.onClick);
    this.element.removeEventListener("close", this.onClose);
    this.pendingClose = null;
    this.restoreTarget = null;
    if (this.element.open) this.element.close();
    this.syncDocumentState();
    instances.delete(this.element);
  }
}

export function initDialogs(root = document) {
  return queryRoots(root, "[data-bs-dialog]").map((element) => Dialog.getOrCreateInstance(element));
}
