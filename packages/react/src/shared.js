import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function emit(element, type, detail, cancelable = false) {
  if (!element) return true;
  const CustomEventConstructor = element.ownerDocument.defaultView.CustomEvent;
  return element.dispatchEvent(new CustomEventConstructor(type, {
    bubbles: true,
    cancelable,
    detail,
  }));
}

export function assignRef(ref, value) {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}

export function mergeRefs(...refs) {
  return (value) => refs.forEach((ref) => assignRef(ref, value));
}

export function composeHandlers(userHandler, internalHandler) {
  return (event) => {
    userHandler?.(event);
    if (!event.defaultPrevented) internalHandler(event);
  };
}

export function enabledMenuItems(menu) {
  if (!menu) return [];
  return [...menu.querySelectorAll('[role="menuitem"]')]
    .filter((item) => !item.hidden && !item.disabled && item.getAttribute("aria-disabled") !== "true");
}

export function controlledPanel(tab) {
  const id = tab?.getAttribute("aria-controls");
  return id ? tab.ownerDocument.getElementById(id) : null;
}

export function useControllableState({ value, defaultValue, onChange }) {
  const controlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const state = controlled ? value : internalValue;
  const stateRef = useRef(state);
  stateRef.current = state;

  const setState = useCallback((nextValue, detail) => {
    const resolvedValue = typeof nextValue === "function" ? nextValue(stateRef.current) : nextValue;
    if (Object.is(resolvedValue, stateRef.current)) return false;
    if (!controlled) setInternalValue(resolvedValue);
    onChange?.(resolvedValue, detail);
    return true;
  }, [controlled, onChange]);

  return [state, setState];
}

export function normalizeId(value) {
  return value.replaceAll(":", "");
}

function floatingCoordinates(triggerRect, panelRect, placement, gap = 10) {
  if (placement === "bottom") return { left: triggerRect.left + ((triggerRect.width - panelRect.width) / 2), top: triggerRect.bottom + gap };
  if (placement === "start") return { left: triggerRect.left - panelRect.width - gap, top: triggerRect.top + ((triggerRect.height - panelRect.height) / 2) };
  if (placement === "end") return { left: triggerRect.right + gap, top: triggerRect.top + ((triggerRect.height - panelRect.height) / 2) };
  return { left: triggerRect.left + ((triggerRect.width - panelRect.width) / 2), top: triggerRect.top - panelRect.height - gap };
}

export function positionFloating(trigger, panel, requestedPlacement = "top") {
  if (!trigger || !panel) return;
  const padding = 8;
  const triggerRect = trigger.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();
  const viewport = trigger.ownerDocument.documentElement;
  const direction = getComputedStyle(trigger).direction;
  const physicalPlacement = requestedPlacement === "start" ? (direction === "rtl" ? "end" : "start")
    : requestedPlacement === "end" ? (direction === "rtl" ? "start" : "end") : requestedPlacement;
  const fallback = { top: "bottom", bottom: "top", start: "end", end: "start" }[physicalPlacement];
  const preferred = floatingCoordinates(triggerRect, panelRect, physicalPlacement);
  const fits = preferred.left >= padding && preferred.top >= padding
    && preferred.left + panelRect.width <= viewport.clientWidth - padding
    && preferred.top + panelRect.height <= viewport.clientHeight - padding;
  const placement = fits ? physicalPlacement : fallback;
  const coordinates = floatingCoordinates(triggerRect, panelRect, placement);
  panel.dataset.bsPlacement = direction === "rtl" && ["start", "end"].includes(placement)
    ? (placement === "start" ? "end" : "start") : placement;
  panel.style.left = `${Math.min(Math.max(coordinates.left, padding), Math.max(padding, viewport.clientWidth - panelRect.width - padding))}px`;
  panel.style.top = `${Math.min(Math.max(coordinates.top, padding), Math.max(padding, viewport.clientHeight - panelRect.height - padding))}px`;
}
