import { useCallback, useEffect, useRef, useState } from "react";
import { composeHandlers, emit, mergeRefs } from "./shared.js";

export function usePassword(options = {}) {
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const toggleRef = useRef(null);
  const labelRef = useRef(null);

  const controlled = options.visible !== undefined;
  const [internalVisible, setInternalVisible] = useState(options.defaultVisible ?? false);
  const visible = controlled ? options.visible : internalVisible;

  const showLabelRef = useRef(options.showLabel);
  const hideLabelRef = useRef(options.hideLabel);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const inputEl = inputRef.current;
    const toggleEl = toggleRef.current;
    if (!inputEl || !toggleEl) return;
    showLabelRef.current = toggleEl.dataset.bsPasswordShowLabel ?? options.showLabel ?? "Show password";
    hideLabelRef.current = toggleEl.dataset.bsPasswordHideLabel ?? options.hideLabel ?? "Hide password";
  }, [options.showLabel, options.hideLabel]);

  const sync = useCallback((nextVisible) => {
    const root = rootRef.current;
    const inputEl = inputRef.current;
    const toggleEl = toggleRef.current;
    if (!root || !inputEl || !toggleEl) return;
    inputEl.type = nextVisible ? "text" : "password";
    toggleEl.setAttribute("aria-pressed", String(nextVisible));
    toggleEl.setAttribute("aria-label", nextVisible ? hideLabelRef.current : showLabelRef.current);
    if (labelRef.current) labelRef.current.textContent = nextVisible ? hideLabelRef.current : showLabelRef.current;
    root.dataset.bsState = nextVisible ? "visible" : "hidden";
  }, []);

  useEffect(() => {
    sync(visible);
  }, [visible, sync]);

  const setVisible = useCallback((nextVisible) => {
    const root = rootRef.current;
    const inputEl = inputRef.current;
    const toggleEl = toggleRef.current;
    if (!root || !inputEl || !toggleEl) return false;
    if (nextVisible === visible) return false;
    if (!emit(root, "bs:password:toggle", { adapter: "react", visible: nextVisible }, true)) return false;
    const selectionStart = inputEl.selectionStart;
    const selectionEnd = inputEl.selectionEnd;
    sync(nextVisible);
    if (!controlled) setInternalVisible(nextVisible);
    inputEl.focus({ preventScroll: true });
    if (selectionStart !== null && selectionEnd !== null) inputEl.setSelectionRange(selectionStart, selectionEnd);
    emit(root, "bs:password:toggled", { adapter: "react", visible: nextVisible });
    options.onVisibleChange?.(nextVisible, { adapter: "react", visible: nextVisible });
    return true;
  }, [visible, controlled, sync, options]);

  const toggleVisible = useCallback(() => setVisible(!visible), [setVisible, visible]);

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
    "aria-pressed": visible,
    onClick: composeHandlers(props.onClick, toggleVisible),
  }), [toggleVisible, visible]);

  const getLabelProps = useCallback((props = {}) => ({
    ...props,
    ref: mergeRefs(labelRef, props.ref),
  }), []);

  return {
    visible,
    setVisible,
    toggle: toggleVisible,
    getRootProps,
    getInputProps,
    getToggleProps,
    getLabelProps,
  };
}