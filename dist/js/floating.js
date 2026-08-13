let floatingId = 0;

export function nextFloatingId(prefix) {
  floatingId += 1;
  return `${prefix}-${floatingId}`;
}

function physicalPlacement(element, placement) {
  if (!["start", "end"].includes(placement)) return placement;
  const rtl = getComputedStyle(element).direction === "rtl";
  if (placement === "start") return rtl ? "right" : "left";
  return rtl ? "left" : "right";
}

function coordinates(triggerRect, panelRect, placement, gap) {
  if (placement === "bottom") return { left: triggerRect.left + ((triggerRect.width - panelRect.width) / 2), top: triggerRect.bottom + gap };
  if (placement === "left") return { left: triggerRect.left - panelRect.width - gap, top: triggerRect.top + ((triggerRect.height - panelRect.height) / 2) };
  if (placement === "right") return { left: triggerRect.right + gap, top: triggerRect.top + ((triggerRect.height - panelRect.height) / 2) };
  return { left: triggerRect.left + ((triggerRect.width - panelRect.width) / 2), top: triggerRect.top - panelRect.height - gap };
}

function fits(position, panelRect, viewport, padding) {
  return position.left >= padding
    && position.top >= padding
    && position.left + panelRect.width <= viewport.width - padding
    && position.top + panelRect.height <= viewport.height - padding;
}

function oppositePlacement(placement) {
  return { top: "bottom", bottom: "top", left: "right", right: "left" }[placement];
}

function logicalPlacement(element, placement) {
  if (!["left", "right"].includes(placement)) return placement;
  const rtl = getComputedStyle(element).direction === "rtl";
  if (placement === "left") return rtl ? "end" : "start";
  return rtl ? "start" : "end";
}

export function positionFloating(trigger, panel, requestedPlacement = "top") {
  const padding = 8;
  const gap = 10;
  const triggerRect = trigger.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();
  const viewport = { width: trigger.ownerDocument.documentElement.clientWidth, height: trigger.ownerDocument.documentElement.clientHeight };
  const requested = physicalPlacement(trigger, requestedPlacement);
  const fallback = oppositePlacement(requested);
  const requestedPosition = coordinates(triggerRect, panelRect, requested, gap);
  const placement = fits(requestedPosition, panelRect, viewport, padding) ? requested : fallback;
  const position = coordinates(triggerRect, panelRect, placement, gap);

  panel.dataset.bsPlacement = logicalPlacement(trigger, placement);
  panel.style.left = `${Math.min(Math.max(position.left, padding), Math.max(padding, viewport.width - panelRect.width - padding))}px`;
  panel.style.top = `${Math.min(Math.max(position.top, padding), Math.max(padding, viewport.height - panelRect.height - padding))}px`;
}

export function autoPosition(trigger, panel, placement) {
  const update = () => positionFloating(trigger, panel, placement);
  const view = trigger.ownerDocument.defaultView;
  view.addEventListener("resize", update);
  view.addEventListener("scroll", update, true);
  const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
  observer?.observe(trigger);
  observer?.observe(panel);
  update();
  return () => {
    view.removeEventListener("resize", update);
    view.removeEventListener("scroll", update, true);
    observer?.disconnect();
  };
}

export function addFloatingArrow(panel) {
  const arrow = panel.ownerDocument.createElement("span");
  arrow.className = "bs-floating-arrow";
  arrow.setAttribute("aria-hidden", "true");
  panel.append(arrow);
}
