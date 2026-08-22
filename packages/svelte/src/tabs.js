import { composeHandlers, controlledPanel, emit } from "./shared.js";

export function createTabs(options = {}) {
  let tablistElement = null;
  let currentSelectedId = options.selectedId ?? options.defaultSelectedId ?? null;

  const getTablist = (source) => tablistElement || source?.closest?.('[role="tablist"], .bs-tabs') || (typeof document !== "undefined" ? document.querySelector('[role="tablist"], .bs-tabs') : null);

  const tabs = (tablist) => {
    const tl = tablist || getTablist();
    return tl ? [...tl.querySelectorAll('[role="tab"]')] : [];
  };

  const syncState = (source) => {
    const tl = getTablist(source);
    if (!tl) return;
    tl.dataset.bsState = currentSelectedId ? "ready" : "empty";
    const allTabs = tabs(tl);
    for (const tab of allTabs) {
      const active = tab.id === currentSelectedId;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      tab.dataset.bsState = active ? "active" : "inactive";
      const panel = controlledPanel(tab);
      if (panel) {
        panel.hidden = !active;
        panel.dataset.bsState = active ? "active" : "inactive";
      }
    }
  };

  const activate = (tabOrId, sourceEvent, reason = "api") => {
    const tl = getTablist(sourceEvent?.currentTarget || (typeof tabOrId === "object" ? tabOrId : null));
    const allTabs = tabs(tl);
    const tab = typeof tabOrId === "string" ? allTabs.find((item) => item.id === tabOrId) : tabOrId;
    if (!tab || tab.id === currentSelectedId || tab.getAttribute("aria-disabled") === "true") return false;
    const previousTab = allTabs.find((item) => item.id === currentSelectedId) ?? null;
    const detail = { adapter: "svelte", reason, sourceEvent, previousTab, previousPanel: controlledPanel(previousTab), tab, panel: controlledPanel(tab) };
    if (!emit(tl || tab, "bs:tabs:change", detail, true)) return false;
    currentSelectedId = tab.id;
    options.onSelectedChange?.(tab.id, detail);
    syncState(tl || tab);
    emit(tl || tab, "bs:tabs:changed", detail);
    return true;
  };

  const getTablistProps = (props = {}) => ({
    ...props,
    role: props.role ?? "tablist",
    "data-bs-state": currentSelectedId ? "ready" : "empty",
  });

  const getTabProps = (props) => {
    const active = props.id === currentSelectedId;
    return {
      ...props,
      type: props.type ?? "button",
      role: "tab",
      "aria-controls": props.controls ?? props["aria-controls"],
      "aria-disabled": props.disabled ? "true" : props["aria-disabled"],
      "aria-selected": String(active),
      tabindex: active ? 0 : -1,
      "data-bs-state": active ? "active" : "inactive",
      onclick: composeHandlers(props.onclick || props.onClick, (event) => activate(event.currentTarget, event, "trigger")),
      onkeydown: composeHandlers(props.onkeydown || props.onKeydown, (event) => {
        const enabled = tabs(event.currentTarget.closest('[role="tablist"], .bs-tabs')).filter((tab) => tab.getAttribute("aria-disabled") !== "true");
        const index = enabled.indexOf(event.currentTarget);
        const vertical = event.currentTarget.closest('[role="tablist"]')?.getAttribute("aria-orientation") === "vertical";
        const nextIndex = { [vertical ? "ArrowUp" : "ArrowLeft"]: index - 1, [vertical ? "ArrowDown" : "ArrowRight"]: index + 1, Home: 0, End: enabled.length - 1 }[event.key];
        if (index < 0 || nextIndex === undefined) return;
        event.preventDefault();
        const nextTab = enabled[(nextIndex + enabled.length) % enabled.length];
        nextTab.focus();
        activate(nextTab, event, "keyboard");
      }),
    };
  };

  const getPanelProps = (props) => ({
    ...props,
    role: "tabpanel",
    "aria-labelledby": props["aria-labelledby"] ?? props.tabId,
    hidden: props.tabId !== currentSelectedId,
    "data-bs-state": props.tabId === currentSelectedId ? "active" : "inactive",
  });

  const tablistAction = (node) => {
    tablistElement = node;
    syncState(node);
    return {
      update() {
        syncState(node);
      },
      destroy() {
        tablistElement = null;
      },
    };
  };

  return {
    get selectedId() {
      return currentSelectedId;
    },
    activate,
    getTablistProps,
    getTabProps,
    getPanelProps,
    tablist: tablistAction,
  };
}

export { createTabs as useTabs };
