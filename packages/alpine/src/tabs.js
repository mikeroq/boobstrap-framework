import { emit, setState, tabPanel } from "./shared.js";

export function tabs() {
  return {
    selectedId: null,

    tablistElement() {
      return this.$root.querySelector('[role="tablist"]');
    },

    init() {
      this.$nextTick(() => {
        const selected = this.tabElements().find((tab) => tab.getAttribute("aria-selected") === "true") ?? this.tabElements()[0];
        this.selectedId = selected?.id ?? null;
        setState(this.tablistElement(), this.selectedId ? "ready" : "empty");
      });
    },

    tabElements() {
      return [...this.tablistElement().querySelectorAll('[role="tab"]')];
    },

    enabledTabs() {
      return this.tabElements().filter((tab) => tab.getAttribute("aria-disabled") !== "true");
    },

    selectedTab() {
      return this.tabElements().find((tab) => tab.id === this.selectedId) ?? null;
    },

    activate(tab) {
      if (!tab || tab.id === this.selectedId || tab.getAttribute("aria-disabled") === "true") return false;
      const previousTab = this.selectedTab();
      const detail = {
        adapter: "alpine",
        component: this,
        previousTab,
        previousPanel: tabPanel(previousTab),
        tab,
        panel: tabPanel(tab),
      };
      if (!emit(this.tablistElement(), "bs:tabs:change", detail, true)) return false;
      this.selectedId = tab.id;
      this.$nextTick(() => emit(this.tablistElement(), "bs:tabs:changed", detail));
      return true;
    },

    navigate(event) {
      const enabledTabs = this.enabledTabs();
      const currentIndex = enabledTabs.indexOf(event.target);
      if (currentIndex < 0) return;
      const vertical = this.tablistElement().getAttribute("aria-orientation") === "vertical";
      const previousKey = vertical ? "ArrowUp" : "ArrowLeft";
      const nextKey = vertical ? "ArrowDown" : "ArrowRight";
      let nextIndex;
      if (event.key === previousKey) nextIndex = currentIndex - 1;
      if (event.key === nextKey) nextIndex = currentIndex + 1;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = enabledTabs.length - 1;
      if (nextIndex === undefined) return;
      event.preventDefault();
      const tab = enabledTabs[(nextIndex + enabledTabs.length) % enabledTabs.length];
      tab.focus();
      this.activate(tab);
    },

    tablist: {},

    tab: {
      ["@click"]() {
        this.activate(this.$el);
      },
      ["@keydown"](event) {
        this.navigate(event);
      },
      [":aria-selected"]() {
        return String(this.$el.id === this.selectedId);
      },
      [":tabindex"]() {
        return this.$el.id === this.selectedId ? 0 : -1;
      },
      [":data-bs-state"]() {
        return this.$el.id === this.selectedId ? "active" : "inactive";
      },
    },

    panel: {
      [":hidden"]() {
        return tabPanel(this.selectedTab()) !== this.$el;
      },
      [":data-bs-state"]() {
        return tabPanel(this.selectedTab()) === this.$el ? "active" : "inactive";
      },
    },
  };
}
