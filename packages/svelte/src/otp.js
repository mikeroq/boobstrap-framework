import { composeHandlers, emit } from "./shared.js";

export function createOtp(options = {}) {
  let rootElement = null;
  const characterPattern = new RegExp(options.pattern ?? "[0-9]");

  const getRoot = (target) => rootElement || target?.closest?.(".bs-otp") || (typeof document !== "undefined" ? document.querySelector(".bs-otp, [data-test-otp]") : null);

  const inputs = (root) => {
    const r = root || getRoot();
    return r ? [...r.querySelectorAll("[data-bs-otp-input], .bs-otp-input")] : [];
  };

  const validCharacters = (value) => [...String(value ?? "")].filter((character) => characterPattern.test(character));

  const sync = (syncOptions = {}) => {
    const root = getRoot(syncOptions.target);
    if (!root) return;
    const inputsList = inputs(root);
    const valueElementNode = root.querySelector("[data-bs-otp-value]");
    const value = inputsList.map((input) => input.value).join("");
    const complete = inputsList.length > 0 && inputsList.every((input) => input.value.length === 1);
    if (valueElementNode) valueElementNode.value = value;
    root.dataset.bsState = complete ? "complete" : value ? "partial" : "empty";
    if (!syncOptions.silent) {
      emit(root, "bs:otp:change", { adapter: "svelte", value, complete });
      if (complete) emit(root, "bs:otp:complete", { adapter: "svelte", value });
    }
  };

  const handleInput = (event) => {
    const root = getRoot(event.target);
    if (!root) return;
    rootElement ||= root;
    const inputsList = inputs(root);
    const index = inputsList.indexOf(event.target);
    if (index < 0) return;
    const [character = ""] = validCharacters(event.target.value);
    event.target.value = character;
    if (character && index < inputsList.length - 1) inputsList[index + 1].focus();
    sync({ target: root });
  };

  const handleKeydown = (event) => {
    const root = getRoot(event.target);
    if (!root) return;
    rootElement ||= root;
    const inputsList = inputs(root);
    const index = inputsList.indexOf(event.target);
    if (index < 0) return;
    if (event.key === "Backspace" && !event.target.value && index > 0) {
      event.preventDefault();
      inputsList[index - 1].value = "";
      inputsList[index - 1].focus();
      sync({ target: root });
      return;
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputsList[index - 1].focus();
    }
    if (event.key === "ArrowRight" && index < inputsList.length - 1) {
      event.preventDefault();
      inputsList[index + 1].focus();
    }
  };

  const handlePaste = (event) => {
    const root = getRoot(event.target);
    if (!root) return;
    rootElement ||= root;
    const inputsList = inputs(root);
    const index = inputsList.indexOf(event.target);
    if (index < 0) return;
    const characters = validCharacters(event.clipboardData?.getData("text"));
    if (!characters.length) return;
    event.preventDefault();
    if (characters.length > inputsList.length - index) return;
    for (let offset = 0; offset < characters.length && index + offset < inputsList.length; offset += 1) {
      inputsList[index + offset].value = characters[offset];
    }
    const focusIndex = Math.min(index + characters.length, inputsList.length - 1);
    inputsList[focusIndex].focus();
    sync({ target: root });
  };

  const clear = () => {
    const root = getRoot();
    if (!root) return;
    const inputsList = inputs(root);
    inputsList.forEach((input) => { input.value = ""; });
    inputsList[0]?.focus();
    sync({ target: root });
  };

  const getRootProps = (props = {}) => ({
    ...props,
    oninput: composeHandlers(props.oninput || props.onInput, handleInput),
    onkeydown: composeHandlers(props.onkeydown || props.onKeydown, handleKeydown),
    onpaste: composeHandlers(props.onpaste || props.onPaste, handlePaste),
  });

  const getInputProps = (index, props = {}) => ({
    ...props,
    maxlength: 1,
    inputmode: props.inputmode ?? props.inputMode ?? "numeric",
    autocomplete: index === 0 ? "one-time-code" : "off",
  });

  const otpAction = (node) => {
    rootElement = node;
    node.addEventListener("input", handleInput);
    node.addEventListener("keydown", handleKeydown);
    node.addEventListener("paste", handlePaste);
    sync({ silent: true, target: node });
    return {
      destroy() {
        node.removeEventListener("input", handleInput);
        node.removeEventListener("keydown", handleKeydown);
        node.removeEventListener("paste", handlePaste);
        rootElement = null;
      },
    };
  };

  return {
    clear,
    sync,
    getRootProps,
    getInputProps,
    otp: otpAction,
  };
}

export { createOtp as useOtp };
