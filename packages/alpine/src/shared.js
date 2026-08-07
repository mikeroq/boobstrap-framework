export function emit(element, name, detail = {}, cancelable = false) {
  return element.dispatchEvent(new CustomEvent(name, {
    bubbles: true,
    cancelable,
    detail,
  }));
}

export function setState(element, state) {
  element.dataset.bsState = state;
}

export function enabledMenuItems(menu) {
  return [...menu.querySelectorAll('[role="menuitem"]:not(:disabled):not([aria-disabled="true"])')]
    .filter((item) => !item.hidden);
}

export function tabPanel(tab) {
  const id = tab?.getAttribute("aria-controls");
  return id ? tab.ownerDocument.getElementById(id) : null;
}
