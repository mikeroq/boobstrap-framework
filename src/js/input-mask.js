import { emit, queryRoots, requireElement } from "./shared.js";

const instances = new WeakMap();
const tokens = {
  "9": /[0-9]/,
  A: /[A-Za-z]/,
  "*": /[A-Za-z0-9]/,
};

export function formatMask(value, mask) {
  const source = String(value ?? "");
  let sourceIndex = 0;
  let output = "";
  let matched = 0;

  for (const patternCharacter of mask) {
    const matcher = tokens[patternCharacter];
    if (!matcher) {
      if (source.length && (matched > 0 || sourceIndex < source.length)) output += patternCharacter;
      continue;
    }

    let character = source[sourceIndex];
    while (character !== undefined && !matcher.test(character)) {
      sourceIndex += 1;
      character = source[sourceIndex];
    }
    if (character === undefined) break;
    output += character;
    matched += 1;
    sourceIndex += 1;
  }

  return output;
}

export class InputMask {
  constructor(element) {
    this.element = requireElement(element, "InputMask");
    this.mask = element.dataset.bsMask;
    if (!this.mask) throw new Error("InputMask requires a non-empty data-bs-mask pattern.");

    this.onInput = () => this.format();
    this.element.addEventListener("input", this.onInput);
    this.element.classList.add("bs-input-mask");
    if ([...this.mask].filter((character) => tokens[character]).every((character) => character === "9")) {
      this.element.inputMode ||= "numeric";
    }
    this.format({ silent: true });
    instances.set(element, this);
  }

  static getOrCreateInstance(element) {
    return instances.get(element) ?? new InputMask(element);
  }

  format(options = {}) {
    const previousValue = this.element.value;
    const value = formatMask(previousValue, this.mask);
    if (value === previousValue) return false;
    this.element.value = value;
    this.element.setSelectionRange?.(value.length, value.length);
    if (!options.silent) emit(this.element, "bs:mask:change", { controller: this, value, mask: this.mask });
    return true;
  }

  destroy() {
    this.element.removeEventListener("input", this.onInput);
    instances.delete(this.element);
  }
}

export function initInputMasks(root = document) {
  return queryRoots(root, "[data-bs-mask]").map((element) => InputMask.getOrCreateInstance(element));
}
