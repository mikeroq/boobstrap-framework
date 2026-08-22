import { useCallback, useRef } from "react";
import { composeHandlers, emit, mergeRefs } from "./shared.js";

export function useOtp(options = {}) {
  const rootRef = useRef(null);
  const characterPattern = new RegExp(options.pattern ?? "[0-9]");

  const validCharacters = useCallback((value) => [...String(value ?? "")].filter((character) => characterPattern.test(character)), [characterPattern]);

  const inputs = () => rootRef.current ? [...rootRef.current.querySelectorAll("[data-bs-otp-input], .bs-otp-input")] : [];

  const sync = useCallback((syncOptions = {}) => {
    const root = rootRef.current;
    if (!root) return;
    const inputsList = inputs();
    const valueElementNode = root.querySelector("[data-bs-otp-value]");
    const value = inputsList.map((input) => input.value).join("");
    const complete = inputsList.every((input) => input.value.length === 1);
    if (valueElementNode) valueElementNode.value = value;
    root.dataset.bsState = complete ? "complete" : value ? "partial" : "empty";
    if (!syncOptions.silent) {
      emit(root, "bs:otp:change", { adapter: "react", value, complete });
      if (complete) emit(root, "bs:otp:complete", { adapter: "react", value });
    }
  }, []);

  const handleInput = useCallback((event) => {
    const root = rootRef.current;
    if (!root) return;
    const inputsList = inputs();
    const index = inputsList.indexOf(event.target);
    if (index < 0) return;
    const [character = ""] = validCharacters(event.target.value);
    event.target.value = character;
    if (character && index < inputsList.length - 1) inputsList[index + 1].focus();
    sync();
  }, [sync, validCharacters]);

  const handleKeydown = useCallback((event) => {
    const root = rootRef.current;
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
  }, [sync]);

  const handlePaste = useCallback((event) => {
    const root = rootRef.current;
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
  }, [sync, validCharacters]);

  const clear = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const inputsList = inputs();
    inputsList.forEach((input) => { input.value = ""; });
    inputsList[0].focus();
    sync();
  }, [sync]);

  const getRootProps = useCallback((props = {}) => ({
    ...props,
    ref: mergeRefs(rootRef, props.ref),
    onInput: composeHandlers(props.onInput, handleInput),
    onKeyDown: composeHandlers(props.onKeyDown, handleKeydown),
    onPaste: composeHandlers(props.onPaste, handlePaste),
  }), [handleInput, handleKeydown, handlePaste]);

  const getInputProps = useCallback((index, props = {}) => ({
    ...props,
    maxLength: 1,
    inputMode: props.inputMode ?? "numeric",
    autoComplete: index === 0 ? "one-time-code" : "off",
  }), []);

  return { clear, sync, getRootProps, getInputProps };
}
