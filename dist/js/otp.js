import { emit, queryRoots, requireElement, setState } from "./shared.js";

const instances = new WeakMap();

export class Otp {
  constructor(element) {
    this.element = requireElement(element, "Otp");
    this.inputs = [...element.querySelectorAll("[data-bs-otp-input], .bs-otp-input")];
    this.valueElement = element.querySelector("[data-bs-otp-value]");
    this.characterPattern = new RegExp(element.dataset.bsOtpPattern ?? "[0-9]");
    if (!this.inputs.length) throw new Error("Otp requires at least one OTP input.");

    this.onInput = (event) => this.handleInput(event);
    this.onKeydown = (event) => this.handleKeydown(event);
    this.onPaste = (event) => this.handlePaste(event);
    this.element.addEventListener("input", this.onInput);
    this.element.addEventListener("keydown", this.onKeydown);
    this.element.addEventListener("paste", this.onPaste);

    this.inputs.forEach((input, index) => {
      input.maxLength = 1;
      input.inputMode ||= "numeric";
      input.autocomplete = index === 0 ? "one-time-code" : "off";
    });
    this.sync({ silent: true });
    instances.set(element, this);
  }

  static getOrCreateInstance(element) {
    return instances.get(element) ?? new Otp(element);
  }

  get value() {
    return this.inputs.map((input) => input.value).join("");
  }

  validCharacters(value) {
    return [...String(value ?? "")].filter((character) => this.characterPattern.test(character));
  }

  sync(options = {}) {
    const value = this.value;
    const complete = this.inputs.every((input) => input.value.length === 1);
    if (this.valueElement) this.valueElement.value = value;
    setState(this.element, complete ? "complete" : value ? "partial" : "empty");
    if (!options.silent) {
      emit(this.element, "bs:otp:change", { controller: this, value, complete });
      if (complete) emit(this.element, "bs:otp:complete", { controller: this, value });
    }
  }

  handleInput(event) {
    const index = this.inputs.indexOf(event.target);
    if (index < 0) return;
    const [character = ""] = this.validCharacters(event.target.value);
    event.target.value = character;
    if (character && index < this.inputs.length - 1) this.inputs[index + 1].focus();
    this.sync();
  }

  handleKeydown(event) {
    const index = this.inputs.indexOf(event.target);
    if (index < 0) return;
    if (event.key === "Backspace" && !event.target.value && index > 0) {
      event.preventDefault();
      this.inputs[index - 1].value = "";
      this.inputs[index - 1].focus();
      this.sync();
      return;
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      this.inputs[index - 1].focus();
    }
    if (event.key === "ArrowRight" && index < this.inputs.length - 1) {
      event.preventDefault();
      this.inputs[index + 1].focus();
    }
  }

  handlePaste(event) {
    const index = this.inputs.indexOf(event.target);
    if (index < 0) return;
    const characters = this.validCharacters(event.clipboardData?.getData("text"));
    if (!characters.length) return;
    event.preventDefault();
    for (let offset = 0; offset < characters.length && index + offset < this.inputs.length; offset += 1) {
      this.inputs[index + offset].value = characters[offset];
    }
    const focusIndex = Math.min(index + characters.length, this.inputs.length - 1);
    this.inputs[focusIndex].focus();
    this.sync();
  }

  clear() {
    this.inputs.forEach((input) => { input.value = ""; });
    this.inputs[0].focus();
    this.sync();
  }

  destroy() {
    this.element.removeEventListener("input", this.onInput);
    this.element.removeEventListener("keydown", this.onKeydown);
    this.element.removeEventListener("paste", this.onPaste);
    instances.delete(this.element);
  }
}

export function initOtps(root = document) {
  return queryRoots(root, "[data-bs-otp]").map((element) => Otp.getOrCreateInstance(element));
}
