import { useCallback, useEffect, useRef } from "react";
import { composeHandlers, emit, mergeRefs } from "./shared.js";

export function usePassword(options = {}) {
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const toggleRef = useRef(null);
  const labelRef = useRef(null);
  const visibleRef = useRef(false);

  const showLabel = useRef(options.showLabel);
  const hideLabel = useRef(options.hideLabel);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const inputEl = inputRef.current;
    const toggleEl = toggleRef.current;
    if (!inputEl || !toggleEl) return;
    showLabel.current = toggleEl.dataset.bsPasswordShowLabel ?? options.showLabel ?? "Show password";
    hideLabel.current = toggleEl.dataset.bsPasswordHideLabel ?? options.hideLabel ?? "Hide password";
    visibleRef.current = inputEl.type === "text";
    const sync = () => {
      toggleEl.setAttribute("aria-pressed", String(visibleRef.current));
      toggleEl.setAttribute("aria-label", visibleRef.current ? hideLabel.current : showLabel.current);
      if (labelRef.current) labelRef.current.textContent = visibleRef.current ? hideLabel.current : showLabel.current;
      root.dataset.bsState = visibleRef.current ? "visible" : "hidden";
    };
    sync();
  }, [options.showLabel, options.hideLabel]);

  const setVisible = useCallback((nextVisible) => {
    const root = rootRef.current;
    const inputEl = inputRef.current;
    const toggleEl = toggleRef.current;
    if (!root || !inputEl || !toggleEl) return false;
    if (nextVisible === visibleRef.current) return false;
    if (!emit(root, "bs:password:toggle", { adapter: "react", visible: nextVisible }, true)) return false;
    const selectionStart = inputEl.selectionStart;
    const selectionEnd = inputEl.selectionEnd;
    visibleRef.current = nextVisible;
    inputEl.type = nextVisible ? "text" : "password";
    toggleEl.setAttribute("aria-pressed", String(nextVisible));
    toggleEl.setAttribute("aria-label", nextVisible ? hideLabel.current : showLabel.current);
    if (labelRef.current) labelRef.current.textContent = nextVisible ? hideLabel.current : showLabel.current;
    root.dataset.bsState = nextVisible ? "visible" : "hidden";
    inputEl.focus({ preventScroll: true });
    if (selectionStart !== null && selectionEnd !== null) inputEl.setSelectionRange(selectionStart, selectionEnd);
    emit(root, "bs:password:toggled", { adapter: "react", visible: nextVisible });
    return true;
  }, []);

  const toggle = useCallback(() => setVisible(!visibleRef.current), [setVisible]);

  const getRootProps = useCallback((props = {}) => ({
    ...props,
    ref: mergeRefs(rootRef, props.ref),
  }), []);

  const getInputProps = useCallback((props = {}) => ({
    ...props,
    ref: mergeRefs(inputRef, props.ref),
  }), []);

  const getToggleProps = useCallback((props = {}) => ({
    ...props,
    ref: mergeRefs(toggleRef, props.ref),
    type: props.type ?? "button",
    "aria-pressed": visibleRef.current,
    onClick: composeHandlers(props.onClick, toggle),
  }), [toggle]);

  const getLabelProps = useCallback((props = {}) => ({
    ...props,
    ref: mergeRefs(labelRef, props.ref),
  }), []);

  return { visible: visibleRef.current, setVisible, toggle, getRootProps, getInputProps, getToggleProps, getLabelProps };
}
