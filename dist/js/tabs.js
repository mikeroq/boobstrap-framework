import { controlledElement, emit, queryRoots, requireElement, setState } from "./shared.js";

const instances = new WeakMap();

export class Tabs {
  constructor(element) {
    this.element = requireElement(element, "Tabs");
    this.tabs = [...element.querySelectorAll('[role="tab"]')];
    if (!this.tabs.length) throw new Error("Tabs requires at least one tab.");

    this.onClick = (event) => {
      const tab = event.target.closest('[role="tab"]');
      if (!tab || !this.tabs.includes(tab) || tab.getAttribute("aria-disabled") === "true") return;
      event.preventDefault();
      this.activate(tab);
    };
    this.onKeydown = (event) => this.handleKeydown(event);
    element.addEventListener("click", this.onClick);
    element.addEventListener("keydown", this.onKeydown);

    const selected = this.tabs.find((tab) => tab.getAttribute("aria-selected") === "true") ?? this.tabs[0];
    this.sync(selected);
    instances.set(element, this);
  }

  static getOrCreateInstance(element) {
    return instances.get(element) ?? new Tabs(element);
  }

  get selectedTab() {
    return this.tabs.find((tab) => tab.getAttribute("aria-selected") === "true");
  }

  sync(selectedTab) {
    for (const tab of this.tabs) {
      const selected = tab === selectedTab;
      const panel = controlledElement(tab);
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      setState(tab, selected ? "active" : "inactive");
      if (panel) {
        panel.hidden = !selected;
        setState(panel, selected ? "active" : "inactive");
      }
    }
  }

  activate(tab) {
    if (!this.tabs.includes(tab) || tab === this.selectedTab || tab.getAttribute("aria-disabled") === "true") return false;
    const previousTab = this.selectedTab;
    const detail = {
      controller: this,
      previousTab,
      previousPanel: previousTab ? controlledElement(previousTab) : null,
      tab,
      panel: controlledElement(tab),
    };
    if (!emit(this.element, "bs:tabs:change", detail, true)) return false;
    this.sync(tab);
    emit(this.element, "bs:tabs:changed", detail);
    return true;
  }

  handleKeydown(event) {
    const currentIndex = this.tabs.indexOf(event.target);
    if (currentIndex < 0) return;
    const vertical = this.element.getAttribute("aria-orientation") === "vertical";
    const previousKey = vertical ? "ArrowUp" : "ArrowLeft";
    const nextKey = vertical ? "ArrowDown" : "ArrowRight";
    const enabledTabs = this.tabs.filter((tab) => tab.getAttribute("aria-disabled") !== "true");
    const currentEnabledIndex = enabledTabs.indexOf(event.target);
    let nextIndex;
    if (event.key === previousKey) nextIndex = currentEnabledIndex - 1;
    if (event.key === nextKey) nextIndex = currentEnabledIndex + 1;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = enabledTabs.length - 1;
    if (nextIndex === undefined) return;
    event.preventDefault();
    const tab = enabledTabs[(nextIndex + enabledTabs.length) % enabledTabs.length];
    tab.focus();
    this.activate(tab);
  }

  destroy() {
    this.element.removeEventListener("click", this.onClick);
    this.element.removeEventListener("keydown", this.onKeydown);
    instances.delete(this.element);
  }
}

export function initTabs(root = document) {
  return queryRoots(root, '[role="tablist"][data-bs-tabs]').map((element) => Tabs.getOrCreateInstance(element));
}
