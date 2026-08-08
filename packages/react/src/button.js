import { useCallback, useRef } from "react";
import { composeHandlers, emit, mergeRefs, useControllableState, useIsomorphicLayoutEffect } from "./shared.js";

export function useButton(options = {}) {
  const buttonRef = useRef(null);
  const pendingTransition = useRef(null);
  const previousLoading = useRef(options.loading ?? options.defaultLoading ?? false);
  const [loading, setLoading] = useControllableState({
    value: options.loading,
    defaultValue: options.defaultLoading ?? false,
    onChange: options.onLoadingChange,
  });
  const loadingRef = useRef(loading);
  loadingRef.current = loading;

  useIsomorphicLayoutEffect(() => {
    if (previousLoading.current === loading) return;
    const pending = pendingTransition.current;
    if (pending?.loading === loading) {
      emit(buttonRef.current, `bs:button:${loading ? "started" : "stopped"}`, pending.detail);
      pendingTransition.current = null;
    }
    previousLoading.current = loading;
  }, [loading]);

  const transition = useCallback((nextLoading, reason = "api", sourceEvent) => {
    if (nextLoading === loadingRef.current) return false;
    const action = nextLoading ? "start" : "stop";
    const detail = { adapter: "react", loading: nextLoading, reason, sourceEvent };
    if (!emit(buttonRef.current, `bs:button:${action}`, detail, true)) return false;
    pendingTransition.current = { loading: nextLoading, detail };
    loadingRef.current = nextLoading;
    return setLoading(nextLoading, detail);
  }, [setLoading]);

  const start = useCallback((reason, sourceEvent) => transition(true, reason, sourceEvent), [transition]);
  const stop = useCallback((reason, sourceEvent) => transition(false, reason, sourceEvent), [transition]);
  const toggle = useCallback((reason, sourceEvent) => transition(!loadingRef.current, reason, sourceEvent), [transition]);

  const getButtonProps = useCallback((props = {}) => ({
    ...props,
    ref: mergeRefs(buttonRef, props.ref),
    type: props.type ?? "button",
    disabled: Boolean(props.disabled || loading),
    "aria-busy": loading ? "true" : props["aria-busy"],
    "aria-label": loading ? (options.loadingLabel ?? props["data-bs-loading-label"] ?? "Loading") : props["aria-label"],
    "data-bs-state": loading ? "loading" : "idle",
    onClick: composeHandlers(props.onClick, (event) => {
      if (options.autoStart !== false) start("trigger", event.nativeEvent ?? event);
    }),
  }), [loading, options.autoStart, options.loadingLabel, start]);

  return { loading, start, stop, toggle, getButtonProps };
}
