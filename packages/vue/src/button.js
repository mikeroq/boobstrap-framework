import { ref, watch } from "vue";
import { composeHandlers, emit, useControllableState } from "./shared.js";

export function useButton(options = {}) {
  const buttonRef = ref(null);
  const pending = ref(null);
  const [loading, setLoading] = useControllableState(options, "loading", "defaultLoading", "onLoadingChange", false);
  watch(loading, (nextLoading) => {
    if (pending.value?.loading === nextLoading) emit(buttonRef.value, `bs:button:${nextLoading ? "started" : "stopped"}`, pending.value.detail);
    pending.value = null;
  });
  const transition = (nextLoading, reason = "api", sourceEvent) => {
    if (nextLoading === loading.value) return false;
    const detail = { adapter: "vue", loading: nextLoading, reason, sourceEvent };
    if (!emit(buttonRef.value, `bs:button:${nextLoading ? "start" : "stop"}`, detail, true)) return false;
    pending.value = { loading: nextLoading, detail };
    return setLoading(nextLoading, detail);
  };
  const start = (reason, event) => transition(true, reason, event);
  const stop = (reason, event) => transition(false, reason, event);
  const toggle = (reason, event) => transition(!loading.value, reason, event);
  const getButtonProps = (props = {}) => ({
    ...props,
    ref: (element) => { buttonRef.value = element; },
    type: props.type ?? "button",
    disabled: Boolean(props.disabled || loading.value),
    "aria-busy": loading.value ? "true" : props["aria-busy"],
    "aria-label": loading.value ? (options.loadingLabel ?? props["data-bs-loading-label"] ?? "Loading") : props["aria-label"],
    "data-bs-state": loading.value ? "loading" : "idle",
    onClick: composeHandlers(props.onClick, (event) => { if (options.autoStart !== false) start("trigger", event); }),
  });
  return { loading, start, stop, toggle, getButtonProps };
}
