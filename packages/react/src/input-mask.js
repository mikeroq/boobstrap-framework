import { useCallback, useMemo, useRef } from "react";
import { composeHandlers, emit, mergeRefs } from "./shared.js";

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
  const inputRef = useRef(null);
  const maskRef = useRef(mask);
  maskRef.current = mask;

  const format = useCallback((options = {}) => {
    const element = inputRef.current;
    if (!element) return false;
    const previousValue = element.value;
    const value = formatMask(previousValue, maskRef.current);
    if (value === previousValue) return false;
    element.value = value;
    element.setSelectionRange?.(value.length, value.length);
    if (!options.silent) emit(element, "bs:mask:change", { adapter: "react", value, mask: maskRef.current });
    return true;
  }, []);

  const onInput = useCallback((event) => {
    format({ nativeEvent: event.nativeEvent ?? event });
  }, [format]);

  const getInputProps = useCallback((props = {}) => {
    const numericOnly = useMemo(() => [...maskRef.current].filter((character) => tokens[character]).every((character) => character === "9"), [mask]);
    return {
      ...props,
      ref: mergeRefs(inputRef, props.ref),
      inputMode: props.inputMode ?? (numericOnly ? "numeric" : undefined),
      className: props.className ? `${props.className} bs-input-mask` : "bs-input-mask",
      defaultValue: props.defaultValue ?? formatMask(props.defaultValue ?? "", maskRef.current),
      onInput: composeHandlers(props.onInput, onInput),
    };
  }, [onInput]);

  return { format, getInputProps };
}
