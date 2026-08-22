import { useCallback, useEffect, useRef } from "react";
import { composeHandlers, emit, mergeRefs, useControllableState, useIsomorphicLayoutEffect } from "./shared.js";

export function useBanner(options = {}) {
  const bannerRef = useRef(null);
  const dismissRef = useRef(null);
  const pendingTransition = useRef(null);
  const previousVisible = useRef(options.visible ?? options.defaultVisible ?? true);
  const [visible, setVisible] = useControllableState({
    value: options.visible,
    defaultValue: options.defaultVisible ?? true,
    onChange: options.onVisibleChange,
  });

  useIsomorphicLayoutEffect(() => {
    if (previousVisible.current === visible) return;
    const pending = pendingTransition.current;
    if (pending?.visible === visible) {
      emit(bannerRef.current, `bs:banner:${visible ? "shown" : "dismissed"}`, pending.detail);
      pendingTransition.current = null;
    }
    previousVisible.current = visible;
  }, [visible]);

  const transition = useCallback((nextVisible) => {
    if (nextVisible === visible) return false;
    const action = nextVisible ? "show" : "dismiss";
    const detail = { adapter: "react", visible: nextVisible };
    if (!emit(bannerRef.current, `bs:banner:${action}`, detail, true)) return false;
    pendingTransition.current = { visible: nextVisible, detail };
    return setVisible(nextVisible, detail);
  }, [visible, setVisible]);

  const show = useCallback(() => transition(true), [transition]);
  const dismiss = useCallback(() => transition(false), [transition]);

  useEffect(() => {
    const element = bannerRef.current;
    const dismissElement = dismissRef.current ?? element?.querySelector("[data-bs-banner-dismiss]");
    if (dismissElement && !dismissElement.textContent.trim() && !dismissElement.hasAttribute("aria-label")) {
      dismissElement.setAttribute("aria-label", "Dismiss banner");
    }
    if (element) element.hidden = !visible;
  }, [visible]);

  const getBannerProps = useCallback((props = {}) => ({
    ...props,
    ref: mergeRefs(bannerRef, props.ref),
    hidden: props.hidden ?? !visible,
    "data-bs-state": visible ? "visible" : "dismissed",
  }), [visible]);

  const getDismissProps = useCallback((props = {}) => ({
    ...props,
    ref: mergeRefs(dismissRef, props.ref),
    type: props.type ?? "button",
    onClick: composeHandlers(props.onClick, dismiss),
  }), [dismiss]);

  return { visible, show, dismiss, getBannerProps, getDismissProps };
}
