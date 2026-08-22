import { emit } from "./shared.js";

export function otp(options = {}) {
  return {
    inputs: [],
    valueElement: null,
    characterPattern: new RegExp(options.pattern ?? "[0-9]"),

    init() {
      this.inputs = [...this.$el.querySelectorAll("[data-bs-otp-input], .bs-otp-input")];
      this.valueElement = this.$el.querySelector("[data-bs-otp-value]");
      this.inputs.forEach((input, index) => {
        input.maxLength = 1;
        input.inputMode ||= "numeric";
        input.autocomplete = index === 0 ? "one-time-code" : "off";
      });
      this.sync({ silent: true });
    },

    get value() {
      return this.inputs.map((input) => input.value).join("");
    },

    validCharacters(value) {
      return [...String(value ?? "")].filter((character) => this.characterPattern.test(character));
    },

    sync(options = {}) {
      const value = this.value;
      const complete = this.inputs.every((input) => input.value.length === 1);
      if (this.valueElement) this.valueElement.value = value;
      this.$el.dataset.bsState = complete ? "complete" : value ? "partial" : "empty";
      if (!options.silent) {
        emit(this.$el, "bs:otp:change", { adapter: "alpine", component: this, value, complete });
        if (complete) emit(this.$el, "bs:otp:complete", { adapter: "alpine", component: this, value });
      }
    },

    handleInput(event) {
      const index = this.inputs.indexOf(event.target);
      if (index < 0) return;
      const [character = ""] = this.validCharacters(event.target.value);
      event.target.value = character;
      if (character && index < this.inputs.length - 1) this.inputs[index + 1].focus();
      this.sync();
    },

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
    },

    handlePaste(event) {
      const index = this.inputs.indexOf(event.target);
      if (index < 0) return;
      const characters = this.validCharacters(event.clipboardData?.getData("text"));
      if (!characters.length) return;
      event.preventDefault();
      if (characters.length > this.inputs.length - index) return;
      for (let offset = 0; offset < characters.length && index + offset < this.inputs.length; offset += 1) {
        this.inputs[index + offset].value = characters[offset];
      }
      const focusIndex = Math.min(index + characters.length, this.inputs.length - 1);
      this.inputs[focusIndex].focus();
      this.sync();
    },

    clear() {
      this.inputs.forEach((input) => { input.value = ""; });
      this.inputs[0].focus();
      this.sync();
    },

    root: {
      ["@input"]() {
        this.handleInput(event);
      },
      ["@keydown"]() {
        this.handleKeydown(event);
      },
      ["@paste"]() {
        this.handlePaste(event);
      },
    },
  };
}
