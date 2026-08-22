import { composeHandlers, emit } from "./shared.js";

export function createBanner(options = {}) {
  let rootElement = null;
  let dismissElement = null;
  let isVisible = options.visible ?? options.defaultVisible ?? true;

  const getRoot = () => rootElement || (typeof document !== "undefined" ? (options.id ? document.getElementById(options.id) : document.querySelector(".bs-banner")) : null);

  const syncState = () => {
    const rootEl = getRoot();
    if (rootEl) {
      rootEl.hidden = !isVisible;
      rootEl.dataset.bsState = isVisible ? "visible" : "dismissed";
    }
  };

  const transition = (nextVisible, reason = "api", sourceEvent) => {
    if (nextVisible === isVisible) return false;
    const rootEl = getRoot() || sourceEvent?.currentTarget?.closest(".bs-banner");
    const action = nextVisible ? "show" : "dismiss";
    const detail = { adapter: "svelte", visible: nextVisible, reason, sourceEvent };
    if (!emit(rootEl, `bs:banner:${action}`, detail, true)) return false;
    isVisible = nextVisible;
    options.onVisibleChange?.(nextVisible, detail);
    syncState();
    emit(rootEl, `bs:banner:${nextVisible ? "shown" : "dismissed"}`, detail);
    return true;
  };

  const show = (reason = "api", sourceEvent) => transition(true, reason, sourceEvent);
  const dismiss = (reason = "api", sourceEvent) => transition(false, reason, sourceEvent);

  const getBannerProps = (props = {}) => ({
    ...props,
    hidden: !isVisible,
    "data-bs-state": isVisible ? "visible" : "dismissed",
  });

  const getDismissProps = (props = {}) => ({
    ...props,
    type: props.type ?? "button",
    onclick: composeHandlers(props.onclick || props.onClick, (event) => {
      rootElement ||= event.currentTarget.closest(".bs-banner");
      dismiss("dismiss", event);
    }),
  });

  const bannerAction = (node) => {
    rootElement = node;
    syncState();
    return {
      update() {
        syncState();
      },
      destroy() {
        rootElement = null;
      },
    };
  };

  const dismissAction = (node) => {
    dismissElement = node;
    const clickHandler = (event) => dismiss("dismiss", event);
    node.addEventListener("click", clickHandler);
    return {
      destroy() {
        node.removeEventListener("click", clickHandler);
        dismissElement = null;
      },
    };
  };

  return {
    get visible() {
      return isVisible;
    },
    show,
    dismiss,
    getBannerProps,
    getDismissProps,
    banner: bannerAction,
    dismissAction,
  };
}

export { createBanner as useBanner };
