import { emit, setState } from "./shared.js";

let nextId = 0;

export function combobox(initialValue = "") {
  return {
    open: false,
    value: initialValue,
    activeId: null,

    inputElement() {
      return this.$root.querySelector("[data-bs-combobox-input]");
    },

    listboxElement() {
      return this.$root.querySelector("[data-bs-combobox-listbox]");
    },

    valueElement() {
      return this.$root.querySelector("[data-bs-combobox-value]");
    },

    emptyElement() {
      return this.$root.querySelector("[data-bs-combobox-empty]");
    },

    optionElements() {
      return [...this.listboxElement().querySelectorAll("[data-bs-combobox-option]")];
    },

    visibleOptions() {
      return this.optionElements().filter((option) => !option.hidden && option.getAttribute("aria-disabled") !== "true");
    },

    optionLabel(option) {
      return option.dataset.bsLabel ?? option.textContent.trim();
    },

    optionValue(option) {
      return option.dataset.bsValue ?? this.optionLabel(option);
    },

    init() {
      nextId += 1;
      const listbox = this.listboxElement();
      listbox.id ||= `bs-alpine-combobox-${nextId}`;
      this.optionElements().forEach((option, index) => {
        option.id ||= `${listbox.id}-option-${index + 1}`;
        option.setAttribute("role", "option");
      });
      const selected = this.optionElements().find((option) => option.getAttribute("aria-selected") === "true")
        ?? this.optionElements().find((option) => this.optionValue(option) === this.value);
      if (selected) this.commit(selected, true);
      this.hide(true);
    },

    transition(open, force = false) {
      if (open === this.open && !force) return false;
      const action = open ? "show" : "hide";
      if (!force && !emit(this.$root, `bs:combobox:${action}`, { adapter: "alpine", component: this }, true)) return false;
      this.open = open;
      this.listboxElement().hidden = !open;
      setState(this.$root, open ? "open" : "closed");
      setState(this.listboxElement(), open ? "open" : "closed");
      if (!open) this.setActive(null);
      if (!force) this.$nextTick(() => emit(this.$root, `bs:combobox:${open ? "shown" : "hidden"}`, { adapter: "alpine", component: this }));
      return true;
    },

    show() {
      if (this.inputElement().disabled) return false;
      return this.transition(true);
    },

    hide(force = false) {
      return this.transition(false, force);
    },

    toggle() {
      if (this.open) return this.hide();
      this.inputElement().focus();
      return this.show();
    },

    setActive(option) {
      this.optionElements().forEach((candidate) => setState(candidate, candidate === option ? "active" : "idle"));
      this.activeId = option?.id ?? null;
      option?.scrollIntoView({ block: "nearest" });
    },

    moveActive(offset) {
      const options = this.visibleOptions();
      if (!options.length) return;
      const currentIndex = options.findIndex((option) => option.id === this.activeId);
      const nextIndex = currentIndex < 0
        ? (offset > 0 ? 0 : options.length - 1)
        : (currentIndex + offset + options.length) % options.length;
      this.setActive(options[nextIndex]);
    },

    filter(event) {
      const query = event.target.value.trim().toLocaleLowerCase();
      const selected = this.optionElements().find((option) => option.getAttribute("aria-selected") === "true");
      if (selected && this.optionLabel(selected) !== event.target.value) {
        selected.setAttribute("aria-selected", "false");
        this.value = "";
        if (this.valueElement()) this.valueElement().value = "";
      }
      this.optionElements().forEach((option) => {
        option.hidden = !this.optionLabel(option).toLocaleLowerCase().includes(query);
      });
      if (this.emptyElement()) this.emptyElement().hidden = this.optionElements().some((option) => !option.hidden);
      this.show();
      this.setActive(this.visibleOptions()[0] ?? null);
    },

    commit(option, silent = false) {
      this.optionElements().forEach((candidate) => candidate.setAttribute("aria-selected", String(candidate === option)));
      this.value = this.optionValue(option);
      this.inputElement().value = this.optionLabel(option);
      if (this.valueElement()) {
        this.valueElement().value = this.value;
        if (!silent) this.valueElement().dispatchEvent(new Event("change", { bubbles: true }));
      }
      if (!silent) emit(this.$root, "bs:combobox:change", { adapter: "alpine", component: this, value: this.value, label: this.optionLabel(option), option });
    },

    select(option, sourceEvent) {
      if (!option || option.hidden || option.getAttribute("aria-disabled") === "true") return false;
      const detail = { adapter: "alpine", component: this, value: this.optionValue(option), label: this.optionLabel(option), option, sourceEvent };
      if (!emit(this.$root, "bs:combobox:select", detail, true)) return false;
      this.commit(option);
      this.hide();
      this.inputElement().focus({ preventScroll: true });
      return true;
    },

    handleKeydown(event) {
      if (["ArrowDown", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        this.show();
        this.moveActive(event.key === "ArrowDown" ? 1 : -1);
        return;
      }
      if (event.key === "Enter" && this.open && this.activeId) {
        event.preventDefault();
        this.select(this.optionElements().find((option) => option.id === this.activeId), event);
        return;
      }
      if (event.key === "Escape" && this.open) {
        event.preventDefault();
        this.hide();
        return;
      }
      if (event.key === "Tab") this.hide();
    },

    root: {
      ["@click.outside"]() {
        this.hide();
      },
      [":data-bs-state"]() {
        return this.open ? "open" : "closed";
      },
    },

    input: {
      role: "combobox",
      ["aria-autocomplete"]: "list",
      autocomplete: "off",
      ["@click"]() {
        this.show();
      },
      ["@input"](event) {
        this.filter(event);
      },
      ["@keydown"](event) {
        this.handleKeydown(event);
      },
      [":aria-controls"]() {
        return this.listboxElement().id;
      },
      [":aria-expanded"]() {
        return String(this.open);
      },
      [":aria-activedescendant"]() {
        return this.activeId;
      },
    },

    toggleButton: {
      type: "button",
      tabindex: -1,
      ["aria-label"]: "Toggle options",
      ["@click"]() {
        this.toggle();
      },
      [":aria-expanded"]() {
        return String(this.open);
      },
    },

    listbox: {
      role: "listbox",
      [":hidden"]() {
        return !this.open;
      },
      [":data-bs-state"]() {
        return this.open ? "open" : "closed";
      },
    },

    option: {
      role: "option",
      ["@pointermove"]() {
        if (this.$el.getAttribute("aria-disabled") !== "true") this.setActive(this.$el);
      },
      ["@click"](event) {
        this.select(this.$el, event);
      },
      [":data-bs-state"]() {
        return this.$el.id === this.activeId ? "active" : "idle";
      },
    },
  };
}
