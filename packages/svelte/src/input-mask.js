import { composeHandlers, emit } from "./shared.js";

const tokens = { "9": /[0-9]/, A: /[A-Za-z]/, "*": /[A-Za-z0-9]/ };

export function formatMask(value, mask) {
  const source = String(value ?? "");
  let sourceIndex = 0;
  let output = "";
  let matched = 0;
  for (const patternCharacter of mask) {
    const matcher = tokens[patternCharacter];
    if (!matcher) {
      if (source.length && (matched > 0 || sourceIndex < source.length)) output += patternCharacter;
      continue;
    }
    let character = source[sourceIndex];
    while (character !== undefined && !matcher.test(character)) {
      sourceIndex += 1;
      character = source[sourceIndex];
    }
    if (character === undefined) break;
    output += character;
    matched += 1;
    sourceIndex += 1;
  }
  return output;
}

export function createInputMask(mask) {
  let inputElement = null;

  const getInput = (target) => inputElement || target || (typeof document !== "undefined" ? document.querySelector(".bs-input-mask") : null);

  const format = (formatOptions = {}) => {
    const el = getInput(formatOptions.nativeEvent?.target);
    if (!el) return false;
    const previousValue = el.value;
    const value = formatMask(previousValue, mask);
    el.value = value;
    el.setSelectionRange?.(value.length, value.length);
    if (!formatOptions.silent) emit(el, "bs:mask:change", { adapter: "svelte", value, mask });
    return true;
  };

  const onInput = (event) => {
    inputElement = event.currentTarget;
    format({ nativeEvent: event });
  };
  const numericOnly = [...mask].filter((character) => tokens[character]).every((character) => character === "9");

  const getInputProps = (props = {}) => ({
    ...props,
    class: props.class ? `${props.class} bs-input-mask` : "bs-input-mask",
    inputmode: props.inputmode ?? props.inputMode ?? (numericOnly ? "numeric" : undefined),
    value: props.value ?? formatMask(props.value ?? "", mask),
    oninput: composeHandlers(props.oninput || props.onInput, onInput),
  });

  const inputAction = (node) => {
    inputElement = node;
    node.classList.add("bs-input-mask");
    if (numericOnly && !node.hasAttribute("inputmode")) {
      node.setAttribute("inputmode", "numeric");
    }
    if (node.value) {
      node.value = formatMask(node.value, mask);
    }
    node.addEventListener("input", onInput);
    return {
      update() {
        if (node.value) node.value = formatMask(node.value, mask);
      },
      destroy() {
        node.removeEventListener("input", onInput);
        inputElement = null;
      },
    };
  };

  return {
    format,
    getInputProps,
    input: inputAction,
  };
}

export { createInputMask as useInputMask };
