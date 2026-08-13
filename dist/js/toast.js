import { emit, queryRoots, requireElement, setState } from "./shared.js";

const instances = new WeakMap();
const controlledSelector = (id) => `[data-bs-toggle="toast"][aria-controls="${CSS.escape(id)}"]`;

export class Toast {
  constructor(element) {
    this.element = requireElement(element, "Toast");
    if (!element.id) throw new Error("Toast requires an id.");
    this.document = element.ownerDocument;
    this.triggers = [...this.document.querySelectorAll(controlledSelector(element.id))];
    this.dismissers = [...element.querySelectorAll("[data-bs-toast-dismiss]")];
    this.timer = null;
    this.remaining = this.duration;
    this.startedAt = 0;
    this.hideTimer = null;

    this.onTrigger = (event) => {
      event.preventDefault();
      this.show({ reason: "trigger", sourceEvent: event });
    };
    this.onDismiss = (event) => {
      event.preventDefault();
      this.hide({ reason: "dismiss", sourceEvent: event });
    };
    this.onPause = () => this.pause();
    this.onResume = () => this.resume();

    this.triggers.forEach((trigger) => trigger.addEventListener("click", this.onTrigger));
    this.dismissers.forEach((dismiss) => {
      if (!dismiss.textContent.trim() && !dismiss.hasAttribute("aria-label")) dismiss.setAttribute("aria-label", "Dismiss notification");
      dismiss.addEventListener("click", this.onDismiss);
    });
    element.addEventListener("pointerenter", this.onPause);
    element.addEventListener("pointerleave", this.onResume);
    element.addEventListener("focusin", this.onPause);
    element.addEventListener("focusout", this.onResume);
    if (!element.hasAttribute("role")) element.setAttribute("role", "status");
    if (!element.hasAttribute("aria-live")) element.setAttribute("aria-live", "polite");
    this.sync(element.hidden ? "hidden" : "shown");
    instances.set(element, this);
  }

  static getOrCreateInstance(element) {
    return instances.get(element) ?? new Toast(element);
  }

  get duration() {
    const duration = Number.parseInt(this.element.dataset.bsToastDuration ?? "5000", 10);
    return Number.isFinite(duration) && duration >= 0 ? duration : 5000;
  }

  get autohide() {
    return this.element.dataset.bsToastAutohide !== "false";
  }

  get visible() {
    return !this.element.hidden && ["showing", "shown"].includes(this.element.dataset.bsState);
  }

  sync(state) {
    setState(this.element, state);
    this.triggers.forEach((trigger) => trigger.setAttribute("aria-expanded", String(state === "showing" || state === "shown")));
  }

  schedule(duration = this.duration) {
    this.clearTimer();
    if (!this.autohide || duration <= 0) return;
    this.remaining = duration;
    this.startedAt = Date.now();
    this.timer = setTimeout(() => this.hide({ reason: "timeout" }), duration);
  }

  clearTimer() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  pause() {
    if (!this.timer) return;
    this.remaining = Math.max(0, this.remaining - (Date.now() - this.startedAt));
    this.clearTimer();
  }

  resume() {
    if (this.visible && !this.timer) this.schedule(this.remaining || this.duration);
  }

  show(options = {}) {
    if (this.visible) {
      this.schedule();
      return false;
    }
    const detail = { controller: this, reason: options.reason ?? "api", sourceEvent: options.sourceEvent };
    if (!emit(this.element, "bs:toast:show", detail, true)) return false;
    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.hideTimer = null;
    this.element.hidden = false;
    this.sync("showing");
    this.element.ownerDocument.defaultView.requestAnimationFrame(() => {
      this.sync("shown");
      emit(this.element, "bs:toast:shown", detail);
      this.schedule();
    });
    return true;
  }

  hide(options = {}) {
    if (!this.visible) return false;
    const detail = { controller: this, reason: options.reason ?? "api", sourceEvent: options.sourceEvent };
    if (!emit(this.element, "bs:toast:hide", detail, true)) return false;
    this.clearTimer();
    this.sync("hiding");
    this.hideTimer = setTimeout(() => {
      this.element.hidden = true;
      this.sync("hidden");
      emit(this.element, "bs:toast:hidden", detail);
      this.hideTimer = null;
    }, 220);
    return true;
  }

  destroy() {
    this.clearTimer();
    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.triggers.forEach((trigger) => trigger.removeEventListener("click", this.onTrigger));
    this.dismissers.forEach((dismiss) => dismiss.removeEventListener("click", this.onDismiss));
    this.element.removeEventListener("pointerenter", this.onPause);
    this.element.removeEventListener("pointerleave", this.onResume);
    this.element.removeEventListener("focusin", this.onPause);
    this.element.removeEventListener("focusout", this.onResume);
    instances.delete(this.element);
  }
}

export function initToasts(root = document) {
  return queryRoots(root, "[data-bs-toast]").map((element) => Toast.getOrCreateInstance(element));
}
