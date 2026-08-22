import { composeHandlers, emit } from "./shared.js";

export function createButton(options = {}) {
  let buttonElement = null;
  let isLoading = options.loading ?? options.defaultLoading ?? false;

  const getButton = () => buttonElement || (typeof document !== "undefined" ? (options.id ? document.getElementById(options.id) : document.querySelector("#svelte-loading, .bs-btn[data-bs-state]")) : null);

  const syncState = () => {
    const btnEl = getButton();
    if (btnEl) {
      btnEl.disabled = Boolean(isLoading);
      btnEl.setAttribute("aria-busy", isLoading ? "true" : "false");
      btnEl.dataset.bsState = isLoading ? "loading" : "idle";
      if (isLoading && options.loadingLabel) {
        btnEl.setAttribute("aria-label", options.loadingLabel);
      }
    }
  };

  const transition = (nextLoading, reason = "api", sourceEvent) => {
    if (nextLoading === isLoading) return false;
    const btnEl = getButton() || sourceEvent?.currentTarget;
    const action = nextLoading ? "start" : "stop";
    const detail = { adapter: "svelte", loading: nextLoading, reason, sourceEvent };
    if (!emit(btnEl, `bs:button:${action}`, detail, true)) return false;
    isLoading = nextLoading;
    options.onLoadingChange?.(nextLoading, detail);
    syncState();
    emit(btnEl, `bs:button:${nextLoading ? "started" : "stopped"}`, detail);
    return true;
  };

  const start = (reason = "api", event) => transition(true, reason, event);
  const stop = (reason = "api", event) => transition(false, reason, event);
  const toggle = (reason = "api", event) => transition(!isLoading, reason, event);

  const getButtonProps = (props = {}) => ({
    ...props,
    type: props.type ?? "button",
    disabled: Boolean(props.disabled || isLoading),
    "aria-busy": isLoading ? "true" : props["aria-busy"],
    "aria-label": isLoading ? (options.loadingLabel ?? props["data-bs-loading-label"] ?? "Loading") : props["aria-label"],
    "data-bs-state": isLoading ? "loading" : "idle",
    onclick: composeHandlers(props.onclick || props.onClick, (event) => {
      buttonElement = event.currentTarget;
      if (options.autoStart !== false) start("trigger", event);
    }),
  });

  const buttonAction = (node) => {
    buttonElement = node;
    syncState();
    const clickHandler = (event) => {
      if (options.autoStart !== false) start("trigger", event);
    };
    node.addEventListener("click", clickHandler);
    return {
      update() {
        syncState();
      },
      destroy() {
        node.removeEventListener("click", clickHandler);
        buttonElement = null;
      },
    };
  };

  return {
    get loading() {
      return isLoading;
    },
    start,
    stop,
    toggle,
    getButtonProps,
    button: buttonAction,
  };
}

export { createButton as useButton };
