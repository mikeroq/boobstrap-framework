import { useCallback, useRef } from "react";
import { composeHandlers, controlledPanel, emit, mergeRefs, useControllableState, useIsomorphicLayoutEffect } from "./shared.js";

export function useTabs(options = {}) {
  const tablistRef = useRef(null);
  const pendingTransition = useRef(null);
  const previousSelectedId = useRef(options.selectedId ?? options.defaultSelectedId ?? null);
  const [selectedId, setSelectedId] = useControllableState({
    value: options.selectedId,
    defaultValue: options.defaultSelectedId ?? null,
    onChange: options.onSelectedChange,
  });

  const tabElements = useCallback(() => (
    tablistRef.current ? [...tablistRef.current.querySelectorAll('[role="tab"]')] : []
  ), []);

  useIsomorphicLayoutEffect(() => {
    if (previousSelectedId.current === selectedId) return;
    const pending = pendingTransition.current;
    if (pending?.selectedId === selectedId) {
      emit(tablistRef.current, "bs:tabs:changed", pending.detail);
      pendingTransition.current = null;
    }
    previousSelectedId.current = selectedId;
  }, [selectedId]);

  const activate = useCallback((tabOrId, sourceEvent, reason = "api") => {
    const tab = typeof tabOrId === "string"
      ? tabElements().find((candidate) => candidate.id === tabOrId)
      : tabOrId;
    if (!tab || tab.id === selectedId || tab.getAttribute("aria-disabled") === "true") return false;
    const previousTab = tabElements().find((candidate) => candidate.id === selectedId) ?? null;
    const detail = {
      adapter: "react",
      reason,
      sourceEvent,
      previousTab,
      previousPanel: controlledPanel(previousTab),
      tab,
      panel: controlledPanel(tab),
    };
    if (!emit(tablistRef.current, "bs:tabs:change", detail, true)) return false;
    pendingTransition.current = { selectedId: tab.id, detail };
    return setSelectedId(tab.id, detail);
  }, [selectedId, setSelectedId, tabElements]);

  const getTablistProps = useCallback((props = {}) => ({
    ...props,
    ref: mergeRefs(tablistRef, props.ref),
    role: props.role ?? "tablist",
    "data-bs-state": selectedId ? "ready" : "empty",
  }), [selectedId]);

  const getTabProps = useCallback((props) => {
    const { controls, disabled = false, onClick, onKeyDown, ...rest } = props;
    const active = props.id === selectedId;
    return {
      ...rest,
      type: props.type ?? "button",
      role: "tab",
      "aria-controls": controls ?? props["aria-controls"],
      "aria-disabled": disabled ? "true" : props["aria-disabled"],
      "aria-selected": String(active),
      tabIndex: active ? 0 : -1,
      "data-bs-state": active ? "active" : "inactive",
      onClick: composeHandlers(onClick, (event) => activate(event.currentTarget, event.nativeEvent ?? event, "trigger")),
      onKeyDown: composeHandlers(onKeyDown, (event) => {
        const tabs = tabElements().filter((tab) => tab.getAttribute("aria-disabled") !== "true");
        const currentIndex = tabs.indexOf(event.currentTarget);
        if (currentIndex < 0) return;
        const vertical = tablistRef.current?.getAttribute("aria-orientation") === "vertical";
        const previousKey = vertical ? "ArrowUp" : "ArrowLeft";
        const nextKey = vertical ? "ArrowDown" : "ArrowRight";
        let nextIndex;
        if (event.key === previousKey) nextIndex = currentIndex - 1;
        else if (event.key === nextKey) nextIndex = currentIndex + 1;
        else if (event.key === "Home") nextIndex = 0;
        else if (event.key === "End") nextIndex = tabs.length - 1;
        else return;
        event.preventDefault();
        const tab = tabs[(nextIndex + tabs.length) % tabs.length];
        tab.focus();
        activate(tab, event.nativeEvent ?? event, "keyboard");
      }),
    };
  }, [activate, selectedId, tabElements]);

  const getPanelProps = useCallback((props) => {
    const { tabId, ...rest } = props;
    const active = tabId === selectedId;
    return {
      ...rest,
      role: "tabpanel",
      "aria-labelledby": props["aria-labelledby"] ?? tabId,
      hidden: !active,
      "data-bs-state": active ? "active" : "inactive",
    };
  }, [selectedId]);

  return {
    selectedId,
    activate,
    getTablistProps,
    getTabProps,
    getPanelProps,
  };
}
