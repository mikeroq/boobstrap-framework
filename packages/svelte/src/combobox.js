import { composeHandlers, emit, nextId } from "./shared.js";

export function createCombobox(options = {}) {
  const listboxId = options.id ?? nextId("bs-combobox");
  let rootElement = null;
  let inputElement = null;
  let isOpen = options.open ?? options.defaultOpen ?? false;
  let currentValue = options.value ?? options.defaultValue ?? (options.multiple ? [] : "");
  let queryText = "";
  let activeIdx = -1;

  const isMultiple = Boolean(options.multiple);

  const getOptionsList = () => options.options ?? [];

  const getSelectedOptions = () => {
    const list = getOptionsList();
    if (isMultiple) {
      const arr = Array.isArray(currentValue) ? currentValue : (currentValue ? [currentValue] : []);
      return list.filter((opt) => arr.includes(opt.value));
    }
    return list.find((opt) => opt.value === currentValue) ?? null;
  };

  if (!isMultiple) {
    const selected = getSelectedOptions();
    queryText = selected?.label ?? "";
  }

  const getFilteredOptions = () => {
    const list = getOptionsList();
    if (!queryText) return list;
    const norm = queryText.trim().toLowerCase();
    return list.filter((opt) => opt.label.toLowerCase().includes(norm));
  };

  const getRoot = () => rootElement || (typeof document !== "undefined" ? document.querySelector(".bs-combobox, #svelte-role")?.closest(".bs-combobox") || document.querySelector(".bs-combobox") : null);
  const getInput = () => inputElement || (typeof document !== "undefined" ? document.querySelector(`[aria-controls="${listboxId}"], #svelte-role-input`) : null);
  const getListbox = () => typeof document !== "undefined" ? document.getElementById(listboxId) : null;

  const syncState = () => {
    const rootEl = getRoot();
    const listboxEl = getListbox();
    const inputEl = getInput();
    if (rootEl) {
      rootEl.dataset.bsState = isOpen ? "open" : "closed";
    }
    if (listboxEl) {
      listboxEl.hidden = !isOpen;
      listboxEl.dataset.bsState = isOpen ? "open" : "closed";
    }
    if (inputEl) {
      inputEl.setAttribute("aria-expanded", String(isOpen));
      if (activeIdx >= 0) {
        inputEl.setAttribute("aria-activedescendant", `${listboxId}-option-${activeIdx}`);
      } else {
        inputEl.removeAttribute("aria-activedescendant");
      }
    }
  };

  const transition = (nextOpen, transitionOptions = {}) => {
    if (nextOpen === isOpen) return false;
    const rootEl = getRoot();
    const inputEl = getInput();
    const detail = { adapter: "svelte", open: nextOpen, reason: transitionOptions.reason ?? "api", sourceEvent: transitionOptions.sourceEvent };
    if (!emit(rootEl || inputEl, `bs:combobox:${nextOpen ? "show" : "hide"}`, detail, true)) return false;
    isOpen = nextOpen;
    if (!nextOpen) activeIdx = -1;
    options.onOpenChange?.(nextOpen, detail);
    syncState();
    emit(rootEl || inputEl, `bs:combobox:${nextOpen ? "shown" : "hidden"}`, detail);
    return true;
  };

  const show = (opts) => transition(true, opts);
  const hide = (opts) => transition(false, opts);
  const toggle = (opts) => transition(!isOpen, opts);

  const onDocPointer = (event) => {
    const rootEl = getRoot();
    if (rootEl && !rootEl.contains(event.target)) {
      hide({ reason: "outside", sourceEvent: event });
    }
  };

  if (typeof document !== "undefined") {
    document.addEventListener("pointerdown", onDocPointer);
  }

  const moveActive = (offset) => {
    const filtered = getFilteredOptions();
    if (!filtered.length) return;
    let nextIndex = activeIdx;
    for (let attempt = 0; attempt < filtered.length; attempt += 1) {
      nextIndex = nextIndex < 0 ? (offset > 0 ? 0 : filtered.length - 1) : (nextIndex + offset + filtered.length) % filtered.length;
      if (!filtered[nextIndex].disabled) {
        activeIdx = nextIndex;
        syncState();
        return;
      }
    }
  };

  const selectOption = (opt, selectOptions = {}) => {
    if (!opt || opt.disabled) return false;
    const rootEl = getRoot();
    const inputEl = getInput();
    const detail = { adapter: "svelte", value: opt.value, label: opt.label, option: opt, reason: selectOptions.reason ?? "selection", sourceEvent: selectOptions.sourceEvent };
    if (!emit(rootEl || inputEl, "bs:combobox:select", detail, true)) return false;

    if (isMultiple) {
      const currentArr = Array.isArray(currentValue) ? [...currentValue] : (currentValue ? [currentValue] : []);
      const existsIndex = currentArr.indexOf(opt.value);
      if (existsIndex >= 0) {
        currentArr.splice(existsIndex, 1);
      } else {
        currentArr.push(opt.value);
      }
      currentValue = currentArr;
      options.onValueChange?.(currentArr, detail);
      queryText = "";
      if (inputEl) inputEl.value = "";
    } else {
      currentValue = opt.value;
      queryText = opt.label;
      if (inputEl) inputEl.value = opt.label;
      options.onValueChange?.(opt.value, detail);
      hide({ reason: "selection", sourceEvent: selectOptions.sourceEvent });
    }

    syncState();
    emit(rootEl || inputEl, "bs:combobox:change", detail);
    inputEl?.focus();
    return true;
  };

  const removeValue = (val, sourceEvent) => {
    if (!isMultiple) return false;
    const rootEl = getRoot();
    const currentArr = Array.isArray(currentValue) ? [...currentValue] : [];
    const idx = currentArr.indexOf(val);
    if (idx >= 0) {
      currentArr.splice(idx, 1);
      currentValue = currentArr;
      const detail = { adapter: "svelte", value: currentArr, reason: "remove", sourceEvent };
      options.onValueChange?.(currentArr, detail);
      emit(rootEl, "bs:combobox:change", detail);
      return true;
    }
    return false;
  };

  const getRootProps = (props = {}) => ({
    ...props,
    "data-bs-state": isOpen ? "open" : "closed",
    ...(isMultiple ? { "data-bs-multiple": "" } : {}),
  });

  const getInputProps = (props = {}) => ({
    ...props,
    role: "combobox",
    autocomplete: props.autocomplete ?? "off",
    value: isMultiple ? (props.value ?? queryText) : queryText,
    "aria-autocomplete": "list",
    "aria-controls": listboxId,
    "aria-expanded": String(isOpen),
    "aria-activedescendant": activeIdx >= 0 ? `${listboxId}-option-${activeIdx}` : undefined,
    onfocus: composeHandlers(props.onfocus || props.onFocus, (event) => {
      inputElement ||= event.currentTarget;
      rootElement ||= event.currentTarget.closest(".bs-combobox");
      show({ reason: "focus", sourceEvent: event });
    }),
    oninput: composeHandlers(props.oninput || props.onInput, (event) => {
      inputElement ||= event.currentTarget;
      rootElement ||= event.currentTarget.closest(".bs-combobox");
      queryText = event.target.value;
      if (!isMultiple && getSelectedOptions() && queryText !== getSelectedOptions().label) {
        currentValue = "";
        options.onValueChange?.("", { adapter: "svelte", value: "", label: "", option: null, reason: "input", sourceEvent: event });
      }
      if (!isOpen) show({ reason: "input", sourceEvent: event });
      activeIdx = getFilteredOptions().findIndex((opt) => !opt.disabled);
      syncState();
    }),
    onkeydown: composeHandlers(props.onkeydown || props.onKeydown, (event) => {
      inputElement ||= event.currentTarget;
      rootElement ||= event.currentTarget.closest(".bs-combobox");
      if (["ArrowDown", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        show({ reason: "keyboard", sourceEvent: event });
        moveActive(event.key === "ArrowDown" ? 1 : -1);
        return;
      }
      if (event.key === "Enter") {
        const filtered = getFilteredOptions();
        const selected = activeIdx >= 0 ? filtered[activeIdx] : filtered[0];
        if (selected) {
          event.preventDefault();
          selectOption(selected, { reason: "keyboard", sourceEvent: event });
        }
        return;
      }
      if (event.key === "Backspace" && isMultiple && !queryText && Array.isArray(currentValue) && currentValue.length) {
        removeValue(currentValue[currentValue.length - 1], event);
        return;
      }
      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        hide({ reason: "escape", sourceEvent: event });
      }
      if (event.key === "Tab") {
        hide({ reason: "tab", sourceEvent: event });
      }
    }),
  });

  const getToggleProps = (props = {}) => ({
    ...props,
    type: props.type ?? "button",
    tabindex: props.tabindex ?? -1,
    "aria-label": props["aria-label"] ?? "Toggle options",
    "aria-controls": listboxId,
    "aria-expanded": String(isOpen),
    onclick: composeHandlers(props.onclick || props.onClick, (event) => {
      const inputEl = getInput();
      inputEl?.focus();
      toggle({ reason: "toggle", sourceEvent: event });
    }),
  });

  const getListboxProps = (props = {}) => ({
    ...props,
    id: props.id ?? listboxId,
    role: "listbox",
    hidden: !isOpen,
    "data-bs-state": isOpen ? "open" : "closed",
    ...(isMultiple ? { "aria-multiselectable": "true" } : {}),
  });

  const getOptionProps = (opt, index, props = {}) => {
    const isSelected = isMultiple
      ? (Array.isArray(currentValue) && currentValue.includes(opt.value))
      : (opt.value === currentValue);
    return {
      ...props,
      id: props.id ?? `${listboxId}-option-${index}`,
      role: "option",
      "aria-disabled": opt.disabled ? "true" : undefined,
      "aria-selected": String(isSelected),
      "data-bs-state": index === activeIdx ? "active" : "idle",
      onpointermove: composeHandlers(props.onpointermove || props.onPointermove, () => {
        if (!opt.disabled) activeIdx = index;
      }),
      onmousedown: composeHandlers(props.onmousedown || props.onMousedown, (event) => event.preventDefault()),
      onclick: composeHandlers(props.onclick || props.onClick, (event) => selectOption(opt, { sourceEvent: event })),
    };
  };

  const comboboxAction = (node) => {
    rootElement = node;
    syncState();
    return {
      update() {
        syncState();
      },
      destroy() {
        rootElement = null;
      },
    };
  };

  const inputAction = (node) => {
    inputElement = node;
    return {
      destroy() {
        inputElement = null;
      },
    };
  };

  return {
    get open() {
      return isOpen;
    },
    get value() {
      return currentValue;
    },
    get query() {
      return queryText;
    },
    get activeIndex() {
      return activeIdx;
    },
    get filteredOptions() {
      return getFilteredOptions();
    },
    get selectedOption() {
      return getSelectedOptions();
    },
    show,
    hide,
    toggle,
    selectOption,
    removeValue,
    getRootProps,
    getInputProps,
    getToggleProps,
    getListboxProps,
    getOptionProps,
    combobox: comboboxAction,
    input: inputAction,
  };
}

export { createCombobox as useCombobox };
