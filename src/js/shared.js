export function emit(element, name, detail = {}, cancelable = false) {
  return element.dispatchEvent(new CustomEvent(name, {
    bubbles: true,
    cancelable,
    detail,
  }));
}

export function requireElement(element, component) {
  if (!(element instanceof Element)) {
    throw new TypeError(`${component} requires a DOM Element.`);
  }
  return element;
}

export function controlledElement(trigger) {
  const id = trigger.getAttribute("aria-controls");
  return id ? trigger.ownerDocument.getElementById(id) : null;
}

export function setState(element, state) {
  element.dataset.bsState = state;
}

export function queryRoots(root, selector) {
  const matches = root instanceof Element && root.matches(selector) ? [root] : [];
  return [...matches, ...root.querySelectorAll(selector)];
}
