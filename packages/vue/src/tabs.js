import { ref, watch } from "vue";
import { composeHandlers, controlledPanel, emit, useControllableState } from "./shared.js";

export function useTabs(options = {}) {
  const tablistRef = ref(null);
  const pending = ref(null);
  const [selectedId, setSelectedId] = useControllableState(options, "selectedId", "defaultSelectedId", "onSelectedChange", null);
  const tabs = () => tablistRef.value ? [...tablistRef.value.querySelectorAll('[role="tab"]')] : [];
  watch(selectedId, (nextId) => { if (pending.value?.selectedId === nextId) emit(tablistRef.value, "bs:tabs:changed", pending.value.detail); pending.value = null; });
  const activate = (tabOrId, sourceEvent, reason = "api") => {
    const tab = typeof tabOrId === "string" ? tabs().find((item) => item.id === tabOrId) : tabOrId;
    if (!tab || tab.id === selectedId.value || tab.getAttribute("aria-disabled") === "true") return false;
    const previousTab = tabs().find((item) => item.id === selectedId.value) ?? null;
    const detail = { adapter: "vue", reason, sourceEvent, previousTab, previousPanel: controlledPanel(previousTab), tab, panel: controlledPanel(tab) };
    if (!emit(tablistRef.value, "bs:tabs:change", detail, true)) return false;
    pending.value = { selectedId: tab.id, detail };
    return setSelectedId(tab.id, detail);
  };
  const getTablistProps = (props = {}) => ({ ...props, ref: (element) => { tablistRef.value = element; }, role: props.role ?? "tablist", "data-bs-state": selectedId.value ? "ready" : "empty" });
  const getTabProps = (props) => {
    const active = props.id === selectedId.value;
    return {
      ...props,
      type: props.type ?? "button",
      role: "tab",
      "aria-controls": props.controls ?? props["aria-controls"],
      "aria-disabled": props.disabled ? "true" : props["aria-disabled"],
      "aria-selected": String(active),
      tabindex: active ? 0 : -1,
      "data-bs-state": active ? "active" : "inactive",
      onClick: composeHandlers(props.onClick, (event) => activate(event.currentTarget, event, "trigger")),
      onKeydown: composeHandlers(props.onKeydown, (event) => {
        const enabled = tabs().filter((tab) => tab.getAttribute("aria-disabled") !== "true");
        const index = enabled.indexOf(event.currentTarget);
        const vertical = tablistRef.value?.getAttribute("aria-orientation") === "vertical";
        const nextIndex = { [vertical ? "ArrowUp" : "ArrowLeft"]: index - 1, [vertical ? "ArrowDown" : "ArrowRight"]: index + 1, Home: 0, End: enabled.length - 1 }[event.key];
        if (index < 0 || nextIndex === undefined) return;
        event.preventDefault();
        const nextTab = enabled[(nextIndex + enabled.length) % enabled.length];
        nextTab.focus();
        activate(nextTab, event, "keyboard");
      }),
    };
  };
  const getPanelProps = (props) => ({ ...props, role: "tabpanel", "aria-labelledby": props["aria-labelledby"] ?? props.tabId, hidden: props.tabId !== selectedId.value, "data-bs-state": props.tabId === selectedId.value ? "active" : "inactive" });
  return { selectedId, activate, getTablistProps, getTabProps, getPanelProps };
}
