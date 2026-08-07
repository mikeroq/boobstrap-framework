import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function emit(element, type, detail, cancelable = false) {
  if (!element) return true;
  const CustomEventConstructor = element.ownerDocument.defaultView.CustomEvent;
  return element.dispatchEvent(new CustomEventConstructor(type, {
    bubbles: true,
    cancelable,
    detail,
  }));
}

export function assignRef(ref, value) {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}

export function mergeRefs(...refs) {
  return (value) => refs.forEach((ref) => assignRef(ref, value));
}

export function composeHandlers(userHandler, internalHandler) {
  return (event) => {
    userHandler?.(event);
    if (!event.defaultPrevented) internalHandler(event);
  };
}

export function enabledMenuItems(menu) {
  if (!menu) return [];
  return [...menu.querySelectorAll('[role="menuitem"]')]
    .filter((item) => !item.hidden && !item.disabled && item.getAttribute("aria-disabled") !== "true");
}

export function controlledPanel(tab) {
  const id = tab?.getAttribute("aria-controls");
  return id ? tab.ownerDocument.getElementById(id) : null;
}

export function useControllableState({ value, defaultValue, onChange }) {
  const controlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const state = controlled ? value : internalValue;
  const stateRef = useRef(state);
  stateRef.current = state;

  const setState = useCallback((nextValue, detail) => {
    const resolvedValue = typeof nextValue === "function" ? nextValue(stateRef.current) : nextValue;
    if (Object.is(resolvedValue, stateRef.current)) return false;
    if (!controlled) setInternalValue(resolvedValue);
    onChange?.(resolvedValue, detail);
    return true;
  }, [controlled, onChange]);

  return [state, setState];
}

export function normalizeId(value) {
  return value.replaceAll(":", "");
}
