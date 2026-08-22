import { emit, queryRoots, requireElement, setState } from "./shared.js";

const instances = new WeakMap();

export class CommandPalette {
  constructor(element, options = {}) {
    this.element = requireElement(element, "CommandPalette");
    this.document = element.ownerDocument;
    this.options = options;
    this.input = element.querySelector(".bs-command-palette-input, input[type='search'], input");
    this.list = element.querySelector(".bs-command-palette-list, [role='listbox']");
    this.emptyElement = element.querySelector(".bs-command-palette-empty");
    this.shortcut = options.shortcut ?? element.dataset.bsShortcut ?? "k";
    this.restoreTarget = null;
    this.activeIndex = -1;

    this.onGlobalKeydown = (event) => {
      const isCmdOrCtrl = event.metaKey || event.ctrlKey;
      if (isCmdOrCtrl && event.key.toLowerCase() === this.shortcut.toLowerCase()) {
        event.preventDefault();
        this.toggle({ reason: "shortcut", sourceEvent: event });
      }
    };

    this.onInputKeydown = (event) => {
      const visibleItems = this.getVisibleItems();
      if (!visibleItems.length) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        this.setActiveIndex(this.activeIndex < visibleItems.length - 1 ? this.activeIndex + 1 : 0);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        this.setActiveIndex(this.activeIndex > 0 ? this.activeIndex - 1 : visibleItems.length - 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        this.setActiveIndex(0);
      } else if (event.key === "End") {
        event.preventDefault();
        this.setActiveIndex(visibleItems.length - 1);
      } else if (event.key === "Enter") {
        event.preventDefault();
        if (this.activeIndex >= 0 && this.activeIndex < visibleItems.length) {
          this.select(visibleItems[this.activeIndex], event);
        }
      }
    };

    this.onInput = (event) => {
      this.search(this.input?.value ?? "", event);
    };

    this.onListClick = (event) => {
      const item = event.target.closest(".bs-command-palette-item, [role='option']");
      if (item && !item.hasAttribute("disabled") && item.getAttribute("aria-disabled") !== "true") {
        this.select(item, event);
      }
    };

    this.onBackdropClick = (event) => {
      if (event.target === this.element) {
        this.hide({ reason: "backdrop", sourceEvent: event });
      }
    };

    this.onCancel = (event) => {
      event.preventDefault();
      this.hide({ reason: "escape", sourceEvent: event });
    };

    const windowObj = this.document.defaultView || window;
    windowObj.addEventListener("keydown", this.onGlobalKeydown);
    this.input?.addEventListener("keydown", this.onInputKeydown);
    this.input?.addEventListener("input", this.onInput);
    this.list?.addEventListener("click", this.onListClick);
    this.element.addEventListener("click", this.onBackdropClick);
    this.element.addEventListener("cancel", this.onCancel);

    setState(this.element, this.element.open ? "open" : "closed");
    instances.set(element, this);
  }

  static getOrCreateInstance(element, options) {
    return instances.get(element) ?? new CommandPalette(element, options);
  }

  get visible() {
    return Boolean(this.element.open);
  }

  getVisibleItems() {
    const items = [...this.element.querySelectorAll(".bs-command-palette-item, [role='option']")];
    return items.filter((item) => !item.hidden && !item.hasAttribute("disabled") && item.getAttribute("aria-disabled") !== "true");
  }

  setActiveIndex(index) {
    const visibleItems = this.getVisibleItems();
    visibleItems.forEach((item, i) => {
      const active = i === index;
      if (active) {
        item.setAttribute("aria-selected", "true");
        item.setAttribute("data-bs-active", "true");
        item.scrollIntoView({ block: "nearest" });
      } else {
        item.removeAttribute("aria-selected");
        item.removeAttribute("data-bs-active");
      }
    });
    this.activeIndex = index;
  }

