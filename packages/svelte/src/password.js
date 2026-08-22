import { composeHandlers, emit } from "./shared.js";

export function createPassword(options = {}) {
  let rootElement = null;
  let inputElement = null;
  let toggleElement = null;
  let isVisible = false;
  const showLabel = options.showLabel ?? "Show password";
  const hideLabel = options.hideLabel ?? "Hide password";

  const getRoot = () => rootElement || (typeof document !== "undefined" ? document.querySelector(".bs-input-group, [data-test-password]") : null);
  const getInput = () => inputElement || getRoot()?.querySelector?.("input");
  const getToggle = () => toggleElement || getRoot()?.querySelector?.("button, [data-bs-password-toggle]");

  const sync = () => {
    const root = getRoot();
    const toggleEl = getToggle();
    if (toggleEl) {
      toggleEl.setAttribute("aria-pressed", String(isVisible));
      toggleEl.setAttribute("aria-label", isVisible ? hideLabel : showLabel);
    }
    if (root) {
      root.dataset.bsState = isVisible ? "visible" : "hidden";
    }
  };

  const setVisible = (nextVisible) => {
    const root = getRoot();
    const inputEl = getInput();
    if (!root || !inputEl) return false;
    if (nextVisible === isVisible) return false;
    if (!emit(root, "bs:password:toggle", { adapter: "svelte", visible: nextVisible }, true)) return false;
    const start = inputEl.selectionStart;
    const end = inputEl.selectionEnd;
    isVisible = nextVisible;
    inputEl.type = nextVisible ? "text" : "password";
    sync();
    inputEl.focus();
    if (start !== null && end !== null) inputEl.setSelectionRange(start, end);
    emit(root, "bs:password:toggled", { adapter: "svelte", visible: nextVisible });
    return true;
  };

  const toggle = () => setVisible(!isVisible);

  const getRootProps = (props = {}) => ({
    ...props,
  });

  const getInputProps = (props = {}) => ({
    ...props,
    type: isVisible ? "text" : "password",
  });

  const getToggleProps = (props = {}) => ({
    ...props,
    type: props.type ?? "button",
    "aria-pressed": isVisible,
    onclick: composeHandlers(props.onclick || props.onClick, (event) => {
      rootElement ||= event.currentTarget.closest(".bs-input-group");
      inputElement ||= rootElement?.querySelector("input");
      toggleElement = event.currentTarget;
      toggle();
    }),
  });

  const passwordAction = (node) => {
    rootElement = node;
    inputElement = node.querySelector("input");
    toggleElement = node.querySelector("button, [data-bs-password-toggle]");
    if (inputElement) {
      isVisible = inputElement.type === "text";
    }
    sync();
    return {
      destroy() {
        rootElement = null;
        inputElement = null;
        toggleElement = null;
      },
    };
  };

  return {
    get visible() {
      return isVisible;
    },
    setVisible,
    toggle,
    getRootProps,
    getInputProps,
    getToggleProps,
    password: passwordAction,
  };
}

export { createPassword as usePassword };
