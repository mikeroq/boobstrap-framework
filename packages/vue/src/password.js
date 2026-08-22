import { ref, watch } from "vue";
import { composeHandlers, emit } from "./shared.js";

export function usePassword(options = {}) {
  const rootRef = ref(null);
  const inputRef = ref(null);
  const toggleRef = ref(null);
  const labelRef = ref(null);
  const visible = ref(false);
  const showLabel = ref(options.showLabel ?? "Show password");
  const hideLabel = ref(options.hideLabel ?? "Hide password");

  const sync = () => {
    const root = rootRef.value;
    const toggleEl = toggleRef.value;
    if (!root || !toggleEl) return;
    toggleEl.setAttribute("aria-pressed", String(visible.value));
    toggleEl.setAttribute("aria-label", visible.value ? hideLabel.value : showLabel.value);
    if (labelRef.value) labelRef.value.textContent = visible.value ? hideLabel.value : showLabel.value;
    root.dataset.bsState = visible.value ? "visible" : "hidden";
  };

  watch([inputRef], () => {
    const inputEl = inputRef.value;
    const toggleEl = toggleRef.value;
    if (!inputEl || !toggleEl) return;
    showLabel.value = toggleEl.dataset.bsPasswordShowLabel ?? options.showLabel ?? "Show password";
    hideLabel.value = toggleEl.dataset.bsPasswordHideLabel ?? options.hideLabel ?? "Hide password";
    visible.value = inputEl.type === "text";
    sync();
  }, { immediate: true });

  const setVisible = (nextVisible) => {
    const root = rootRef.value;
    const inputEl = inputRef.value;
    if (!root || !inputEl) return false;
    if (nextVisible === visible.value) return false;
    if (!emit(root, "bs:password:toggle", { adapter: "vue", visible: nextVisible }, true)) return false;
    const selectionStart = inputEl.selectionStart;
    const selectionEnd = inputEl.selectionEnd;
    visible.value = nextVisible;
    inputEl.type = nextVisible ? "text" : "password";
    sync();
    inputEl.focus({ preventScroll: true });
    if (selectionStart !== null && selectionEnd !== null) inputEl.setSelectionRange(selectionStart, selectionEnd);
    emit(root, "bs:password:toggled", { adapter: "vue", visible: nextVisible });
    return true;
  };

  const toggle = () => setVisible(!visible.value);

  const getRootProps = (props = {}) => ({
    ...props,
    ref: (element) => { rootRef.value = element; },
  });
  const getInputProps = (props = {}) => ({
    ...props,
    ref: (element) => { inputRef.value = element; },
  });
  const getToggleProps = (props = {}) => ({
    ...props,
    ref: (element) => { toggleRef.value = element; },
    type: props.type ?? "button",
    "aria-pressed": visible.value,
    onClick: composeHandlers(props.onClick, toggle),
  });
  const getLabelProps = (props = {}) => ({
    ...props,
    ref: (element) => { labelRef.value = element; },
  });
  return { visible, setVisible, toggle, getRootProps, getInputProps, getToggleProps, getLabelProps };
}
