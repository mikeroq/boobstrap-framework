import { emit, queryRoots, requireElement, setState } from "./shared.js";

const instances = new WeakMap();
const enabledOptionSelector = '[data-bs-combobox-option]:not([aria-disabled="true"])';
let nextId = 0;

export class Combobox {
  constructor(element) {
    this.element = requireElement(element, "Combobox");
    this.input = element.querySelector("[data-bs-combobox-input]");
    this.listbox = element.querySelector("[data-bs-combobox-listbox]");
    this.toggleElement = element.querySelector("[data-bs-combobox-toggle]");
    this.valueElement = element.querySelector("[data-bs-combobox-value]");
    this.emptyElement = element.querySelector("[data-bs-combobox-empty]");
    if (!this.input || !this.listbox) throw new Error("Combobox requires an input and a listbox.");

    nextId += 1;
    this.original = {
      listboxRole: this.listbox.getAttribute("role"),
      listboxId: this.listbox.id,
      inputRole: this.input.getAttribute("role"),
      inputAriaAutocomplete: this.input.getAttribute("aria-autocomplete"),
      inputAriaControls: this.input.getAttribute("aria-controls"),
      inputAutocomplete: this.input.getAttribute("autocomplete"),
      optionStates: this.options.map((option) => ({
        id: option.id,
        role: option.getAttribute("role"),
      })),
    };
    this.listbox.id ||= `bs-combobox-listbox-${nextId}`;
    this.listbox.setAttribute("role", "listbox");
    this.options.forEach((option, index) => {
      option.id ||= `${this.listbox.id}-option-${index + 1}`;
      option.setAttribute("role", "option");
    });

    this.input.setAttribute("role", "combobox");
    this.input.setAttribute("aria-autocomplete", "list");
    this.input.setAttribute("aria-controls", this.listbox.id);
    this.input.setAttribute("autocomplete", this.input.getAttribute("autocomplete") ?? "off");

    this.activeOption = null;
    this.selectedOption = this.options.find((option) => option.getAttribute("aria-selected") === "true") ?? null;
    this.initialOption = this.selectedOption;
    if (this.selectedOption) this.commit(this.selectedOption, { silent: true });

    this.onInput = () => this.filter();
    this.onInputClick = () => this.show();
    this.onKeydown = (event) => this.handleKeydown(event);
    this.onListboxClick = (event) => {
      const option = event.target.closest(enabledOptionSelector);
      if (option && this.listbox.contains(option)) this.select(option, { sourceEvent: event });
    };
    this.onToggleClick = () => this.toggle();
    this.onDocumentPointerdown = (event) => {
      if (this.expanded && !this.element.contains(event.target)) this.hide();
    };
    this.onFormReset = () => queueMicrotask(() => this.reset());

    this.input.addEventListener("input", this.onInput);
    this.input.addEventListener("click", this.onInputClick);
    this.input.addEventListener("keydown", this.onKeydown);
    this.listbox.addEventListener("click", this.onListboxClick);
    this.toggleElement?.addEventListener("click", this.onToggleClick);
    element.ownerDocument.addEventListener("pointerdown", this.onDocumentPointerdown);
    this.form = this.input.form;
    this.form?.addEventListener("reset", this.onFormReset);
    this.hide({ force: true });
    instances.set(element, this);
  }

  static getOrCreateInstance(element) {
    return instances.get(element) ?? new Combobox(element);
  }

  get expanded() {
    return !this.listbox.hidden;
  }

  get options() {
    return [...this.listbox.querySelectorAll("[data-bs-combobox-option]")];
  }

  get visibleOptions() {
    return [...this.listbox.querySelectorAll(enabledOptionSelector)].filter((option) => !option.hidden);
  }

  optionLabel(option) {
    return option.dataset.bsLabel ?? option.textContent.trim();
  }

  optionValue(option) {
    return option.dataset.bsValue ?? this.optionLabel(option);
  }

  sync() {
    this.input.setAttribute("aria-expanded", String(this.expanded));
    this.toggleElement?.setAttribute("aria-expanded", String(this.expanded));
    setState(this.element, this.expanded ? "open" : "closed");
    setState(this.listbox, this.expanded ? "open" : "closed");
  }

  show() {
    if (this.expanded || this.input.disabled || !emit(this.element, "bs:combobox:show", { controller: this }, true)) return false;
    this.listbox.hidden = false;
    this.sync();
    emit(this.element, "bs:combobox:shown", { controller: this });
    return true;
  }

  hide(options = {}) {
    if (!this.expanded && !options.force) return false;
    if (!options.force && !emit(this.element, "bs:combobox:hide", { controller: this }, true)) return false;
    this.listbox.hidden = true;
    this.setActive(null);
    this.sync();
    if (!options.force) emit(this.element, "bs:combobox:hidden", { controller: this });
    return true;
  }

  toggle() {
    if (this.expanded) return this.hide();
    this.input.focus();
    return this.show();
  }

