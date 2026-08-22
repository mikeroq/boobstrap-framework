import { ref } from "vue";
import { composeHandlers, emit } from "./shared.js";

export function useOtp(options = {}) {
  const rootRef = ref(null);
  const characterPattern = new RegExp(options.pattern ?? "[0-9]");
  const inputs = () => rootRef.value ? [...rootRef.value.querySelectorAll("[data-bs-otp-input], .bs-otp-input")] : [];

  const validCharacters = (value) => [...String(value ?? "")].filter((character) => characterPattern.test(character));

  const sync = (syncOptions = {}) => {
    const root = rootRef.value;
    if (!root) return;
    const inputsList = inputs();
    const valueElementNode = root.querySelector("[data-bs-otp-value]");
    const value = inputsList.map((input) => input.value).join("");
    const complete = inputsList.every((input) => input.value.length === 1);
    if (valueElementNode) valueElementNode.value = value;
    root.dataset.bsState = complete ? "complete" : value ? "partial" : "empty";
    if (!syncOptions.silent) {
      emit(root, "bs:otp:change", { adapter: "vue", value, complete });
      if (complete) emit(root, "bs:otp:complete", { adapter: "vue", value });
    }
  };

  const handleInput = (event) => {
    const root = rootRef.value;
    if (!root) return;
    const inputsList = inputs();
    const index = inputsList.indexOf(event.target);
    if (index < 0) return;
    const [character = ""] = validCharacters(event.target.value);
    event.target.value = character;
    if (character && index < inputsList.length - 1) inputsList[index + 1].focus();
    sync();
  };
  const handleKeydown = (event) => {
    const root = rootRef.value;
    if (!root) return;
    const inputsList = inputs();
    const index = inputsList.indexOf(event.target);
    if (index < 0) return;
    if (event.key === "Backspace" && !event.target.value && index > 0) {
      event.preventDefault();
      inputsList[index - 1].value = "";
      inputsList[index - 1].focus();
      sync();
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
    const root = rootRef.value;
    if (!root) return;
    const inputsList = inputs();
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
    sync();
  };
  const clear = () => {
    const root = rootRef.value;
    if (!root) return;
    const inputsList = inputs();
    inputsList.forEach((input) => { input.value = ""; });
    inputsList[0].focus();
    sync();
  };
  const getRootProps = (props = {}) => ({
    ...props,
    ref: (element) => { rootRef.value = element; },
    onInput: composeHandlers(props.onInput, handleInput),
    onKeydown: composeHandlers(props.onKeydown, handleKeydown),
    onPaste: composeHandlers(props.onPaste, handlePaste),
  });
  const getInputProps = (index, props = {}) => ({
    ...props,
    maxLength: 1,
    inputMode: props.inputMode ?? "numeric",
    autocomplete: index === 0 ? "one-time-code" : "off",
  });
  return { clear, sync, getRootProps, getInputProps };
}
