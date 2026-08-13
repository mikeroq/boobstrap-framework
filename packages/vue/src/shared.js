import { computed, isRef, ref, useId } from "vue";

export function emit(element, type, detail, cancelable = false) {
  if (!element) return true;
  const CustomEventConstructor = element.ownerDocument.defaultView.CustomEvent;
  return element.dispatchEvent(new CustomEventConstructor(type, { bubbles: true, cancelable, detail }));
}

export function useControllableState(options, key, defaultKey, onChangeKey, fallback) {
  const internal = ref(options[defaultKey] ?? fallback);
  const state = computed(() => isRef(options[key]) ? options[key].value : (options[key] ?? internal.value));
  const setState = (nextValue, detail) => {
    const resolved = typeof nextValue === "function" ? nextValue(state.value) : nextValue;
    if (Object.is(resolved, state.value)) return false;
    if (isRef(options[key])) options[key].value = resolved;
    else if (options[key] === undefined) internal.value = resolved;
    options[onChangeKey]?.(resolved, detail);
    return true;
  };
  return [state, setState];
}

export function composeHandlers(userHandler, internalHandler) {
  return (event) => {
    userHandler?.(event);
    if (!event.defaultPrevented) internalHandler(event);
  };
}

export function normalizeId(value) {
  return value.replaceAll(":", "");
}

export function nextId(prefix) {
  return `${prefix}-${normalizeId(useId())}`;
}

export function enabledMenuItems(menu) {
  return menu ? [...menu.querySelectorAll('[role="menuitem"]')].filter((item) => !item.hidden && !item.disabled && item.getAttribute("aria-disabled") !== "true") : [];
}

export function controlledPanel(tab) {
  const id = tab?.getAttribute("aria-controls");
  return id ? tab.ownerDocument.getElementById(id) : null;
}

export function positionFloating(trigger, panel, placement = "top") {
  if (!trigger || !panel) return;
  const gap = 10;
  const padding = 8;
  const triggerRect = trigger.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();
  const viewport = trigger.ownerDocument.documentElement;
  const positions = {
    top: { left: triggerRect.left + ((triggerRect.width - panelRect.width) / 2), top: triggerRect.top - panelRect.height - gap },
    bottom: { left: triggerRect.left + ((triggerRect.width - panelRect.width) / 2), top: triggerRect.bottom + gap },
    start: { left: triggerRect.left - panelRect.width - gap, top: triggerRect.top + ((triggerRect.height - panelRect.height) / 2) },
    end: { left: triggerRect.right + gap, top: triggerRect.top + ((triggerRect.height - panelRect.height) / 2) },
  };
  const preferred = positions[placement] ?? positions.top;
  const fits = preferred.left >= padding && preferred.top >= padding
    && preferred.left + panelRect.width <= viewport.clientWidth - padding
    && preferred.top + panelRect.height <= viewport.clientHeight - padding;
  const resolvedPlacement = fits ? placement : ({ top: "bottom", bottom: "top", start: "end", end: "start" }[placement] ?? "bottom");
  const resolved = positions[resolvedPlacement];
  panel.dataset.bsPlacement = resolvedPlacement;
  panel.style.left = `${Math.min(Math.max(resolved.left, padding), Math.max(padding, viewport.clientWidth - panelRect.width - padding))}px`;
  panel.style.top = `${Math.min(Math.max(resolved.top, padding), Math.max(padding, viewport.clientHeight - panelRect.height - padding))}px`;
}