  setActive(option) {
    this.options.forEach((candidate) => setState(candidate, candidate === option ? "active" : "idle"));
    this.activeOption = option;
    if (option) {
      this.input.setAttribute("aria-activedescendant", option.id);
      option.scrollIntoView({ block: "nearest" });
    } else {
      this.input.removeAttribute("aria-activedescendant");
    }
  }

  moveActive(offset) {
    const options = this.visibleOptions;
    if (!options.length) return;
    const currentIndex = options.indexOf(this.activeOption);
    const nextIndex = currentIndex < 0
      ? (offset > 0 ? 0 : options.length - 1)
      : (currentIndex + offset + options.length) % options.length;
    this.setActive(options[nextIndex]);
  }

  filter() {
    const query = this.input.value.trim().toLocaleLowerCase();
    if (this.selectedOption && this.optionLabel(this.selectedOption) !== this.input.value) {
      this.selectedOption.setAttribute("aria-selected", "false");
      this.selectedOption = null;
      if (this.valueElement) this.valueElement.value = "";
    }
    this.options.forEach((option) => {
      option.hidden = !this.optionLabel(option).toLocaleLowerCase().includes(query);
    });
    if (this.emptyElement) this.emptyElement.hidden = this.options.some((option) => !option.hidden);
    this.show();
    this.setActive(this.visibleOptions[0] ?? null);
  }

  commit(option, options = {}) {
    this.options.forEach((candidate) => candidate.setAttribute("aria-selected", String(candidate === option)));
    this.selectedOption = option;
    const value = this.optionValue(option);
    const label = this.optionLabel(option);
    this.input.value = label;
    if (this.valueElement) {
      this.valueElement.value = value;
      if (!options.silent) this.valueElement.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (!options.silent) emit(this.element, "bs:combobox:change", { controller: this, value, label, option });
  }

  select(option, options = {}) {
    if (!option || option.hidden || option.getAttribute("aria-disabled") === "true") return false;
    const detail = { controller: this, value: this.optionValue(option), label: this.optionLabel(option), option, sourceEvent: options.sourceEvent };
    if (!emit(this.element, "bs:combobox:select", detail, true)) return false;
    this.commit(option);
    this.hide();
    this.input.focus({ preventScroll: true });
    return true;
  }

  handleKeydown(event) {
    if (["ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
      this.show();
      this.moveActive(event.key === "ArrowDown" ? 1 : -1);
      return;
    }
    if (event.key === "Enter" && this.expanded && this.activeOption) {
      event.preventDefault();
      this.select(this.activeOption, { sourceEvent: event });
      return;
    }
    if (event.key === "Escape" && this.expanded) {
      event.preventDefault();
      this.hide();
      return;
    }
    if (event.key === "Tab") this.hide();
  }

  reset() {
    const initial = this.initialOption;
    this.options.forEach((option) => { option.hidden = false; });
    if (initial) this.commit(initial, { silent: true });
    else {
      this.selectedOption = null;
      this.input.value = "";
      if (this.valueElement) this.valueElement.value = "";
    }
    this.hide({ force: true });
  }

  destroy() {
    this.input.removeEventListener("input", this.onInput);
    this.input.removeEventListener("click", this.onInputClick);
    this.input.removeEventListener("keydown", this.onKeydown);
    this.listbox.removeEventListener("click", this.onListboxClick);
    this.toggleElement?.removeEventListener("click", this.onToggleClick);
    this.element.ownerDocument.removeEventListener("pointerdown", this.onDocumentPointerdown);
    this.form?.removeEventListener("reset", this.onFormReset);
    if (this.original) {
      if (this.original.inputRole === null) this.input.removeAttribute("role");
      else this.input.setAttribute("role", this.original.inputRole);
      if (this.original.inputAriaAutocomplete === null) this.input.removeAttribute("aria-autocomplete");
      else this.input.setAttribute("aria-autocomplete", this.original.inputAriaAutocomplete);
      if (this.original.inputAriaControls === null) this.input.removeAttribute("aria-controls");
      else this.input.setAttribute("aria-controls", this.original.inputAriaControls);
      if (this.original.inputAutocomplete === null) this.input.removeAttribute("autocomplete");
      else this.input.setAttribute("autocomplete", this.original.inputAutocomplete);
      this.input.removeAttribute("aria-expanded");
      if (this.original.listboxRole === null) this.listbox.removeAttribute("role");
      else this.listbox.setAttribute("role", this.original.listboxRole);
      if (this.original.listboxId === null) this.listbox.removeAttribute("id");
      else this.listbox.id = this.original.listboxId;
      this.options.forEach((option, index) => {
        const state = this.original.optionStates[index];
        if (!state) return;
        if (state.id === null) option.removeAttribute("id");
        else option.id = state.id;
        if (state.role === null) option.removeAttribute("role");
        else option.setAttribute("role", state.role);
      });
    }
    instances.delete(this.element);
  }
}

export function initComboboxes(root = document) {
  return queryRoots(root, "[data-bs-combobox]").map((element) => Combobox.getOrCreateInstance(element));
}
