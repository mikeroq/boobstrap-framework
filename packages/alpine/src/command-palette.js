import { emit, setState } from "./shared.js";

let nextPaletteId = 0;

export function commandPalette(options = {}) {
  nextPaletteId += 1;
  const paletteId = options.id ?? `bs-alpine-command-palette-${nextPaletteId}`;
  const shortcut = options.shortcut ?? "k";

  return {
    open: Boolean(options.open ?? options.defaultOpen ?? false),
    query: "",
    activeIndex: -1,
    paletteId,
    shortcut,

    panelElement() {
      return this.$refs?.dialog || (this.$el?.tagName === "DIALOG" ? this.$el : this.$el?.querySelector("dialog")) || this.$el;
    },

    inputElement() {
      return this.$refs?.input || this.$el?.querySelector("input");
    },

    init() {
      const panel = this.panelElement();
      if (panel) {
        setState(panel, this.open ? "open" : "closed");
        this.onNativeClose = () => {
          if (!this.open) return;
          this.open = false;
          setState(panel, "closed");
          emit(panel, "bs:command:hidden", { adapter: "alpine", open: false, reason: "native" });
        };
        panel.addEventListener("close", this.onNativeClose);
      }
    },

    getItems() {
      const panel = this.panelElement();
      return [...panel.querySelectorAll(".bs-command-palette-item, [role='option']")];
    },

    getVisibleItems() {
      return this.getItems().filter((item) => !item.hidden && !item.hasAttribute("disabled") && item.getAttribute("aria-disabled") !== "true");
    },

    setActive(index) {
      const items = this.getVisibleItems();
      this.activeIndex = index;
      items.forEach((item, i) => {
        if (i === index) {
          item.setAttribute("aria-selected", "true");
          item.setAttribute("data-bs-active", "true");
          item.scrollIntoView({ block: "nearest" });
        } else {
          item.removeAttribute("aria-selected");
          item.removeAttribute("data-bs-active");
        }
      });
    },

    moveActive(offset) {
      const items = this.getVisibleItems();
      if (!items.length) return;
      const nextIndex = this.activeIndex < 0
        ? (offset > 0 ? 0 : items.length - 1)
        : (this.activeIndex + offset + items.length) % items.length;
      this.setActive(nextIndex);
    },

    filter() {
      const input = this.inputElement();
      const rawQuery = input?.value ?? this.query;
      const normalized = rawQuery.trim().toLowerCase();
      const items = this.getItems();
      let matchCount = 0;

      for (const item of items) {
        const text = (item.textContent || "").toLowerCase();
        const keywords = (item.dataset.bsKeywords || "").toLowerCase();
        const matches = !normalized || text.includes(normalized) || keywords.includes(normalized);
        item.hidden = !matches;
        if (matches) matchCount++;
      }

      const panel = this.panelElement();
      const groups = [...panel.querySelectorAll(".bs-command-palette-group")];
      for (const group of groups) {
        const groupItems = [...group.querySelectorAll(".bs-command-palette-item, [role='option']")];
        group.hidden = !groupItems.some((item) => !item.hidden);
      }

      const empty = panel.querySelector(".bs-command-palette-empty");
      if (empty) empty.hidden = matchCount > 0;

      this.setActive(matchCount > 0 ? 0 : -1);
    },

    show(reason = "api", sourceEvent) {
      if (this.open) return false;
      const panel = this.panelElement();
      const detail = { adapter: "alpine", open: true, reason, sourceEvent };
      if (!emit(panel, "bs:command:show", detail, true)) return false;
      this.open = true;
      if (panel && typeof panel.showModal === "function" && !panel.open) {
        panel.showModal();
      }
      setState(panel, "open");
      const input = this.inputElement();
      if (input) {
        input.value = "";
        this.query = "";
        this.filter();
        input.focus();
      }
      emit(panel, "bs:command:shown", detail);
      return true;
    },

    hide(reason = "api", sourceEvent) {
      if (!this.open) return false;
      const panel = this.panelElement();
      const detail = { adapter: "alpine", open: false, reason, sourceEvent };
      if (!emit(panel, "bs:command:hide", detail, true)) return false;
      this.open = false;
      if (panel && typeof panel.close === "function" && panel.open) {
        panel.close();
      }
      setState(panel, "closed");
      emit(panel, "bs:command:hidden", detail);
      return true;
    },

    toggle(reason = "api", sourceEvent) {
      return this.open ? this.hide(reason, sourceEvent) : this.show(reason, sourceEvent);
    },

    select(item, sourceEvent) {
      if (!item) return false;
      const panel = this.panelElement();
      const value = item.dataset?.bsValue || item.getAttribute("value") || item.textContent?.trim() || "";
      const detail = { adapter: "alpine", item, value, label: item.textContent?.trim() || "", sourceEvent };
      if (!emit(panel, "bs:command:select", detail, true)) return false;
      this.hide("select", sourceEvent);
      return true;
    },

    selectActive(sourceEvent) {
      const items = this.getVisibleItems();
      if (this.activeIndex >= 0 && this.activeIndex < items.length) {
        this.select(items[this.activeIndex], sourceEvent);
      }
    },

    trigger: {
      type: "button",
      ["@click"](event) {
        this.toggle("trigger", event);
      },
    },

    dialog: {
      "x-ref": "dialog",
      [":data-bs-state"]() {
        return this.open ? "open" : "closed";
      },
      ["@cancel.prevent"](event) {
        this.hide("escape", event);
      },
      ["@click"](event) {
        if (event.target === this.$el) {
          this.hide("backdrop", event);
        }
      },
    },

    input: {
      "x-ref": "input",
      type: "search",
      placeholder: options.placeholder ?? "Type a command or search...",
      ["@input"]() {
        this.query = this.$el.value;
        this.filter();
      },
      ["@keydown.arrow-down.prevent"]() {
        this.moveActive(1);
      },
      ["@keydown.arrow-up.prevent"]() {
        this.moveActive(-1);
      },
      ["@keydown.enter.prevent"](event) {
        this.selectActive(event);
      },
    },

    item: {
      ["@click"](event) {
        this.select(this.$el, event);
      },
    },
  };
}
