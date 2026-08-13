import { computed, onBeforeUnmount, ref, watch } from "vue";
import { composeHandlers, emit, nextId, useControllableState } from "./shared.js";

export function useCombobox(options = {}) {
  const listboxId = options.id ?? nextId("bs-combobox");
  const rootRef = ref(null);
  const inputRef = ref(null);
  const [open, setOpen] = useControllableState(options, "open", "defaultOpen", "onOpenChange", false);
  const [value, setValue] = useControllableState(options, "value", "defaultValue", "onValueChange", "");
  const selectedOption = computed(() => (options.options ?? []).find((option) => option.value === value.value) ?? null);
  const query = ref(selectedOption.value?.label ?? "");
  const activeIndex = ref(-1);
  const filteredOptions = computed(() => {
    const normalized = selectedOption.value?.label === query.value ? "" : query.value.trim().toLocaleLowerCase();
    return (options.options ?? []).filter((option) => option.label.toLocaleLowerCase().includes(normalized));
  });
  watch(() => selectedOption.value?.label, (label) => { query.value = label ?? ""; });
  const transition = (nextOpen, transitionOptions = {}) => {
    if (nextOpen === open.value) return false;
    const detail = { adapter: "vue", open: nextOpen, reason: transitionOptions.reason ?? "api", sourceEvent: transitionOptions.sourceEvent };
    if (!emit(rootRef.value, `bs:combobox:${nextOpen ? "show" : "hide"}`, detail, true)) return false;
    const changed = setOpen(nextOpen, detail);
    if (!nextOpen) activeIndex.value = -1;
    queueMicrotask(() => emit(rootRef.value, `bs:combobox:${nextOpen ? "shown" : "hidden"}`, detail));
    return changed;
  };
  const show = (value) => transition(true, value);
  const hide = (value) => transition(false, value);
  const toggle = (value) => transition(!open.value, value);
  const onDocumentPointer = (event) => { if (!rootRef.value?.contains(event.target)) hide({ reason: "outside", sourceEvent: event }); };
  watch(open, (nextOpen) => {
    rootRef.value?.ownerDocument.removeEventListener("pointerdown", onDocumentPointer);
    if (nextOpen) rootRef.value?.ownerDocument.addEventListener("pointerdown", onDocumentPointer);
  });
  onBeforeUnmount(() => rootRef.value?.ownerDocument.removeEventListener("pointerdown", onDocumentPointer));
  const moveActive = (offset) => {
    if (!filteredOptions.value.length) return;
    let nextIndex = activeIndex.value;
    for (let attempt = 0; attempt < filteredOptions.value.length; attempt += 1) {
      nextIndex = nextIndex < 0 ? (offset > 0 ? 0 : filteredOptions.value.length - 1) : (nextIndex + offset + filteredOptions.value.length) % filteredOptions.value.length;
      if (!filteredOptions.value[nextIndex].disabled) { activeIndex.value = nextIndex; return; }
    }
  };
  const selectOption = (option, selectOptions = {}) => {
    if (!option || option.disabled) return false;
    const detail = { adapter: "vue", value: option.value, label: option.label, option, reason: selectOptions.reason ?? "selection", sourceEvent: selectOptions.sourceEvent };
    if (!emit(rootRef.value, "bs:combobox:select", detail, true)) return false;
    setValue(option.value, detail);
    query.value = option.label;
    hide({ reason: "selection", sourceEvent: selectOptions.sourceEvent });
    queueMicrotask(() => emit(rootRef.value, "bs:combobox:change", detail));
    inputRef.value?.focus({ preventScroll: true });
    return true;
  };
  const getRootProps = (props = {}) => ({ ...props, ref: (element) => { rootRef.value = element; }, "data-bs-state": open.value ? "open" : "closed" });
  const getInputProps = (props = {}) => ({
    ...props,
    ref: (element) => { inputRef.value = element; },
    role: "combobox",
    autocomplete: props.autocomplete ?? "off",
    value: query.value,
    "aria-autocomplete": "list",
    "aria-controls": listboxId,
    "aria-expanded": String(open.value),
    "aria-activedescendant": activeIndex.value >= 0 ? `${listboxId}-option-${activeIndex.value}` : undefined,
    onFocus: composeHandlers(props.onFocus, (event) => show({ reason: "focus", sourceEvent: event })),
    onInput: composeHandlers(props.onInput, (event) => {
      query.value = event.target.value;
      if (selectedOption.value && query.value !== selectedOption.value.label) setValue("", { adapter: "vue", value: "", label: "", option: null, reason: "input", sourceEvent: event });
      if (!open.value) show({ reason: "input", sourceEvent: event });
      activeIndex.value = filteredOptions.value.findIndex((option) => !option.disabled);
    }),
    onKeydown: composeHandlers(props.onKeydown, (event) => {
      if (["ArrowDown", "ArrowUp"].includes(event.key)) { event.preventDefault(); show({ reason: "keyboard", sourceEvent: event }); moveActive(event.key === "ArrowDown" ? 1 : -1); return; }
      if (event.key === "Enter" && open.value && activeIndex.value >= 0) { event.preventDefault(); selectOption(filteredOptions.value[activeIndex.value], { reason: "keyboard", sourceEvent: event }); return; }
      if (event.key === "Escape" && open.value) { event.preventDefault(); hide({ reason: "escape", sourceEvent: event }); }
      if (event.key === "Tab") hide({ reason: "tab", sourceEvent: event });
    }),
  });
  const getToggleProps = (props = {}) => ({ ...props, type: props.type ?? "button", tabindex: props.tabindex ?? -1, "aria-label": props["aria-label"] ?? "Toggle options", "aria-controls": listboxId, "aria-expanded": String(open.value), onClick: composeHandlers(props.onClick, (event) => { inputRef.value?.focus(); toggle({ reason: "toggle", sourceEvent: event }); }) });
  const getListboxProps = (props = {}) => ({ ...props, id: props.id ?? listboxId, role: "listbox", hidden: !open.value, "data-bs-state": open.value ? "open" : "closed" });
  const getOptionProps = (option, index, props = {}) => ({
    ...props,
    id: props.id ?? `${listboxId}-option-${index}`,
    role: "option",
    "aria-disabled": option.disabled ? "true" : undefined,
    "aria-selected": String(option.value === value.value),
    "data-bs-state": index === activeIndex.value ? "active" : "idle",
    onPointermove: composeHandlers(props.onPointermove, () => { if (!option.disabled) activeIndex.value = index; }),
    onMousedown: composeHandlers(props.onMousedown, (event) => event.preventDefault()),
    onClick: composeHandlers(props.onClick, (event) => selectOption(option, { sourceEvent: event })),
  });
  return { open, value, query, activeIndex, filteredOptions, selectedOption, show, hide, toggle, selectOption, getRootProps, getInputProps, getToggleProps, getListboxProps, getOptionProps };
}
