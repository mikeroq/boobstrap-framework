let idCounter = 0;

export function emit(element, type, detail = {}, cancelable = false) {
  if (!element) return true;
  const doc = element.ownerDocument || document;
  const CustomEventConstructor = doc.defaultView?.CustomEvent || CustomEvent;
  const eventDetail = { adapter: "svelte", ...detail };
  return element.dispatchEvent(new CustomEventConstructor(type, { bubbles: true, cancelable, detail: eventDetail }));
}

export function composeHandlers(userHandler, internalHandler) {
  return (event) => {
    userHandler?.(event);
    if (!event.defaultPrevented) internalHandler(event);
  };
}

export function normalizeId(value) {
  return String(value).replaceAll(":", "");
}

export function nextId(prefix) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

export function enabledMenuItems(menu) {
  return menu ? [...menu.querySelectorAll('[role="menuitem"]')].filter((item) => !item.hidden && !item.disabled && item.getAttribute("aria-disabled") !== "true") : [];
}

export function controlledPanel(tab) {
  const id = tab?.getAttribute("aria-controls");
  return id ? (tab.ownerDocument || document).getElementById(id) : null;
}

export function isBackdropPointer(element, event) {
  if (event.target !== element) return false;
  const rect = element.getBoundingClientRect();
  return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
}

export function positionFloating(trigger, panel, placement = "top") {
  if (!trigger || !panel) return;
  const gap = 10;
  const padding = 8;
  const triggerRect = trigger.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();
  const viewport = (trigger.ownerDocument || document).documentElement;
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
