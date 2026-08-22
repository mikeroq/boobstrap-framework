export function inputMask(pattern) {
  const tokens = { "9": /[0-9]/, A: /[A-Za-z]/, "*": /[A-Za-z0-9]/ };

  function formatMask(value, mask) {
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

  return {
    mask: pattern,

    init() {
      this.$el.classList.add("bs-input-mask");
      if ([...this.mask].filter((character) => tokens[character]).every((character) => character === "9")) {
        this.$el.inputMode ||= "numeric";
      }
      const initial = formatMask(this.$el.value, this.mask);
      if (initial !== this.$el.value) {
        this.$el.value = initial;
        this.$el.setSelectionRange?.(initial.length, initial.length);
      }
    },

    format() {
      const previousValue = this.$el.value;
      const value = formatMask(previousValue, this.mask);
      if (value === previousValue) return false;
      this.$el.value = value;
      this.$el.setSelectionRange?.(value.length, value.length);
      this.$dispatch(`bs:mask:change`, { adapter: "alpine", component: this, value, mask: this.mask });
      return true;
    },

    root: {
      ["@input"]() {
        this.format();
      },
    },
  };
}