  search(query = "", sourceEvent) {
    const normalized = query.trim().toLowerCase();
    const items = [...this.element.querySelectorAll(".bs-command-palette-item, [role='option']")];
    let matchCount = 0;

    for (const item of items) {
      const text = (item.textContent || "").toLowerCase();
      const keywords = (item.dataset.bsKeywords || "").toLowerCase();
      const matches = !normalized || text.includes(normalized) || keywords.includes(normalized);
      item.hidden = !matches;
      if (matches) matchCount++;
    }

    // Hide groups if all children are hidden
    const groups = [...this.element.querySelectorAll(".bs-command-palette-group")];
    for (const group of groups) {
      const groupItems = [...group.querySelectorAll(".bs-command-palette-item, [role='option']")];
      const hasVisible = groupItems.some((item) => !item.hidden);
      group.hidden = !hasVisible;
    }

    if (this.emptyElement) {
      this.emptyElement.hidden = matchCount > 0;
    }

    this.setActiveIndex(matchCount > 0 ? 0 : -1);
  }

  select(item, sourceEvent) {
    if (!item) return false;
    const value = item.dataset.bsValue || item.getAttribute("value") || item.textContent?.trim() || "";
    const detail = {
      controller: this,
      item,
      value,
      label: item.textContent?.trim() || "",
      sourceEvent,
    };

    if (!emit(this.element, "bs:command:select", detail, true)) return false;

    // Trigger standard click on item or anchor if present
    const link = item.tagName === "A" ? item : item.querySelector("a");
    if (link && link !== sourceEvent?.target) {
      link.click();
    }

    this.hide({ reason: "select", sourceEvent });
    return true;
  }

  show(options = {}) {
    if (this.visible) return false;
    const detail = { controller: this, reason: options.reason ?? "api", sourceEvent: options.sourceEvent };
    if (!emit(this.element, "bs:command:show", detail, true)) return false;

    this.restoreTarget = options.restoreTarget ?? this.document.activeElement;
    if (typeof this.element.showModal === "function") {
      this.element.showModal();
    } else {
      this.element.setAttribute("open", "");
    }

    this.document.body.classList.add("bs-dialog-open");
    setState(this.element, "open");

    // Reset search query and state
    if (this.input) {
      this.input.value = "";
      this.search("");
      this.input.focus();
    } else {
      this.setActiveIndex(0);
    }

    emit(this.element, "bs:command:shown", detail);
    return true;
  }

  hide(options = {}) {
    if (!this.visible) return false;
    const detail = { controller: this, reason: options.reason ?? "api", sourceEvent: options.sourceEvent };
    if (!emit(this.element, "bs:command:hide", detail, true)) return false;

    if (typeof this.element.close === "function") {
      this.element.close();
    } else {
      this.element.removeAttribute("open");
    }

    this.document.body.classList.remove("bs-dialog-open");
    setState(this.element, "closed");

    const restoreTarget = options.restoreTarget ?? this.restoreTarget;
    if (options.restoreFocus !== false && restoreTarget && typeof restoreTarget.focus === "function") {
      restoreTarget.focus();
    }

    emit(this.element, "bs:command:hidden", detail);
    return true;
  }

  toggle(options = {}) {
    return this.visible ? this.hide(options) : this.show(options);
  }

  destroy() {
    this.hide({ reason: "destroy", restoreFocus: false });
    const windowObj = this.document.defaultView || window;
    windowObj.removeEventListener("keydown", this.onGlobalKeydown);
    this.input?.removeEventListener("keydown", this.onInputKeydown);
    this.input?.removeEventListener("input", this.onInput);
    this.list?.removeEventListener("click", this.onListClick);
    this.element.removeEventListener("click", this.onBackdropClick);
    this.element.removeEventListener("cancel", this.onCancel);
    instances.delete(this.element);
  }
}

export function initCommandPalettes(root = document) {
  return queryRoots(root, "[data-bs-command-palette], dialog.bs-command-palette").map((element) => CommandPalette.getOrCreateInstance(element));
}
