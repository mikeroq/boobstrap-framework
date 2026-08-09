import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { composeHandlers, emit, mergeRefs, normalizeId, useControllableState } from "./shared.js";

export function useCombobox(options = {}) {
  const generatedId = useId();
  const listboxId = options.id ?? `bs-combobox-${normalizeId(generatedId)}`;
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const [open, setOpen] = useControllableState({
    value: options.open,
    defaultValue: options.defaultOpen ?? false,
    onChange: options.onOpenChange,
  });
  const [value, setValue] = useControllableState({
    value: options.value,
    defaultValue: options.defaultValue ?? "",
    onChange: options.onValueChange,
  });
  const sourceOptions = options.options ?? [];
  const selectedOption = sourceOptions.find((option) => option.value === value) ?? null;
  const [query, setQuery] = useState(selectedOption?.label ?? "");
  const [activeIndex, setActiveIndex] = useState(-1);
  const normalizedQuery = selectedOption?.label === query ? "" : query.trim().toLocaleLowerCase();
  const filteredOptions = useMemo(() => sourceOptions.filter((option) => option.label.toLocaleLowerCase().includes(normalizedQuery)), [normalizedQuery, sourceOptions]);

  useEffect(() => {
    setQuery(selectedOption?.label ?? "");
  }, [selectedOption?.label]);

  const transition = useCallback((nextOpen, transitionOptions = {}) => {
    if (nextOpen === open) return false;
    const detail = {
      adapter: "react",
      open: nextOpen,
      reason: transitionOptions.reason ?? "api",
      sourceEvent: transitionOptions.sourceEvent,
    };
    if (!emit(rootRef.current, `bs:combobox:${nextOpen ? "show" : "hide"}`, detail, true)) return false;
    const changed = setOpen(nextOpen, detail);
    if (changed) queueMicrotask(() => emit(rootRef.current, `bs:combobox:${nextOpen ? "shown" : "hidden"}`, detail));
    if (!nextOpen) setActiveIndex(-1);
    return changed;
  }, [open, setOpen]);

  const show = useCallback((transitionOptions) => transition(true, transitionOptions), [transition]);
  const hide = useCallback((transitionOptions) => transition(false, transitionOptions), [transition]);
  const toggle = useCallback((transitionOptions) => transition(!open, transitionOptions), [open, transition]);

  useEffect(() => {
    if (!open || !rootRef.current) return undefined;
    const ownerDocument = rootRef.current.ownerDocument;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) hide({ reason: "outside", sourceEvent: event });
    };
    ownerDocument.addEventListener("pointerdown", onPointerDown);
    return () => ownerDocument.removeEventListener("pointerdown", onPointerDown);
  }, [hide, open]);

  const moveActive = useCallback((offset) => {
    if (!filteredOptions.length) return;
    let nextIndex = activeIndex;
    for (let attempt = 0; attempt < filteredOptions.length; attempt += 1) {
      nextIndex = nextIndex < 0
        ? (offset > 0 ? 0 : filteredOptions.length - 1)
        : (nextIndex + offset + filteredOptions.length) % filteredOptions.length;
      if (!filteredOptions[nextIndex].disabled) {
        setActiveIndex(nextIndex);
        queueMicrotask(() => rootRef.current?.querySelector(`#${CSS.escape(`${listboxId}-option-${nextIndex}`)}`)?.scrollIntoView({ block: "nearest" }));
        return;
      }
    }
  }, [activeIndex, filteredOptions, listboxId]);

  const selectOption = useCallback((option, selectOptions = {}) => {
    if (!option || option.disabled) return false;
    const detail = {
      adapter: "react",
      value: option.value,
      label: option.label,
      option,
      reason: selectOptions.reason ?? "selection",
      sourceEvent: selectOptions.sourceEvent,
    };
    if (!emit(rootRef.current, "bs:combobox:select", detail, true)) return false;
    setValue(option.value, detail);
    setQuery(option.label);
    hide({ reason: "selection", sourceEvent: selectOptions.sourceEvent });
    queueMicrotask(() => emit(rootRef.current, "bs:combobox:change", detail));
    inputRef.current?.focus({ preventScroll: true });
    return true;
  }, [hide, setValue]);

  const getRootProps = useCallback((props = {}) => ({
    ...props,
    ref: mergeRefs(rootRef, props.ref),
    "data-bs-state": open ? "open" : "closed",
  }), [open]);

  const getInputProps = useCallback((props = {}) => ({
    ...props,
    ref: mergeRefs(inputRef, props.ref),
    role: "combobox",
    autoComplete: props.autoComplete ?? "off",
    value: query,
    "aria-autocomplete": "list",
    "aria-controls": listboxId,
    "aria-expanded": String(open),
    "aria-activedescendant": activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined,
    onFocus: composeHandlers(props.onFocus, (event) => show({ reason: "focus", sourceEvent: event.nativeEvent ?? event })),
    onChange: composeHandlers(props.onChange, (event) => {
      const nextQuery = event.target.value;
      setQuery(nextQuery);
      if (selectedOption && nextQuery !== selectedOption.label) {
        setValue("", { adapter: "react", value: "", label: "", option: null, reason: "input", sourceEvent: event.nativeEvent ?? event });
      }
      if (!open) show({ reason: "input", sourceEvent: event.nativeEvent ?? event });
      const nextFilteredOptions = sourceOptions.filter((option) => option.label.toLocaleLowerCase().includes(nextQuery.trim().toLocaleLowerCase()));
      setActiveIndex(nextFilteredOptions.findIndex((option) => !option.disabled));
    }),
    onKeyDown: composeHandlers(props.onKeyDown, (event) => {
      if (["ArrowDown", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        show({ reason: "keyboard", sourceEvent: event.nativeEvent ?? event });
        moveActive(event.key === "ArrowDown" ? 1 : -1);
        return;
      }
      if (event.key === "Enter" && open && activeIndex >= 0) {
        event.preventDefault();
        selectOption(filteredOptions[activeIndex], { reason: "keyboard", sourceEvent: event.nativeEvent ?? event });
        return;
      }
      if (event.key === "Escape" && open) {
        event.preventDefault();
        hide({ reason: "escape", sourceEvent: event.nativeEvent ?? event });
        return;
      }
      if (event.key === "Tab") hide({ reason: "tab", sourceEvent: event.nativeEvent ?? event });
    }),
  }), [activeIndex, filteredOptions, hide, listboxId, moveActive, open, query, selectOption, selectedOption, setValue, show, sourceOptions]);

  const getToggleProps = useCallback((props = {}) => ({
    ...props,
    type: props.type ?? "button",
    tabIndex: props.tabIndex ?? -1,
    "aria-label": props["aria-label"] ?? "Toggle options",
    "aria-controls": listboxId,
    "aria-expanded": String(open),
    onClick: composeHandlers(props.onClick, (event) => {
      inputRef.current?.focus();
      toggle({ reason: "toggle", sourceEvent: event.nativeEvent ?? event });
    }),
  }), [listboxId, open, toggle]);

  const getListboxProps = useCallback((props = {}) => ({
    ...props,
    id: props.id ?? listboxId,
    role: "listbox",
    hidden: !open,
    "data-bs-state": open ? "open" : "closed",
  }), [listboxId, open]);

  const getOptionProps = useCallback((option, index, props = {}) => ({
    ...props,
    id: props.id ?? `${listboxId}-option-${index}`,
    role: "option",
    "aria-disabled": option.disabled ? "true" : undefined,
    "aria-selected": String(option.value === value),
    "data-bs-state": index === activeIndex ? "active" : "idle",
    onPointerMove: composeHandlers(props.onPointerMove, () => {
      if (!option.disabled) setActiveIndex(index);
    }),
    onMouseDown: composeHandlers(props.onMouseDown, (event) => event.preventDefault()),
    onClick: composeHandlers(props.onClick, (event) => selectOption(option, { sourceEvent: event.nativeEvent ?? event })),
  }), [activeIndex, listboxId, selectOption, value]);

  return {
    open,
    value,
    query,
    activeIndex,
    filteredOptions,
    selectedOption,
    show,
    hide,
    toggle,
    selectOption,
    getRootProps,
    getInputProps,
    getToggleProps,
    getListboxProps,
    getOptionProps,
  };
}
