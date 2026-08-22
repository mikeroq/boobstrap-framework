import { ref } from "vue";
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

export function useInputMask(mask) {
  const inputRef = ref(null);
  const format = (options = {}) => {
    const element = inputRef.value;
    if (!element) return false;
    const previousValue = element.value;
    const value = formatMask(previousValue, mask);
    if (value === previousValue) return false;
    element.value = value;
    element.setSelectionRange?.(value.length, value.length);
    if (!options.silent) emit(element, "bs:mask:change", { adapter: "vue", value, mask });
    return true;
  };
  const onInput = (event) => format({ nativeEvent: event });
  const numericOnly = [...mask].filter((character) => tokens[character]).every((character) => character === "9");
  const getInputProps = (props = {}) => ({
    ...props,
    ref: (element) => { inputRef.value = element; },
    class: props.class ? `${props.class} bs-input-mask` : "bs-input-mask",
    inputMode: props.inputMode ?? (numericOnly ? "numeric" : undefined),
    value: props.value ?? formatMask(props.value ?? "", mask),
    onInput: composeHandlers(props.onInput, onInput),
  });
  return { format, getInputProps };
}
